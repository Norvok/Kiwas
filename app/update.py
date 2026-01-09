from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

UPDATES_DIR = Path("/opt/notesapp/updates")
UPDATES_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Notes Update Server", version="0.1.0")

# Serve latest.json and binaries from /opt/notesapp/updates
app.mount("/", StaticFiles(directory=UPDATES_DIR, html=True), name="updates")
