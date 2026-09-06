import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * SANAL SINIF — ERİŞİM JETONU VE ZAMAN PENCERESİ
 * ============================================================================
 * Bu modül SUNUCUDA çalışır. İstemci bileşenlerinden import EDİLMEMELİDİR;
 * `node:crypto` ve `PAYLOAD_SECRET` istemci paketine sızmamalıdır.
 *
 * NEDEN JETON, NEDEN OTURUM DEĞİL
 * Sitede ziyaretçi oturumu yoktur (Users koleksiyonu yalnızca personel
 * panelidir). Katılımcılar kuruma kayıtlı kişilerdir ama sitede hesapları
 * yoktur. Şartnamenin istediği "yalnızca şifresi olan kullanıcı girebilsin"
 * kuralı bu yüzden ODA BAZLI bir erişim jetonuyla karşılanır:
 *
 *   1. Ziyaretçi katılım şifresini girer (sunucu eylemi).
 *   2. Şifre doğruysa sunucu HMAC ile imzalı bir jeton üretir ve httpOnly
 *      çerezine yazar.
 *   3. Sayfa her açılışta jetonu DOĞRULAR; geçersizse yeniden şifre sorar.
 *
 * Jeton içeriği: oda kimliği + rol + son geçerlilik. İmza `PAYLOAD_SECRET` ile
 * atılır, dolayısıyla istemci içeriği değiştirip eğitmen rolüne yükselemez.
 * ============================================================================
 */

export type ClassroomRole = 'moderator' | 'attendee'

/** Çerez adı oda bazlıdır: bir odanın jetonu diğerine geçmez. */
export const classroomCookieName = (roomId: number | string) => `aiftc_vc_${roomId}`

const secret = (): string => {
  const value = process.env.PAYLOAD_SECRET
  /*
    Sır yoksa jeton üretilemez. Zayıf bir varsayılana DÜŞÜLMEZ: sabit bir
    yedek anahtar, imzayı herkesin taklit edebileceği anlamına gelirdi.
  */
  if (!value) throw new Error('PAYLOAD_SECRET tanımlı değil; sanal sınıf jetonu imzalanamaz.')
  return value
}

const sign = (payload: string): string =>
  createHmac('sha256', secret()).update(payload).digest('base64url')

/**
 * Sabit süreli karşılaştırma. Normal `===` karakter karakter kısa devre yapar
 * ve yanıt süresinden şifrenin ilk harfleri çıkarılabilir (timing attack).
 * Uzunluklar farklıysa `timingSafeEqual` hata atar; bu yüzden önce eşit uzunlukta
 * tampona alınır.
 */
export const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) {
    // Yine de bir karşılaştırma yap: erken dönüş de bir zamanlama sinyalidir.
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

/** `roomId.role.expiry.signature` */
export const issueClassroomToken = (
  roomId: number | string,
  role: ClassroomRole,
  ttlSeconds: number,
): string => {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = `${roomId}.${role}.${expiry}`
  return `${body}.${sign(body)}`
}

export const verifyClassroomToken = (
  token: string | undefined,
  roomId: number | string,
): ClassroomRole | null => {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 4) return null

  const [tokenRoomId, role, expiryText, signature] = parts
  if (tokenRoomId !== String(roomId)) return null
  if (role !== 'moderator' && role !== 'attendee') return null

  const expiry = Number(expiryText)
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return null

  const body = `${tokenRoomId}.${role}.${expiryText}`
  if (!safeEqual(signature, sign(body))) return null

  return role
}

// ---------------------------------------------------------------------------
// ZAMAN PENCERESİ
// ---------------------------------------------------------------------------

export type ClassroomWindow = 'before' | 'open' | 'after' | 'unknown'

/**
 * Odanın şu anda girilebilir olup olmadığı.
 * `joinWindowMinutes` kadar erken giriş serbesttir; bitişten sonra kapanır.
 * Tarihler eksikse 'unknown' döner ve çağıran taraf odayı kapalı sayar.
 */
export const classroomWindow = (
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  joinWindowMinutes: number | null | undefined,
  now: Date = new Date(),
): ClassroomWindow => {
  if (!startsAt || !endsAt) return 'unknown'

  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 'unknown'

  const grace = Math.max(0, Number(joinWindowMinutes ?? 0)) * 60_000

  if (now.getTime() < start - grace) return 'before'
  if (now.getTime() > end) return 'after'
  return 'open'
}

/**
 * Jetonun ömrü: oturumun bitişine kadar, en fazla 12 saat.
 * Oturum bittiğinde jeton da geçersizleşsin ki ertesi gün aynı çerezle
 * girilemesin.
 */
export const tokenTtlSeconds = (endsAt: string | null | undefined): number => {
  const max = 12 * 60 * 60
  if (!endsAt) return 60 * 60
  const remaining = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)
  if (!Number.isFinite(remaining) || remaining <= 0) return 60
  return Math.min(max, remaining)
}
