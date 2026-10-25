from fastapi import FastAPI
from contextlib import asynccontextmanager

from routers import assets, logs, tasks
from setup_db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"status": "ok"}
    
app.include_router(assets.router)
app.include_router(tasks.router)
app.include_router(logs.router)