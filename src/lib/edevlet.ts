import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * e-DEVLET KAPISI ENTEGRASYONU — ORTAK KURALLAR
 * ============================================================================
 * Bu dosya, e-Devlet akışının TEK karar noktasıdır: kum havuzu (mock) kipinin
 * açık olup olmadığı, kimlik numarasının nasıl saklandığı ve `state` değerinin
 * nasıl doğrulandığı yalnızca burada tanımlanır. Rotalar ve arayüz bu
 * fonksiyonları çağırır, kendi kararlarını vermez.
 *
 * ============================================================================
 * EN ÖNEMLİ KISIM: KUM HAVUZU ÜRETİMDE ASLA AÇILAMAZ
 * ============================================================================
 * Kum havuzu kipi, girilen kimlik numarasını DOĞRULAMADAN kabul eder ve
 * "Onaylı" bir hesap üretir. Üretimde açık kalırsa bu, parolayı tümden
 * atlayan tam bir kimlik doğrulama açığıdır: siteye giren herkes istediği
 * kişinin adıyla onaylı hesap açabilir.
 *
 * Bu yüzden tek bir bayrağa GÜVENİLMEZ. Kip iki koşul birlikte sağlanmadan
 * açılmaz:
 *
 *   1. `NEXT_PUBLIC_EDEVLET_MOCK_MODE === 'true'`
 *   2. `NEXT_PUBLIC_SERVER_URL` bir YEREL GELİŞTİRME adresi olmalı
 *
 * İkincisi kritik olan koşuldur: bayrak yanlışlıkla üretim ortamına taşınsa
 * bile — `.env` kopyalanır, bir CI değişkeni unutulur, bir Docker imajı eski
 * ortamla çalıştırılır — gerçek alan adında çalışan uygulama kum havuzunu
 * AÇMAZ ve rotalar 404 döner.
 *
 * ---------------------------------------------------------------------------
 * NEDEN `NODE_ENV !== 'production'` DEĞİL
 * ---------------------------------------------------------------------------
 * ÖLÇÜLMÜŞ KISIT: `.env.test` bilinçli olarak `NODE_ENV=production` verir,
 * çünkü E2E takımı üretim derlemesinin DAVRANIŞINI sınar (`force-dynamic`
 * gerçekten dinamik mi, ISR gerçekten önbellekliyor mu). `NODE_ENV`e bakan bir
 * kilit, testlerde kum havuzunu kapatır ve akış hiç sınanamazdı.
 *
 * Adres tabanlı kilit bu çakışmayı yaşamaz: testler `http://localhost:3100`
 * kullanır, üretim gerçek alan adını kullanır.
 * ============================================================================
 */

/** Yerel geliştirme sayılan ana makine adları. */
const YEREL_ADLAR = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Adres yerel geliştirme adresi mi?
 *
 * `.localhost` ve `.test` son ekleri de kabul edilir: ikisi de RFC ile
 * ayrılmış, internette çözümlenmeyen adlardır (RFC 6761). Başka hiçbir ad
 * yerel sayılmaz — `dev.kurum.gov.tr` gibi bir ad gerçek bir sunucudur.
 */
const yerelAdresMi = (adres: string | undefined): boolean => {
  if (!adres) return false
  try {
    const { hostname } = new URL(adres)
    return (
      YEREL_ADLAR.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.test')
    )
  } catch {
    /* Ayrıştırılamayan adres yerel SAYILMAZ — hata güvenli tarafa düşer. */
    return false
  }
}

const BAYRAK_ACIK = process.env.NEXT_PUBLIC_EDEVLET_MOCK_MODE === 'true'

/**
 * Kum havuzu kipi etkin mi?
 *
 * Hem sunucu hem istemci tarafında çağrılabilir: `NEXT_PUBLIC_*` değişkenleri
 * derleme anında gömülür, dolayısıyla istemcide de okunur. İstemci bu değeri
 * yalnızca DÜĞMEYİ ETKİNLEŞTİRMEK için kullanır; yetki kararı her zaman
 * sunucudadır (rotalar aynı fonksiyonu yeniden çağırır).
 */
export const mockModuAktif = (): boolean =>
  BAYRAK_ACIK && yerelAdresMi(process.env.NEXT_PUBLIC_SERVER_URL)

