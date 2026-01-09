import asyncio
import json
from collections import defaultdict
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import settings
from .database import get_session, init_models
from .models import Base, CalendarEvent, Note, User
from .schemas import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventUpdate,
    NoteCreate,
    NoteOut,
    NoteUpdate,
    Token,
    UserCreate,
    UserOut,
)

app = FastAPI(title="Notes and Calendar API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_models(Base.metadata)


@app.get("/health")
async def health():
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}


@app.post("/auth/register", response_model=UserOut, status_code=201)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    user = User(username=payload.username, hashed_password=hash_password(payload.password))
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Username already exists")
    await session.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    expires_in = settings.access_token_exp_minutes * 60
    token = create_access_token({"sub": user.username}, expires_delta=timedelta(seconds=expires_in))
    return Token(access_token=token, expires_in=expires_in)


# Notes REST
@app.get("/notes", response_model=list[NoteOut])
async def list_notes(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Note).where(Note.owner_id == current_user.id).order_by(Note.updated_at.desc()))
    return result.scalars().all()


@app.post("/notes", response_model=NoteOut, status_code=201)
async def create_note(payload: NoteCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    note = Note(title=payload.title, content=payload.content, owner_id=current_user.id)
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note


@app.get("/notes/{note_id}", response_model=NoteOut)
async def get_note(note_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    note = await session.get(Note, note_id)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.patch("/notes/{note_id}", response_model=NoteOut)
async def update_note(note_id: UUID, payload: NoteUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    note = await session.get(Note, note_id)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Note not found")
    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
    await session.commit()
    await session.refresh(note)
    await broadcast_note_change(note)
    return note


@app.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    note = await session.get(Note, note_id)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Note not found")
    await session.delete(note)
    await session.commit()
    await broadcast_note_delete(note_id)
    return None


# Calendar REST
@app.get("/calendar", response_model=list[CalendarEventOut])
async def list_events(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(CalendarEvent).where(CalendarEvent.owner_id == current_user.id).order_by(CalendarEvent.start_time.desc())
    )
    return result.scalars().all()


@app.post("/calendar", response_model=CalendarEventOut, status_code=201)
async def create_event(
    payload: CalendarEventCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    event = CalendarEvent(
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        owner_id=current_user.id,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    await broadcast_calendar_change({"action": "created", "event": serialize_event(event)})
    return event


@app.patch("/calendar/{event_id}", response_model=CalendarEventOut)
async def update_event(
    event_id: UUID,
    payload: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    event = await session.get(CalendarEvent, event_id)
    if not event or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")
    if payload.title is not None:
        event.title = payload.title
    if payload.description is not None:
        event.description = payload.description
    if payload.start_time is not None:
        event.start_time = payload.start_time
    if payload.end_time is not None:
        event.end_time = payload.end_time
    await session.commit()
    await session.refresh(event)
    await broadcast_calendar_change({"action": "updated", "event": serialize_event(event)})
    return event


@app.delete("/calendar/{event_id}", status_code=204)
async def delete_event(event_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    event = await session.get(CalendarEvent, event_id)
    if not event or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")
    await session.delete(event)
    await session.commit()
    await broadcast_calendar_change({"action": "deleted", "event_id": str(event_id)})
    return None


# WebSocket state
note_clients: dict[str, set[WebSocket]] = defaultdict(set)
note_lock = asyncio.Lock()
calendar_clients: set[WebSocket] = set()
calendar_lock = asyncio.Lock()


async def broadcast_note_change(note: Note):
    message = json.dumps(
        {
            "type": "note_updated",
            "id": str(note.id),
            "title": note.title,
            "content": note.content,
            "updated_at": note.updated_at.isoformat(),
        }
    )
    async with note_lock:
        clients = list(note_clients.get(str(note.id), set()))
    for ws in clients:
        try:
            await ws.send_text(message)
        except Exception:
            pass


async def broadcast_note_delete(note_id: UUID):
    message = json.dumps({"type": "note_deleted", "id": str(note_id)})
    async with note_lock:
        clients = list(note_clients.get(str(note_id), set()))
    for ws in clients:
        try:
            await ws.send_text(message)
        except Exception:
            pass


def serialize_event(event: CalendarEvent) -> dict:
    return {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "updated_at": event.updated_at.isoformat(),
    }


async def broadcast_calendar_change(payload: dict):
    message = json.dumps({"type": "calendar", **payload})
    async with calendar_lock:
        clients = list(calendar_clients)
    for ws in clients:
        try:
            await ws.send_text(message)
        except Exception:
            pass


@app.websocket("/ws/notes/{note_id}")
async def notes_ws(websocket: WebSocket, note_id: str, session: AsyncSession = Depends(get_session)):
    await websocket.accept()
    # simple token query param auth: ws://...?token=xxx
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        from jose import jwt

        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    note = await session.get(Note, note_id)
    if note is None or note.owner_id != user.id:
        await websocket.send_text(json.dumps({"error": "not_found"}))
        await websocket.close()
        return

    async with note_lock:
        note_clients[str(note_id)].add(websocket)

    await websocket.send_text(
        json.dumps(
            {
                "type": "init",
                "id": str(note.id),
                "title": note.title,
                "content": note.content,
                "updated_at": note.updated_at.isoformat(),
            }
        )
    )

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                continue
            if payload.get("type") == "update":
                new_content = payload.get("content", "")
                note.title = payload.get("title", note.title)
                note.content = new_content
                await session.commit()
                await session.refresh(note)
                await broadcast_note_change(note)
    except WebSocketDisconnect:
        pass
    finally:
        async with note_lock:
            note_clients[str(note_id)].discard(websocket)


@app.websocket("/ws/calendar")
async def calendar_ws(websocket: WebSocket, session: AsyncSession = Depends(get_session)):
    await websocket.accept()
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        from jose import jwt

        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with calendar_lock:
        calendar_clients.add(websocket)

    # send initial events list for user
    result = await session.execute(select(CalendarEvent).where(CalendarEvent.owner_id == user.id))
    events = [serialize_event(ev) for ev in result.scalars().all()]
    await websocket.send_text(json.dumps({"type": "init", "events": events}))

    try:
        while True:
            await websocket.receive_text()  # keep alive; client pushes via REST
    except WebSocketDisconnect:
        pass
    finally:
        async with calendar_lock:
            calendar_clients.discard(websocket)

# Updates endpoint for Tauri updater
@app.get("/api/updates/{target}/{arch}/{current_version}")
@app.head("/api/updates/{target}/{arch}/{current_version}")
async def check_update(target: str, arch: str, current_version: str):
    """
    Endpoint dla Tauri updater plugin.
    target: windows, linux, macos
    arch: x86_64, aarch64
    current_version: aktualnie zainstalowana wersja (np. 0.1.0)
    """
    import os
    from pathlib import Path
    
    # Katalog ze storanymi build'ami (./updates/releases/)
    updates_dir = Path(__file__).parent.parent / "updates" / "releases"
    
    # Wersja z aplikacji - zmień na aktualną gdy będziesz tworzyć nowe builde
    latest_version = "0.2.2"
    
    # Jeśli klient ma taką samą wersję, nie ma co aktualizować
    if current_version >= latest_version:
        return {"url": "", "version": current_version, "notes": "Już masz najnowszą wersję", "pub_date": ""}
    
    # Nazwa pliku: notes-desktop_0.2.0_x86_64-pc-windows-msvc.msi.zip
    # lub notes-desktop_0.2.0_x86_64-pc-windows-msvc_en-US.msi.zip
    filename = f"notes-desktop_{latest_version}_{arch}-pc-{target}-msvc.msi.zip"
    
    # Sprawdzenie czy plik istnieje
    update_file = updates_dir / filename
    if not update_file.exists():
        # Jeśli nie ma pliku, zwróć aktualną wersję
        return {"url": "", "version": current_version, "notes": "Aktualizacja niedostępna", "pub_date": ""}
    
    return {
        "url": f"https://api.vamare.pl/api/updates/download/{filename}",
        "version": latest_version,
        "notes": "Nowa wersja zawiera poprawki i ulepszenia",
        "pub_date": datetime.utcnow().isoformat(),
    }


@app.get("/api/updates/download/{filename}")
@app.head("/api/updates/download/{filename}")
async def download_update(filename: str):
    """
    Pobieranie pliku aktualizacji.
    """
    from fastapi.responses import FileResponse
    import os
    from pathlib import Path
    
    # Zabezpieczenie: sprawdzenie, że filename to znany plik
    updates_dir = Path(__file__).parent.parent / "updates" / "releases"
    file_path = updates_dir / filename
    
    # Sprawdzenie, czy plik istnieje i jest w updates/releases/
    if not file_path.exists() or not file_path.is_relative_to(updates_dir):
        raise HTTPException(status_code=404, detail="Update file not found")
    
    return FileResponse(file_path, media_type="application/zip", filename=filename)