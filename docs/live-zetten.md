# Live zetten: Cloudflare + Railway + MongoDB Atlas

```
telefoon / laptop
      │  https://<project>.pages.dev
      ▼
Cloudflare Access ── inloggen met een code per e-mail (alleen jouw adres)
      │
Cloudflare Pages ─── de React-app (frontend/dist)
      │  /api/...  → frontend/functions/api/[[pad]].js voegt X-App-Sleutel toe
      ▼
Railway ──────────── FastAPI (backend/Dockerfile), weigert alles zonder sleutel (401)
      │  MONGO_URL
      ▼
MongoDB Atlas ────── gratis cluster, database "onderhoud"
```

Lokaal ontwikkelen blijft precies zoals het was (`docker compose up -d` + `npm run dev`):
zonder `APP_SLEUTEL` controleert de backend niets.

Prijzen en schermnamen kunnen veranderd zijn; de stappen hieronder zijn de route, niet de exacte knoppen.

## 0. Code op GitHub
Railway en Cloudflare bouwen vanaf GitHub. Zet de branch `ui-herontwerp` op GitHub en voeg hem
samen in `main` (pull request), zodat beide diensten `main` kunnen volgen.

## 1. MongoDB Atlas (database)
1. Maak een gratis cluster (M0) in een Europese regio, bijvoorbeeld Frankfurt.
2. **Database Access**: maak een databasegebruiker met een lang, willekeurig wachtwoord.
3. **Network Access**: voeg `0.0.0.0/0` toe. Railway heeft geen vast IP-adres, dus Atlas moet
   verbindingen van overal toestaan; het sterke wachtwoord is je bescherming.
4. **Connect → Drivers**: kopieer de verbindings-URL (`mongodb+srv://…`) en vul je wachtwoord in.
   Dit is straks `MONGO_URL` op Railway. Deel hem met niemand en zet hem niet in de code.

Let op: het gratis cluster maakt geen automatische back-ups. Zie "Later".

## 2. Je huidige gegevens naar Atlas
Vanuit de projectmap, met Docker aan (vul je eigen lokale gebruiker, wachtwoord en Atlas-URL in):

```powershell
# 1. Export uit de lokale database (in de container, dan eruit kopiëren).
#    De inloggegevens komen uit de omgeving van de container zelf, dus je hoeft ze niet te typen.
docker exec onderhoud-mongo sh -c 'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db onderhoud --archive=/tmp/onderhoud.archive'
docker cp onderhoud-mongo:/tmp/onderhoud.archive .

# 2. Import in Atlas (met een tijdelijke mongo-container, je hoeft niets te installeren)
docker run --rm -v "${PWD}:/data" mongo:8.0 mongorestore --uri "<atlas-url>" --archive=/data/onderhoud.archive
```

Gebruik `--archive=bestand` en niet `> bestand`: PowerShell verminkt binaire uitvoer bij `>`.
Bevat je wachtwoord tekens als `@ : / ? # %`, zet die dan om ("URL encode"), anders klopt de URL niet.
Verwijder `onderhoud.archive` daarna: `*.archive` staat in `.gitignore`, maar het bestand bevat al je gegevens.

## 3. Railway (backend)
1. **New Project → Deploy from GitHub repo** → kies `HomeMaintenance`.
2. **Settings → Root Directory**: `backend`. Railway vindt dan zelf de `Dockerfile`.
3. **Variables**:
   - `MONGO_URL` = de Atlas-URL uit stap 1
   - `APP_SLEUTEL` = een lange willekeurige sleutel, bijvoorbeeld uit
     `python -c "import secrets; print(secrets.token_urlsafe(32))"`
4. **Settings → Networking → Generate Domain** → je krijgt `https://<naam>.up.railway.app`.
   Kies een regio in Europa en zet de health check op pad `/`.
5. Controleer:
   - `https://<naam>.up.railway.app/` → `{"status":"ok"}`
   - `https://<naam>.up.railway.app/tasks` → **401 "Geen toegang"**. Dat is goed: zonder sleutel mag niemand erbij.
   - In de logs: bij het opstarten zet de backend schema's en indexen (`setup_db.py`). Zie je daar een
     foutmelding over rechten (`collMod`, `not authorized`), laat het weten; dan passen we dat aan voor Atlas.

## 4. Cloudflare Pages (frontend)
1. **Workers & Pages → Create → Pages → Connect to Git** → kies `HomeMaintenance`.
2. Build-instellingen:
   - Production branch: `main`
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Settings → Variables and Secrets** (voor Production):
   - `BACKEND_URL` = `https://<naam>.up.railway.app`
   - `APP_SLEUTEL` = dezelfde sleutel als op Railway, als type **Secret**
4. Deploy opnieuw na het instellen van de variabelen. Je app staat op `https://<project>.pages.dev`.

De map `frontend/functions/` wordt door Cloudflare automatisch als "Pages Functions" gebruikt:
daardoor werkt `/api/...` op hetzelfde adres als de app.

## 5. Cloudflare Access (inloggen)
Zonder deze stap kan iedereen met de link je app gebruiken. Doe dit dus vóór je de link ergens deelt.

1. Open **Zero Trust** in het Cloudflare-dashboard (gratis plan; kies een teamnaam).
2. **Access → Applications → Add an application → Self-hosted**.
   - Domein: `<project>.pages.dev`
   - Policy: **Allow**, met **Include → Emails** = jouw e-mailadres
   - Inlogmethode: **One-time PIN** (je krijgt een code per mail)
3. In **Pages → je project → Settings**: zet ook de access policy voor *preview deployments* aan,
   anders zijn de previewadressen (`<hash>.<project>.pages.dev`) wél open.

## 6. Testen
Open `https://<project>.pages.dev` op je telefoon → code uit je mail invullen → de app.
Tip: "Zet op beginscherm" in je browser, dan opent hij als een app.

## Later
- **Back-up**: het gratis Atlas-cluster heeft geen automatische back-ups. Draai af en toe stap 2
  andersom (`mongodump --uri "<atlas-url>"`) en bewaar het archief op een veilige plek.
- **Eigen domein** (±€10/jaar): toevoegen in Pages → Custom domains en daarna in Access.
- **Eigen server thuis**: zelfde `docker compose`, met Cloudflare Tunnel of Tailscale ervoor.
