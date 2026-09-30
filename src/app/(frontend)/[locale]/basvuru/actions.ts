'use server'

import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { FOCUS_COUNTRIES } from '@/fields/options'
import { isLocale, type Locale } from '@/i18n/locales'
import {
  ayarlariCoz,
  bugunIstanbul,
  doluGeceler,
  gunOf,
  konaklamaDogrula,
  konaklamaHesapla,
  type KonaklamaHesabi,
} from '@/lib/accommodation'
import { EK_ALAN_ONEKI, ekCevaplariDogrula, sorulariCoz, type EkCevap } from '@/lib/applicationQuestions'
import { CONTACT_FORM_TITLE } from '@/lib/contactForm'
import { payloadClient } from '@/lib/queries'
import { REGISTRATION_FORM_TITLE } from '@/lib/registrationForm'

/**
 * EĞİTİM BAŞVURUSU GÖNDERİMİ  (Şartname 6.4 · 12.2)
 * ============================================================================
 * `iletisim/actions.ts` ile aynı omurga, farklı hedef: kayıt `registrations`
 * koleksiyonuna düşer ve bir YAŞAM DÖNGÜSÜ başlatır (bekliyor → karar).
 *
 * SERVER ACTION KULLANILIYOR — KURALLA ÇELİŞMİYOR
 * ---------------------------------------------------------------------------
 * Proje kuralı KİMLİK formlarında Server Action yasaklar (Payload çerezi ve
 * `Origin` tabanlı CSRF). Bu form oturum AÇMAZ; iletişim formuyla aynı sınıfta
 * bir veri girişidir. Oturum yalnızca OKUNUR (`payload.auth`) ve kaydı hesaba
 * bağlamak için kullanılır.
 *
 * KVKK (12.2) — iletişim formuyla birebir aynı dört kural:
 *  1. açık rıza SUNUCUDA denetlenir, 2. veri asgariliği (IP/tarayıcı yok),
 *  3. saklama kurumun envanterinde (bkz. Registrations.ts — süpürmeye dahil
 *  DEĞİL), 4. rıza kanıtı (an + metin kopyası) kayda yazılır.
 *
 * BU FORMA ÖZGÜ DENETİMLER
 * ---------------------------------------------------------------------------
 *  - EĞİTİM GERÇEKTEN BAŞVURUYA AÇIK MI. Tarayıcıdan gelen id doğrudan
 *    yazılmaz: yayında VE `applications-open` olmayan bir eğitime kayıt
 *    açılmaz. Aksi hâlde kapalı/taslak bir programa istekle başvuru
 *    iliştirilebilirdi.
 *  - MÜKERRER BAŞVURU. Aynı e-posta + aynı eğitim için reddedilmemiş bir
 *    kayıt varsa yenisi açılmaz; kişiye bunun söylenmesi, panelde iki
 *    kayıtla uğraşmaktan iyidir. DÜRÜST SINIR: denetim ile yazma arasında
 *    yarış vardır — iki eş zamanlı gönderim ikisini de geçirebilir.
 *    Veritabanı düzeyinde tekil kısıt yok (Payload'ın alan API'si bileşik
 *    tekil indeks tanımlamaz); panelde ikinci kaydı silmek yeterlidir.
 *
 * SPAM: bal küpü + uzunluk sınırı, iletişim formuyla aynı. CAPTCHA YOK —
 * kayıt formunda var, burada kurumun kararı. Ters vekil sınırlaması şart.
 * ============================================================================
 */

export type RegistrationFormState = {
  status: 'idle' | 'success' | 'error'
  fieldErrors?: Record<string, string>
  message?: string
  /**
   * HATADA GÖNDERİLEN DEĞERLER GERİ DÖNER — ölçülmüş kusur (2026-09-30).
   * React 19, `action` alan formu eylem bitince SIFIRLAR; sunucu bir hata
   * döndürdüğünde kişinin yazdığı her şey siliniyordu (ad, e-posta, rıza,
   * cevaplar). Form bu değerleri `defaultValue` olarak kullanır; sıfırlama
   * onlara döner. Yalnızca formun kendi alan adları, kırpılmış ve sınırlı
   * uzunlukta döner.
   */
  values?: Record<string, string>
}

/** Hata dönüşünde formu geri doldurmak için gönderilen değerler. */
const gonderilenDegerler = (formData: FormData): Record<string, string> => {
  const sonuc: Record<string, string> = {}
  for (const [ad, deger] of formData.entries()) {
    if (typeof deger !== 'string') continue
    if (ad === 'website' || ad.startsWith('$')) continue
    const bilinen =
      ad in LIMITS ||
      ['training', 'country', 'consent', 'accRequested', 'accCheckIn', 'accCheckOut'].includes(ad) ||
      ad.startsWith(EK_ALAN_ONEKI)
    if (bilinen) sonuc[ad] = deger.slice(0, 2000)
  }
  return sonuc
}

const LIMITS: Record<string, number> = {
  fullName: 120,
  email: 200,
  phone: 40,
  organization: 160,
  position: 120,
  notes: 2000,
}

