from datetime import datetime, timezone
from typing import Annotated, Literal
from pydantic import BaseModel, BeforeValidator, Field, ConfigDict

pyObjectId = Annotated[str, BeforeValidator(str)]

# ASSETS

class Asset(BaseModel):
    id: pyObjectId = Field(alias="_id")
    name: str
    category: str | None = None
    location: str
    brand: str | None = None
    model: str | None = None
    installedAt: datetime | None = None
    specs: dict = {}
    archivedAt: datetime | None = None

class AssetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    category: str | None = None
    location: str = Field(min_length=1)
    brand: str | None = None
    model: str | None = None
    installedAt: datetime | None = None
    specs: dict = {}

class AssetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = None
    category: str | None = None
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

class TaskUpdate(BaseModel):
    # Alles optioneel: je stuurt alleen wat je wilt wijzigen (zie PATCH /tasks/{id}).
    # Ook "uitstellen" is gewoon een PATCH met alleen nextDue.
    # Een expliciete null (bijv. "title": null) mag niet: het type is dan geen str.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(default=None, min_length=1)
    every: int = Field(default=None, gt=0)
    unit: Literal["days", "weeks", "months", "years"] = None
    nextDue: datetime = None

# LOGS

class Log(BaseModel):
    id: pyObjectId = Field(alias="_id")
    taskId: pyObjectId | None = None
    assetId: pyObjectId
    # Alleen bij los onderhoud (reparatie, storing). Bij een afgevinkte taak blijft dit leeg:
    # de UI toont dan de titel van de taak.
    title: str | None = None
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

class ManualLogCreate(LogCreate):
    # Los onderhoud vastleggen (POST /assets/{id}/logs): zonder taak, dus een titel is verplicht,
    # bijv. "Pomp vervangen". str_strip_whitespace: alleen spaties telt niet als titel.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=120)

class LogUpdate(BaseModel):
    # Een logregel achteraf corrigeren (PATCH /logs/{id}). Alles optioneel, alleen wat je
    # meestuurt verandert (exclude_unset). title en doneAt mogen niet leeg (null) worden.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(default=None, min_length=1, max_length=120)
    doneAt: datetime = None
    performedBy: str | None = None
    cost: int | None = Field(default=None, ge=0)
    notes: str | None = None


# RUIMTES EN CATEGORIEËN (zelfde vorm, zie routers/labels.py)

class Label(BaseModel):
    id: pyObjectId = Field(alias="_id")
    name: str
    order: int
    icon: str | None = None  # naam van een icoon in de frontend (alleen gebruikt bij categorieën)
    assetCount: int = 0   # actieve apparaten (wat je in de app ziet)
    totalCount: int = 0   # inclusief gearchiveerd (die verhuizen ook mee)

class LabelWrite(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=60)

class LabelUpdate(BaseModel):
    # Allebei optioneel: hernoemen, een icoon kiezen, of allebei. icon: null = icoon weghalen.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(default=None, min_length=1, max_length=60)
    icon: str | None = Field(default=None, max_length=40)
