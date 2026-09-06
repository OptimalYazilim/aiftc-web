'use server'

import { getTranslations } from 'next-intl/server'

import { FOCUS_COUNTRIES, SUBMISSION_TYPES } from '@/fields/options'
import { isLocale, type Locale } from '@/i18n/locales'
import { CONTACT_FORM_TITLE } from '@/lib/contactForm'
import { payloadClient } from '@/lib/queries'

/**
 * İLETİŞİM FORMU GÖNDERİMİ  (Şartname 6.9, 12.2)
 * ============================================================================
 * KVKK / GDPR NOTLARI — bu dosyadaki her kural bir maddeye dayanır:
 *
 *  1. AÇIK RIZA ZORUNLU (12.2). Onay kutusu işaretlenmeden kayıt OLUŞTURULMAZ.
 *     Kontrol yalnızca tarayıcıda yapılamaz: `required` niteliği devtools ile
 *     kaldırılabilir, istek doğrudan da atılabilir. Bu yüzden sunucu tarafında
 *     tekrar doğrulanır.
 *  2. VERİ ASGARİLİĞİ. Yalnızca formda tanımlı alanlar kaydedilir. IP adresi,
 *     tarayıcı bilgisi veya oturum kimliği TOPLANMAZ ve saklanmaz.
 *  3. SAKLAMA SÜRESİ. `retentionDays` form kaydında tutulur; silme işlemi
 *     yönetim tarafında yürütülür (bkz. collections/FormRequests.ts).
 *  4. AÇIK RIZA KANITI. Onay anı ve o an gösterilen metnin kopyası kayda
 *     yazılır; metin sonradan değişse bile eski kaydın dayanağı korunur.
 *
 * NEREYE YAZIYOR
 * Gönderim tipli `form-requests` koleksiyonuna düşer — plugin'in
 * `form-submissions` koleksiyonuna DEĞİL. Gerekçe FormRequests.ts başında.
 *
 * SPAM KORUMASI
 * Yapılandırmada hız sınırlama YOKTUR (bkz. payload.config.ts içindeki not),
 * bu yüzden iki hafif önlem buraya konur: bal küpü (honeypot) alanı ve alan
 * uzunluğu sınırları. Bunlar CAPTCHA yerine geçmez; ciddi bir saldırı için
 * ters vekil katmanında sınırlama gerekir.
 * ============================================================================
 */

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  /** Alan adı → hata mesajı. Boşsa genel hata `message` alanındadır. */
  fieldErrors?: Record<string, string>
  message?: string
}

/** Alan adı → azami karakter. Sunucu tarafı sınırı; istemci `maxLength` ile eşleşir. */
const LIMITS: Record<string, number> = {
  fullName: 120,
  organization: 160,
  email: 200,
  subject: 160,
  message: 4000,
}

const REQUIRED_FIELDS = ['fullName', 'email', 'subject', 'message'] as const

/** RFC'nin tamamı değil; kullanıcıyı erken uyarmaya yeten sağlamlıkta. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const submitContactForm = async (
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> => {
  const rawLocale = String(formData.get('locale') ?? '')
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'tr'
  const t = await getTranslations({ locale, namespace: 'contact' })

  // --- Bal küpü: gerçek kullanıcı bu alanı göremez, bot doldurur ----------
  // Başarı döndürülür ki bot hatayı görüp yöntem değiştirmesin.
  if (String(formData.get('website') ?? '').trim().length > 0) {
    return { status: 'success', message: t('formSuccess') }
  }

  const values: Record<string, string> = {}
  for (const field of ['fullName', 'organization', 'email', 'subject', 'message']) {
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

  // --- Açık rıza (12.2) ---------------------------------------------------
  if (formData.get('consent') !== 'on') {
    fieldErrors.consent = t('errorConsent')
  }

  /*
    --- Seçim alanları -------------------------------------------------------
    Tarayıcıdan gelen değer HİÇBİR ZAMAN doğrudan yazılmaz: `<select>` devtools
    ile değiştirilebilir, istek doğrudan da atılabilir. Bu yüzden gelen değer
    sözlükte var mı diye kontrol edilir; yoksa güvenli varsayılana düşülür.
    (Aynı gerekçe açık rıza denetiminin sunucuda tekrarlanmasıyla aynıdır.)
  */
  const rawType = String(formData.get('submissionType') ?? '')
  const submissionType = SUBMISSION_TYPES.some((option) => option.value === rawType)
    ? rawType
    : 'contact'

  const rawCountry = String(formData.get('country') ?? '')
  const country = FOCUS_COUNTRIES.some((option) => option.value === rawCountry) ? rawCountry : null

  /*
    Bağlı eğitim yalnızca BAŞVURU türünde kabul edilir ve gerçekten var olan,
    YAYINDA bir kayda işaret etmelidir. Doğrulanmadan yazılsaydı ziyaretçi
    istediği id'yi göndererek taslak/silinmiş bir eğitime kayıt iliştirebilirdi.
  */
  let relatedTraining: number | null = null
  const rawTraining = String(formData.get('relatedTraining') ?? '').trim()

  if (submissionType === 'training-application' && /^\d+$/.test(rawTraining)) {
    const payloadForCheck = await payloadClient()
    const found = await payloadForCheck.find({
      collection: 'training-programs',
      where: { id: { equals: Number(rawTraining) }, _status: { equals: 'published' } },
      limit: 1,
      depth: 0,
      select: {} as never,
    })
    if (found.docs.length > 0) relatedTraining = Number(rawTraining)
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', fieldErrors, message: t('formErrorSummary') }
  }

  try {
    const payload = await payloadClient()

    /*
      Açık rıza metni `forms` kaydından okunur ve gönderimin YANINA KOPYALANIR.
      Neden kopya: metin sonradan güncellenirse, eski kaydın hangi metne onay
      verdiği belirsizleşirdi. KVKK açısından kanıt, o anki metindir.

      Form kaydı yoksa gönderim yine de kabul edilir — ziyaretçinin mesajını
      bir CMS eksiği yüzünden kaybetmek en kötü sonuçtur. Snapshot boş kalır
      ve panelde bu görülür.
    */
    const forms = await payload.find({
      collection: 'forms',
      where: { title: { equals: CONTACT_FORM_TITLE } },
      limit: 1,
      depth: 0,
    })

    const consentSnapshot =
      (forms.docs[0] as { consentText?: string | null } | undefined)?.consentText ?? null

    await payload.create({
      collection: 'form-requests',
      // Koleksiyonun `create` erişimi herkese kapalıdır (bkz. FormRequests.ts).
      // Local API varsayılan olarak erişimi aşar; kayıt yalnızca buradan düşer.
      data: {
        submissionType,
        status: 'pending',
        fullName: values.fullName,
        email: values.email,
        organization: values.organization || undefined,
        country: country || undefined,
        subject: values.subject,
        message: values.message,
        relatedTraining: relatedTraining ?? undefined,
        consentAcceptedAt: new Date().toISOString(),
        consentSnapshot,
        locale,
      } as never,
    })

    return { status: 'success', message: t('formSuccess') }
  } catch {
    // Ayrıntılı hata kullanıcıya gösterilmez (bilgi sızıntısı); sunucu
    // günlüğünde Payload zaten kaydeder.
    return { status: 'error', message: t('formFailed') }
  }
}
