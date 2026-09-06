import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { LOCALES, type Locale } from '@/i18n/locales'

/**
 * KONTROL PANELİ — OPERASYON ÖZETİ
 * ============================================================================
 * Payload'ın varsayılan kontrol paneli yalnızca koleksiyon kartlarını listeler.
 * Bu bileşen onun üstüne, editörün panele girer girmez göreceği bir durum
 * özeti koyar: kaç eğitim aktif, kaç program yaklaşıyor, kaç form bildirimi
 * beklemede — ve çeviri durumu.
 *
 * SUNUCU BİLEŞENİ — Payload Local API'ye doğrudan erişir; ek HTTP isteği yok.
 *
 * ---------------------------------------------------------------------------
 * ÇEVİRİ DURUMU — YALNIZCA ROZET
 * Önceden ayrı bir `TranslationOverview` bileşeni kontrol panelinin ortasında
 * tam genişlikte bir tablo basıyordu; ardından açılır bir blok denendi. İkisi
 * de kaldırıldı: panelde ayrıntı tablosu YOKTUR.
 *
 * Şartname 5 "eksik çeviriler panelde görülebilmelidir" koşulu rozetle
 * karşılanır: eksik varsa rozet sayıyı yazar ve en çok eksiği olan bölümün
 * listesine BAĞLANIR. Editör tek tıkla oraya gider, oradaki "Çeviri Durumu"
 * sütunu hangi kaydın eksik olduğunu gösterir.
 * ---------------------------------------------------------------------------
 *
 * TEMA UYUMU
 * Panel Tailwind KULLANMAZ; projenin Tailwind katmanı `/admin` rotalarında
 * çalışmaz. Biçimlendirme satır içidir, renkler Payload'ın `--theme-*`
 * değişkenlerinden gelir. Kurumsal zümrül yalnızca kontrastı garanti
 * edilebilen yerlerde kullanılır: beyaz metinli dolgun butonlar, sol şerit
 * ve ikonlar. Sayı ve etiketler `--theme-text` ile basılır — koyu temada
 * koyu yeşil metin okunmazdı.
 * ============================================================================
 */

/** Kurumsal zümrüt — globals.css'teki brand-700 / brand-800 ile aynı. */
const ACCENT = '#0b6b3a'
const ACCENT_STRONG = '#0a4423'

/* --------------------------------------------------------------------------
   İKONLAR — her biri dekoratif (`aria-hidden`), bilgi metinde.
   -------------------------------------------------------------------------- */
const iconProps = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
}

/** Açık kitap — eğitimler. */
const IconTraining = () => (
  <svg {...iconProps}>
    <path d="M12 7.5C10.5 6.2 8.5 5.5 4 5.5v12c4.5 0 6.5.7 8 2 1.5-1.3 3.5-2 8-2v-12c-4.5 0-6.5.7-8 2Z" />
    <path d="M12 7.5v12" />
  </svg>
)

/** Takvim — yaklaşan programlar. */
const IconCalendar = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

/** Gazete — haberler ve duyurular. */
const IconNews = () => (
  <svg {...iconProps}>
    <path d="M4 5h13a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1V5Z" />
    <path d="M18 9h2v9a1 1 0 0 1-1 1M7.5 9h6M7.5 12.5h6M7.5 16h4" />
  </svg>
)

/** Zarf — gelen form bildirimleri. */
const IconInbox = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
)

type Metric = {
  label: string
  value: number | null
  hint?: string | null
  href: string
  icon: React.ReactNode
}

/** Sayımı güvenli yapar: hata durumunda `null` döner, kart "—" gösterir. */
const safeCount = async (run: () => Promise<number>): Promise<number | null> => {
  try {
    return await run()
  } catch {
    return null
  }
}

const formatDate = (value?: string | null): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('tr', { dateStyle: 'long' }).format(date)
}

/** Çeviri takibi yapılan koleksiyonlar (Şartname 5). */
const TRACKED_COLLECTIONS = [
  { slug: 'training-topics', label: 'Eğitim Konuları' },
  { slug: 'training-programs', label: 'Eğitimler ve Programlar' },
  { slug: 'simulation-systems', label: 'Simülasyon Sistemleri' },
  { slug: 'news', label: 'Haberler ve Duyurular' },
  { slug: 'international-guide', label: 'Uluslararası Katılımcı Rehberi' },
  { slug: 'faqs', label: 'Sık Sorulan Sorular' },
  { slug: 'pages', label: 'Sayfalar' },
] as const

