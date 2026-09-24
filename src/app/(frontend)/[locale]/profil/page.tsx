import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AUDIENCE_ROLES, SUBMISSION_STATUSES, SUBMISSION_TYPES } from '@/fields/options'
import { isLocale, type Locale } from '@/i18n/locales'
import { authHref, detailHref, href } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { optionLabel } from '@/lib/optionLabel'
import { payloadClient } from '@/lib/queries'
import { abonelikDurumu } from '@/lib/subscription'

/**
 * PROFİL PANOSU  (Şartname 1.7 · 12.2 · KVKK)
 * ============================================================================
 * ROTA: klasör adı `profil`, `AUTH_ROUTES.profile.tr` ile birebir aynıdır.
 * /tr/profil · /en/profile · /ru/profil
 *
 * ---------------------------------------------------------------------------
 * BU SAYFA NE GÖSTERİR — VE NEYİ GÖSTEREMEZ
 * ---------------------------------------------------------------------------
 * Sayfa YALNIZCA SİSTEMDE GERÇEKTEN TUTULAN veriyi basar. Şema tarandı
 * (2026-09-24) ve şu üçü ölçülerek doğrulandı:
 *
 *   ✓ HESAP       `users` — ad, e-posta, birim, erişim rolü, hesap durumu
 *   ✓ ABONELİK    `users.subscriptionPlan` + `subscriptionEndsAt`
 *   ✓ BAŞVURULAR  `form-requests` — kullanıcının KENDİ e-postasıyla
 *                 gönderdiği iletişim ve eğitim başvuruları
 *
 *   ✗ KATILDIĞI EĞİTİMLER — BÖYLE BİR KAYIT YOK.
 *     Başvurular `form-requests` içinde serbest metin ad/e-posta ile durur ve
 *     bir kullanıcı hesabına İLİŞKİ ile BAĞLI DEĞİLDİR. Sanal sınıflarda da
 *     katılımcı listesi tutulmaz (erişim ortak parolayla verilir). Yani
 *     sistem "bu kişi hangi eğitime katıldı" sorusunu yanıtlayamaz.
 *
 *   ✗ SERTİFİKALAR — BÖYLE BİR KAYIT YOK.
 *     `training-programs.certificateType` alanı PROGRAMIN ne tür belge
 *     verdiğini söyler; bir KİŞİYE verilmiş belgeyi değil. Kişiye özel
 *     sertifika kaydı, numarası ve dosyası hiçbir koleksiyonda yoktur.
 *
 * Bu iki bölüm UYDURULMADI. Kamu kurumu adına var olmayan bir katılım ya da
 * sertifika göstermek, kullanıcıyı elinde olmayan bir belge olduğuna
 * inandırır ve kurumu yanlış beyana sokar. Bölümler yerinde durur, durumu
 * AÇIKÇA söyler ve kullanıcıyı iletişim sayfasına yönlendirir.
 *
 * Kurum bu kayıtları tutmak isterse iki koleksiyon gerekir (katılım kaydı ve
 * sertifika); bu bir şema kararıdır, arayüz kararı değil.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİM
 * ---------------------------------------------------------------------------
 * Oturum SUNUCUDA okunur; oturumsuz ziyaretçi giriş sayfasına yönlendirilir.
 * Sayfa kişiye özeldir, bu yüzden `force-dynamic`: önbelleğe alınmış bir HTML
 * sonraki ziyaretçiye ÖNCEKİNİN profilini gösterirdi.
 *
 * Başvurular `overrideAccess: false` + `user` ile çekilir — yani
 * `formRequestReadAccess` kuralı çalışır ve kullanıcı yalnızca kendi
 * kayıtlarını görür. Kural burada TEKRAR YAZILMAZ; tek kaynak erişim
 * modülüdür.
 * ============================================================================
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = await getTranslations({ locale, namespace: 'profile' })

  return {
    title: t('metaTitle'),
    /* Kişiye özel sayfa arama motoruna açılmaz. */
    robots: { index: false, follow: false },
  }
}

