import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { href } from '@/i18n/routes'
import { LIBRARY_RESOURCE_TYPES } from '@/fields/options'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * ANA SAYFA — DİJİTAL KÜTÜPHANE KÖPRÜSÜ  (Şartname 6.1, 6.6)
 * ============================================================================
 * "Dijital kütüphaneye hızlı erişim"
 *
 * ---------------------------------------------------------------------------
 * NE DEĞİŞTİ
 * ---------------------------------------------------------------------------
 * Bu bileşen önceden EK-2 SUBDOMAIN'ine bağlanıyordu: adres, etiket ve öne
 * çıkan koleksiyonlar `ExternalServices` global'inden geliyor, servis
 * "yakında" durumundayken bir ön tanıtım kartı basılıyordu.
 *
 * Kütüphane siteye alt dizin olarak alındığından (bkz.
 * collections/LibraryResources.ts ve app/(frontend)/[locale]/kutuphane)
 * bileşen artık İÇ ROTAYA bakar. `ExternalServices.library` ayarı silinmedi —
 * ileride gerçekten ayrı bir kütüphane sistemi kurulursa hâlâ kullanılabilir —
 * ama ana sayfa kartı ona bağlı DEĞİLDİR.
 *
 * ---------------------------------------------------------------------------
 * İKİ DURUM, VERİDEN TÜRETİLİR
 * ---------------------------------------------------------------------------
 *   kayıt var  → kurumsal aksiyon kartı: başlık, açıklama, "Kütüphaneyi
 *                İncele" butonu ve yayın sayısı.
 *   kayıt yok  → ön tanıtım kartı (aksiyon yok). Boş bir listeye götüren
 *                buton, kırık bir bağlantı kadar kötüdür.
 *
 * Durum ELLE AYARLANMAZ: editör ilk yayını eklediği anda kart kendiliğinden
 * canlıya döner. Önceki sürümde bu, `ExternalServices.library.status`
 * alanının elle "live" yapılmasına bağlıydı ve unutulmaya açıktı.
 *
 * SORGU
 * `depth: 0` ve `limit: 0` — yalnızca `totalDocs` gerekiyor, kayıtların
 * kendisi değil. Ana sayfada kütüphane listesi basılmaz.
 * ============================================================================
 */
export const LibraryCta = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations('library')

  const payload = await payloadClient()
  const { totalDocs } = await payload.find({
    collection: 'library-resources',
    locale,
    where: { _status: { equals: 'published' } },
    limit: 0,
    depth: 0,
    /*
      Ziyaretçinin GÖREBİLECEĞİ kayıtlar sayılır. Bu satır yokken erişim
      seviyesi kısıtlı kayıtlar da toplama giriyordu (ölçüldü: "3" yazıyor,
      kütüphane sayfası 2 kayıt listeliyordu). bkz. access-control-guide 9.1
    */
    overrideAccess: false,
  })

  /*
    HAZIR DEĞİLKEN — UYARI KUTUSU DEĞİL, ÖN TANITIM BANNER'I
    Kütüphanede henüz yayın yoksa bu durumu sarı ünlemli bir uyarı olarak
    göstermek ziyaretçiye bir ARIZA varmış izlenimi verir — oysa bölüm henüz
    doldurulmamıştır. Bunun yerine ne geleceğini anlatan kurumsal bir
    önizleme kartı basılır.

    Erişilebilirlik: durum bilgisi METİNLE verilir (rozet + açıklama);
    `role="status"` rozette korunur, çünkü bu bir durum bildirimidir.
  */
  if (totalDocs === 0) {
    return (
      <section aria-labelledby="library-cta" className="container-page py-12 lg:py-14">
        <div className="rounded-2xl border border-brand-900/10 bg-brand-950/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <ArchiveIcon />
              <div className="max-w-2xl">
                <h2 id="library-cta" className="text-xl font-semibold sm:text-2xl">
                  {t('previewTitle')}
                </h2>
                <p className="mt-2 text-ink-600">{t('previewIntro')}</p>
              </div>
            </div>

            <p
              role="status"
              className="inline-flex shrink-0 items-center self-start rounded-full border border-brand-700/25 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success-800"
            >
              {t('previewBadge')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  /*
    TÜR BAZINDA DAĞILIM
    Koleksiyonun büyüklüğü tek bir sayı yerine türlere bölünerek verilir:
    "3 yayın" soyut kalır, "1 rapor · 1 teknik rehber · 1 fotoğraf albümü"
    ziyaretçiye ne bulacağını söyler. Tek sorgu, yalnızca `resourceType`.
  */
  const turler = await payload.find({
    collection: 'library-resources',
    locale,
    where: { _status: { equals: 'published' } },
    limit: 500,
    depth: 0,
    overrideAccess: false,
    select: { resourceType: true } as never,
  })
  const dagilim = new Map<string, number>()
  for (const doc of turler.docs as unknown as { resourceType?: string | null }[]) {
    if (doc.resourceType) dagilim.set(doc.resourceType, (dagilim.get(doc.resourceType) ?? 0) + 1)
  }
  const enCok = [...dagilim.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4)

  return (
    <section aria-labelledby="library-cta" className="bg-surface-warm">
      <div className="container-page py-16 lg:py-24">
        <div className="grid overflow-hidden rounded-card border border-line bg-surface lg:grid-cols-12">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-6 lg:p-12">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              <span aria-hidden="true" className="h-px w-8 bg-brand-700" />
              {t('title')}
            </p>
            <h2
              id="library-cta"
              className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-shell-900 sm:text-4xl"
            >
              {t('homeCtaTitle')}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink-600">{t('homeCtaIntro')}</p>

            <Link
              href={href('library', locale)}
              className="group mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-brand-700 px-6 font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:bg-brand-800"
            >
              {t('homeCtaAction')}
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="1em" height="1em" className="transition-transform duration-300 group-hover:translate-x-1">
                <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M2.5 8h11M9.5 4l4 4-4 4" />
              </svg>
            </Link>
          </div>

          {/* Sağ panel: toplam + tür dağılımı */}
          <div className="relative isolate flex flex-col justify-center gap-6 bg-shell-950 p-8 text-white sm:p-10 lg:col-span-6 lg:p-12">
            <ArchiveIcon className="absolute -bottom-6 -right-6 -z-10 h-48 w-48 text-white/[0.06]" />
            <div>
              <p className="text-5xl font-bold tracking-tight text-white">{totalDocs}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-100">
                {t('homeTotalLabel')}
              </p>
            </div>
            {enCok.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {enCok.map(([tur, adet]) => (
                  <li
                    key={tur}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/15 bg-white/[0.05] px-4 py-3"
                  >
                    <span className="text-sm text-white/90">
                      {optionLabel(LIBRARY_RESOURCE_TYPES, tur, locale)}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-white">{adet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const ArchiveIcon: React.FC<{ className?: string }> = ({ className = 'mt-0.5 h-9 w-9 shrink-0 text-brand-700' }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="6" width="9" height="21" rx="1.5" />
    <rect x="13.5" y="9" width="8" height="18" rx="1.5" />
    <path d="M22.8 9.6l4.6 1.2-4 16.4-4.6-1.2" />
    <path d="M6.5 11h4M16 13.5h3" />
  </svg>
)

export default LibraryCta
