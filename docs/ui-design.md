# UI-ontwerp — herontwerp vanaf de grond

Uitkomst van het ontwerp-interview (2026-10-28). Functies en flows komen uit
[ui-requirements.md](ui-requirements.md); dit document gaat over hoe het eruitziet en is ingedeeld.

## Uitgangspunten
- **Gevoel:** zoals Linear / Stripe Dashboard. Zakelijk, strak, geen gloed, verlopen of decoratie.
- **Frictieloos:** het scherm laat direct zien wat er moet, één tik doet het.

## Visuele taal
| Onderwerp | Keuze |
|---|---|
| Thema | **Donker** is het hoofdontwerp, er is een lichte variant. Schakelaar: Systeem → Licht → Donker (standaard Systeem). |
| Accent | **Indigo/violet**, alleen voor primaire acties, focus en actieve navigatie. |
| Statustaal | Elke status heeft vaste kleur + icoon (`ui/status.js`): Te laat = rood + uitroepteken, Deze week = amber + klok, Deze maand/Later = neutraal + kalender. Te laat krijgt ook een rode streep en tint over de rij. |
| Groepskop | Getint in eigen kleur met een streep links van 3px: neutrale groepen (ruimtes, deze maand) in het accent, statusgroepen in hun statuskleur. |
| Info | Blauw (`--kl-info`) + puzzelstukje = "er ontbreekt iets" (onvolledig). Amber is alleen voor tijd. |
| Apparaattegel | Vierkantje vooraan elk apparaat met het icoon van de categorie (te kiezen in Instellingen), anders de eerste letter. Taak = rondje, apparaat = tegel. |
| Vorm | Afronding 6px, randen 1px, geen schaduw behalve bij panelen/menu's/toast. Spacing in stappen van 4px. |
| Typografie | **Inter** (lokaal via npm), cijfers in gelijke breedte (`tabular-nums`). |
| Iconen | **Heroicons** (outline 24 voor navigatie, mini 20 in rijen). |
| Dichtheid | Desktop compact (rijen ~40px, tekst 14px). Mobiel ruim (tikdoelen ≥ 48px). |
| Animatie | Rijk maar functioneel: panelen schuiven in, vinkje vult zich, afgevinkte rij glijdt weg, lijsten komen gestaffeld binnen. Uit bij `prefers-reduced-motion`. |
| Techniek | Gewone CSS met tokens (CSS-variabelen), per component een eigen bestand. |

## Schermen
| Scherm | Indeling |
|---|---|
| Navigatie | Desktop: **inklapbare iconenbalk** links, bovenin Toevoegen, onderin Instellingen. Mobiel: onderbalk met centrale "+", tandwiel rechtsboven in de paginakop. |
| Overzicht | Geen tegels. Eén samenvattingsregel, dan takenrijen gegroepeerd: Te laat / Deze week / Deze maand. Daaronder klein: Onvolledig. |
| Taakrij | Leeg rondje vooraan = afvinken (met undo-toast). Tik op de rij = apparaat openen. `⋯`-menu: afronden met details. Datum rechts. |
| Apparaten | Rijen gegroepeerd per ruimte, live zoeken bovenaan. Per rij: naam, merk/model, rechts eerstvolgende taak of "onvolledig". |
| Apparaatpagina | Eén kolom: Taken → Logboek → Gegevens → Bestanden. Desktop: gegevens in smalle rechterkolom. |
| Formulieren | Desktop: paneel dat van rechts inschuift. Mobiel: sheet van onderen. |
| Rondgang | Ook een sheet; op mobiel bijna schermvullend met de ruimte bovenin. |
| Instellingen | Tandwiel onderin de iconenbalk, op mobiel rechtsboven in de kop. Bevat thema (Systeem/Licht/Donker), ruimtes en categorieën. Hernoemen past apparaten mee aan (zelfde naam = samenvoegen); verwijderen verplaatst eerst de apparaten (bij categorie mag "geen categorie"). |
| "Binnenkort" | Blijft zichtbaar, ingetogen en uitgeschakeld met klein label. |

## Aanpak
1. Tokens + Overzicht (donker en licht, desktop en mobiel) → goedkeuring.
2. Daarna de overige schermen; de oude `index.css` verdwijnt als alles is omgebouwd.
