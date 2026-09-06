/**
 * ANA MENÜYÜ EŞİTLE
 * ============================================================================
 * `MENU_ADDITIONS` içindeki bölümlerin ana menüde bulunduğundan emin olur.
 * Mevcut menüyü EZMEZ; yalnızca eksik öğeyi doğru konuma ekler ve üç dilde
 * etiketini yazar.
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/sync-main-menu.ts
 *
 * NEDEN AYRI BİR BETİK: aynı işi `seed.ts` de yapar, ama seed tüm örnek
 * içeriği (site ayarları, ana sayfa hero'su, haberler) yeniden yazar. Menüye
 * tek bir öğe eklemek için o riski almaya gerek yok. Bu betik SADECE menüye
 * dokunur.
 * ============================================================================
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config.js'
import { appendMenuRoute, MENU_ADDITIONS, type MenuRow } from './menuTools.js'

const payload = await getPayload({ config })

for (const addition of MENU_ADDITIONS) {
  const changed = await appendMenuRoute(payload, addition.route, addition.labels, {
    after: addition.after,
  })
  console.log(`${addition.route}: ${changed ? 'eklendi/güncellendi' : 'zaten güncel'}`)
}

console.log('\nmenünün son hâli:')
for (const locale of ['tr', 'en', 'ru'] as const) {
  const nav = (await payload.findGlobal({ slug: 'navigation', locale, depth: 0 })) as unknown as {
    mainMenu?: MenuRow[]
  }
  const items = (nav.mainMenu ?? []).map((row) => row.label).join(' · ')
  console.log(`  [${locale}] ${items}`)
}

process.exit(0)
