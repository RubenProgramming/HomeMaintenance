from fastapi import APIRouter, HTTPException

from database import assets_col, logs_col, tasks_col
from models import Log, LogUpdate, ManualLogCreate
from helpers import bereken_volgende, parse_object_id, find_or_404

router = APIRouter(tags=["Logs"])

# Het logboek: wat er aan een apparaat gedaan is.
# Een logregel ontstaat op twee manieren:
# - een taak afvinken (POST /tasks/{id}/done in tasks.py): heeft een taskId, geen eigen titel
# - los onderhoud vastleggen (POST /assets/{id}/logs hieronder): geen taskId, wel een titel
#
# Een afvink-log bepaalt de volgende datum van zijn taak (nextDue = doneAt + interval).
# Bij bewerken en verwijderen moet die datum dus soms mee veranderen; zie taak_leunt_op().


def laatste_log_van_taak(task_oid):
    """De nieuwste afvink-log van een taak (bij gelijke datum de laatst aangemaakte), of None."""
    return logs_col.find_one({"taskId": task_oid}, sort=[("doneAt", -1), ("_id", -1)])


def taak_leunt_op(log, task):
    """Is de huidige nextDue van de taak berekend uit deze log?

    Dat is zo als (1) dit de nieuwste afvinking van de taak is en (2) nextDue nog precies
    doneAt + interval is. Is de taak daarna handmatig verzet, dan klopt (2) niet meer en
    blijven we eraf. (1) voorkomt dat een oude log die toevallig op dezelfde dag viel
    de taak terugzet.
    """
    if task is None or log.get("taskId") is None:
        return False
    laatste = laatste_log_van_taak(task["_id"])
    if laatste is None or laatste["_id"] != log["_id"]:
        return False
    return task.get("nextDue") == bereken_volgende(log["doneAt"], task["every"], task["unit"])


@router.get("/assets/{asset_id}/logs", response_model=list[Log])
def get_logs(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")
    return list(logs_col.find({"assetId": asset_oid}).sort("doneAt", -1))


@router.post("/assets/{asset_id}/logs", response_model=Log, status_code=201)
def create_log(asset_id: str, log: ManualLogCreate):
    """Los onderhoud vastleggen: een reparatie, storing of klus zonder vaste taak.
    Raakt geen taken aan (er is geen taak, dus ook geen nextDue)."""
    asset_oid = parse_object_id(asset_id, "assetId")
    asset = find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")
    if asset.get("archivedAt") is not None:
        raise HTTPException(status_code=409, detail="Apparaat is gearchiveerd, zet het eerst terug")

    doc = log.model_dump()
    doc["taskId"] = None
    doc["assetId"] = asset_oid
    result = logs_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


@router.patch("/logs/{log_id}", response_model=Log)
def update_log(log_id: str, updates: LogUpdate):
    """Een logregel achteraf corrigeren (verkeerde datum, kosten vergeten, ...).

    Keuze voor nextDue: verandert doneAt van de afvinking waar de taak nu op leunt
    (de nieuwste, en nextDue is niet handmatig verzet), dan rekenen we nextDue opnieuw uit.
    Dat doen we vanaf de nieuwste afvinking ná de wijziging: zet je de datum terug tot vóór
    een andere afvinking, dan wordt die andere de basis. previousDue blijft staan, zodat
    verwijderen de taak nog steeds terugzet naar wat hij vóór deze afvinking was.
    Bij een oudere log, een losse log of een handmatig verzette taak verandert nextDue niet.
    """
    log_oid = parse_object_id(log_id, "logId")
    log = find_or_404(logs_col, {"_id": log_oid}, "Logregel niet gevonden")

    changes = updates.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Geen velden om te wijzigen")
    if "title" in changes and log.get("taskId") is not None:
        raise HTTPException(status_code=422, detail="Een afgevinkte taak heeft geen eigen titel")

    # Vóór het opslaan kijken: na de wijziging klopt de vergelijking met nextDue niet meer
    task = tasks_col.find_one({"_id": log.get("taskId")}) if log.get("taskId") else None
    herbereken = "doneAt" in changes and taak_leunt_op(log, task)

    logs_col.update_one({"_id": log_oid}, {"$set": changes})

    if herbereken:
        basis = laatste_log_van_taak(task["_id"])
        nieuwe_datum = bereken_volgende(basis["doneAt"], task["every"], task["unit"])
        tasks_col.update_one({"_id": task["_id"]}, {"$set": {"nextDue": nieuwe_datum}})

    return logs_col.find_one({"_id": log_oid})


@router.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: str):
    """Logregel definitief verwijderen. Ook de "ongedaan maken" direct na het afvinken.

    nextDue alleen terugzetten als de taak nog op deze log leunt (zie taak_leunt_op):
    niet als het een oude afvinking is, als de taak daarna opnieuw is afgerond of
    handmatig is verzet. Een losse log (zonder taskId) raakt geen taak.
    """
    log_oid = parse_object_id(log_id, "logId")
    log = find_or_404(logs_col, {"_id": log_oid}, "Logregel niet gevonden")

    task = tasks_col.find_one({"_id": log.get("taskId")}) if log.get("taskId") else None
    terugzetten = "previousDue" in log and taak_leunt_op(log, task)

    logs_col.delete_one({"_id": log_oid})
    if terugzetten:
        tasks_col.update_one({"_id": task["_id"]}, {"$set": {"nextDue": log["previousDue"]}})
