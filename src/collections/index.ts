import type { CollectionConfig } from 'payload'

import { DocumentFiles } from './DocumentFiles'
import { Faqs } from './Faqs'
import { FormRequests } from './FormRequests'
import { GalleryAlbums } from './GalleryAlbums'
import { InternationalGuide } from './InternationalGuide'
import { LibraryCategories } from './LibraryCategories'
import { LibraryResources } from './LibraryResources'
import { Media } from './Media'
import { News } from './News'
import { Pages } from './Pages'
import { Projects } from './Projects'
import { Quotes } from './Quotes'
import { Registrations } from './Registrations'
import { SimulationSystems } from './SimulationSystems'
import { SubscriptionPlans } from './SubscriptionPlans'
import { TrainingPrograms } from './TrainingPrograms'
import { TrainingTopics } from './TrainingTopics'
import { Users } from './Users'
import { VirtualClassrooms } from './VirtualClassrooms'

/**
 * Admin panelindeki gruplama sirasi, editorlerin gunluk is akisina gore:
 *   Egitim -> Icerik -> Medya -> Kurumsal -> Ticari -> Sistem
 */
export const collections: CollectionConfig[] = [
  // Eğitim
  TrainingTopics,
  TrainingPrograms,
  Registrations,
  SimulationSystems,
  VirtualClassrooms,

  // İçerik
  News,
  InternationalGuide,
  Faqs,
  Pages,

  // Medya
  GalleryAlbums,
  Media,
  DocumentFiles,
  LibraryCategories,
  LibraryResources,

  // Kurumsal
  Projects,

  // Ticari (B2B)
  SubscriptionPlans,
  Quotes,

  // Sistem
  FormRequests,
  Users,
]

export {
  DocumentFiles,
  Faqs,
  FormRequests,
  GalleryAlbums,
  InternationalGuide,
  LibraryResources,
  Media,
  News,
  Pages,
  Projects,
  Quotes,
  Registrations,
  SimulationSystems,
  SubscriptionPlans,
  TrainingPrograms,
  TrainingTopics,
  Users,
  VirtualClassrooms,
}
