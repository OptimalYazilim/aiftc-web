'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * TURNSTILE WIDGET'I — İSTEMCİ TARAFI  (Kılavuz 5.2)
 * ============================================================================
 * Cloudflare'in doğrulama widget'ını çizer ve gönderim anında bir jeton verir.
 * Gerekçeler (neden Turnstile, neden paket kurulmadı, kapalıya düşme kuralı)
 * `lib/captcha.ts` başındadır; burada yalnızca tarayıcı tarafı vardır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN "GÖRÜNMEZ" DEĞİL, "YALNIZCA GEREKİRSE GÖRÜNÜR"
 * ---------------------------------------------------------------------------
 * `appearance: 'interaction-only'` widget'ı normalde HİÇ göstermez; yalnızca
 * Cloudflare gerçekten bir etkileşim isterse belirir. Tam görünmez kip
 * (`size: 'invisible'`) de mümkündü ama şüpheli bir oturumda kullanıcıya
 * hiçbir çıkış yolu bırakmaz: doğrulama sessizce başarısız olur ve kişi
 * formu neden gönderemediğini anlayamaz. Kutu, gerektiğinde görünmelidir.
 *
 * ---------------------------------------------------------------------------
 * JETON TEK KULLANIMLIKTIR — SIFIRLAMA ZORUNLU
 * ---------------------------------------------------------------------------
 * Aynı jeton ikinci kez doğrulatılırsa Cloudflare `timeout-or-duplicate`
 * döner. Yani ilk gönderim başka bir sebeple (e-posta zaten kayıtlı, parola
 * kısa) başarısız olursa ve kullanıcı düzeltip tekrar gönderirse, jeton
 * HARCANMIŞTIR ve ikinci deneme CAPTCHA hatasıyla reddedilirdi — kullanıcı
 * için tamamen anlamsız bir hata. Bu yüzden HER gönderimden sonra widget
 * sıfırlanır.
 *
 * Jetonun kendi ömrü de vardır (~5 dakika). Formu yavaş dolduran biri için
 * `expired-callback` devreye girer ve widget kendini yeniler.
 *
 * ---------------------------------------------------------------------------
 * `tokenAl()` NEDEN BEKLİYOR
 * ---------------------------------------------------------------------------
 * Widget jetonu kendiliğinden, çizildikten kısa süre sonra üretir. Kullanıcı
 * formu çok hızlı doldurup gönderirse jeton henüz gelmemiş olabilir. Bu
 * durumda "doğrulama yok" deyip reddetmek yanlış olurdu; kısa bir süre
 * BEKLENİR. Süre dolarsa `null` döner ve çağıran taraf kullanıcıya
 * anlaşılır bir mesaj gösterir.
 * ============================================================================
 */

type TurnstileSecenekleri = {
  sitekey: string
  callback: (jeton: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  appearance?: 'always' | 'execute' | 'interaction-only'
  language?: string
  size?: 'normal' | 'compact' | 'flexible'
  theme?: 'light' | 'dark' | 'auto'
}

type TurnstileApi = {
  render: (el: HTMLElement, secenekler: TurnstileSecenekleri) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_ID = 'cf-turnstile-api'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Jeton gelene kadar beklenecek üst sınır. */
const BEKLEME_MS = 8_000

/** Betiği bir kez yükler; ikinci çağrı aynı sözü döndürür. */
let scriptSozu: Promise<void> | null = null

const scriptYukle = (): Promise<void> => {
  if (scriptSozu) return scriptSozu

  scriptSozu = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('sunucu'))
    if (window.turnstile) return resolve()

    const mevcut = document.getElementById(SCRIPT_ID)
    if (mevcut) {
      mevcut.addEventListener('load', () => resolve())
      mevcut.addEventListener('error', () => reject(new Error('yuklenemedi')))
      return
    }

    const etiket = document.createElement('script')
    etiket.id = SCRIPT_ID
    etiket.src = SCRIPT_SRC
    etiket.async = true
    etiket.defer = true
    etiket.onload = () => resolve()
    etiket.onerror = () => reject(new Error('yuklenemedi'))
    document.head.appendChild(etiket)
  })

  return scriptSozu
}

