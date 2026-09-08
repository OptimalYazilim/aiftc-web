/**
 * S3 KOVASI GİZLİLİK DENETİMİ  (Kılavuz 5.1.2)
 * ============================================================================
 * "Kova private olmalıdır" bir yapılandırma şartıdır ve **uygulama kodundan
 * zorlanamaz**. Kod yalnızca nesneyi `private` ACL ile yazabilir; kovanın
 * kendisinde `s3:GetObject` herkese açan bir politika varsa o ACL'in hiçbir
 * hükmü kalmaz ve her belge, adresini bilen herkese açılır.
 *
 * Bu betik o şartı SÖZ olarak değil ÖLÇÜM olarak doğrular: kovaya bir sonda
 * nesnesi yazar, sonra aynı adrese **kimliksiz** (imzasız) bir istek atar.
 * Kova gerçekten kapalıysa istek 403 veya 404 döner. 200 dönerse kova
 * herkese açıktır ve bu, kurumun tüm yüklü belgelerinin dışarıya açık olduğu
 * anlamına gelir.
 *
 * Sonda nesnesi her durumda silinir.
 *
 * ---------------------------------------------------------------------------
 * NE ZAMAN ÇALIŞTIRILIR
 * ---------------------------------------------------------------------------
 *   - kurulumdan sonra, canlıya geçmeden ÖNCE (zorunlu),
 *   - kova politikası veya "Block Public Access" ayarı her değiştiğinde,
 *   - depolama sağlayıcısı değiştiğinde.
 *
 *   pnpm s3:denetle
 *
 * `.env` içindeki S3_* değişkenlerini okur; `MEDIA_STORAGE_ADAPTER=s3`
 * değilse hiçbir şey ölçmeden çıkar.
 * ============================================================================
 */
