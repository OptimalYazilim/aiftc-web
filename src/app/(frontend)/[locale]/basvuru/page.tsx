import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  RegistrationForm,
  type KonaklamaProp,
  type TrainingOption,
} from '@/components/registration/RegistrationForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { isLocale, type Locale } from '@/i18n/locales'
import { ROUTES } from '@/i18n/routes'
import { ayarlariCoz, bugunIstanbul, doluGeceler, gunOf } from '@/lib/accommodation'
import { sorulariCoz } from '@/lib/applicationQuestions'
import { CONTACT_FORM_TITLE } from '@/lib/contactForm'
import { buildMetadata } from '@/lib/metadata'
import { payloadClient } from '@/lib/queries'
import { REGISTRATION_FORM_TITLE } from '@/lib/registrationForm'

/**
 * EĞİTİM BAŞVURU SAYFASI  (Şartname 6.4 · EK-1 · 12.2)
 * ============================================================================
 * ROTA: klasör adı `basvuru`, `ROUTES.application.tr` ile birebir aynıdır.
 * /tr/basvuru · /en/apply · /ru/zayavka
 *
 * EK-1 gereği eğitim DETAY sayfası form barındırmaz; kişisel veri yalnızca
 * bu sayfada, açık rıza metniyle birlikte toplanır. Eğitim künyesindeki
 * "Ön Başvuru Yap" düğmesi `?egitim=<id>` ile buraya getirir; sayfa tek
 * başına açıldığında başvuruya açık eğitimlerden seçim sunar.
 *
 * DİNAMİK — ÖNBELLEĞE ALINMAZ
 * ---------------------------------------------------------------------------
 * Oturum varsa ad ve e-posta ön dolu gelir; kişiye özel üretilmiş HTML
 * önbelleğe düşse sonraki ziyaretçi öncekinin adını görürdü. Ayrıca
 * "başvuruya açık" listesi anlık olmalı: kapanan bir eğitim beş dakika daha
 * seçilebilir görünmemeli (sunucu eylemi yine reddeder, ama kullanıcıya
 * doldurduktan sonra "kapandı" demek kötü deneyimdir).
 * ============================================================================
 */

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const t = await getTranslations({ locale, namespace: 'registration' })
  return {
    ...buildMetadata({
      locale,
      title: t('metaTitle'),
      description: t('intro'),
      pathByLocale: ROUTES.application,
    }),
    /* Form sayfası dizine girmesin; eğitim sayfaları zaten dizindedir. */
    robots: { index: false, follow: true },
  }
}

