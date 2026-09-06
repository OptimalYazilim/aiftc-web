/**
 * DIŞ BAĞLANTI TIKLAMA SAYACI  (Şartname 17)
 * ============================================================================
 * "Raporlanabilecek göstergeler: ... Başvuru bağlantısı tıklamaları,
 *  En çok görüntülenen dijital kütüphane kayıtları"
 *
 * Bu modül BİR ANALİTİK SİSTEMİ DEĞİLDİR; yalnızca bağlanma noktasıdır.
 * Kurumun tercih ettiği araç (Matomo, Plausible, kurum içi toplayıcı)
 * belirlendiğinde `dispatch` içindeki tek blok doldurulur — çağıran
 * bileşenlerde hiçbir değişiklik gerekmez.
 *
 * KVKK (12.2 / 12.3):
 *  - Kişisel veri gönderilmez: yalnızca olay adı, hedef anahtar ve dil.
 *  - Çerez onayı alınmadan hiçbir şey gönderilmez (`hasAnalyticsConsent`).
 *  - Tam URL değil, kararlı bir anahtar (`library`, `portal`, `ext:<host>`)
 *    gönderilir; sorgu parametreleri asla iletilmez.
 * ============================================================================
 */

export const ANALYTICS_CONSENT_KEY = 'aiftc.consent.analytics'

export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted'
  } catch {
    return false
  }
}

type OutboundEvent = {
  /** 'library' | 'portal' | 'ext:<host>' | 'application' */
  target: string
  locale: string
  /** İsteğe bağlı bağlam: eğitim kodu, konu anahtarı. Kişisel veri OLAMAZ. */
  context?: string
}

/** Tam URL'den yalnızca host'u alır — sorgu ve yol atılır. */
export const toTrackKey = (url: string): string => {
  try {
    return `ext:${new URL(url).host}`
  } catch {
    return 'ext:unknown'
  }
}

declare global {
  interface Window {
    /** Plausible/Matomo gibi araçlar yüklendiğinde tanımlanır. */
    aiftcTrack?: (event: string, payload: Record<string, string>) => void
  }
}

export const trackOutbound = (event: OutboundEvent): void => {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) return

  const payload: Record<string, string> = {
    target: event.target,
    locale: event.locale,
    ...(event.context ? { context: event.context } : {}),
  }

  try {
    // Kurumsal analitik aracı yüklüyse ona devret.
    window.aiftcTrack?.('outbound', payload)

    // Geliştirmede görünür olsun; üretimde sessiz.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[aiftc] outbound', payload)
    }
  } catch {
    // Analitik hatası kullanıcı akışını asla bozmaz.
  }
}