/** Künye satırı — etiket/değer çifti. Değer yoksa satır hiç basılmaz. */
const Satir: React.FC<{ etiket: string; deger?: string | null }> = ({ etiket, deger }) =>
  deger ? (
    <div className="flex flex-col gap-0.5 border-b border-line-soft py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-500 sm:w-44">
        {etiket}
      </dt>
      <dd className="min-w-0 text-ink-900">{deger}</dd>
    </div>
  ) : null

/**
 * HENÜZ TUTULMAYAN KAYITLAR İÇİN BÖLÜM.
 * Boş bir liste göstermek "sizin hiç eğitiminiz yok" demek olurdu — oysa
 * doğru cümle "sistem bunu henüz tutmuyor"dur. İkisi farklı şeydir ve
 * kullanıcının kuruma soracağı soru da farklıdır.
 */
const KayitTutulmuyor: React.FC<{
  baslik: string
  aciklama: string
  iletisimHref: string
  iletisimEtiketi: string
}> = ({ baslik, aciklama, iletisimHref, iletisimEtiketi }) => (
  <section className="border border-line bg-surface p-6">
    <h2 className="text-lg font-bold tracking-tight text-shell-900">{baslik}</h2>
    <p className="mt-2 text-sm leading-relaxed text-ink-700">{aciklama}</p>
    <p className="mt-4">
      <Link
        href={iletisimHref}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800"
      >
        {iletisimEtiketi}
      </Link>
    </p>
  </section>
)

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const t = await getTranslations('profile')
  const tc = await getTranslations('contact')
  const payload = await payloadClient()

  const { user } = await payload.auth({ headers: await headers() })

  /*
    OTURUMSUZ ZİYARETÇİ GİRİŞE GÖNDERİLİR.
    `notFound()` değil `redirect()`: sayfa VARDIR, kullanıcının kimliği
    eksiktir. 404 göstermek, bağlantıyı bozuk sanmasına yol açardı.
  */
  if (!user) redirect(authHref('login', locale))

  const eposta = typeof user.email === 'string' ? user.email : null

  /*
    KENDİ BAŞVURULARI. Kural `formRequestReadAccess` içindedir ve burada
    tekrarlanmaz; `overrideAccess: false` + `user` onu devreye sokar.
    Fazladan bir `where` yazmak, kuralın iki yerde yaşamasına ve bir gün
    ayrışmasına yol açardı.
  */
  const basvurular = await payload.find({
    collection: 'form-requests',
    locale,
    sort: '-createdAt',
    limit: 50,
    depth: 1,
    overrideAccess: false,
    user,
  })

  const abonelik = abonelikDurumu(user)
  const rolEtiketi = optionLabel(AUDIENCE_ROLES, String(user.role ?? ''), locale)

  const planAdi =
    user.subscriptionPlan && typeof user.subscriptionPlan === 'object'
      ? ((user.subscriptionPlan as { name?: string | null }).name ?? null)
      : null

  const biterTarih = user.subscriptionEndsAt
    ? new Date(user.subscriptionEndsAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const iletisimHref = href('contact', locale)

  return (
    <>
      {/* --- Başlık ------------------------------------------------------- */}
      <section className="border-b border-line bg-surface-alt">
        <div className="container-page page-hero-compact">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="title-page measure mt-3">{user.name || eposta || t('title')}</h1>
          <p className="lede measure mt-4">{t('intro')}</p>
        </div>
      </section>

      <div className="container-page section-block">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* --- Hesap künyesi --------------------------------------------- */}
          <section className="border border-line bg-surface p-6 lg:col-span-2">
            <h2 className="text-lg font-bold tracking-tight text-shell-900">
              {t('accountHeading')}
            </h2>
            <dl className="mt-4">
              <Satir etiket={t('fieldName')} deger={user.name} />
              <Satir etiket={t('fieldEmail')} deger={eposta} />
              <Satir etiket={t('fieldUnit')} deger={user.unit} />
              <Satir etiket={t('fieldRole')} deger={rolEtiketi} />
            </dl>

            <p className="mt-5 border-t border-line-soft pt-5 text-sm">
              <Link
                href={authHref('forgotPassword', locale)}
                className="inline-flex min-h-11 items-center font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800"
              >
                {t('changePassword')}
              </Link>
            </p>
          </section>

          {/* --- Abonelik --------------------------------------------------- */}
          <section className="border border-line bg-surface p-6">
            <h2 className="text-lg font-bold tracking-tight text-shell-900">
              {t('subscriptionHeading')}
            </h2>

            {/*
              Durum METİNLE söylenir, renkle değil (Kontrol Listesi 47).
              `muaf` hâli ayrı bir cümle alır: personel ve eğitmenler için
              "aboneliğiniz yok" demek YANLIŞ bilgidir — onlar zaten muaftır.
            */}
            <p className="mt-3 text-sm font-semibold text-shell-900">
              {abonelik === 'gecerli'
                ? t('subscriptionActive')
                : abonelik === 'muaf'
                  ? t('subscriptionExempt')
                  : abonelik === 'suresi-doldu'
                    ? t('subscriptionExpired')
                    : t('subscriptionNone')}
            </p>

            <dl className="mt-3">
              <Satir etiket={t('fieldPlan')} deger={planAdi} />
              <Satir etiket={t('fieldEndsAt')} deger={biterTarih} />
            </dl>

            <p className="mt-4 text-sm">
              <Link
                href={href('library', locale)}
                className="inline-flex min-h-11 items-center font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800"
              >
                {t('goToLibrary')}
              </Link>
            </p>
          </section>
        </div>

        {/* --- Başvurularım ------------------------------------------------ */}
        <section className="mt-6 border border-line bg-surface p-6">
          <h2 className="text-lg font-bold tracking-tight text-shell-900">
            {t('requestsHeading')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {t('requestsIntro', { eposta: eposta ?? '' })}
          </p>

          {basvurular.docs.length === 0 ? (
            <p className="mt-5 border-t border-line-soft pt-5 text-sm text-ink-700">
              {t('requestsEmpty')}
            </p>
          ) : (
            <ul className="mt-5 border-t border-line-soft">
              {basvurular.docs.map((kayit) => {
                const egitim =
                  kayit.relatedTraining && typeof kayit.relatedTraining === 'object'
                    ? (kayit.relatedTraining as { slug?: string | null; title?: string | null })
                    : null

                const gonderim = kayit.createdAt
                  ? new Date(kayit.createdAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : null

                return (
                  <li key={String(kayit.id)} className="border-b border-line-soft py-4 last:border-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-ink-600">
                      <span>
                        {optionLabel(SUBMISSION_TYPES, String(kayit.submissionType ?? ''), locale)}
                      </span>
                      {/*
                        Durum rozeti renge EK OLARAK metin taşır; ayrıca
                        ekran okuyucuya ne olduğu söylenir (Madde 47/89).
                      */}
                      <span className="bg-surface-alt px-2 py-0.5 text-ink-700">
                        <span className="sr-only">{t('fieldStatus')}: </span>
                        {optionLabel(SUBMISSION_STATUSES, String(kayit.status ?? ''), locale)}
                      </span>
                      {gonderim ? <span className="font-normal normal-case">{gonderim}</span> : null}
                    </p>

                    <p className="mt-1.5 font-semibold leading-snug text-shell-900">
                      {kayit.subject}
                    </p>

                    {egitim?.slug && egitim.title ? (
                      <p className="mt-1 text-sm">
                        <Link
                          href={detailHref('training-program', locale, egitim.slug)}
                          className="text-brand-800 underline decoration-line-strong underline-offset-4 hover:decoration-brand-700 focus-visible:decoration-brand-700"
                        >
                          {egitim.title}
                        </Link>
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* --- Henüz tutulmayan kayıtlar ----------------------------------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <KayitTutulmuyor
            baslik={t('trainingsHeading')}
            aciklama={t('trainingsNotTracked')}
            iletisimHref={iletisimHref}
            iletisimEtiketi={tc('contactPageLink')}
          />
          <KayitTutulmuyor
            baslik={t('certificatesHeading')}
            aciklama={t('certificatesNotTracked')}
            iletisimHref={iletisimHref}
            iletisimEtiketi={tc('contactPageLink')}
          />
        </div>
      </div>
    </>
  )
}