export default async function RegistrationPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  setRequestLocale(locale)

  const [t, tn] = await Promise.all([getTranslations('registration'), getTranslations('nav')])
  const payload = await payloadClient()

  const sorgu = await searchParams
  const ham = sorgu.egitim
  const hamEgitim = Array.isArray(ham) ? ham[0] : ham
  const defaultTrainingId = hamEgitim && /^\d+$/.test(hamEgitim) ? Number(hamEgitim) : null

  /*
    Yalnızca YAYINDA ve BAŞVURUYA AÇIK eğitimler; başlık dışında alan çekilmez.
    Sunucu eylemi aynı koşulu yeniden denetler — liste bir kolaylıktır,
    kural değil.
  */
  const [egitimler, formlar, { user }] = await Promise.all([
    payload.find({
      collection: 'training-programs',
      locale,
      where: { _status: { equals: 'published' }, status: { equals: 'applications-open' } },
      limit: 100,
      depth: 0,
      sort: '-startDate',
      select: { title: true, applicationQuestions: true, startDate: true, endDate: true } as never,
    }),
    payload.find({
      collection: 'forms',
      where: { title: { in: [REGISTRATION_FORM_TITLE, CONTACT_FORM_TITLE] } },
      limit: 2,
      depth: 0,
    }),
    payload.auth({ headers: await headers() }),
  ])

  /*
    Sorular yalnızca GÖSTERMEK için forma gider; sunucu eylemi zorunluluğu ve
    geçerli seçenekleri eğitim kaydından yeniden okur (lib/applicationQuestions).
  */
  type EgitimSatiri = {
    id: number
    title: string
    applicationQuestions?: unknown
    startDate?: string | null
    endDate?: string | null
  }
  const trainings: TrainingOption[] = (egitimler.docs as unknown as Partial<EgitimSatiri>[])
    .filter((d): d is EgitimSatiri => Boolean(d.id && d.title))
    .map((d) => ({
      id: d.id,
      title: d.title,
      questions: sorulariCoz(d.applicationQuestions),
      start: gunOf(d.startDate),
      end: gunOf(d.endDate),
    }))

  /*
    KONAKLAMA ÖN BAŞVURUSU — kurum özelliği açtıysa. Doluluk ONAYLI taleplerden
    hesaplanır; yalnızca bugünden sonraki dolu geceler gönderilir. Kapalı
    dönemlerin iç notu istemciye GİTMEZ (Local API erişim kuralını aştığı için
    sayfada okunur; burada ayıklanır).
  */
  const konaklamaAyar = ayarlariCoz(
    await payload.findGlobal({ slug: 'accommodation-settings', depth: 0 }).catch(() => null),
  )
  let konaklama: KonaklamaProp | null = null
  if (konaklamaAyar.enabled) {
    const bugun = bugunIstanbul()
    const onayli = await payload.find({
      collection: 'accommodation-requests',
      where: { status: { equals: 'approved' }, checkOut: { greater_than_equal: bugun } },
      limit: 2000,
      depth: 0,
      select: { checkIn: true, checkOut: true } as never,
    })
    const talepler = (onayli.docs as unknown as { checkIn?: string; checkOut?: string }[])
      .map((d) => ({ checkIn: gunOf(d.checkIn), checkOut: gunOf(d.checkOut) }))
      .filter((d): d is { checkIn: string; checkOut: string } => Boolean(d.checkIn && d.checkOut))
    konaklama = {
      bugun,
      doluGeceler: [...doluGeceler(talepler, konaklamaAyar.capacity)].filter((g) => g >= bugun).sort(),
      ayar: {
        maxNights: konaklamaAyar.maxNights,
        rateInTraining: konaklamaAyar.rateInTraining,
        rateOutsideTraining: konaklamaAyar.rateOutsideTraining,
        currency: konaklamaAyar.currency,
        closedPeriods: konaklamaAyar.closedPeriods.map(({ from, to }) => ({ from, to })),
      },
    }
  }

  /*
    AÇIK RIZA METNİ — ÜÇ KADEMELİ YEDEK, İLETİŞİM FORMUYLA AYNI
    1. panelde "Eğitim Başvuru Formu" başlıklı kaydın metni (asıl hedef),
    2. yoksa iletişim formunun metni,
    3. o da yoksa iletişim formunun kullandığı sabit yedek (`consentFallback`).
    Üçüncü kademe iletişim formuyla birebir aynıdır; başvuru formunun rıza
    kutusu hiçbir koşulda metinsiz kalmaz. Kurumun kendi metnini panelden
    girmesi beklenir — bu kod hukuki metin ÜRETMEZ (lib/registrationForm.ts).
  */
  const tc = await getTranslations('contact')
  const f = formlar.docs as unknown as { title?: string; consentText?: string | null }[]
  const consentText =
    f.find((x) => x.title === REGISTRATION_FORM_TITLE)?.consentText?.trim() ||
    f.find((x) => x.title === CONTACT_FORM_TITLE)?.consentText?.trim() ||
    tc('consentFallback')

  return (
    <>
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero">
          <Breadcrumbs
            label={tn('breadcrumb')}
            items={[{ label: tn('home'), href: `/${locale}` }, { label: t('title') }]}
          />
          <p className="eyebrow mt-6">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{t('title')}</h1>
          <p className="lede measure mt-5">{t('intro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        <div className="max-w-2xl">
          {user ? (
            <p className="mb-6 border-s-2 border-brand-700 bg-surface-alt p-4 text-sm text-ink-700">
              {t('signedInNote')}
            </p>
          ) : null}
          <RegistrationForm
            locale={locale}
            consentText={consentText}
            trainings={trainings}
            defaultTrainingId={defaultTrainingId}
            konaklama={konaklama}
            varsayilan={
              user
                ? {
                    fullName: (user as { name?: string | null }).name ?? null,
                    email: typeof user.email === 'string' ? user.email : null,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </>
  )
}
