from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .routes import dashboard, health, indicators, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    try:
        yield
    finally:
        await db.disconnect()


app = FastAPI(title="kaizen-api", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kaizen.northernarchive.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(indicators.router)
app.include_router(logs.router)
app.include_router(dashboard.router)
