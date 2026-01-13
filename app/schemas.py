from datetime import datetime, timedelta, date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: UUID
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    username: str | None = None


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    color: Optional[str] = None
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[str] = None
    archived: Optional[bool] = None


class NoteOut(BaseModel):
    id: UUID
    title: str
    content: str
    color: Optional[str] = None
    tags: Optional[str] = None
    archived: bool = False
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_all_day: bool = False
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_date: Optional[date] = None
    reminder_minutes: Optional[str] = None  # e.g., "15,60"


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_all_day: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_date: Optional[date] = None
    reminder_minutes: Optional[str] = None


class CalendarEventOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    is_all_day: bool = False
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_date: Optional[date] = None
    reminder_minutes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
