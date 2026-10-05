import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ClassroomAccountEntry } from '@/components/classroom/ClassroomAccountEntry'
import { ClassroomGate } from '@/components/classroom/ClassroomGate'
import { ClassroomStage } from '@/components/classroom/ClassroomStage'
import { PageHero } from '@/components/ui/PageHero'
import { isLocale, type Locale } from '@/i18n/locales'
import { authHref, classroomHref, detailHref, href } from '@/i18n/routes'
import { onayliBasvuruBul } from '@/lib/classroomAccess'
import { formatDateRange } from '@/lib/dates'
import { payloadClient } from '@/lib/queries'
import {
  classroomCookieName,
  classroomWindow,
  verifyClassroomToken,
} from '@/lib/virtualClassroom'

/**
 * SANAL SINIF KATILIM SAYFASI  (Şartname — Entegre Canlı Eğitim)
 * ============================================================================
 * ROTA: `/tr/sanal-sinif/[id]` · `/en/virtual-classroom/[id]` · `/ru/...`
 *
 * KORUMA ZİNCİRİ — sayfanın çizim sırası bilinçlidir
 *   1. Oda kaydı YALNIZCA herkese açık alanlarla okunur (`select`). Toplantı
 *      adresi ve parolalar bu sorguya HİÇ girmez; dolayısıyla kapıyı geçmemiş
 *      bir ziyaretçinin aldığı HTML/RSC yükünde bulunamazlar.
 *   2. Çerezdeki imzalı jeton doğrulanır (`verifyClassroomToken`).
 *   3. Jeton geçerliyse — ve YALNIZCA o zaman — sırlar ikinci bir sorguyla
 *      okunup sahneye verilir.
 *
 * `cookies()` çağrısı sayfayı DİNAMİK yapar; bu yüzden `revalidate` yoktur ve
 * olmamalıdır: önbelleğe alınmış bir katılım sayfası, bir kullanıcının
 * jetonuyla üretilmiş HTML'i başkasına gösterebilirdi.
 *
 * HESAPLA GİRİŞ (2026-10-01): oturum açmış ve eğitime onaylı başvurusu olan
 * kişiye şifresiz giriş düğmesi gösterilir; şifre formu YEDEK olarak altında
 * kalır (hesabı olmayan katılımcılar, eğitmen). Düğme yalnızca davettir;
 * karar sunucu eyleminde yeniden verilir (actions.ts → enterWithAccount).
 *
 * ARAMA MOTORU: sayfa `noindex`. Sitemap'e de eklenmez (bkz. sitemap.ts).
 * ============================================================================
 */

type Props = { params: Promise<{ locale: Locale; id: string }> }

/** Ziyaretçiye gösterilebilir alanlar. Sır içermez — dosya başındaki 1. adım. */
type PublicRoom = {
  id: number
  title?: string | null
  roomStatus?: string | null
  platform?: string | null
  startsAt?: string | null
  endsAt?: string | null
  joinWindowMinutes?: number | null
  instructions?: string | null
  training?: { id: number; title?: string | null; slug?: string | null } | number | null
}

type RoomSecrets = {
  meetingUrl?: string | null
  meetingId?: string | null
}

const PUBLIC_SELECT = {
  title: true,
  roomStatus: true,
  platform: true,
  startsAt: true,
  endsAt: true,
  joinWindowMinutes: true,
  instructions: true,
  training: true,
} as const

