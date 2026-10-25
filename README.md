## Database starten (vanuit de projectmap):
```powershell
docker compose up -d
```

## Backend starten:
```powershell
.venv\Scripts\Activate.ps1
cd backend
fastapi dev main.py
```

## Daarna bereikbaar op:
- API-documentatie: http://127.0.0.1:8000/docs


## Database bekijken
```powershell
docker exec -it onderhoud-mongo mongosh -u admin -p geheim
```

Daarna in mongosh: `use onderhoud`