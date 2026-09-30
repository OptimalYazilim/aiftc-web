import type { GlobalConfig } from 'payload'

import { AccommodationSettings } from './AccommodationSettings'
import { ExternalServices } from './ExternalServices'
import { Homepage } from './Homepage'
import { Navigation } from './Navigation'
import { SimulationCenter } from './SimulationCenter'
import { SiteSettings } from './SiteSettings'

export const globals: GlobalConfig[] = [
  SiteSettings,
  Navigation,
  Homepage,
  ExternalServices,
  SimulationCenter,
  AccommodationSettings,
]

export { ExternalServices, Homepage, Navigation, SimulationCenter, SiteSettings }
