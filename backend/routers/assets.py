from fastapi import HTTPException, APIRouter
from datetime import datetime, timezone

from database import assets_col, tasks_col
from models import (Asset, AssetCreate, AssetUpdate)
from helpers import parse_object_id, find_or_404

router = APIRouter(tags=["Apparaten"])

@router.get("/assets", response_model=list[Asset])
def get_assets(include_archived: bool = False):
    query = {} if include_archived else {"archivedAt": None}
    return list(assets_col.find(query))

@router.get("/assets/{asset_id}", response_model=Asset)
def get_asset(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    return find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")


@router.post("/assets", response_model=Asset, status_code=201)
def create_asset(asset: AssetCreate):
    doc = asset.model_dump()
    result = assets_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc

@router.patch("/assets/{asset_id}", response_model=Asset)
def update_asset(asset_id: str, updates:AssetUpdate):
    asset_oid = parse_object_id(asset_id, "assetId")
    asset = find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")

    if asset.get("archivedAt") is not None:
        raise HTTPException(status_code=409, detail="Apparaat is gearchiveerd, zet het eerst terug")
    
    changes = updates.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(status_code=422, detail="Geen velden om te wijzigen")

    if "specs" in changes:
        for key, value in changes.pop("specs").items():
            changes[f"specs.{key}"] = value

    assets_col.update_one({"_id": asset_oid},{"$set": changes})
    return assets_col.find_one({"_id": asset_oid})
       
@router.delete("/assets/{asset_id}", status_code=204)
def archive_asset(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    find_or_404(assets_col, {"_id": asset_oid, "archivedAt": None}, "Apparaat niet gevonden")

    now= datetime.now(timezone.utc)
    assets_col.update_one({"_id": asset_oid}, {"$set": {"archivedAt": now}})
    tasks_col.update_many({"assetId": asset_oid, "archivedAt": None}, 
                        {"$set": {"archivedAt": now}})

@router.post("/assets/{asset_id}/restore", response_model=Asset)
def restore_asset(asset_id: str):
    asset_oid = parse_object_id(asset_id, "assetId")
    asset = find_or_404(assets_col, {"_id": asset_oid}, "Apparaat niet gevonden")

    if asset.get("archivedAt") is None:
        raise HTTPException(status_code=409, detail="Apparaat is niet gearchiveerd")
    
    archived_at = asset["archivedAt"]

    assets_col.update_one({"_id": asset_oid}, {"$set": {"archivedAt": None}})
    tasks_col.update_many({"assetId": asset_oid, "archivedAt": archived_at}, 
                        {"$set": {"archivedAt": None}})

    return assets_col.find_one({"_id": asset_oid})
    
