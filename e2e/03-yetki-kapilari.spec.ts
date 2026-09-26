import { expect, test } from '@playwright/test'

import { girisYap } from './yardimcilar/oturum'
import { ADLAR, payloadIstemcisi, testEpostasi, TEST_ONEKI } from './yardimcilar/tohum'

/**
 * SENARYO 3 — NEGATİF YETKİ KAPILARI
 * ============================================================================
 * Bu dosya yalnızca REDDEDİLMESİ GEREKEN istekleri ölçer. Olumlu testler
 * (senaryo 2) bir kuralın çalıştığını gösterir; olumsuz testler kuralın
 * KALDIRILDIĞINI yakalar. İkisi ayrı şeylerdir ve biri diğerinin yerine
 * geçmez.
 *
 * ---------------------------------------------------------------------------
 * NEDEN DURUM KODU, NEDEN EKRAN DEĞİL
 * ---------------------------------------------------------------------------
 * "Giriş sayfası göründü" iddiası zayıftır: uygulama istemci tarafında
 * yönlendirme yapıyor olsa da aynı ekran görünürdü ve korunmasız sayfa yine
 * de üretilmiş olurdu. Bu yüzden yönlendirme HTTP katmanında, yönlendirme
 * TAKİP EDİLMEDEN ölçülür.
 *
 * ---------------------------------------------------------------------------
 * KATILIMCI HESABI BİLİNÇLİ OLARAK GEÇERLİ BİR HESAPTIR
 * ---------------------------------------------------------------------------
 * Belge indirme testinde kullanılan hesap ONAYLI ve aboneliği GEÇERLİDİR.
 * Reddedilmesinin tek sebebi belgenin SEVİYESİDİR (`staff`). "Oturumsuz
 * kullanıcı reddedildi" ölçümü çok daha zayıf olurdu: kural "oturum var mı"
 * biçimine bozulsa bile o test geçmeye devam ederdi.
 * ============================================================================
 */

const KATILIMCI = testEpostasi('katilimci')

/** Tohumlanan personele özel belgenin gerçek dosya adı. */
const personelBelgesi = async () => {
  const payload = await payloadIstemcisi()
  const sonuc = await payload.find({
    collection: 'document-files',
    where: { title: { like: ADLAR.personelBelgesi } },
    limit: 1,
    overrideAccess: true,
  })
  const kayit = sonuc.docs[0] as unknown as { filename?: string; accessLevel?: string } | undefined
  expect(kayit, 'Personele özel belge tohumlanmamış.').toBeTruthy()
  expect(kayit?.accessLevel, 'Belge seviyesi `staff` olmalı, yoksa test anlamsızdır.').toBe('staff')
  return String(kayit?.filename)
}

