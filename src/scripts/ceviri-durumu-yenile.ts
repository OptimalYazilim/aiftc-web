/**
 * ÇEVİRİ DURUMUNU YENİDEN HESAPLA — BİR KERELİK / GEREKTİĞİNDE
 * ============================================================================
 * `translationStatus` yalnızca kayıt DEĞİŞTİĞİNDE hesaplanır. Hesap kuralı
 * değiştiğinde (29.09.2026: zengin metin artık içeriğine bakılarak, kaynak
 * dile göre ve gövde alanlarıyla birlikte değerlendiriliyor) mevcut kayıtlar
 * eski sonucu taşımaya devam eder. Bu betik her kaydı `locale: 'all'` ile
 * okur, aynı fonksiyonla (lib/translationStatus.ts) yeniden hesaplar ve
 * yalnızca DEĞİŞENLERİ yazar.
 *
 * Kaydın içeriğine dokunmaz; yalnızca `translationStatus` alanını günceller.
 * Kancalar `skipTranslationStatus` + `skipRevalidate` ile atlanır.
 *
 * Çalıştırma:  pnpm exec tsx src/scripts/ceviri-durumu-yenile.ts
 * ============================================================================
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import { IZLENEN_ALANLAR, ceviriDurumuHesapla, type IzlenenKoleksiyon } from '../lib/translationStatus.js'
import config from '../payload.config.js'

const payload = await getPayload({ config })

let degisen = 0
let toplam = 0

for (const slug of Object.keys(IZLENEN_ALANLAR) as IzlenenKoleksiyon[]) {
  let sayfa = 1
  for (;;) {
    const sonuc = await payload.find({
      collection: slug,
      locale: 'all',
      depth: 0,
      limit: 100,
      page: sayfa,
      overrideAccess: true,
      pagination: true,
    })
    for (const doc of sonuc.docs as unknown as Array<Record<string, unknown> & { id: number | string }>) {
      toplam++
      const yeni = ceviriDurumuHesapla(doc, [...IZLENEN_ALANLAR[slug]])
      const eski = doc.translationStatus as { missing?: string[]; complete?: string[] } | undefined
      if (eski?.missing?.join(',') === yeni.missing.join(',') && eski?.complete?.join(',') === yeni.complete.join(',')) {
        continue
      }
      await payload.update({
        collection: slug,
        id: doc.id,
        data: { translationStatus: yeni } as never,
        depth: 0,
        overrideAccess: true,
        context: { skipTranslationStatus: true, skipRevalidate: true },
      })
      degisen++
      console.log(`${slug} #${doc.id}: eksik [${eski?.missing?.join(',') ?? '-'}] → [${yeni.missing.join(',')}]`)
    }
    if (!sonuc.hasNextPage) break
    sayfa++
  }
}

console.log(`Bitti: ${toplam} kayıt incelendi, ${degisen} kaydın çeviri durumu güncellendi.`)
process.exit(0)
