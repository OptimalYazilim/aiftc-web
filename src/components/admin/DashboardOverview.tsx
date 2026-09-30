import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { LOCALES, type Locale } from '@/i18n/locales'

/**
 * KONTROL PANELİ — GENEL BAKIŞ
 * ============================================================================
 * Payload'ın varsayılan kontrol paneli yalnızca koleksiyon kartlarını listeler.
 * Bu bileşen onun üstüne, editörün panele girer girmez göreceği bir durum
 * özeti koyar: kaç eğitim aktif, kaç program yaklaşıyor, kaç başvuru ve form
 * gönderimi karar bekliyor — ve çeviri durumu.
 *
 * SUNUCU BİLEŞENİ — Payload Local API'ye doğrudan erişir; ek HTTP isteği yok.
 * Biçim admin-theme.css → 9. bölüm (`.aiftc-ozet`, `.aiftc-olcum`, …).
 * Projenin Tailwind katmanı `/admin` rotalarında ÇALIŞMAZ; sınıflar orada.
 *
 * ---------------------------------------------------------------------------
 * DÜZELTME (2026-10-01): "Form Bildirimleri" sayacı ve "Gelen Başvuruları
 * İncele" bağlantısı `form-submissions` koleksiyonuna bakıyordu — panelde
 * adıyla "kullanılmıyor" diye işaretli, BOŞ olan koleksiyona. Gerçek kutular:
 *   - eğitim başvuruları  → `registrations`
 *   - iletişim/form       → `form-requests`
 * Sayaçlar artık oralarda "Bekliyor" durumundaki kayıtları sayar ve
 * bağlantılar o süzgeçle açılır. KVKK: yalnızca SAYI okunur, içerik okunmaz.
 *
 * ---------------------------------------------------------------------------
 * ÇEVİRİ DURUMU — YALNIZCA ROZET
 * Şartname 5 "eksik çeviriler panelde görülebilmelidir" koşulu rozetle
 * karşılanır: eksik varsa sayıyı yazar ve en çok eksiği olan bölümün
 * listesine BAĞLANIR; oradaki "Çeviri Durumu" sütunu ayrıntıyı gösterir.
 * ============================================================================
 */

/* --------------------------------------------------------------------------
   İKONLAR — her biri dekoratif (`aria-hidden`), bilgi metinde.
   -------------------------------------------------------------------------- */
const iconProps = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
}

/** Kep — eğitimler. */
const IconTraining = () => (
  <svg {...iconProps}>
    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
    <path d="M6 12.5v4.5c3 2 9 2 12 0v-4.5" />
  </svg>
)

/** Takvim — yaklaşan programlar. */
const IconCalendar = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

/** Pano — başvurular. */
const IconClipboard = () => (
  <svg {...iconProps}>
    <path d="M9 3.5h6v3H9z" />
    <path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
)

/** Gelen kutusu — form gönderimleri. */
const IconInbox = () => (
  <svg {...iconProps}>
    <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <path d="M3 13h5l1 2h6l1-2h5" />
  </svg>
)