/*
  AÇILIŞTA UYARI — SESSİZ YANLIŞ YAPILANDIRMAYA KARŞI
  ---------------------------------------------------------------------------
  Kilit, yanlış yapılandırmayı GÜVENLİ tarafa düşürür ama SESSİZ bırakır:
  bayrağı açık bırakıp üretime çıkan biri, e-Devlet düğmesinin neden
  görünmediğini anlamaz ve hatayı başka yerde arar. Ters durum daha da
  önemlidir: bayrağın üretimde açık kalmış olması, kayıtlara geçmesi gereken
  bir olaydır.

  `captcha.ts` ile aynı desen: yalnızca sunucuda, modül düzeyinde bir kez.
*/
if (typeof window === 'undefined' && BAYRAK_ACIK && !mockModuAktif()) {
  console.warn(
    '[edevlet] NEXT_PUBLIC_EDEVLET_MOCK_MODE=true ama NEXT_PUBLIC_SERVER_URL ' +
      `yerel bir adres değil (${process.env.NEXT_PUBLIC_SERVER_URL ?? 'tanımsız'}). ` +
      'Kum havuzu KAPATILDI ve ilgili uçlar 404 dönecek. Üretim ortamında bu bayrak ' +
      'hiç tanımlanmamalıdır (bkz. .env.production.example).',
  )
}

/**
 * GERÇEK KAPI YAPILANDIRMASI — HENÜZ YOK, UYDURULMADI
 * ---------------------------------------------------------------------------
 * e-Devlet Kapısı entegrasyonu kurumun NİTELİKLİ BAŞVURUSUYLA açılır: uygulama
 * kaydı, istemci kimliği/sırrı, sabit dönüş adresi ve imza anahtarları kurum
 * adına e-Devlet tarafından verilir. Bu değerlerin hiçbiri tahmin edilemez ve
 * BU KOD İÇİNE UYDURULMAMIŞTIR — çalışmayan bir adrese yönlendiren bir düğme,
 * entegrasyon varmış izlenimi verirdi.
 *
 * Değerler geldiğinde `.env` üzerinden verilir ve `gercekKapiHazir()` true
 * döner. O ana kadar gerçek kip KAPALIDIR ve rota açık bir hata döndürür.
 */
export const EDEVLET_GERCEK_ALANLAR = [
  'EDEVLET_AUTHORIZE_URL',
  'EDEVLET_TOKEN_URL',
  'EDEVLET_CLIENT_ID',
  'EDEVLET_CLIENT_SECRET',
] as const

export const gercekKapiHazir = (): boolean =>
  EDEVLET_GERCEK_ALANLAR.every((ad) => Boolean(process.env[ad]?.trim()))

/** Akış hiç kullanılabilir mi (kum havuzu ya da gerçek kapı)? */
export const edevletKullanilabilir = (): boolean => mockModuAktif() || gercekKapiHazir()

/**
 * KİMLİK NUMARASI SAKLANMAZ — YALNIZCA ÖZETİ SAKLANIR
 * ============================================================================
 * T.C. kimlik numarası KVKK kapsamında özel nitelikli olmasa da doğrudan
 * kimlik belirleyen bir veridir ve sızdığında geri alınamaz. Dönen kullanıcıyı
 * tanımak için numaranın KENDİSİ gerekmez; DEĞİŞMEYEN bir eşleştirme anahtarı
 * yeterlidir. Bu yüzden veritabanında yalnızca tuzlanmış SHA-256 özeti durur
 * (`Users.edevletSubject`).
 *
 * Sonuç: veritabanı bir şekilde ele geçse bile içinden kimlik numarası
 * ÇIKARILAMAZ.
 *
 * ---------------------------------------------------------------------------
 * TUZ DEĞİŞİRSE EŞLEŞTİRME KOPAR — BİLİNÇLİ TAKAS
 * ---------------------------------------------------------------------------
 * Özet deterministik olmak ZORUNDADIR (aynı kişi aynı hesaba düşsün). Bu da
 * tuzun sabit kalmasını gerektirir. `EDEVLET_SUBJECT_SALT` değiştirilirse ya
 * da `PAYLOAD_SECRET` döndürülürse (tuz verilmemişse ona düşer) mevcut
 * hesaplar tanınamaz ve kullanıcılar İKİNCİ bir hesap açar.
 *
 * Bu yüzden tuz ayrı bir değişkendir: `PAYLOAD_SECRET` güvenlik gereği
 * döndürülebilir, kimlik eşleştirmesi ondan bağımsız kalmalıdır.
 *
 * KURUMSAL KARAR GEREKTİRİR: eğitim katılım belgesi veya sertifika üzerinde
 * kimlik numarası basılması gerekiyorsa numara bir yerde tutulmak zorundadır.
 * O ihtiyaç ortaya çıkarsa bu tercih (özet) yeniden değerlendirilmelidir —
 * kendiliğinden ters çevrilemez.
 */
const tuz = (): string => {
  const ozel = process.env.EDEVLET_SUBJECT_SALT?.trim()
  if (ozel) return ozel

  const yedek = process.env.PAYLOAD_SECRET?.trim()
  if (yedek) return yedek

  /*
    Tuz yoksa özet üretmek, tuzsuz (dolayısıyla kaba kuvvetle çözülebilir) bir
    kimlik numarası özeti yazmak olurdu: TCKN uzayı 11 hanedir ve tuzsuz bir
    SHA-256 tablosu sıradan bir makinede çıkarılabilir. Hata güvenli tarafa
    düşer — akış hiç başlamaz.
  */
  throw new Error(
    'e-Devlet: EDEVLET_SUBJECT_SALT ya da PAYLOAD_SECRET tanımlı olmalı. ' +
      'Tuzsuz özet, kimlik numarasının kaba kuvvetle çözülmesine izin verir.',
  )
}

