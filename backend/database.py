import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]

client = MongoClient(MONGO_URL, tz_aware=True)
db = client["onderhoud"]
assets_col = db["assets"]
tasks_col = db["tasks"]
logs_col = db["logs"]