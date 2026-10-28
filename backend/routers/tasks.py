from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from database import assets_col, tasks_col, logs_col
from models import (Task, TaskOverview, TaskCreate, TaskUpdate, Log, LogCreate)
from helpers import bereken_volgende, parse_object_id, find_or_404

router = APIRouter(tags=["Taken"])

@router.get("/tasks", response_model=list[Task])
def get_tasks(include_archived: bool = False):
    query = {} if include_archived else {"archivedAt": None}
    return list(tasks_col.find(query))

@router.get("/tasks/upcoming", response_model=list[TaskOverview])
def get_upcoming_tasks():
    pipeline = [
        {"$match": {"archivedAt": None}},
        {"$sort": {"nextDue": 1}},
        {"$lookup": {"from": "assets", "localField": "assetId",
                     "foreignField": "_id", "as": "asset"}},
         {"$unwind": "$asset" }, 
         {"$project": { "title": 1, "nextDue": 1, "location": "$asset.location", "assetName": "$asset.name" }}
    ]
    return list(tasks_col.aggregate(pipeline))


@router.post("/tasks", response_model=Task, status_code=201)
def create_task(task: TaskCreate):
    asset_oid = parse_object_id(task.assetId, "assetId")
    find_or_404(assets_col, {"_id": asset_oid, "archivedAt": None}, "Apparaat niet gevonden")

    doc = task.model_dump()
    doc["assetId"] = asset_oid
    result = tasks_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc

@router.post("/tasks/{task_id}/done", response_model=Log, status_code=201)
def complete_task(task_id: str, log: LogCreate):
    task_oid = parse_object_id(task_id, "taskId")
    task = find_or_404(tasks_col, {"_id": task_oid, "archivedAt": None}, "Taak niet gevonden")

    doc = log.model_dump()
    doc["taskId"] = task_oid
    doc["assetId"] = task["assetId"]
    # Oude datum bewaren, zodat DELETE /logs/{id} (ongedaan maken) hem terug kan zetten
    doc["previousDue"] = task.get("nextDue")
    result = logs_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    nieuwe_datum = bereken_volgende(log.doneAt, task["every"], task["unit"])
    tasks_col.update_one({"_id": task_oid},{"$set": {"nextDue":nieuwe_datum}})

    return doc


@router.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, updates: TaskUpdate):
    task_oid = parse_object_id(task_id, "taskId")
    task = find_or_404(tasks_col, {"_id": task_oid}, "Taak niet gevonden")

    if task.get("archivedAt") is not None:
        raise HTTPException(status_code=409, detail="Taak is verwijderd, zet hem eerst terug")

    # exclude_unset: alleen de velden die echt in het verzoek stonden
    changes = updates.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(status_code=422, detail="Geen velden om te wijzigen")

    tasks_col.update_one({"_id": task_oid}, {"$set": changes})
    return tasks_col.find_one({"_id": task_oid})

# "Verwijderen" is archiveren, net als bij apparaten: de logboekregels blijven
# dan kloppen en "Ongedaan maken" kan de taak terugzetten.
@router.delete("/tasks/{task_id}", status_code=204)
def archive_task(task_id: str):
    task_oid = parse_object_id(task_id, "taskId")
    find_or_404(tasks_col, {"_id": task_oid, "archivedAt": None}, "Taak niet gevonden")

    tasks_col.update_one({"_id": task_oid}, {"$set": {"archivedAt": datetime.now(timezone.utc)}})

@router.post("/tasks/{task_id}/restore", response_model=Task)
def restore_task(task_id: str):
    task_oid = parse_object_id(task_id, "taskId")
    task = find_or_404(tasks_col, {"_id": task_oid}, "Taak niet gevonden")

    if task.get("archivedAt") is None:
        raise HTTPException(status_code=409, detail="Taak is niet verwijderd")

    # Een taak bij een gearchiveerd apparaat zou nergens zichtbaar zijn.
    # Zet dan eerst het apparaat terug (dat neemt zijn taken vanzelf mee, zie assets.py).
    asset = assets_col.find_one({"_id": task["assetId"]})
    if asset is None or asset.get("archivedAt") is not None:
        raise HTTPException(status_code=409, detail="Apparaat is gearchiveerd, zet dat eerst terug")

    # Een los verwijderde taak heeft zijn eigen archivedAt-tijdstip. Daardoor komt hij
    # NIET mee terug als het apparaat later gearchiveerd en weer teruggezet wordt.
    tasks_col.update_one({"_id": task_oid}, {"$set": {"archivedAt": None}})
    return tasks_col.find_one({"_id": task_oid})