/** Kimlik numarasından değişmeyen, geri döndürülemez eşleştirme anahtarı. */
export const kimlikOzeti = (tckn: string): string =>
  createHash('sha256').update(`${tuz()}:${tckn}`).digest('hex')

/**
 * T.C. kimlik numarası biçim denetimi.
 *
 * Gövdesi `lib/tckn.ts` içindedir ve buradan yeniden ihraç edilir. Sebep:
 * fonksiyon İSTEMCİDE de çalışmalı (formda anında geri bildirim), ama bu dosya
 * `node:crypto` içe aktardığı için istemci paketine giremez. Tek kopya iki
 * tarafta çalışsın diye ayrıldı — gerekçesi o dosyada.
 *
 * ÖLÇÜLMÜŞ BİR HATA ORADA DÜZELTİLDİ: bu fonksiyonun ilk sürümü negatif
 * kalanı normalize etmiyordu (`(x) % 10`, `((x % 10) + 10) % 10` değil) ve
 * 200.000 geçerli numaradan 19'unu (≈%0,01) YANLIŞLIKLA reddediyordu. O
 * kişiler e-Devlet ile hiç giriş yapamazdı.
 */
export { tcknBicimiGecerli } from './tckn'

/**
 * `state` — CSRF VE İSTEK BÜTÜNLÜĞÜ
 * ============================================================================
 * Dönüş (callback) ucu, tarayıcıdan gelen ve oturum açtıran bir uçtur. Tek
 * başına bırakılırsa herkes ona istediği kimlik numarasıyla istek atıp hesap
 * açtırabilir. Bu yüzden akış şöyle bağlanır:
 *
 *   1. `/login` rastgele bir `state` üretir, httpOnly çerezine yazar ve
 *      değeri kapıya (kum havuzunda sahte ekrana) parametre olarak verir.
 *   2. `/callback` gelen `state` ile çerezdeki değeri karşılaştırır.
 *      Eşleşmezse istek REDDEDİLİR.
 *
 * Yani dönüş ucu, yalnızca BU TARAYICIDA başlamış bir akışı tamamlayabilir.
 *
 * SINIRIN DÜRÜST İFADESİ: bu, kum havuzunu güvenli yapmaz. Kum havuzunda
 * kullanıcı kendi akışını başlatıp istediği numarayı girebilir — kimliği
 * doğrulayan bir merci yoktur. Kum havuzunun güvenliği YEREL ADRES
 * KİLİDİNDEN gelir, `state`ten değil. `state` burada gerçek kipte de aynen
 * çalışacak olan mekanizmayı yerine koyar.
 */
export const EDEVLET_STATE_COOKIE = 'aiftc-edevlet-state'

/** Çerez ömrü: akış bir kaç dakikada tamamlanır, jeton uzun yaşamamalı. */
export const EDEVLET_STATE_OMRU_SN = 10 * 60

export const stateUret = (): string => randomBytes(32).toString('base64url')

/**
 * Sabit süreli karşılaştırma — `===` uzunluk/önek sızdırabilir.
 *
 * Dönüş tipi bir TİP KORUYUCUSUDUR (`gelen is string`): eşleşme sağlandığında
 * `gelen` kesinlikle tanımlıdır ve sonraki kod onu boş olabilir diye ele almak
 * zorunda kalmaz. Bu, gerçek değişmezi tip sisteminde ifade eder; alternatifi
 * çağrı yerlerine `state!` ya da `state ?? ''` yazmaktı — ikisi de değişmezi
 * gizler.
 */
export const stateEslesiyor = (
  gelen: string | undefined,
  cerez: string | undefined,
): gelen is string => {
  if (!gelen || !cerez) return false

  const a = Buffer.from(gelen)
  const b = Buffer.from(cerez)
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

/**
 * KUM HAVUZU HESAPLARI İÇİN PAROLA
 * ---------------------------------------------------------------------------
 * Payload'ın kimlik koleksiyonu parola ZORUNLU tutar, ama e-Devlet'le gelen
 * kullanıcının parolası yoktur ve olmamalıdır. Hesap, tahmin edilemez ve
 * HİÇBİR YERDE SAKLANMAYAN bir parolayla açılır: kullanıcı parolayla giriş
 * yapmak isterse "parolamı unuttum" akışını kullanır ve kendi parolasını
 * belirler.
 *
 * Boş ya da sabit bir parola konmaz — sabit parola, e-Devlet'le açılmış tüm
 * hesaplara tek bir anahtarla girilmesi demekti.
 */
export const rastgeleParola = (): string => `${randomBytes(24).toString('base64url')}Aa1!`
