'use server'

import { cookies, headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { isLocale, type Locale } from '@/i18n/locales'
import { payloadClient } from '@/lib/queries'
import {
  classroomCookieName,
  classroomWindow,
  issueClassroomToken,
  safeEqual,
  tokenTtlSeconds,
  type ClassroomRole,
} from '@/lib/virtualClassroom'

/**
 * SANAL SINIFA GİRİŞ — SUNUCU EYLEMİ
 * ============================================================================
 * Şartname: "Sayfaya sadece kayıtlı/şifresi olan kullanıcıların girebileceği
 * mantığı kurgula."
 *
 * DOĞRULAMA NEDEN BURADA, SAYFADA DEĞİL
 * Sayfa bileşeni odayı çizerken parolayı HİÇ okumaz (`select` ile alanlar
 * dışarıda bırakılır). Parola yalnızca bu eylemin içinde, tek bir yerel
 * değişkende bulunur ve hiçbir zaman döndürülmez. Böylece sır, tarayıcıya
 * giden RSC yükünde bulunamaz — istemci tarafı bir hata bile onu sızdıramaz.
 *
 * ROL AYRIMI
 * Eğitmen şifresi girilirse jeton `moderator`, katılımcı şifresi girilirse
 * `attendee` rolüyle üretilir. Rol imzalıdır; istemci yükseltemez.
 *
 * ---------------------------------------------------------------------------
 * KABA KUVVET KORUMASI — SINIRLARI AÇIKÇA YAZILMIŞTIR
 * ---------------------------------------------------------------------------
 * Aşağıdaki sayaç SÜREÇ BELLEĞİNDEDİR. Tek örnekli kurulumda işe yarar;
 * birden çok Node örneği (veya sunucusuz ortam) çalıştığında her örnek kendi
 * sayacını tutar ve koruma zayıflar. Sunucu yeniden başlarsa sayaç sıfırlanır.
 *
 * Bu, ters vekil / WAF katmanındaki hız sınırlamasının YERİNE GEÇMEZ —
 * payload.config.ts içindeki aynı başlıklı nota bakınız. Yine de konuldu:
 * parola denemesi, iletişim formu spam'inden daha ciddi bir saldırıdır ve
 * hiç engel olmaması kabul edilemez.
 * ============================================================================
 */

const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000

type AttemptRecord = { count: number; resetAt: number }
const attempts = new Map<string, AttemptRecord>()

const throttle = (key: string): boolean => {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  record.count += 1

  // Harita sınırsız büyümesin: süresi dolmuş kayıtlar ara sıra temizlenir.
  if (attempts.size > 500) {
    for (const [mapKey, value] of attempts) {
      if (value.resetAt < now) attempts.delete(mapKey)
    }
  }

  return record.count <= MAX_ATTEMPTS
}

/** Ters vekil arkasında gerçek istemci adresi. Yoksa tek bir kovaya düşer. */
const clientKey = async (roomId: string): Promise<string> => {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || headerList.get('x-real-ip') || 'unknown'
  return `${roomId}:${ip}`
}

export type ClassroomFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
}

type RoomSecrets = {
  id: number
  roomStatus?: string | null
  startsAt?: string | null
  endsAt?: string | null
  joinWindowMinutes?: number | null
  moderatorPassword?: string | null
  attendeePassword?: string | null
}

export const enterVirtualClassroom = async (
  _previous: ClassroomFormState,
  formData: FormData,
): Promise<ClassroomFormState> => {
  const rawLocale = String(formData.get('locale') ?? '')
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'tr'
  const t = await getTranslations({ locale, namespace: 'classroom' })

  const roomId = String(formData.get('roomId') ?? '').trim()
  const code = String(formData.get('accessCode') ?? '').trim()

  if (!/^\d+$/.test(roomId)) return { status: 'error', message: t('errorGeneric') }
  if (!code) return { status: 'error', message: t('errorRequired') }
  if (code.length > 200) return { status: 'error', message: t('errorGeneric') }

  if (!throttle(await clientKey(roomId))) {
    return { status: 'error', message: t('errorTooManyAttempts') }
  }

  const payload = await payloadClient()

  /*
    `overrideAccess` varsayılan olarak true'dur (Local API). Sırlar burada
    OKUNUR ama hiçbir şekilde DÖNDÜRÜLMEZ; yalnızca karşılaştırmada kullanılır.
  */
  let room: RoomSecrets | null = null
  try {
    room = (await payload.findByID({
      collection: 'virtual-classrooms',
      id: Number(roomId),
      depth: 0,
    })) as unknown as RoomSecrets
  } catch {
    return { status: 'error', message: t('errorGeneric') }
  }

  if (!room) return { status: 'error', message: t('errorGeneric') }

  // --- Oda açık mı? Şifre doğru olsa bile kapalı odaya girilmez ------------
  if (room.roomStatus !== 'active') {
    return { status: 'error', message: t('errorRoomClosed') }
  }

  const windowState = classroomWindow(room.startsAt, room.endsAt, room.joinWindowMinutes)
  if (windowState !== 'open') {
    return {
      status: 'error',
      message: windowState === 'after' ? t('errorSessionEnded') : t('errorNotStarted'),
    }
  }

  // --- Şifre karşılaştırması ----------------------------------------------
  const moderator = (room.moderatorPassword ?? '').trim()
  const attendee = (room.attendeePassword ?? '').trim()

  /*
    Her iki karşılaştırma da HER ZAMAN çalıştırılır. "Eğitmen şifresi tutmadı,
    katılımcıyı deneme" gibi bir kısa devre, iki dal arasındaki süre farkından
    hangi şifrenin tutmadığını ele verebilirdi.
  */
  const moderatorMatch = moderator.length > 0 && safeEqual(code, moderator)
  const attendeeMatch = attendee.length > 0 && safeEqual(code, attendee)

  const role: ClassroomRole | null = moderatorMatch
    ? 'moderator'
    : attendeeMatch
      ? 'attendee'
      : null

  if (!role) return { status: 'error', message: t('errorWrongCode') }

  const token = issueClassroomToken(room.id, role, tokenTtlSeconds(room.endsAt))
  const cookieStore = await cookies()

  cookieStore.set(classroomCookieName(room.id), token, {
    httpOnly: true, // JavaScript okuyamaz: XSS ile jeton çalınamaz.
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: tokenTtlSeconds(room.endsAt),
  })

  return { status: 'success' }
}

/** Katılımcının odadan çıkması: jeton çerezi silinir. */
export const leaveVirtualClassroom = async (formData: FormData): Promise<void> => {
  const roomId = String(formData.get('roomId') ?? '').trim()
  if (!/^\d+$/.test(roomId)) return

  const cookieStore = await cookies()
  cookieStore.delete(classroomCookieName(roomId))
}