const findPublicRoom = async (locale: Locale, id: string): Promise<PublicRoom | null> => {
  if (!/^\d+$/.test(id)) return null

  const payload = await payloadClient()

  try {
    const doc = (await payload.findByID({
      collection: 'virtual-classrooms',
      id: Number(id),
      locale,
      depth: 0,
      select: PUBLIC_SELECT as never,
    })) as unknown as PublicRoom

    /*
      Eğitim İKİNCİ ve DAR bir sorguyla çözülür. `depth: 1` kullanıldığında
      Payload bağlı eğitimin TÜM kaydını döndürüyor ve o kayıt RSC yüküne
      olduğu gibi basılıyordu (ölçüldü: sayfanın HTML çıktısında eğitimin
      bütün alanları vardı). Sır değil — eğitim zaten herkese açık — ama
      katılım sayfasının ihtiyacı yalnızca başlık ve adres parçası.
    */
    const trainingId =
      typeof doc.training === 'object' && doc.training !== null
        ? doc.training.id
        : typeof doc.training === 'number'
          ? doc.training
          : null

    doc.training = null

    if (trainingId) {
      try {
        const training = (await payload.findByID({
          collection: 'training-programs',
          id: trainingId,
          locale,
          depth: 0,
          select: { title: true, slug: true } as never,
        })) as unknown as { id: number; title?: string | null; slug?: string | null }

        doc.training = { id: training.id, title: training.title, slug: training.slug }
      } catch {
        // Eğitim silinmiş veya yayından kalkmış olabilir; oda yine açılır.
      }
    }

    return doc
  } catch {
    return null
  }
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, id } = await params
  if (!isLocale(locale)) return {}

  const room = await findPublicRoom(locale, id)
  /* Oda yoksa başlık da 404 sayfasından gelir (sayfa aşağıda 404 verir). */
  if (!room) notFound()
  const t = await getTranslations({ locale, namespace: 'classroom' })

  return {
    title: room.title ?? t('pageTitle'),
    /*
      Korumalı sayfa dizine EKLENMEZ. `buildMetadata` kanonik/alternate
      üretir; burada onu kullanmıyoruz çünkü bu adresin paylaşılabilir bir
      kanonik karşılığı olmamalıdır.
    */
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function VirtualClassroomPage({ params }: Props) {
  const { locale, id } = await params
  if (!isLocale(locale)) notFound()

  setRequestLocale(locale)

  const room = await findPublicRoom(locale, id)
  if (!room) notFound()

  const [t, tn] = await Promise.all([getTranslations('classroom'), getTranslations('nav')])

  const training =
    typeof room.training === 'object' && room.training !== null ? room.training : null

  const schedule = formatDateRange(locale, room.startsAt, room.endsAt)
  const windowState = classroomWindow(room.startsAt, room.endsAt, room.joinWindowMinutes)
  const isActive = room.roomStatus === 'active'

  // --- Jeton doğrulaması ---------------------------------------------------
  const cookieStore = await cookies()
  const token = cookieStore.get(classroomCookieName(room.id))?.value
  const role = verifyClassroomToken(token, room.id)

  /*
    Jeton geçerli OLSA BİLE oda kapandıysa veya oturum bittiyse sahne
    gösterilmez. Jeton bir "giriş kartı"dır, odanın açık olduğunun garantisi
    değil: yönetici odayı erkenden kapatabilir.
  */
  const admitted = role !== null && isActive && windowState === 'open'

  /*
    HESAP DURUMU — yalnızca oda açık ve saati içindeyse sorulur; aksi hâlde
    zaten kapı gösterilmez. Sonuç düğmeyi göstermek içindir, yetki vermez.
  */
  let hesap: 'anonim' | 'onayli' | 'onaysiz' = 'anonim'
  if (!admitted && isActive && windowState === 'open') {
    const payload = await payloadClient()
    const { user } = await payload.auth({ headers: await headers() }).catch(() => ({ user: null }))
    if (user) {
      const u = user as { id: number | string; email?: string | null }
      const basvuru = training?.id
        ? await onayliBasvuruBul(payload, { id: u.id, email: u.email ?? null }, training.id)
        : null
      hesap = basvuru ? 'onayli' : 'onaysiz'
    }
  }

  let secrets: RoomSecrets | null = null
  if (admitted) {
    const payload = await payloadClient()
    const full = (await payload.findByID({
      collection: 'virtual-classrooms',
      id: room.id,
      depth: 0,
      select: { meetingUrl: true, meetingId: true } as never,
    })) as unknown as RoomSecrets
    secrets = full
  }

  return (
    <>
      {/* --- Üst alan ------------------------------------------------------ */}
      <PageHero
        variant="record"
        breadcrumbs={{
          label: tn('breadcrumb'),
          items: [
            { label: tn('home'), href: `/${locale}` },
            { label: tn('trainingPrograms'), href: href('training-programs', locale) },
            ...(training?.slug && training.title
              ? [
                  {
                    label: training.title,
                    href: detailHref('training-program', locale, training.slug),
                  },
                ]
              : []),
            { label: room.title ?? t('pageTitle') },
          ],
        }}
        meta={
          <span className="inline-flex items-center rounded-sm bg-brand-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {t('badge')}
          </span>
        }
        title={room.title ?? t('pageTitle')}
      >
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-white/90">
          {training?.title ? (
            <div className="flex gap-2">
              <dt className="text-white/65">{t('training')}:</dt>
              <dd>
                {training.slug ? (
                  <Link
                    href={detailHref('training-program', locale, training.slug)}
                    className="font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:decoration-white"
                  >
                    {training.title}
                  </Link>
                ) : (
                  training.title
                )}
              </dd>
            </div>
          ) : null}
          {schedule ? (
            <div className="flex gap-2">
              <dt className="text-white/65">{t('schedule')}:</dt>
              <dd>
                <time dateTime={room.startsAt ?? undefined}>{schedule}</time>
              </dd>
            </div>
          ) : null}
        </dl>
      </PageHero>

      {/* --- Gövde --------------------------------------------------------- */}
      <div className="container-page max-w-3xl py-10 lg:py-14">
        {admitted && role ? (
          <ClassroomStage
            locale={locale}
            role={role}
            roomId={room.id}
            platform={room.platform}
            meetingUrl={secrets?.meetingUrl}
            meetingId={secrets?.meetingId}
          />
        ) : !isActive ? (
          <p
            role="status"
            className="rounded-card border border-line bg-surface-alt p-6 text-ink-700"
          >
            {t('roomClosed')}
          </p>
        ) : windowState === 'after' ? (
          <p
            role="status"
            className="rounded-card border border-line bg-surface-alt p-6 text-ink-700"
          >
            {t('sessionEnded')}
          </p>
        ) : windowState !== 'open' ? (
          <p
            role="status"
            className="rounded-card border border-line bg-surface-alt p-6 text-ink-700"
          >
            {t('notStartedYet')}
          </p>
        ) : (
          <div className="space-y-6">
            {hesap === 'onayli' ? (
              <ClassroomAccountEntry locale={locale} roomId={room.id} />
            ) : hesap === 'onaysiz' ? (
              <p role="status" className="rounded-card border border-line bg-surface-alt p-5 text-ink-700">
                {t('accountNotRegistered')}
              </p>
            ) : (
              <p className="rounded-card border border-line bg-surface-alt p-5 text-ink-700">
                {t('accountLoginHint')}{' '}
                <Link
                  href={`${authHref('login', locale)}?donus=${encodeURIComponent(classroomHref(locale, room.id))}`}
                  className="font-semibold text-brand-800 underline underline-offset-4"
                >
                  {t('accountLoginLink')}
                </Link>
              </p>
            )}
            <ClassroomGate
              locale={locale}
              roomId={room.id}
              instructions={room.instructions}
              yedek={hesap === 'onayli'}
            />
          </div>
        )}

        {training?.slug ? (
          <p className="mt-10">
            <Link
              href={detailHref('training-program', locale, training.slug)}
              className="inline-flex min-h-11 items-center text-brand-800 underline underline-offset-4"
            >
              ← {t('backToTraining')}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  )
}