test.describe('Negatif yetki kapıları', () => {
  test('anonim istek /tr/profil rotasından 307 ile giriş sayfasına atılır', async ({ page }) => {
    /*
      `maxRedirects: 0` ŞART. Playwright varsayılan olarak yönlendirmeyi
      izler ve 200 döner; o hâlde 307'nin gerçekten üretildiği ölçülemez.
    */
    const yanit = await page.request.get('/tr/profil', { maxRedirects: 0 })

    expect(yanit.status()).toBe(307)
    expect(yanit.headers()['location']).toContain('/tr/giris')
  })

  test('onaylı katılımcı, PERSONELE ÖZEL belgeyi indiremez', async ({ page, baseURL }) => {
    await girisYap(page, KATILIMCI)
    const dosyaAdi = await personelBelgesi()
    const adres = `/api/document-files/file/${encodeURIComponent(dosyaAdi)}`

    /*
      `Origin` BAŞLIĞI ELLE VERİLİR — ÖLÇÜLMÜŞ BİR TUZAK.
      Payload'un CSRF koruması çerezi yalnızca aynı köken kanıtlanabiliyorsa
      kabul eder: ya `Origin` ya `Sec-Fetch-Site: same-origin`. Sayfa
      bağlamının dışından yapılan bir istek ikisini de taşımayabilir; o zaman
      istek ANONİM sayılır ve test doğru sonucu YANLIŞ sebeple alırdı.
    */
    const basliklar = { Origin: String(baseURL) }

    /*
      Önce oturumun bu istek bağlamında GERÇEKTEN tanındığını kanıtla. Bu
      satır olmadan, aşağıdaki 403 "katılımcı reddedildi" değil "anonim
      reddedildi" anlamına gelebilirdi — kural bozulsa bile test yeşil kalırdı.
    */
    const ben = await page.request.get('/api/users/me', { headers: basliklar })
    expect(ben.status()).toBe(200)
    const benGovde = (await ben.json()) as { user?: { email?: string; role?: string } | null }
    expect(benGovde.user?.email).toBe(KATILIMCI)
    expect(benGovde.user?.role).toBe('trainee')

    /* Ve şimdi asıl ölçüm. */
    const belge = await page.request.get(adres, { headers: basliklar })
    expect(
      belge.status(),
      'Personele özel belge, onaylı bir KATILIMCIYA verilmemeli.',
    ).toBe(403)
  })

  test('belgelerin eski KORUMASIZ adresi (/documents/...) artık dosya sunmaz', async ({ page }) => {
    /*
      ÖLÇÜLMÜŞ BİR AÇIĞIN NÖBETÇİSİ.
      `DocumentFiles.staticDir` bir dönem `public/documents` idi. Next.js
      `public/` altındaki her şeyi HİÇBİR KOD ÇALIŞTIRMADAN diskten servis
      eder; yani Payload'un erişim kuralı ne yazarsa yazsın dosyanın ikinci ve
      tamamen korumasız bir adresi vardı (2026-09-07 ölçümü: anonim istek 206
      döndü). Klasör `private/documents` yapılarak kapatıldı.

      `public/` yeniden kullanılırsa bu test kırılır — düzeltmenin geri
      alınmasını yakalayan tek şey budur.
    */
    const dosyaAdi = await personelBelgesi()
    const yanit = await page.request.get(`/documents/${encodeURIComponent(dosyaAdi)}`, {
      maxRedirects: 0,
    })

    expect(
      yanit.status(),
      'Dosya `public/` altından servis ediliyor — erişim kuralı devre dışı kalır.',
    ).not.toBe(200)
    expect(yanit.status()).not.toBe(206)
  })

  test('anonim istek form taleplerini API üzerinden çekemez', async ({ page }) => {
    /*
      `formRequestReadAccess` oturumsuz istek için `false` döner — filtre
      değil, tümden ret. Payload bunu 403 olarak yanıtlar.
    */
    const yanit = await page.request.get('/api/form-requests?limit=100')
    expect(yanit.status()).toBe(403)
  })

  test('katılımcı, API üzerinden YALNIZCA kendi form talebini çekebilir', async ({
    page,
    baseURL,
  }) => {
    await girisYap(page, KATILIMCI)

    const yanit = await page.request.get('/api/form-requests?limit=100', {
      headers: { Origin: String(baseURL) },
    })
    expect(yanit.status()).toBe(200)

    const govde = (await yanit.json()) as {
      docs?: Array<{ subject?: string; email?: string }>
    }
    const konular = (govde.docs ?? []).map((d) => String(d.subject ?? ''))

    /* Kendi kaydı gelmeli. */
    expect(konular).toContain(ADLAR.kendiTalep)
    /* Yabancının kaydı GELMEMELİ. */
    expect(konular).not.toContain(ADLAR.yabanciTalep)

    /*
      Ve dönen HER kayıt bu kullanıcıya ait olmalı — tohum dışından gelmiş
      bir kayıt sızsa bile yakalanır.
      (Tohum önekiyle sınırlamıyoruz: sınırlama, sızıntıyı gizleyebilirdi.)
      Not: `TEST_ONEKI` yalnızca hata mesajını okunur kılmak için anılır.
    */
    for (const kayit of govde.docs ?? []) {
      expect(
        String(kayit.email ?? '').toLowerCase(),
        `Yabancı kayıt sızdı (önek: ${TEST_ONEKI}).`,
      ).toBe(KATILIMCI.toLowerCase())
    }
  })
})
