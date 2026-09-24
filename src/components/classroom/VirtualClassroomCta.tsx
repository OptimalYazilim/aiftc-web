import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/locales'
import { classroomHref } from '@/i18n/routes'
import { formatDateRange } from '@/lib/dates'
import { payloadClient } from '@/lib/queries'
import { classroomWindow } from '@/lib/virtualClassroom'

/**
 * "SANAL SINIFA KATIL" AKSİYONU  (Şartname — Entegre Canlı Eğitim)
 * ============================================================================
 * Şartname: buton "eğitim 'Devam Ediyor' durumundaysa" belirmelidir.
 * Üç koşulun HEPSİ sağlanmadıkça hiçbir şey basılmaz:
 *
 *   1. Eğitimin durumu `ongoing`.
 *   2. Eğitime bağlı, durumu `active` olan en az bir oda var.
 *   3. O odanın zaman penceresi henüz kapanmamış (bitmiş oturum gösterilmez).
 *
 * Koşullar sağlanmıyorsa boş bir kutu veya devre dışı bir buton BASILMAZ:
 * "sanal sınıf yok" bilgisi ziyaretçiye bir şey katmaz, yalnızca sayfayı
 * kalabalıklaştırır. (Başvuru butonundan farkı budur: başvuru her eğitimde
 * beklenen bir eylemdir, canlı oturum değildir.)
 *
 * VERİ GÜVENLİĞİ
 * Sorgu `select` ile daraltılmıştır: toplantı adresi ve parolalar BU
 * BİLEŞENE HİÇ GELMEZ. Eğitim detay sayfası herkese açıktır; oraya sır
 * taşıyan bir sorgu gönderilmez.
 *
 * `virtual-classrooms` koleksiyonunun genel okuma erişimi kapalıdır; buradaki
 * çağrı Local API üzerinden ve sunucuda çalıştığı için sorun çıkarmaz.
 * ============================================================================
 */

type Props = {
  locale: Locale
  trainingId: number
  status?: string | null
}

type RoomRef = {
  id: number
  title?: string | null
  startsAt?: string | null
  endsAt?: string | null
  joinWindowMinutes?: number | null
}

export const VirtualClassroomCta = async ({ locale, trainingId, status }: Props) => {
  if (status !== 'ongoing') return null

  const payload = await payloadClient()

  const result = await payload.find({
    collection: 'virtual-classrooms',
    locale,
    depth: 0,
    limit: 20,
    sort: 'startsAt',
    where: {
      training: { equals: trainingId },
      roomStatus: { equals: 'active' },
    },
    select: {
      title: true,
      startsAt: true,
      endsAt: true,
      joinWindowMinutes: true,
    } as never,
  })

  const rooms = result.docs as unknown as RoomRef[]

  /*
    Önce ŞU AN AÇIK olan oturum; yoksa sıradaki (henüz başlamamış) oturum.
    Bitmiş oturumlar elenir. Böylece 5 günlük bir programda katılımcı her
    zaman doğru güne yönlendirilir.
  */
  const open = rooms.find(
    (room) => classroomWindow(room.startsAt, room.endsAt, room.joinWindowMinutes) === 'open',
  )
  const upcoming = rooms.find(
    (room) => classroomWindow(room.startsAt, room.endsAt, room.joinWindowMinutes) === 'before',
  )
  const room = open ?? upcoming

  if (!room) return null

  const t = await getTranslations('classroom')
  const schedule = formatDateRange(locale, room.startsAt, room.endsAt)

  return (
    <div className="rounded-card border border-success-800 bg-brand-50 p-5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-900">
        {t('ctaHeading')}
      </p>

      {room.title ? <p className="mt-2 font-semibold text-ink-900">{room.title}</p> : null}

      {schedule ? (
        <p className="mt-1 text-ink-700">
          <time dateTime={room.startsAt ?? undefined}>{schedule}</time>
        </p>
      ) : null}

      <Link
        href={classroomHref(locale, room.id)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded bg-brand-800 px-5 text-center font-semibold text-white hover:bg-brand-900 focus-visible:bg-brand-900"
      >
        {t('joinButton')}
      </Link>

      <p className="mt-3 text-sm text-ink-700">{t('ctaNote')}</p>
    </div>
  )
}

export default VirtualClassroomCta