type TranslationRow = { slug: string; label: string; missing: Record<Locale, number> }

export const DashboardOverview = async () => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const [activeTrainings, upcoming, newsCount, submissions] = await Promise.all([
    safeCount(async () => {
      const result = await payload.find({
        collection: 'training-programs',
        where: {
          _status: { equals: 'published' },
          status: { in: ['applications-open', 'ongoing'] },
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      return result.totalDocs
    }),

    (async () => {
      try {
        const result = await payload.find({
          collection: 'training-programs',
          where: { _status: { equals: 'published' }, startDate: { greater_than_equal: now } },
          sort: 'startDate',
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        const first = result.docs[0] as { startDate?: string | null } | undefined
        return { count: result.totalDocs, nextDate: formatDate(first?.startDate) }
      } catch {
        return { count: null, nextDate: null }
      }
    })(),

    safeCount(async () => {
      const result = await payload.find({
        collection: 'news',
        where: { _status: { equals: 'published' } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      return result.totalDocs
    }),

    // KVKK: yalnızca SAYI okunur, gönderim içeriği okunmaz.
    safeCount(async () => {
      const result = await payload.find({
        collection: 'form-submissions',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      return result.totalDocs
    }),
  ])

  // --- Çeviri durumu -------------------------------------------------------
  const translationRows: TranslationRow[] = []

  for (const collection of TRACKED_COLLECTIONS) {
    try {
      const result = await payload.find({
        collection: collection.slug,
        limit: 500,
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })

      const missing = Object.fromEntries(LOCALES.map((l) => [l.code, 0])) as Record<Locale, number>

      for (const doc of result.docs as Array<{ translationStatus?: { missing?: Locale[] } }>) {
        for (const locale of doc.translationStatus?.missing ?? []) {
          if (locale in missing) missing[locale] += 1
        }
      }

      if (Object.values(missing).some((count) => count > 0)) {
        translationRows.push({ slug: collection.slug, label: collection.label, missing })
      }
    } catch {
      // Koleksiyon henüz oluşmamış olabilir (ilk migration öncesi).
    }
  }

  const totalMissing = translationRows.reduce(
    (sum, row) => sum + Object.values(row.missing).reduce((a, b) => a + b, 0),
    0,
  )

  const metrics: Metric[] = [
    {
      label: 'Aktif Eğitimler',
      value: activeTrainings,
      hint: 'Başvuruya açık veya devam eden',
      href: '/admin/collections/training-programs',
      icon: <IconTraining />,
    },
    {
      label: 'Yaklaşan Programlar',
      value: upcoming.count,
      hint: upcoming.nextDate ? `En yakın: ${upcoming.nextDate}` : 'Planlanmış program yok',
      href: '/admin/collections/training-programs',
      icon: <IconCalendar />,
    },
    {
      label: 'Haberler ve Duyurular',
      value: newsCount,
      hint: 'Yayımlanmış içerik',
      href: '/admin/collections/news',
      icon: <IconNews />,
    },
    {
      label: 'Form Bildirimleri',
      value: submissions,
      hint: 'Toplam gönderim',
      href: '/admin/collections/form-submissions',
      icon: <IconInbox />,
    },
  ]

  const actions = [
    { label: 'Yeni Eğitim Ekle', href: '/admin/collections/training-programs/create', primary: true },
    { label: 'Yeni Haber Yayınla', href: '/admin/collections/news/create', primary: true },
    { label: 'Gelen Başvuruları İncele', href: '/admin/collections/form-submissions', primary: false },
  ]

  return (
    <section
      aria-labelledby="dashboard-overview-heading"
      style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        borderRadius: 10,
        border: '1px solid var(--theme-elevation-100)',
        borderLeft: `4px solid ${ACCENT}`,
        background: 'var(--theme-elevation-0)',
        boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)',
      }}
    >
      {/* --- Karşılama + çeviri rozeti ----------------------------------- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: '44rem' }}>
          <h2 id="dashboard-overview-heading" style={{ margin: 0, fontSize: '1.2rem', lineHeight: 1.3 }}>
            Antalya Uluslararası Ormancılık Eğitim Merkezi — Yönetim Paneli
          </h2>
          <p style={{ margin: '.5rem 0 0', fontSize: '.875rem', opacity: 0.75 }}>
            Eğitim programları, takvim, haber ve duyurular ile başvuru yönlendirmeleri bu panelden
            yönetilir. Aşağıdaki sayılar yalnızca <strong>yayımlanmış</strong> kayıtları gösterir.
          </p>
        </div>

        {/*
          ÇEVİRİ DURUMU — YALNIZCA ROZET
          Ayrıntılı tablo tamamen kaldırıldı; kontrol panelinin ortasında yer
          kaplayan bir kutu bırakılmadı.

          Şartname 5 "eksik çeviriler panelde görülebilmelidir" der. Bu koşul
          rozetin KENDİSİYLE karşılanır: eksik varsa sayıyı yazar ve en çok
          eksiği olan bölümün listesine BAĞLANIR — editör tek tıkla oraya gider.

          Renk tek başına anlam taşımaz: simge (✓ / ⚠) ve metin de durumu
          söyler (WCAG 2.2 — 1.4.1). Renk çiftleri ölçülmüştür:
            #0a5c33 / #e7f6ed → 7.26:1
            #7a4a05 / #fbf1de → 6.67:1
        */}
        {(() => {
          const complete = totalMissing === 0

          const badgeStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.35rem',
            padding: '.25rem .625rem',
            borderRadius: 999,
            fontSize: '.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            border: complete ? '1px solid #c3e6d2' : '1px solid #f0dcb4',
            background: complete ? '#e7f6ed' : '#fbf1de',
            color: complete ? '#0a5c33' : '#7a4a05',
          }

          if (complete) {
            return <span style={badgeStyle}>✓ {LOCALES.length} dil senkronize</span>
          }

          // En çok eksiği olan bölüm — rozet oraya götürür.
          const worst = [...translationRows].sort(
            (a, b) =>
              Object.values(b.missing).reduce((x, y) => x + y, 0) -
              Object.values(a.missing).reduce((x, y) => x + y, 0),
          )[0]

          return (
            <a href={`/admin/collections/${worst.slug}`} style={badgeStyle}>
              ⚠ {totalMissing} eksik çeviri
            </a>
          )
        })()}
      </div>

      {/* --- Metrikler ---------------------------------------------------- */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: '.875rem',
          margin: '1.5rem 0 0',
        }}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              border: '1px solid var(--theme-elevation-100)',
              borderRadius: 8,
              padding: '1rem',
              background: 'var(--theme-elevation-50)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ color: ACCENT, display: 'inline-flex' }}>{metric.icon}</span>
              <dt
                style={{
                  fontSize: '.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  opacity: 0.7,
                }}
              >
                {metric.label}
              </dt>
            </div>

            <dd style={{ margin: '.5rem 0 0' }}>
              <a
                href={metric.href}
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: 'var(--theme-text)',
                  textDecoration: 'none',
                }}
              >
                {/* Sorgu düştüyse sayı uydurulmaz. */}
                {metric.value === null ? '—' : metric.value}
              </a>
              {metric.hint ? (
                <span style={{ display: 'block', marginTop: '.35rem', fontSize: '.75rem', opacity: 0.65 }}>
                  {metric.hint}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      {/* --- Hızlı kısayollar --------------------------------------------- */}
      <nav aria-label="Hızlı işlemler" style={{ marginTop: '1.5rem' }}>
        <ul
          style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', listStyle: 'none', margin: 0, padding: 0 }}
        >
          {actions.map((action) => (
            <li key={action.href}>
              {/* Hover durumu satır içi stille verilemez; sınıflar
                  admin-theme.css içinde tanımlıdır. */}
              <a
                href={action.href}
                className={`aiftc-btn ${action.primary ? 'aiftc-btn--primary' : 'aiftc-btn--secondary'}`}
              >
                {action.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

    </section>
  )
}

export default DashboardOverview
