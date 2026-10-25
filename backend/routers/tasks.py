from fastapi import APIRouter

from database import assets_col, tasks_col, logs_col
from models import (Task, TaskOverview, TaskCreate, Log, LogCreate)
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
    result = logs_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    nieuwe_datum = bereken_volgende(log.doneAt, task["every"], task["unit"])
    tasks_col.update_one({"_id": task_oid},{"$set": {"nextDue":nieuwe_datum}})

    return doc