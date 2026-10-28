from fastapi import APIRouter, HTTPException

from database import assets_col, rooms_col, categories_col, NAAM_COLLATIE
from models import Label, LabelUpdate, LabelWrite
from helpers import parse_object_id, find_or_404

# Ruimtes en categorieën werken precies hetzelfde: een lijst met namen,
# en een apparaat verwijst ernaar met de naam (asset.location / asset.category).
# Daarom maakt maak_router() voor allebei dezelfde endpoints.
#
# - hernoemen past ook de apparaten aan; hernoemen naar een bestaande naam = samenvoegen
# - verwijderen verplaatst eerst de apparaten (moveTo). Bij een ruimte is dat verplicht,
#   bij een categorie mag het ook leeg (dan krijgen de apparaten geen categorie).


def zorg_voor_label(col, naam):
    """Nieuwe naam (bijv. vrij ingetypt bij een apparaat)? Dan komt hij in de lijst."""
    if not naam:
        return
    if col.find_one({"name": naam}, collation=NAAM_COLLATIE) is None:
        col.insert_one({"name": naam, "order": volgende_order(col)})


def volgende_order(col):
    laatste = col.find_one(sort=[("order", -1)])
    return (laatste["order"] + 1) if laatste else 0


def maak_router(pad, col, veld, tag, verplaatsen_verplicht, enkelvoud):
    router = APIRouter(tags=[tag])

    def aantal(naam, alleen_actief=False):
        # Standaard tellen gearchiveerde apparaten mee: die verhuizen bij hernoemen gewoon mee
        query = {veld: naam, "archivedAt": None} if alleen_actief else {veld: naam}
        return assets_col.count_documents(query, collation=NAAM_COLLATIE)

    def met_aantallen(label):
        label["assetCount"] = aantal(label["name"], alleen_actief=True)
        label["totalCount"] = aantal(label["name"])
        return label

    @router.get(f"/{pad}", response_model=list[Label])
    def lijst():
        return [met_aantallen(label) for label in col.find().sort("order", 1)]

    @router.post(f"/{pad}", response_model=Label, status_code=201)
    def toevoegen(label: LabelWrite):
        if col.find_one({"name": label.name}, collation=NAAM_COLLATIE):
            raise HTTPException(status_code=409, detail=f"{enkelvoud} '{label.name}' bestaat al")
        doc = {"name": label.name, "order": volgende_order(col)}
        doc["_id"] = col.insert_one(doc).inserted_id
        return doc

    @router.patch(f"/{pad}/{{label_id}}", response_model=Label)
    def wijzigen(label_id: str, wijziging: LabelUpdate):
        oid = parse_object_id(label_id, "id")
        huidig = find_or_404(col, {"_id": oid}, f"{enkelvoud} niet gevonden")
        velden = wijziging.model_dump(exclude_unset=True)
        if not velden:
            raise HTTPException(status_code=422, detail="Geen velden om te wijzigen")

        if "icon" in velden:
            col.update_one({"_id": oid}, {"$set": {"icon": velden["icon"]}})
        if "name" not in velden:
            return met_aantallen(col.find_one({"_id": oid}))

        # Bestaat de nieuwe naam al (een ander label)? Dan samenvoegen: dit label vervalt
        # en de apparaten krijgen de schrijfwijze van het bestaande label.
        bestaand = col.find_one({"name": wijziging.name, "_id": {"$ne": oid}}, collation=NAAM_COLLATIE)
        nieuw = bestaand["name"] if bestaand else wijziging.name

        # Apparaten verhuizen mee naar de nieuwe naam
        assets_col.update_many({veld: huidig["name"]}, {"$set": {veld: nieuw}}, collation=NAAM_COLLATIE)

        if bestaand:
            col.delete_one({"_id": oid})
            doel = bestaand
        else:
            col.update_one({"_id": oid}, {"$set": {"name": nieuw}})
            doel = col.find_one({"_id": oid})

        return met_aantallen(doel)

    @router.delete(f"/{pad}/{{label_id}}", status_code=204)
    def verwijderen(label_id: str, moveTo: str | None = None):
        oid = parse_object_id(label_id, "id")
        huidig = find_or_404(col, {"_id": oid}, f"{enkelvoud} niet gevonden")
        n = aantal(huidig["name"])

        if n > 0:
            if moveTo:
                doel_oid = parse_object_id(moveTo, "moveTo")
                if doel_oid == oid:
                    raise HTTPException(status_code=422, detail="Kies een andere bestemming")
                doel = find_or_404(col, {"_id": doel_oid}, "Bestemming niet gevonden")
                nieuwe_waarde = doel["name"]
            elif verplaatsen_verplicht:
                raise HTTPException(
                    status_code=409,
                    detail=f"Er {'staat' if n == 1 else 'staan'} nog {n} {'apparaat' if n == 1 else 'apparaten'} "
                    f"in '{huidig['name']}'. Kies waar {'het' if n == 1 else 'ze'} heen moet{'' if n == 1 else 'en'}.",
                )
            else:
                nieuwe_waarde = None
            assets_col.update_many({veld: huidig["name"]}, {"$set": {veld: nieuwe_waarde}}, collation=NAAM_COLLATIE)

        col.delete_one({"_id": oid})

    return router


rooms_router = maak_router("rooms", rooms_col, "location", "Ruimtes", True, "Ruimte")
categories_router = maak_router("categories", categories_col, "category", "Categorieën", False, "Categorie")
