from fastapi import APIRouter

from database import assets_col, logs_col
from models import Log
from helpers import parse_object_id, find_or_404

router = APIRouter(tags=["Logs"])

@router.get("/assets/{asset_id}/logs", response_model=list[Log])
def get_logs(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")
    return list(logs_col.find({"assetId": asset_oid}).sort("doneAt", -1)) 