type Metric = {
  label: string
  value: number | null
  hint?: string | null
  href: string
  icon: React.ReactNode
  /** Karar bekleyen iş var mı — kart bunu yazıyla da söyler. */
  attention?: boolean
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
  return new Intl.DateTimeFormat('tr', { dateStyle: 'long', timeZone: 'Europe/Istanbul' }).format(date)
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

const PENDING_QUERY = '?where[status][equals]=pending'

export const DashboardOverview = async () => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const countPending = (collection: 'registrations' | 'accommodation-requests' | 'form-requests') =>
    safeCount(async () => {
      const result = await payload.count({
        collection,
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      })
      return result.totalDocs
    })

  const [activeTrainings, upcoming, pendingRegistrations, pendingAccommodation, pendingRequests] =
    await Promise.all([
      safeCount(async () => {
        const result = await payload.count({
          collection: 'training-programs',
          where: {
            _status: { equals: 'published' },
            status: { in: ['applications-open', 'ongoing'] },
          },
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

      countPending('registrations'),
      countPending('accommodation-requests'),
      countPending('form-requests'),
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
      label: 'Aktif eğitimler',
      value: activeTrainings,
      hint: 'Başvuruya açık veya devam eden',
      href: '/admin/collections/training-programs',
      icon: <IconTraining />,
    },
    {
      label: 'Yaklaşan programlar',
      value: upcoming.count,
      hint: upcoming.nextDate ? `En yakını: ${upcoming.nextDate}` : 'Planlanmış program yok',
      href: '/admin/collections/training-programs',
      icon: <IconCalendar />,
    },
    {
      label: 'Bekleyen başvurular',
      value: pendingRegistrations,
      hint:
        pendingAccommodation === null
          ? 'Karar bekleyen eğitim başvurusu'
          : `Konaklama talebi: ${pendingAccommodation} bekliyor`,
      href: `/admin/collections/registrations${PENDING_QUERY}`,
      icon: <IconClipboard />,
      attention: Boolean(pendingRegistrations),
    },
    {
      label: 'Bekleyen formlar',
      value: pendingRequests,
      hint: 'Yanıt bekleyen iletişim ve bilgi talepleri',
      href: `/admin/collections/form-requests${PENDING_QUERY}`,
      icon: <IconInbox />,
      attention: Boolean(pendingRequests),
    },
  ]

  const today = new Intl.DateTimeFormat('tr', {
    dateStyle: 'full',
    timeZone: 'Europe/Istanbul',
  }).format(new Date())

  /*
    Rozet: renk tek başına anlam taşımaz — simge (✓ / ⚠) ve metin de durumu
    söyler (WCAG 2.2 — 1.4.1). Renk çiftleri admin-theme.css'te ölçülmüştür.
  */
  const translationBadge = (() => {
    if (totalMissing === 0) {
      return <span className="aiftc-rozet aiftc-rozet--tamam">✓ {LOCALES.length} dil eşit</span>
    }
    const worst = [...translationRows].sort(
      (a, b) =>
        Object.values(b.missing).reduce((x, y) => x + y, 0) -
        Object.values(a.missing).reduce((x, y) => x + y, 0),
    )[0]
    return (
      <a className="aiftc-rozet aiftc-rozet--eksik" href={`/admin/collections/${worst.slug}`}>
        ⚠ {totalMissing} eksik çeviri
      </a>
    )
  })()

  return (
    <section className="aiftc-ozet" aria-labelledby="dashboard-overview-heading">
      <div className="aiftc-ozet__ust">
        <div>
          <p className="aiftc-ozet__tarih">{today}</p>
          <h2 id="dashboard-overview-heading" className="aiftc-ozet__baslik">
            Genel bakış
          </h2>
          <p className="aiftc-ozet__aciklama">
            Antalya Uluslararası Ormancılık Eğitim Merkezi yönetim paneli. Eğitim sayıları yalnızca{' '}
            <strong>yayımlanmış</strong> kayıtları gösterir. {translationBadge}
          </p>
        </div>

        <nav aria-label="Hızlı işlemler">
          <ul className="aiftc-ozet__eylemler">
            <li>
              <a className="aiftc-btn aiftc-btn--birincil" href="/admin/collections/training-programs/create">
                + Yeni eğitim
              </a>
            </li>
            <li>
              <a className="aiftc-btn aiftc-btn--birincil" href="/admin/collections/news/create">
                + Yeni haber
              </a>
            </li>
            <li>
              <a className="aiftc-btn aiftc-btn--ikincil" href={`/admin/collections/registrations${PENDING_QUERY}`}>
                Başvuruları incele
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Her ölçüm kendi listesine giden bir bağlantıdır; bağlantının adı
          etiket + sayı + ipucudur ("Bekleyen başvurular 3 …"). */}
      <ul className="aiftc-ozet__olcumler">
        {metrics.map((metric) => (
          <li key={metric.label}>
            <a
              className={`aiftc-olcum${metric.attention ? ' aiftc-olcum--dikkat' : ''}`}
              href={metric.href}
            >
              <span className="aiftc-olcum__ust">
                <span className="aiftc-olcum__etiket">{metric.label}</span>
                <span className="aiftc-olcum__ikon">{metric.icon}</span>
              </span>
              {/* Sorgu düştüyse sayı uydurulmaz. */}
              <strong className="aiftc-olcum__deger">{metric.value === null ? '—' : metric.value}</strong>
              {metric.hint ? <span className="aiftc-olcum__ipucu">{metric.hint}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DashboardOverview
