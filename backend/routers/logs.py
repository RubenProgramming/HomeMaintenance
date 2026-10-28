from fastapi import APIRouter

from database import assets_col, logs_col, tasks_col
from models import Log
from helpers import bereken_volgende, parse_object_id, find_or_404

router = APIRouter(tags=["Logs"])

@router.get("/assets/{asset_id}/logs", response_model=list[Log])
def get_logs(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")
    return list(logs_col.find({"assetId": asset_oid}).sort("doneAt", -1))

@router.delete("/logs/{log_id}", status_code=204)
def undo_log(log_id: str):
    log_oid = parse_object_id(log_id, "logId")
    log = find_or_404(logs_col, {"_id": log_oid}, "Logregel niet gevonden")
    logs_col.delete_one({"_id": log_oid})

    # nextDue alleen terugzetten als die nog steeds door deze afronding komt
    # (niet als de taak daarna opnieuw is afgerond of handmatig is verzet)
    task = tasks_col.find_one({"_id": log.get("taskId")})
    if task is None or "previousDue" not in log:
        return
    if task.get("nextDue") == bereken_volgende(log["doneAt"], task["every"], task["unit"]):
        tasks_col.update_one({"_id": task["_id"]}, {"$set": {"nextDue": log["previousDue"]}})
