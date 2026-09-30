import { defineConfig, devices } from '@playwright/test'

import { portOf, testOrtaminiYukle } from './e2e/yardimcilar/ortam'

/**
 * PLAYWRIGHT — UÇTAN UCA TEST YAPILANDIRMASI
 * ============================================================================
 * ÖNCE ORTAM, SONRA HER ŞEY
 * ---------------------------------------------------------------------------
 * `.env.test` her şeyden önce, aşağıdaki `testOrtaminiYukle()` çağrısıyla
 * yüklenir (e2e/yardimcilar/ortam.ts). `override: true` şart:
 * kabuğun içinde zaten bir `DATABASE_URI` varsa (geliştirici `.env`i yüklemiş
 * olabilir) testler GELİŞTİRME VERİTABANINA bağlanır ve orada hesap açıp
 * siler. Bu, geri alınamaz bir veri kaybıdır; sessizce olur ve testler yeşil
 * görünmeye devam eder.
 *
 * Aynı değişkenler alt süreçlere (next build / next start) de miras kalır.
 *
 * ---------------------------------------------------------------------------
 * NEDEN `next build` + `next start`, `next dev` DEĞİL
 * ---------------------------------------------------------------------------
 * `next dev` ilk istekte sayfayı derler; bu projede ölçülen süre ~100 saniye.
 * Testlerin ilki her seferinde zaman aşımına düşerdi ve hatanın sebebi
 * uygulamada sanılırdı. Üretim derlemesi ayrıca ÜRETİMDEKİ davranışı sınar:
 * `force-dynamic` gerçekten dinamik mi, ISR gerçekten önbellekliyor mu.
 *
 * ---------------------------------------------------------------------------
 * PORT 3100 — GELİŞTİRME SUNUCUSUNDAN AYRI
 * ---------------------------------------------------------------------------
 * 3000 geliştirme sunucusunundur. Aynı portu paylaşmak, testlerin yanlışlıkla
 * geliştirme veritabanına bakan bir sunucuya bağlanmasına yol açardı —
 * yukarıdaki `override` ile aynı kategoriden bir hata.
 *
 * 3100 de doluysa `E2E_PORT` ile başka bir port verilir; ortamın yüklenmesi ve
 * port kuralı `e2e/yardimcilar/ortam.ts` içindedir. Portta BİZİM sunucumuzun
 * çalıştığı ayrıca `e2e/genel-kurulum.ts` içinde doğrulanır.
 * ============================================================================
 */
const TABAN_ADRES = testOrtaminiYukle()
const PORT = portOf(TABAN_ADRES)

/**
 * Derleme, Playwright yerine ÇAĞIRAN tarafta mı yapıldı?
 *
 * Yalnızca CI iş akışı bunu verir (.github/workflows/e2e.yml). Yerelde
 * tanımsızdır ve `webServer` eskisi gibi kendisi derler — tek komutla koşu
 * kolaylığı korunur. Gerekçe aşağıda, `command` alanının yanında.
 */
const derlemeyiAtla = process.env.PLAYWRIGHT_SKIP_BUILD === 'true'

export default defineConfig({
  testDir: './e2e',

  /*
    TEST SÜRECİ KENDİ TSCONFIG'İNİ KULLANIR.
    Tek fark `next/cache` eşlemesidir: Payload yapılandırması bu süreçte de
    yüklenir ve düz Node ESM o içe aktarmayı çözemez. Gerekçe
    `tsconfig.e2e.json` içinde yazılıdır. Üretim derlemesi `tsconfig.json`
    kullanmaya devam eder.
  */
  tsconfig: './tsconfig.e2e.json',
  /* Kurulum ve temizlik tek seferliktir: şema göçü ve tohum verisi. */
  globalSetup: './e2e/genel-kurulum.ts',
  globalTeardown: './e2e/genel-temizlik.ts',

  /*
    TESTLER SIRAYLA KOŞAR  (`workers: 1`)
    Paralel koşumda iki test aynı tohum verisini paylaşır ve biri diğerinin
    oluşturduğu kaydı silebilir. Bu takım küçük; kararlılık hızdan önce gelir.
    Paralelleştirme gerekirse her işçiye ayrı veritabanı vermek gerekir.
  */
  workers: 1,
  fullyParallel: false,

  /* CI'da yanlışlıkla bırakılmış `test.only` derlemeyi kırmalıdır. */
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: TABAN_ADRES,
    /* Hata ayıklanabilirlik: başarısız testte iz ve ekran görüntüsü kalır. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    /*
      `next build` de `.env.test` ile koşmalıdır: `NEXT_PUBLIC_*` değişkenleri
      DERLEME ANINDA gömülür. Geliştirme değerleriyle derlenmiş bir çıktıyı
      test ortam değişkenleriyle çalıştırmak, adresi yanlış gömülü bir
      uygulama üretirdi.
    */
    /*
      DERLEME DİZİNİ HER KOŞUDA SIFIRDAN KURULUR — ÖLÇÜLMÜŞ ZORUNLULUK.
      Var olan bir derleme dizininin üzerine yeniden derlemek Windows'ta
      "Cannot find module for page" (ENOENT) hatalarıyla çöküyor; aynı derleme
      temiz dizinde her seferinde başarılı oluyor. Silinen dizin `.next-test`
      olduğu için geliştirme sunucusunun `.next`i etkilenmez
      (bkz. next.config.mjs -> NEXT_DIST_DIR).
    */
    /*
      DERLEMEYİ ATLAMA — CI İÇİN
      ------------------------------------------------------------------------
      GitHub Actions iş akışı derlemeyi KENDİ adımında yapar. Sebep dürüstçe
      şudur: `webServer` çıktısı Playwright tarafından `[WebServer]` önekiyle
      test günlüğüne karıştırılır ve bir derleme hatası orada kaybolur — bu
      oturumda tam olarak yaşandı, hatayı bulmak için günlükte "Build error"
      aramak gerekti. Ayrı bir adım, hatayı kendi başlığı altında gösterir ve
      tarayıcı kurulumundan ÖNCE başarısız olur.
      Ayrıca `next build` tip denetimi de yapar; boşa tarayıcı indirmemek için
      sıra böyle kurulur.

      Bayrak verilmediğinde davranış AYNEN ESKİSİ GİBİDİR: yerelde tek komutla
      (`pnpm test:e2e`) derleme + koşu yapılır.
    */
    command: derlemeyiAtla
      ? `pnpm exec next start -p ${PORT}`
      : `node e2e/derleme-temizle.mjs && pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: TABAN_ADRES,
    /* Derleme uzun sürer; yerelde ayakta duran sunucu yeniden kullanılır. */
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
