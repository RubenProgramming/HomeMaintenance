from database import db, tasks_col, logs_col

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

    tasks_col.create_index([("archivedAt", 1), ("nextDue", 1)])
    logs_col.create_index([("assetId", 1), ("doneAt", -1)])