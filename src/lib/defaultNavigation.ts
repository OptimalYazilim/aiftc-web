import type { NavItemInput } from './resolveLink'

/**
 * VARSAYILAN ANA MENÜ
 * ============================================================================
 * Menünün ASIL kaynağı `globals/Navigation.ts`'tir; editör menüyü panelden
 * yönetir. Bu dosya yalnızca o global HENÜZ DOLDURULMAMIŞKEN devreye girer.
 *
 * Neden gerekli: yeni kurulan bir ortamda (ya da seed çalıştırılmamış bir
 * veritabanında) menü dizisi boş gelir ve site üst barında yalnızca logo ile
 * dil seçici kalır. Ziyaretçi hiçbir bölüme ulaşamaz. Boş bir menü, kırık bir
 * menüden daha kötüdür: hata vermez, sadece sessizce yok olur.
 *
 * Öğeler doğrudan `ROUTES` anahtarlarına bağlanır; bu yüzden yerelleştirilmiş
 * adresleri (`/en/training-programmes`, `/ru/novosti`) otomatik üretirler.
 * Dijital Kütüphane öğesi de sıradan bir iç rotadır (`route: 'library'`).
 * Eskiden `type: 'library'` idi ve adresi/"yakında" durumu ExternalServices
 * global'inden geliyordu; kütüphane siteye alt dizin olarak alındığından
 * (bkz. collections/LibraryResources.ts) o dolaylılığa gerek kalmadı.
 *
 * Etiketler `messages/*.json` içindeki `nav` sözlüğünden okunur; bu dosya
 * yalnızca YAPIYI tanımlar, metni değil.
 * ============================================================================
 */

/** `nav` çeviri sözlüğündeki anahtar + menü öğesinin hedefi. */
type DefaultItem = { labelKey: string; item: Omit<NavItemInput, 'label'> }

export const DEFAULT_MAIN_MENU: DefaultItem[] = [
  { labelKey: 'home', item: { type: 'route', route: 'home' } },
  { labelKey: 'trainingPrograms', item: { type: 'route', route: 'training-programs' } },
  { labelKey: 'trainingCalendar', item: { type: 'route', route: 'training-calendar' } },
  { labelKey: 'simulationCentre', item: { type: 'route', route: 'simulation-centre' } },
  { labelKey: 'library', item: { type: 'route', route: 'library' } },
  { labelKey: 'news', item: { type: 'route', route: 'news' } },
  { labelKey: 'contact', item: { type: 'route', route: 'contact' } },
]

/**
 * Çeviri fonksiyonunu alıp menüyü kurar.
 * `translate` olarak next-intl'in `t`'si geçilir; bu modül next-intl'e
 * doğrudan bağlanmaz, böylece sunucu/istemci ayrımından etkilenmez.
 */
export const buildDefaultMainMenu = (translate: (key: string) => string): NavItemInput[] =>
  DEFAULT_MAIN_MENU.map(({ labelKey, item }) => ({ ...item, label: translate(labelKey) }))
