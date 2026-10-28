# UI-requirements — hoe de app echt gebruikt wordt

Uitkomst van de grill-me sessie (2026-10-25).

## Scope & gebruik
- **Gebruiker:** alleen ikzelf, één huis. Geen accounts, rollen of multi-woning.
- **Apparaat:** telefoon en laptop even veel. Telefoon = bij het apparaat afvinken en invoeren tijdens rondgang; laptop = beheer en naslag.
- **Frequentie:** app wordt alleen geopend als er iets moet. Het overzicht moet dus in één blik zeggen wat er nu moet.
- **Kernwaarde:** (1) niets vergeten, (2) inventaris snel opbouwen.

## Beslissingen
| Onderwerp | Keuze |
|---|---|
| Herinneringen | **Nog niet.** Eerst UI. (Bekend risico: zonder herinnering vergeet je de app zelf.) |
| Inspecties | **Schrappen.** Pagina, menu-item en "Inspectie starten"-knop verwijderen. |
| Mobiele navigatie | **Onderbalk met tabs:** Overzicht / Apparaten / Taken + centrale "+" knop. Desktop houdt de zijbalk. |
| Ruimtes | **Vaste lijst, uitbreidbaar** (keuken, badkamer, zolder, …) als knoppen; eigen ruimte toevoegen kan. |
| Inventaris opbouwen | **Rondgang door het huis:** kies ruimte → voeg achter elkaar apparaten toe zonder terug te navigeren. |
| Formulier nieuw apparaat | **Minimaal:** alleen naam + ruimte verplicht. Categorie, merk, model, specs zijn optioneel / later. |
| Afvinken | **Eén tik = klaar.** doneAt = nu, nextDue schuift automatisch door. Notitie/kosten optioneel achteraf. |
| Per ongeluk afgevinkt | **Undo-toast (5 sec)** "Afgerond — Ongedaan maken". |
| Apparaat zonder taken | **Badge "onvolledig"** op het apparaat + zichtbaar als to-do op het overzicht. |

## Workflows
**Afvinken (mobiel)**
1. Open app → overzicht toont te laat / deze week bovenaan.
2. Tik ✓ op een taak → taak verdwijnt/schuift door, toast met "Ongedaan maken".
3. Optioneel: in de toast of historie notitie/kosten toevoegen.

**Rondgang**
1. "+" → "Ronde door het huis" → kies ruimte (knoppen).
2. Typ naam → opslaan → formulier blijft open voor het volgende apparaat in dezelfde ruimte.
3. Volgende ruimte kiezen of stoppen. Nieuwe apparaten zonder taken krijgen badge "onvolledig".

**Overzicht**
- Te laat / deze week / komende maand (bestaat al).
- Nieuw: blok "Onvolledig — N apparaten zonder onderhoudstaken".

## Backend-gevolgen
| Nodig voor | Wijziging | Bestaat nu? |
|---|---|---|
| Undo afvinken | Log verwijderen + `nextDue` terugzetten (bijv. `POST /tasks/{id}/undo` of `DELETE /logs/{id}`) | Nee |
| Notitie/kosten achteraf | `PATCH /logs/{id}` | Nee |
| Uitbreidbare ruimtelijst | Ruimtes opslaan (eigen collectie, of afleiden uit distinct `location`) | Nee (vrije tekst) |
| Minimaal formulier | `category` optioneel maken in `AssetCreate` | Nee (verplicht) |
| Badge onvolledig | Kan in frontend: assets zonder taak in `GET /tasks` | Ja |
| Taak bewerken | `PATCH /tasks/{id}` | Nee (staat al als "binnenkort") |

## Buiten scope
- Herinneringen (iCal / mail / push) — later, maar zeer waarschijnlijk nodig.
- Sjablonen per categorie, OCR van typeplaatje.
- Foto-/documentupload (blijft "binnenkort").
- Jaarplanning / MJOP, uitstellen/snooze, meerdere gebruikers, offline gebruik.

## Aannames
- **HOOG:** één gebruiker, geen authenticatie nodig (app draait lokaal/thuisnetwerk).
- **MIDDEL:** telefoon bereikt de app via het thuisnetwerk (Vite/FastAPI moeten dan op LAN-adres luisteren, niet alleen localhost).
- **MIDDEL:** "één tik" klopt voor de meeste taken; voor dure klussen (monteur) wil je kosten wel vastleggen → vandaar optioneel achteraf.
- **LAAG:** een vaste ruimtelijst past bij jouw huis zonder verdieping-niveau.

## Risico's / blinde vlekken
- Zonder herinneringen staat "niets vergeten" volledig op je eigen discipline om de app te openen.
- Telefoon-toegang vanaf het thuisnetwerk is nu niet geregeld (alles op localhost).
- Bestaande apparaten hebben vrije-tekst locaties; bij overstap naar vaste lijst moeten die worden gemigreerd/gekoppeld.
