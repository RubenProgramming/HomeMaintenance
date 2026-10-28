import {
  BeakerIcon,
  BoltIcon,
  CogIcon,
  ComputerDesktopIcon,
  CubeIcon,
  FireIcon,
  HomeModernIcon,
  KeyIcon,
  LightBulbIcon,
  PrinterIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  TruckIcon,
  TvIcon,
  WifiIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

// Iconen die je in Instellingen aan een categorie kunt geven.
// In de database staat alleen de sleutel ("fire"); hier staat welk icoon dat is.
// Volgorde = volgorde in de kiezer.
export const CATEGORIE_ICONEN = {
  fire: { icoon: FireIcon, label: 'Verwarming' },
  bolt: { icoon: BoltIcon, label: 'Elektra' },
  'light-bulb': { icoon: LightBulbIcon, label: 'Verlichting' },
  beaker: { icoon: BeakerIcon, label: 'Water' },
  'shield-check': { icoon: ShieldCheckIcon, label: 'Veiligheid' },
  wrench: { icoon: WrenchScrewdriverIcon, label: 'Gereedschap' },
  cog: { icoon: CogIcon, label: 'Machine' },
  cube: { icoon: CubeIcon, label: 'Apparaat' },
  tv: { icoon: TvIcon, label: 'Beeld en geluid' },
  computer: { icoon: ComputerDesktopIcon, label: 'Computer' },
  wifi: { icoon: WifiIcon, label: 'Netwerk' },
  printer: { icoon: PrinterIcon, label: 'Printer' },
  home: { icoon: HomeModernIcon, label: 'Woning' },
  sun: { icoon: SunIcon, label: 'Tuin en buiten' },
  sparkles: { icoon: SparklesIcon, label: 'Schoonmaak' },
  scissors: { icoon: ScissorsIcon, label: 'Hobby' },
  key: { icoon: KeyIcon, label: 'Sloten' },
  truck: { icoon: TruckIcon, label: 'Vervoer' },
}

// Icoon-sleutel per categorienaam (hoofdletterongevoelig), uit de lijst van GET /categories
export function iconenPerCategorie(categorieen = []) {
  return Object.fromEntries(categorieen.map((c) => [c.name.toLowerCase(), c.icon]))
}
