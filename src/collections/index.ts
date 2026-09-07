import type { CollectionConfig } from 'payload'

import { DocumentFiles } from './DocumentFiles'
import { Faqs } from './Faqs'
import { FormRequests } from './FormRequests'
import { GalleryAlbums } from './GalleryAlbums'
import { InternationalGuide } from './InternationalGuide'
import { LibraryResources } from './LibraryResources'
import { Media } from './Media'
import { News } from './News'
import { Pages } from './Pages'
import { Projects } from './Projects'
import { Quotes } from './Quotes'
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
  SimulationSystems,
  SubscriptionPlans,
  TrainingPrograms,
  TrainingTopics,
  Users,
  VirtualClassrooms,
}
