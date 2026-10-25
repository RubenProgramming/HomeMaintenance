from fastapi import HTTPException
from bson import ObjectId
from dateutil.relativedelta import relativedelta

def bereken_volgende(datum, every, unit):
    if unit in ("days", "weeks", "months", "years"):
        return datum + relativedelta(**{unit: every})
    else:
        raise ValueError(f"Onbekende unit: {unit}")

def parse_object_id(value: str, name: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=422, detail=f"Ongeldig {name}")
    return ObjectId(value)


def find_or_404(collection, query: dict, detail: str) -> dict:
    doc = collection.find_one(query)
    if doc is None:
        raise HTTPException(status_code=404, detail=detail)
    return doc
