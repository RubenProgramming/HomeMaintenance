from database import db, tasks_col, logs_col, assets_col, rooms_col, categories_col, NAAM_COLLATIE

TASKS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["assetId", "title", "every", "unit", "nextDue"],
        "properties": {
            "assetId": {"bsonType": "objectId"},
            "title": {"bsonType": "string", "minLength": 1},
            "every": {"bsonType": "number", "minimum": 1},
            "unit": {"enum": ["days", "weeks", "months", "years"]},
            "nextDue": {"bsonType": "date"},
            "archivedAt": {"bsonType": ["date", "null"]},
        },
    }
}

LOGS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["assetId", "doneAt"],
        "properties": {
            "taskId": { "bsonType": ["objectId", "null"] },
            "assetId": { "bsonType": "objectId" },
            "title": { "bsonType": ["string", "null"] },
            "doneAt": { "bsonType": "date" },
            "performedBy": { "bsonType": ["string", "null"] },
            "cost": { "bsonType": ["int", "long", "null"], "minimum": 0 },
            "notes": { "bsonType": ["string", "null"] },
            "attachments": { "bsonType": "array"},
            "previousDue": { "bsonType": ["date", "null"] }
        },
    }
}

ASSETS_SCHEMA = {
    "$jsonSchema": {
       "bsonType": "object",
       "required": ["name", "location"],
       "properties": {
         "name": { "bsonType": "string", "minLength": 1 },
         "category": { "bsonType": ["string", "null"] },
         "location": { "bsonType": "string", "minLength": 1 },
         "brand": { "bsonType": ["string", "null"]},
         "model": { "bsonType": ["string", "null"]},
         "installedAt": { "bsonType": ["date", "null"]},
         "specs":{ "bsonType": "object" },
         "archivedAt" : { "bsonType": ["date", "null"]}
        },
    }
}

LABEL_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "order"],
        "properties": {
            "name": {"bsonType": "string", "minLength": 1},
            "order": {"bsonType": ["int", "long"]},
            "icon": {"bsonType": ["string", "null"]},
        },
    }
}

# Waarmee de ruimtelijst begint. Daarna beheer je hem zelf via Instellingen.
STANDAARD_RUIMTES = [
    "Keuken", "Woonkamer", "Badkamer", "Toilet", "Slaapkamer", "Hal",
    "Zolder", "Kelder", "Berging", "Meterkast", "Tuin", "Dak & gevel",
]


def vul_eenmalig(col, namen):
    """Lege lijst? Dan vullen, zonder dubbele (hoofdletterongevoelig)."""
    if col.estimated_document_count() > 0:
        return
    gezien = {}
    for naam in namen:
        if naam and naam.strip() and naam.strip().lower() not in gezien:
            gezien[naam.strip().lower()] = naam.strip()
    if gezien:
        col.insert_many([{"name": n, "order": i} for i, n in enumerate(gezien.values())])


def apply_schema(name: str, schema: dict):
    if name in db.list_collection_names():
        db.command("collMod", name, validator=schema,
                   validationLevel="strict", validationAction="error")
    else:
        db.create_collection(name, validator=schema,
                             validationLevel="strict", validationAction="error")


def init_db():
    apply_schema("tasks", TASKS_SCHEMA)
    apply_schema("assets", ASSETS_SCHEMA)
    apply_schema("logs", LOGS_SCHEMA)
    apply_schema("rooms", LABEL_SCHEMA)
    apply_schema("categories", LABEL_SCHEMA)

    # Uniek, zonder op hoofdletters te letten: "keuken" naast "Keuken" kan niet
    rooms_col.create_index("name", unique=True, collation=NAAM_COLLATIE)
    categories_col.create_index("name", unique=True, collation=NAAM_COLLATIE)

    # Eerste keer: standaardruimtes + alles wat bestaande apparaten al gebruiken
    vul_eenmalig(rooms_col, STANDAARD_RUIMTES + assets_col.distinct("location"))
    vul_eenmalig(categories_col, assets_col.distinct("category"))

    tasks_col.create_index([("archivedAt", 1), ("nextDue", 1)])
    logs_col.create_index([("assetId", 1), ("doneAt", -1)])