import 'dotenv/config'
import {
  DeleteObjectCommand,
  GetBucketPolicyStatusCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

type Satir = { ok: boolean | null; ad: string; not: string }
const satirlar: Satir[] = []

const yaz = (ok: boolean | null, ad: string, not = '') => {
  satirlar.push({ ok, ad, not })
  const isaret = ok === null ? 'BILGI' : ok ? 'OK   ' : 'HATA '
  console.log(`  ${isaret} ${ad.padEnd(46)} ${not}`)
}

const cikis = (kod: number): never => {
  const basarisiz = satirlar.filter((s) => s.ok === false).length
  console.log(
    `\n${basarisiz === 0 ? 'KOVA KAPALI GÖRÜNÜYOR' : 'DİKKAT: ' + basarisiz + ' ölçüm başarısız'}\n`,
  )
  process.exit(kod)
}

if (process.env.MEDIA_STORAGE_ADAPTER !== 's3') {
  console.log('\nMEDIA_STORAGE_ADAPTER=s3 değil; S3 kullanılmıyor. Denetlenecek bir şey yok.\n')
  process.exit(0)
}

const kova = process.env.S3_BUCKET
const endpoint = process.env.S3_ENDPOINT
const bolge = process.env.S3_REGION
const yolTabanli = process.env.S3_FORCE_PATH_STYLE === 'true'

if (!kova) {
  console.error('S3_BUCKET tanımsız.')
  process.exit(1)
}

console.log(`\nS3 GİZLİLİK DENETİMİ`)
console.log(`  kova     : ${kova}`)
console.log(`  uç nokta : ${endpoint ?? '(AWS varsayılanı)'}`)
console.log(`  bölge    : ${bolge ?? '(tanımsız)'}\n`)

const istemci = new S3Client({
  region: bolge,
  endpoint,
  forcePathStyle: yolTabanli,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
})

/*
  Sonda anahtarı tahmin edilemez olmalıdır: sabit bir ad, önceki bir denetimden
  kalan nesneyi okuyup yanlış sonuç üretebilirdi.
*/
const anahtar = `aiftc-gizlilik-denetimi/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`
const govde = 'AIFTC gizlilik denetimi sondasi. Bu dosya disaridan okunabiliyorsa kova ACIKTIR.'

const adres = yolTabanli
  ? `${(endpoint ?? '').replace(/\/$/, '')}/${kova}/${anahtar}`
  : `https://${kova}.s3.${bolge}.amazonaws.com/${anahtar}`

let yazildi = false

try {
  // ---------------------------------------------------------------- 1. sonda
  try {
    await istemci.send(
      new PutObjectCommand({
        Bucket: kova,
        Key: anahtar,
        Body: govde,
        ContentType: 'text/plain',
        /* Uygulamanın yazdığı ACL ile AYNI olmalı, yoksa sonda gerçek
           belgeleri temsil etmez. `S3_ACL=none` ise başlık gönderilmez. */
        ...((process.env.S3_ACL ?? 'private').toLowerCase() === 'none'
          ? {}
          : { ACL: 'private' as const }),
      }),
    )
    yazildi = true
    yaz(true, 'sonda nesnesi yazıldı', anahtar.slice(0, 32) + '…')
  } catch (hata) {
    const mesaj = (hata as Error).message
    if (/AccessControlListNotSupported/i.test(mesaj)) {
      yaz(
        false,
        'ACL reddedildi — S3_ACL=none yapın',
        'kova "Bucket owner enforced" modunda',
      )
      cikis(1)
    }
    yaz(false, 'sonda YAZILAMADI', mesaj.slice(0, 60))
    cikis(1)
  }

  // ------------------------------------------------- 2. KİMLİKSİZ okuma denemesi
  /*
    ÖLÇÜMÜN KALBİ. `fetch` hiçbir imza taşımaz — tam olarak internetteki
    yabancı bir istemcinin yapacağı istektir.
  */
  try {
    const yanit = await fetch(adres, { redirect: 'manual' })
    if (yanit.status === 200) {
      const okunan = (await yanit.text()).slice(0, 40)
      yaz(false, 'KOVA HERKESE AÇIK — imzasız istek dosyayı verdi', `HTTP 200 · "${okunan}…"`)
    } else {
      yaz(true, 'imzasız istek engellendi', `HTTP ${yanit.status}`)
    }
  } catch (hata) {
    /* Ağ hatası bir KANIT DEĞİLDİR: uç nokta dışarıdan erişilemiyor olabilir
       ya da DNS çözülmemiş olabilir. Başarı sayılmaz, bilgi olarak yazılır. */
    yaz(null, 'imzasız istek ağ hatası verdi', (hata as Error).message.slice(0, 50))
  }

  // ------------------------------------------- 3. AWS ayarları (varsa okunur)
  /*
    Bu iki çağrı yalnızca gerçek AWS'de ve yetki varsa çalışır; MinIO ve diğer
    S3 uyumlu sistemler desteklemez. Desteklenmiyorsa BAŞARISIZLIK sayılmaz —
    asıl kanıt yukarıdaki imzasız istektir.
  */
  /*
    DİKKAT — "cevap geldi" ile "cevap ANLAMLI" aynı şey değildir.
    S3 uyumlu sistemler bu uçları çoğu zaman tanımaz ve hata yerine BOŞ ama
    200 bir gövde döndürebilir. O gövdeyi "sorun yok" diye okumak, denetimi
    sessizce işe yaramaz hâle getirirdi. Bu yüzden yalnızca AÇIKÇA gelen bir
    değer sonuç sayılır; gerisi BİLGİ olarak yazılır.
  */
  try {
    const durum = await istemci.send(new GetBucketPolicyStatusCommand({ Bucket: kova }))
    const acik = durum.PolicyStatus?.IsPublic
    if (acik === true) yaz(false, 'kova POLİTİKASI herkese açık')
    else if (acik === false) yaz(true, 'kova politikası açık değil')
    else yaz(null, 'kova politikası okunamadı', 'sağlayıcı bu ucu desteklemiyor')
  } catch {
    yaz(null, 'kova politikası okunamadı', 'desteklenmiyor veya yetki yok')
  }

  try {
    const blok = await istemci.send(new GetPublicAccessBlockCommand({ Bucket: kova }))
    const y = blok.PublicAccessBlockConfiguration
    if (!y || Object.keys(y).length === 0) {
      yaz(null, 'Block Public Access okunamadı', 'sağlayıcı bu ucu desteklemiyor')
    } else {
      const tamBlok = Boolean(
        y.BlockPublicAcls && y.BlockPublicPolicy && y.IgnorePublicAcls && y.RestrictPublicBuckets,
      )
      yaz(tamBlok, tamBlok ? 'Block Public Access tam açık' : 'Block Public Access EKSİK')
    }
  } catch {
    yaz(null, 'Block Public Access okunamadı', 'desteklenmiyor veya yetki yok')
  }
} finally {
  if (yazildi) {
    try {
      await istemci.send(new DeleteObjectCommand({ Bucket: kova, Key: anahtar }))
      yaz(true, 'sonda nesnesi silindi')
    } catch (hata) {
      yaz(false, 'SONDA SİLİNEMEDİ — elle silin', anahtar)
    }
  }
}

cikis(satirlar.some((s) => s.ok === false) ? 1 : 0)
