import {
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'

// De "statustaal" van de app: elke urgentie heeft één vaste combinatie van
// titel, kleur en icoon, die overal hetzelfde terugkomt (groepskop, chips, rij).
// De sleutels zijn wat urgentie() in utils/datum.js teruggeeft.
//
// toon: '' (neutraal) | 'rood' | 'amber' | 'info'. Amber is alleen voor tijd,
// "onvolledig" (er ontbreekt iets) gebruikt info.
export const STATUS = {
  telaat: { titel: 'Te laat', toon: 'rood', icoon: ExclamationCircleIcon },
  week: { titel: 'Deze week', toon: 'amber', icoon: ClockIcon },
  maand: { titel: 'Deze maand', toon: '', icoon: CalendarDaysIcon },
  later: { titel: 'Later', toon: '', icoon: CalendarIcon },
  onbekend: { titel: 'Zonder datum', toon: '', icoon: QuestionMarkCircleIcon },
}