const REQUIRED_FIELDS = ['fullName', 'email'] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const submitRegistration = async (
  _previous: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> => {
  const rawLocale = String(formData.get('locale') ?? '')
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'tr'
  const t = await getTranslations({ locale, namespace: 'registration' })

  /* Bal küpü: bot doldurur, gerçek kullanıcı görmez. Başarı döner, kayıt yok. */
  if (String(formData.get('website') ?? '').trim().length > 0) {
    return { status: 'success', message: t('formSuccess') }
  }

  const values: Record<string, string> = {}
  for (const field of Object.keys(LIMITS)) {
    values[field] = String(formData.get(field) ?? '').trim()
  }

  const fieldErrors: Record<string, string> = {}

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) fieldErrors[field] = t('errorRequired')
  }
  for (const [field, limit] of Object.entries(LIMITS)) {
    if (values[field] && values[field].length > limit) {
      fieldErrors[field] = t('errorTooLong', { max: limit })
    }
  }
  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    fieldErrors.email = t('errorEmail')
  }
  if (formData.get('consent') !== 'on') {
    fieldErrors.consent = t('errorConsent')
  }

  const rawCountry = String(formData.get('country') ?? '')
  const country = FOCUS_COUNTRIES.some((o) => o.value === rawCountry) ? rawCountry : null

  const payload = await payloadClient()

  /* --- Eğitim: var mı, yayında mı, başvuruya açık mı ----------------------- */
  const rawTraining = String(formData.get('training') ?? '').trim()
  let trainingId: number | null = null
  let extraAnswers: EkCevap[] = []
  let egitimTarihleri: { start: string | null; end: string | null } = { start: null, end: null }

  if (/^\d+$/.test(rawTraining)) {
    const found = await payload.find({
      collection: 'training-programs',
      locale,
      where: {
        id: { equals: Number(rawTraining) },
        _status: { equals: 'published' },
        status: { equals: 'applications-open' },
      },
      limit: 1,
      depth: 0,
      select: { applicationQuestions: true, startDate: true, endDate: true } as never,
    })
    if (found.docs.length > 0) {
      trainingId = Number(rawTraining)
      const egitimDoc = found.docs[0] as { startDate?: string | null; endDate?: string | null }
      egitimTarihleri = { start: gunOf(egitimDoc.startDate), end: gunOf(egitimDoc.endDate) }
      /*
        Eğitime özel sorular SUNUCUDA, kayıttan yeniden okunur; istemcinin
        gönderdiği alan listesine güvenilmez (lib/applicationQuestions.ts).
      */
      const sorular = sorulariCoz((found.docs[0] as { applicationQuestions?: unknown }).applicationQuestions)
      const { cevaplar, hatalar } = ekCevaplariDogrula(sorular, formData, {
        zorunlu: t('errorRequired'),
        uzun: (max) => t('errorTooLong', { max }),
        secim: t('errorChoice'),
        evet: t('answerYes'),
        hayir: t('answerNo'),
      })
      extraAnswers = cevaplar
      Object.assign(fieldErrors, hatalar)
    }
  }
  if (!trainingId) fieldErrors.training = t('errorTraining')

  /*
    KONAKLAMA — yalnızca kurum özelliği açtıysa ve kişi işaretlediyse. Kural,
    ayarlar ve doluluk SUNUCUDA yeniden okunur; form yalnızca yardım gösterir
    (lib/accommodation.ts). Özellik kapalıyken gelen alanlar yok sayılır.
  */
  let konaklama: (KonaklamaHesabi & { checkIn: string; checkOut: string; currency: string }) | null = null
  if (formData.get('accRequested') === 'on') {
    const ayar = ayarlariCoz(await payload.findGlobal({ slug: 'accommodation-settings', depth: 0 }).catch(() => null))
    if (ayar.enabled) {
      const bugun = bugunIstanbul()
      const onayli = await payload.find({
        collection: 'accommodation-requests',
        where: { status: { equals: 'approved' }, checkOut: { greater_than_equal: bugun } },
        limit: 2000,
        depth: 0,
        select: { checkIn: true, checkOut: true } as never,
      })
      const dolu = doluGeceler(
        (onayli.docs as unknown as { checkIn?: string; checkOut?: string }[])
          .map((d) => ({ checkIn: gunOf(d.checkIn), checkOut: gunOf(d.checkOut) }))
          .filter((d): d is { checkIn: string; checkOut: string } => Boolean(d.checkIn && d.checkOut)),
        ayar.capacity,
      )
      const girisHam = String(formData.get('accCheckIn') ?? '').trim()
      const cikisHam = String(formData.get('accCheckOut') ?? '').trim()
      const hata = konaklamaDogrula(girisHam, cikisHam, ayar, bugun, dolu)
      if (hata) {
        const tarih = (gun: string) =>
          new Date(`${gun}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        const metin = (() => {
          switch (hata.kod) {
            case 'zorunlu':
              return t('errorRequired')
            case 'gecersiz':
              return t('accErrInvalid')
            case 'gecmis':
              return t('accErrPast')
            case 'sira':
              return t('accErrOrder')
            case 'uzun':
              return t('accErrTooLong', { max: hata.max })
            case 'kapali':
              return t('accErrClosed', { from: tarih(hata.from), to: tarih(hata.to) })
            case 'dolu':
              return t('accErrFull', { night: tarih(hata.gece) })
          }
        })()
        fieldErrors[hata.alan] = metin
      } else {
        const checkIn = gunOf(girisHam)!
        const checkOut = gunOf(cikisHam)!
        konaklama = {
          ...konaklamaHesapla(checkIn, checkOut, egitimTarihleri, ayar),
          checkIn,
          checkOut,
          currency: ayar.currency,
        }
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', fieldErrors, message: t('formErrorSummary'), values: gonderilenDegerler(formData) }
  }

  const eposta = values.email.toLowerCase()

  /* --- Mükerrer başvuru ------------------------------------------------- */
  const mevcut = await payload.find({
    collection: 'registrations',
    where: {
      training: { equals: trainingId },
      email: { like: eposta },
      status: { not_equals: 'rejected' },
    },
    limit: 1,
    depth: 0,
  })
  if (mevcut.totalDocs > 0) {
    return {
      status: 'error',
      fieldErrors: { email: t('errorDuplicate') },
      message: t('errorDuplicate'),
      values: gonderilenDegerler(formData),
    }
  }

  try {
    /*
      Oturum varsa kayıt hesaba bağlanır. `payload.auth` çerezi başlıklardan
      okur; oturum yoksa `user` null kalır ve başvuru anonim olarak düşer —
      ikisi de geçerli yoldur.
    */
    const { user } = await payload.auth({ headers: await headers() })

    /*
      Açık rıza metni: önce başvuruya özel form, yoksa iletişim formu
      (gerekçe: lib/registrationForm.ts). Metin sonradan değişse bile kayıt
      hangi metne onay verildiğini göstermeye devam eder.
    */
    const forms = await payload.find({
      collection: 'forms',
      where: { title: { in: [REGISTRATION_FORM_TITLE, CONTACT_FORM_TITLE] } },
      limit: 2,
      depth: 0,
    })
    const formlar = forms.docs as unknown as { title?: string; consentText?: string | null }[]
    const consentSnapshot =
      formlar.find((f) => f.title === REGISTRATION_FORM_TITLE)?.consentText ??
      formlar.find((f) => f.title === CONTACT_FORM_TITLE)?.consentText ??
      null

    const basvuru = await payload.create({
      collection: 'registrations',
      /* Koleksiyonun `create` erişimi kapalı; Local API bunu aşar (bkz. Registrations.ts). */
      data: {
        status: 'pending',
        training: trainingId,
        user: user?.id ?? undefined,
        fullName: values.fullName,
        email: eposta,
        phone: values.phone || undefined,
        organization: values.organization || undefined,
        position: values.position || undefined,
        country: country || undefined,
        notes: values.notes || undefined,
        extraAnswers: extraAnswers.length > 0 ? extraAnswers : undefined,
        consentAcceptedAt: new Date().toISOString(),
        consentSnapshot,
        locale,
      } as never,
    })

    /*
      Konaklama talebi başvuruya bağlı açılır (panelde ayrı bölüm). Açılamazsa
      başvuru da GERİ ALINIR: kişi "alındı" görüp konaklama talebinin
      kaybolması, başvurunun hiç düşmemesinden daha kötüdür — hata dönünce
      form değerleriyle geri gelir ve kişi yeniden gönderebilir.
    */
    if (konaklama) {
      try {
        await payload.create({
          collection: 'accommodation-requests',
          data: {
            status: 'pending',
            registration: basvuru.id,
            training: trainingId,
            fullName: values.fullName,
            email: eposta,
            phone: values.phone || undefined,
            /*
              ÖĞLEN SAATİYLE yazılır (UTC 12:00). Yalın "YYYY-AA-GG" UTC gece
              yarısı olarak saklanır; UTC'nin gerisindeki bir saat diliminde
              açılan panel o değeri BİR GÜN ÖNCE gösterirdi. Öğlen, hangi saat
              diliminden bakılırsa bakılsın aynı güne düşer; `gunOf` okurken
              yine doğru günü verir (lib/accommodation.ts).
            */
            checkIn: `${konaklama.checkIn}T12:00:00.000Z`,
            checkOut: `${konaklama.checkOut}T12:00:00.000Z`,
            nights: konaklama.nights,
            nightsInTraining: konaklama.nightsInTraining,
            nightsOutside: konaklama.nightsOutside,
            estimatedCost: konaklama.estimatedCost ?? undefined,
            currency: konaklama.currency,
          } as never,
        })
      } catch (err) {
        await payload.delete({ collection: 'registrations', id: basvuru.id }).catch(() => undefined)
        throw err
      }
    }

    return { status: 'success', message: t('formSuccess') }
  } catch {
    /* Ayrıntı kullanıcıya sızdırılmaz; Payload sunucu günlüğüne yazar. */
    return { status: 'error', message: t('formFailed'), values: gonderilenDegerler(formData) }
  }
}
