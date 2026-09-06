import type { GlobalConfig } from 'payload'

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
]

export { ExternalServices, Homepage, Navigation, SimulationCenter, SiteSettings }
