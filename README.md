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
  hooks/              useApi (laden/fout/herladen), useAfvinken (vinkje + undo), useThema
  utils/              datums, specs en ruimtes omzetten
  ui/                 bouwstenen met eigen .css: AppShell, TaakRij, Sheet, Melding, ...
  ui/tokens.css       alle kleuren, maten en tijden (donker + licht)
  pages/              één bestand per scherm
```
Ontwerpkeuzes staan in `docs/ui-design.md`. Onderdelen met het label "Binnenkort"
wachten nog op backend-functionaliteit (zoek in de code op `binnenkort`).


## Database bekijken
```powershell
docker exec -it onderhoud-mongo mongosh -u admin -p geheim
```

Daarna in mongosh: `use onderhoud`