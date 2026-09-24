import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CardMeta } from '@/components/ui/CardMeta'
import { richTextExcerpt } from '@/components/ui/RichTextBlock'
import { FOCUS_COUNTRIES } from '@/fields/options'
import { LOCALE_CODES, isLocale, type Locale } from '@/i18n/locales'
import { ROUTES, detailHref } from '@/i18n/routes'
import { formatDate } from '@/lib/dates'
import { buildMetadata } from '@/lib/metadata'
import { optionLabels } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'

/**
 * PROJELER VE İŞ BİRLİKLERİ — LİSTE  (Şartname EK-1 / 10.1)
 * ============================================================================
 * ROTA: klasör adı `projeler`, `ROUTES.projects.tr` ile HARF HARF aynıdır.
 * /tr/projeler · /en/projects · /ru/proekty
 *
 * Klasör adı kanonik TR segmentiyle uyuşmazsa hata SESSİZDİR: TR'de sayfa
 * açılır, EN/RU'da next-intl kanonik yola yeniden yazamayıp 404 verir. Ayrıca
 * `Projects.ts` içindeki `revalidateCollection('/projeler')` de bu yolu
 * tazeler — ad yanlışsa yayın sonrası hiçbir dil tazelenmez.
 *
 * ---------------------------------------------------------------------------
 * SIRALAMA — AÇIK YAZILMAK ZORUNDA
 * ---------------------------------------------------------------------------
 * `Projects` koleksiyonunda `defaultSort` TANIMLI DEĞİLDİR. Sıralama
 * verilmezse Payload kayıt sırasına (id) düşer ve proje listesi rastgele
 * görünür. En yeni başlayan proje önce: `-startDate`.
 *
 * ---------------------------------------------------------------------------
 * KART ÖZETİ GÖVDEDEN TÜRETİLİR
 * ---------------------------------------------------------------------------
 * Koleksiyonda `summary` alanı yoktur; kartta gösterilecek metin `objective`
 * (richText) gövdesinden çıkarılır (bkz. ui/RichTextBlock → richTextExcerpt).
 * Ayrı bir özet alanı açmak editöre aynı cümleyi iki kez yazdırırdı.
 *
 * ISR: 5 dakika; yayında değişiklik olduğunda hook anında tazeler.
 * ============================================================================
 */
export const revalidate = 300

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'projects' })

  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('intro'),
    pathByLocale: { tr: ROUTES.projects.tr, en: ROUTES.projects.en, ru: ROUTES.projects.ru },
  })
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('projects')
  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'projects',
    locale,
    where: { _status: { equals: 'published' } },
    /* Öne çıkan (ana) proje en üstte, sonra en yeni başlayan. */
    sort: ['-isPrimary', '-startDate'],
    limit: 200,
    /* depth 1: ortak ve görünürlük logolarının `url` alanı için gerekir. */
    depth: 1,
    overrideAccess: false,
  })

  return (
    <>
      {/* --- Üst bölüm --------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

      {/* --- Liste -------------------------------------------------------- */}
      <section aria-labelledby="projects-list" className="bg-surface-warm">
        <div className="container-page section-block">
          <h2 id="projects-list" className="sr-only">
            {t('listHeading')}
          </h2>

          {result.docs.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-6 text-ink-700">
              {t('empty')}
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600">{t('resultsCount', { count: result.docs.length })}</p>

              {/*
                EDİTORYAL SATIR LİSTESİ — kutu değil.
                Projeler az sayıdadır ve her biri uzun bir künyeye sahiptir;
                ızgaraya dizilmiş kartlar yerine saç teli ayraçlarla ayrılmış
                satırlar hem taramayı hızlandırır hem gölgesiz çizgiyi korur.
              */}
              <ul className="mt-6 border-t border-line-soft">
                {result.docs.map((doc) => {
                  const link = doc.slug ? detailHref('project', locale, doc.slug) : null
                  const ozet = richTextExcerpt(doc.objective)
                  const ulkeler = optionLabels(FOCUS_COUNTRIES, doc.focusCountries, locale)

                  const baslangic = formatDate(locale, doc.startDate)
                  const bitis = formatDate(locale, doc.endDate)
                  const donem = baslangic
                    ? `${baslangic} – ${bitis ?? t('ongoing')}`
                    : (bitis ?? null)

                  return (
                    <li
                      key={String(doc.id)}
                      className={`group relative border-b border-line-soft py-7 transition-colors duration-500 ${
                        link ? 'cursor-pointer hover:border-shell-900' : ' focus-within:border-shell-900'
                      }`}
                    >
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-ink-600">
                        <span className="text-brand-700">{doc.symbol}</span>
                        {doc.isPrimary ? (
                          <span className="bg-badge-active-bg px-2 py-0.5 text-accent-700">
                            {t('primaryBadge')}
                          </span>
                        ) : null}
                      </p>

                      <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-shell-900 sm:text-2xl">
                        {link ? (
                          <Link
                            href={link}
                            className="transition-colors duration-500 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800 focus-visible:text-brand-800 group-focus-within:text-brand-800"
                          >
                            {doc.title}
                          </Link>
                        ) : (
                          doc.title
                        )}
                      </h3>

                      {ozet ? (
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">{ozet}</p>
                      ) : null}

                      {/*
                        Künye satırları `CardMeta` ile. Bileşen yalnızca
                        null/false ÖĞELERİ eler, boş DEĞERİ elemez — bu yüzden
                        her satır kendi koşuluyla üretilir. Hiçbiri kalmazsa
                        bileşen null döner ve boş bir <dl> basılmaz.
                      */}
                      <CardMeta
                        className="mt-4 max-w-xl"
                        items={[
                          donem ? { key: 'period', label: t('periodLabel'), value: donem } : null,
                          ulkeler.length > 0
                            ? {
                                key: 'countries',
                                label: t('countriesLabel'),
                                value: ulkeler.join(', '),
                              }
                            : null,
                          doc.nationalCounterpart
                            ? {
                                key: 'counterpart',
                                label: t('counterpartLabel'),
                                value: doc.nationalCounterpart,
                              }
                            : null,
                        ]}
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  )
}
