from fastapi import FastAPI
from contextlib import asynccontextmanager

from routers import assets, logs, tasks, labels
from setup_db import init_db

from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
