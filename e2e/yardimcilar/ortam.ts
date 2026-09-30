import dotenv from 'dotenv'

/**
 * TEST ORTAMINI YÜKLE — TEK YER
 * ============================================================================
 * `.env.test` üç ayrı yerde yüklenir: `playwright.config.ts` (koşucu ve her
 * işçi süreç), `genel-kurulum.ts` ve `genel-temizlik.ts`. Üçü de bu fonksiyonu
 * çağırır; port seçimi gibi bir kural yalnızca birinde uygulansaydı, diğeri
 * `override: true` ile onu sessizce geri alırdı.
 *
 * `override: true` ŞART — gerekçesi `playwright.config.ts` başında: kabukta
 * zaten bir `DATABASE_URI` varsa testler geliştirme veritabanına bağlanırdı.
 *
 * ---------------------------------------------------------------------------
 * PORT — VARSAYILAN 3100, `E2E_PORT` İLE DEĞİŞTİRİLEBİLİR
 * ---------------------------------------------------------------------------
 * ÖLÇÜLDÜ (2026-09-30): 3100 portunu aynı makinede çalışan BAŞKA bir projenin
 * sunucusu tutuyordu. Yerelde `reuseExistingServer` açıktır; port doluysa
 * Playwright ya o yabancı sunucuyu "test sunucusu" sanıp takımı ona karşı
 * koşar ya da `next start` EADDRINUSE ile düşer. İkisi de testlerin değil,
 * makinenin sorunudur.
 *
 *   $env:E2E_PORT='3110'; pnpm test:e2e      (PowerShell)
 *   E2E_PORT=3110 pnpm test:e2e              (bash)
 *
 * Port verilince `NEXT_PUBLIC_SERVER_URL` ve `ALLOWED_ORIGINS` AYNI adrese
 * çekilir: ilki derleme anında uygulamaya gömülür, ikincisi Payload'ın köken
 * denetimidir; biri eski portta kalırsa oturum çerezi kabul edilmez ve testler
 * anlaşılmaz biçimde kırılır. Adres `localhost` kaldığı için e-Devlet kum
 * havuzunun yerel adres kilidi de sağlanmaya devam eder (src/lib/edevlet.ts).
 *
 * DİKKAT: adres derlemeye GÖMÜLDÜĞÜ için port değiştirilen koşu yeniden
 * derlemelidir; `PLAYWRIGHT_SKIP_BUILD=true` ile başka bir port için yapılmış
 * derleme kullanılmamalıdır.
 *
 * CI bu değişkeni vermez; varsayılan davranış AYNEN eskisi gibidir.
 * ============================================================================
 */
export const VARSAYILAN_ADRES = 'http://localhost:3100'

export const testOrtaminiYukle = (): string => {
  dotenv.config({ path: '.env.test', override: true })

  const ozelPort = process.env.E2E_PORT?.trim()
  if (ozelPort) {
    const sayi = Number(ozelPort)
    if (!/^\d{2,5}$/.test(ozelPort) || sayi < 1024 || sayi > 65535) {
      throw new Error(`E2E_PORT geçersiz: "${ozelPort}". 1024–65535 arasında bir port verin (ör. 3110).`)
    }
    const adres = `http://localhost:${sayi}`
    process.env.NEXT_PUBLIC_SERVER_URL = adres
    process.env.ALLOWED_ORIGINS = adres
  }

  return process.env.NEXT_PUBLIC_SERVER_URL ?? VARSAYILAN_ADRES
}

/** Taban adresin portu — `next start -p` ile adres ayrışamasın diye adresten türetilir. */
export const portOf = (adres: string): string => new URL(adres).port || '80'

/**
 * Verilen adreste çalışan sunucu BİZİM uygulamamız mı?
 *
 * Parmak izi olarak Payload'ın kendi REST ucu kullanılır: `external-services`
 * global'i herkese açık okunur ve yanıtında `globalType` alanını taşır. Başka
 * bir uygulamanın bu adrese bu gövdeyle cevap vermesi beklenmez. `/api/health`
 * bilerek KULLANILMADI: `{ status: 'ok' }` hemen her sunucunun verebileceği,
 * hiçbir şeyi ayırt etmeyen bir cevaptır.
 *
 * Hiçbir koşulda fırlatmaz; kararı çağıran verir (genel-kurulum.ts).
 */
export const sunucuBizimMi = async (tabanAdres: string): Promise<{ bizim: boolean; ayrinti: string }> => {
  try {
    const yanit = await fetch(`${tabanAdres}/api/globals/external-services?depth=0`, {
      signal: AbortSignal.timeout(20_000),
    })
    const govde = (await yanit.json().catch(() => null)) as { globalType?: unknown } | null
    return {
      bizim: yanit.ok && govde?.globalType === 'external-services',
      ayrinti: `HTTP ${yanit.status}`,
    }
  } catch (hata) {
    return { bizim: false, ayrinti: hata instanceof Error ? hata.message : String(hata) }
  }
}
