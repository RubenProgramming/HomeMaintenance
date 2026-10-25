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

## Frontend starten:
```powershell
cd frontend
npm install
npm run dev
```

## Daarna bereikbaar op:
- App: http://localhost:5173
- API-documentatie: http://127.0.0.1:8000/docs

De frontend praat met de backend via `/api/...`; Vite stuurt dat door naar poort 8000 (zie `frontend/vite.config.js`).

### Opbouw frontend
```
frontend/src/
  api.js              alle backend-aanroepen (1 functie per endpoint)
  hooks/useApi.js     data ophalen met laden/fout/herladen
  utils/              datums en specs omzetten
  components/         herbruikbare stukjes (TaskCard, SpecsEditor, ...)
  pages/              één bestand per scherm
```
Knoppen met het label "binnenkort" (`NogNietKlaar`) wachten nog op backend-functionaliteit.


## Database bekijken
```powershell
docker exec -it onderhoud-mongo mongosh -u admin -p geheim
```

Daarna in mongosh: `use onderhoud`