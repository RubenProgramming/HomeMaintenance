import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collation import Collation

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]

client = MongoClient(MONGO_URL, tz_aware=True)
db = client["onderhoud"]
assets_col = db["assets"]
tasks_col = db["tasks"]
logs_col = db["logs"]
rooms_col = db["rooms"]
categories_col = db["categories"]

# Namen van ruimtes en categorieën vergelijken we zonder op hoofdletters te letten:
# "keuken" en "Keuken" zijn dezelfde ruimte. strength=2 = hoofdletterongevoelig.
NAAM_COLLATIE = Collation(locale="nl", strength=2)