export type TurnstileDurumu = {
  /** Widget'ın çizileceği kapsayıcıya bağlanır. */
  kapsayiciRef: React.RefObject<HTMLDivElement | null>
  /** Betik veya widget yüklenemedi. Form bunu kullanıcıya söylemelidir. */
  yuklenemedi: boolean
  /** Gönderim anında çağrılır; jeton yoksa kısa süre bekler. */
  tokenAl: () => Promise<string | null>
  /** Her gönderimden SONRA çağrılır — jeton tek kullanımlıktır. */
  sifirla: () => void
}

export const useTurnstile = (siteKey: string | null, dil: string): TurnstileDurumu => {
  const kapsayiciRef = useRef<HTMLDivElement | null>(null)
  const widgetRef = useRef<string | null>(null)
  const jetonRef = useRef<string | null>(null)
  const bekleyenlerRef = useRef<((jeton: string | null) => void)[]>([])
  const [yuklenemedi, setYuklenemedi] = useState(false)

  const jetonAta = useCallback((jeton: string | null) => {
    jetonRef.current = jeton
    if (jeton) {
      /* Bekleyen `tokenAl()` çağrıları varsa hepsini aynı jetonla serbest
         bırak. `splice` listeyi boşaltır: aynı çağrı iki kez çözülmez. */
      bekleyenlerRef.current.splice(0).forEach((coz) => coz(jeton))
    }
  }, [])

  useEffect(() => {
    if (!siteKey) return

    let sokuldu = false

    void scriptYukle()
      .then(() => {
        if (sokuldu || !kapsayiciRef.current || !window.turnstile) return
        /* React geliştirme kipinde bileşeni iki kez bağlar; bu kontrol
           olmadan iki widget çizilir ve ikincisi jetonu ezerdi. */
        if (widgetRef.current) return

        widgetRef.current = window.turnstile.render(kapsayiciRef.current, {
          sitekey: siteKey,
          language: dil,
          appearance: 'interaction-only',
          size: 'flexible',
          theme: 'light',
          callback: (jeton) => jetonAta(jeton),
          'expired-callback': () => {
            jetonAta(null)
            window.turnstile?.reset(widgetRef.current ?? undefined)
          },
          'timeout-callback': () => {
            jetonAta(null)
            window.turnstile?.reset(widgetRef.current ?? undefined)
          },
          'error-callback': () => {
            jetonAta(null)
            setYuklenemedi(true)
          },
        })
      })
      .catch(() => {
        if (!sokuldu) setYuklenemedi(true)
      })

    return () => {
      sokuldu = true
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current)
        } catch {
          /* Widget zaten kaldırılmışsa sorun değil. */
        }
      }
      widgetRef.current = null
      /* Bekleyen sözleri boşta bırakma: hepsini `null` ile kapat. */
      bekleyenlerRef.current.splice(0).forEach((coz) => coz(null))
    }
  }, [siteKey, dil, jetonAta])

  const tokenAl = useCallback((): Promise<string | null> => {
    if (!siteKey) return Promise.resolve(null)
    if (jetonRef.current) return Promise.resolve(jetonRef.current)

    return new Promise<string | null>((resolve) => {
      const zamanlayici = setTimeout(() => {
        bekleyenlerRef.current = bekleyenlerRef.current.filter((f) => f !== dinleyici)
        resolve(null)
      }, BEKLEME_MS)

      const dinleyici = (jeton: string | null) => {
        clearTimeout(zamanlayici)
        resolve(jeton)
      }

      bekleyenlerRef.current.push(dinleyici)
    })
  }, [siteKey])

  const sifirla = useCallback(() => {
    jetonRef.current = null
    if (widgetRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetRef.current)
      } catch {
        /* Sıfırlama başarısızsa bir sonraki gönderim jetonsuz kalır ve
           kullanıcı anlaşılır bir hata görür — sessiz kalmaktan iyidir. */
      }
    }
  }, [])

  return { kapsayiciRef, yuklenemedi, tokenAl, sifirla }
}
