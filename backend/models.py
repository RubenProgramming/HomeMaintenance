from datetime import datetime, timezone
from typing import Annotated, Literal
from pydantic import BaseModel, BeforeValidator, Field, ConfigDict

pyObjectId = Annotated[str, BeforeValidator(str)]

# ASSETS

class Asset(BaseModel):
    id: pyObjectId = Field(alias="_id")
    name: str
    category: str
    location: str
    brand: str | None = None
    model: str | None = None
    installedAt: datetime | None = None
    specs: dict = {}
    archivedAt: datetime | None = None

class AssetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    category: str
    location: str
    brand: str | None = None
    model: str | None = None
    installedAt: datetime | None = None
    specs: dict = {}

class AssetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = None
    category: str = None
    location: str = None
    brand: str | None = None
    model: str | None = None
    installedAt: datetime | None = None
    specs: dict = None


# TASKS

class Task(BaseModel):
    id: pyObjectId = Field(alias="_id")
    assetId: pyObjectId
    title: str
    every: int
    unit: Literal["days", "weeks", "months", "years"]
    nextDue: datetime | None = None
    archivedAt: datetime | None = None

class TaskOverview(BaseModel):
    id: pyObjectId = Field(alias="_id")
    title: str
    nextDue: datetime | None = None
    assetName: str
    location: str

class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    assetId: str
    title: str
    every: int = Field(gt=0)
    unit: Literal["days", "weeks", "months", "years"]
    nextDue: datetime

# LOGS

class Log(BaseModel):
    id: pyObjectId = Field(alias="_id")
    taskId: pyObjectId | None = None
    assetId: pyObjectId
    doneAt: datetime
    performedBy: str | None = None
    cost: int | None = None
    notes: str | None = None
    attachments: list[str] = []

class LogCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    doneAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    performedBy: str | None = None
    cost: int | None = Field(default=None, ge=0)
    notes: str | None = None
    attachments: list[str] = []