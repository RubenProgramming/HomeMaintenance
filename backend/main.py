import os
import secrets
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from routers import assets, logs, tasks, labels
from setup_db import init_db

from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Live (Railway) staat de backend open op internet. Alleen de frontend op Cloudflare
# mag erbij: die stuurt bij elk verzoek de geheime sleutel mee (zie frontend/functions/api).
# Lokaal is APP_SLEUTEL niet gezet, dan werkt alles zoals altijd.
APP_SLEUTEL = os.environ.get("APP_SLEUTEL")

@app.middleware("http")
async def controleer_sleutel(request: Request, call_next):
    vrij = request.url.path == "/" or request.method == "OPTIONS"  # "/" = health check van Railway
    if APP_SLEUTEL and not vrij:
        meegestuurd = request.headers.get("X-App-Sleutel", "")
        # compare_digest: even lang over elke vergelijking, zodat je de sleutel niet kunt raden via de tijd
        if not secrets.compare_digest(meegestuurd, APP_SLEUTEL):
            return JSONResponse(status_code=401, content={"detail": "Geen toegang"})
    return await call_next(request)

# Toegestane adressen voor de browser (CORS), komma-gescheiden. Live gaat alles via
# Cloudflare (zelfde adres als de frontend), dus daar is dit niet nodig.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}

app.include_router(assets.router)
app.include_router(tasks.router)
app.include_router(logs.router)
app.include_router(labels.rooms_router)
app.include_router(labels.categories_router)
