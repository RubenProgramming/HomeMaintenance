// Alle communicatie met de backend staat in dit ene bestand.
// Elke functie hier hoort bij precies één endpoint in backend/routers/*.py.
// Pagina's roepen deze functies aan en hoeven zelf niets van URL's te weten.

const BASIS = '/api' // zie de proxy in vite.config.js

async function verzoek(pad, { methode = 'GET', body } = {}) {
  const response = await fetch(BASIS + pad, {
    method: methode,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    // FastAPI stuurt fouten terug als { "detail": "..." }.
    // Bij validatiefouten (422) is detail een lijst met per veld wat er mis is.
    let melding = `Server gaf ${response.status}`
    try {
      const fout = await response.json()
      if (typeof fout.detail === 'string') melding = fout.detail
      else if (Array.isArray(fout.detail)) {
        melding = fout.detail.map((d) => `${d.loc.at(-1)}: ${d.msg}`).join(', ')
      }
    } catch {
      // geen JSON in de foutmelding, dan houden we de standaardmelding
    }
    throw new Error(melding)
  }

  // 204 No Content (bijv. bij archiveren) heeft geen body
  if (response.status === 204) return null
  return response.json()
}

// ---------- Apparaten (routers/assets.py) ----------

export const getAssets = (inclusiefGearchiveerd = false) =>
  verzoek(`/assets?include_archived=${inclusiefGearchiveerd}`)

export const getAsset = (id) => verzoek(`/assets/${id}`)

export const createAsset = (asset) =>
  verzoek('/assets', { methode: 'POST', body: asset })

export const updateAsset = (id, wijzigingen) =>
  verzoek(`/assets/${id}`, { methode: 'PATCH', body: wijzigingen })

export const archiveAsset = (id) =>
  verzoek(`/assets/${id}`, { methode: 'DELETE' })

export const restoreAsset = (id) =>
  verzoek(`/assets/${id}/restore`, { methode: 'POST' })

// ---------- Taken (routers/tasks.py) ----------

export const getTasks = () => verzoek('/tasks')

export const getUpcomingTasks = () => verzoek('/tasks/upcoming')

export const createTask = (taak) =>
  verzoek('/tasks', { methode: 'POST', body: taak })

export const completeTask = (taakId, log) =>
  verzoek(`/tasks/${taakId}/done`, { methode: 'POST', body: log })

// wijzigingen: alleen wat verandert, bijv. { title } of { nextDue } (uitstellen)
export const updateTask = (taakId, wijzigingen) =>
  verzoek(`/tasks/${taakId}`, { methode: 'PATCH', body: wijzigingen })

// "Verwijderen" = archiveren; met restoreTask zet je hem terug
export const archiveTask = (taakId) =>
  verzoek(`/tasks/${taakId}`, { methode: 'DELETE' })

export const restoreTask = (taakId) =>
  verzoek(`/tasks/${taakId}/restore`, { methode: 'POST' })

// ---------- Logboek (routers/logs.py) ----------

export const getLogs = (assetId) => verzoek(`/assets/${assetId}/logs`)

// Afronden ongedaan maken: verwijdert de logregel en zet nextDue van de taak terug
export const undoLog = (logId) => verzoek(`/logs/${logId}`, { methode: 'DELETE' })

// ---------- Ruimtes en categorieën (routers/labels.py) ----------
// soort: 'rooms' of 'categories'. Allebei dezelfde endpoints.

export const getLabels = (soort) => verzoek(`/${soort}`)

export const createLabel = (soort, naam) =>
  verzoek(`/${soort}`, { methode: 'POST', body: { name: naam } })

// wijziging: { name } en/of { icon }. Hernoemen past ook de apparaten aan;
// een bestaande naam = samenvoegen
export const updateLabel = (soort, id, wijziging) =>
  verzoek(`/${soort}/${id}`, { methode: 'PATCH', body: wijziging })

// naarId: waar de apparaten heen gaan (bij categorieën mag het leeg: dan geen categorie)
export const deleteLabel = (soort, id, naarId = null) =>
  verzoek(`/${soort}/${id}${naarId ? `?moveTo=${naarId}` : ''}`, { methode: 'DELETE' })
