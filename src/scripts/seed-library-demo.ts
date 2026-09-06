/**
 * DİJİTAL KÜTÜPHANE — ÖRNEK VİDEO KAYDI
 * ============================================================================
 * Ne yapar:
 *   1. Verilen .mp4 dosyasını MEDYA KÜTÜPHANESİ'ne yükler.
 *   2. Kapak görseli üretip yükler (dosya verilmediyse).
 *   3. "OGM — Yangın Tatbikatı Eğitimi" başlıklı, türü Video Kaydı olan,
 *      videoya ve kapağa bağlı, YAYIMLANMIŞ bir kütüphane kaydı oluşturur.
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/seed-library-demo.ts "D:/video.mp4"
 *   corepack pnpm exec tsx src/scripts/seed-library-demo.ts --temizle
 *
 * TEKRAR ÇALIŞTIRILABİLİR: aynı slug varsa kayıt SİLİNİP yeniden kurulur,
 * kopya üretmez.
 *
 * ---------------------------------------------------------------------------
 * NEDEN MEDYA'YA YÜKLÜYOR
 * ---------------------------------------------------------------------------
 * `videoFile` artık hem `media` hem `document-files` koleksiyonunu görüyor
 * (çok hedefli ilişki), yani ikisi de çalışır. Betik MEDYA'yı seçiyor çünkü
 * kütüphanede OYNATILACAK videoların doğal yeri orasıdır; Site Belgeleri
 * indirilebilir ekler içindir. Panelde ikisi de seçilebilir.
 * ============================================================================
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../payload.config.js'

/** Revalidate hook'ları betik bağlamında `next/cache` bulamaz. */
const CTX = { context: { skipRevalidate: true } }

const SLUG = 'ogm-yangin-tatbikati-egitimi'

const payload = await getPayload({ config })

// --- Temizlik modu ---------------------------------------------------------
const args = process.argv.slice(2)
if (args.includes('--temizle')) {
  const removed = await payload.delete({
    collection: 'library-resources',
    locale: 'tr',
    ...CTX,
    where: { slug: { equals: SLUG } },
  })
  console.log('silinen kayıt:', removed.docs.length)
  process.exit(0)
}

const videoPath = args[0] ?? 'D:/videoplayback (1).mp4'
if (!fs.existsSync(videoPath)) {
  console.error('Video bulunamadı:', videoPath)
  console.error('Kullanım: tsx src/scripts/seed-library-demo.ts "<mp4 yolu>"')
  process.exit(1)
}

// --- 0) Bu betiğin daha önce yüklediği kapakları temizle -------------------
/*
  Betik tekrar çalıştırılabilir olmalı. Kapak medyası her seferinde yeniden
  yüklendiği için temizlenmezse Medya kitaplığında kopya birikir.
  Video dosyası ELLE seçildiği (argümanla verildiği) için ona dokunulmaz.
*/
const staleCovers = await payload.delete({
  collection: 'media',
  locale: 'tr',
  ...CTX,
  where: { alt: { like: 'Tatbikat ateşinin çevresinde' } },
})
if (staleCovers.docs.length > 0) console.log('eski kapak silindi:', staleCovers.docs.length)

// --- 1) Video dosyasını Medya Kütüphanesi'ne yükle -------------------------
const video = await payload.create({
  collection: 'media',
  locale: 'tr',
  ...CTX,
  filePath: videoPath,
  data: {
    // `alt` zorunludur (WCAG 1.1.1). Video için ekran okuyucuya okunacak ad.
    alt: 'Yangın tatbikatı eğitimi saha kaydı',
    caption: 'OGM yangın tatbikatı eğitimi sırasında çekilen saha kaydı.',
    // `mediaType` Media koleksiyonundaki hook tarafından 'video' yapılır.
  },
})

const v = video as unknown as { id: number; mimeType?: string; filesize?: number; url?: string }
console.log('video yüklendi:')
console.log('   id       =', v.id)
console.log('   mimeType =', v.mimeType)
console.log('   boyut    =', ((v.filesize ?? 0) / 1024 / 1024).toFixed(1), 'MB')
console.log('   url      =', v.url)

// --- 2) Kapak görseli ------------------------------------------------------
/*
  KAPAK ARTIK DÜZ RENK DEĞİL, GERÇEK BİR FOTOĞRAF.

  İlk sürümde kurumsal koyu zümrüt zeminde düz bir kare basılıyordu; kartta
  ve oynatıcının `poster` alanında boş bir kutu gibi duruyordu. Videodan kare
  çıkarmak ffmpeg gerektirir ve bu makinede kurulu değil, ayrıca rastgele bir
  karenin kapak olarak uygun olacağının garantisi yok.

  Bu yüzden ücretsiz lisanslı (Unsplash License) TEMSİLİ bir tatbikat karesi
  kullanılıyor. Albüm görselleriyle aynı kural geçerlidir:
  bu, merkezin kendi eğitiminden çekilmiş bir fotoğraf DEĞİLDİR — `caption`
  alanı bunu söyler, `credit` alanı kaynağı kayda geçirir (Şartname 10.2).
  Editör gerçek kapağı panelden değiştirmelidir.

  Dosya bulunamazsa betik DURMAZ: düz renkli yedeğe düşer, çünkü kapak
  eksikliği kaydın kurulmasını engellememelidir.
*/
const photoCover = path.join(process.env.TEMP ?? '.', 'aiftc-video-kapak.jpg')
let coverPath = photoCover
let coverIsPhoto = true

if (!fs.existsSync(photoCover)) {
  coverIsPhoto = false
  coverPath = path.join(process.env.TEMP ?? '.', 'aiftc-library-cover.png')
  if (!fs.existsSync(coverPath)) {
    const sharp = (await import('sharp')).default
    await sharp({
      create: { width: 1200, height: 1600, channels: 3, background: { r: 6, g: 40, b: 34 } },
    })
      .png()
      .toFile(coverPath)
  }
  console.warn('UYARI: fotoğraf kapağı bulunamadı, düz renkli yedeğe düşüldü.')
}

const cover = await payload.create({
  collection: 'media',
  locale: 'tr',
  ...CTX,
  filePath: coverPath,
  data: {
    alt: coverIsPhoto
      ? 'Tatbikat ateşinin çevresinde toplanmış koruyucu teçhizatlı itfaiye ekibi'
      : 'Yangın tatbikatı eğitimi kaydı kapak görseli',
    ...(coverIsPhoto
      ? {
          caption: 'Temsili görsel — yangın tatbikatı eğitimi.',
          credit: 'Natalia Marcelewicz / Unsplash (Unsplash License)',
        }
      : {}),
  },
})
const cv = cover as unknown as { id: number; width?: number; height?: number; filename?: string }
console.log(
  `kapak yüklendi: #${cv.id} ${cv.filename} (${cv.width}x${cv.height})` +
    (coverIsPhoto ? ' [gerçek fotoğraf]' : ' [düz renk yedek]'),
)

// --- 3) İlgili eğitim konusunu bul ----------------------------------------
/*
  Tematik filtrelerin çalıştığını da görebilmek için kayıt bir konuya
  bağlanır. Yangınla ilgili konu yoksa ilk konuya düşülür; hiç konu yoksa
  alan boş bırakılır — kayıt yine geçerlidir.
*/
const topics = await payload.find({
  collection: 'training-topics',
  locale: 'tr',
  limit: 20,
  depth: 0,
})
const fireTopic =
  topics.docs.find((t) => /yang[ıi]n/i.test(String((t as { title?: string }).title ?? ''))) ??
  topics.docs[0]

// --- 4) Kütüphane kaydı ----------------------------------------------------
const existing = await payload.find({
  collection: 'library-resources',
  locale: 'tr',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
})
for (const doc of existing.docs) {
  await payload.delete({ collection: 'library-resources', id: doc.id, ...CTX })
  console.log('mevcut kayıt silindi (yeniden kurulacak): id =', doc.id)
}

const record = await payload.create({
  collection: 'library-resources',
  locale: 'tr',
  ...CTX,
  data: {
    slug: SLUG,
    title: 'OGM - Yangın Tatbikatı Eğitimi',
    description:
      'Orman Genel Müdürlüğü iş birliğiyle düzenlenen yangın tatbikatı eğitiminin saha kaydı. Müdahale ekiplerinin sevk düzeni, telsiz iletişimi ve söndürme tekniklerinin uygulamalı gösterimini içerir.',
    author: 'Orman Genel Müdürlüğü',
    resourceType: 'video',
    publicationYear: 2026,
    featured: true,
    /*
      Çok hedefli ilişki: hangi koleksiyondan geldiği AÇIKÇA yazılır.
      Tek hedefliyken yalnızca id yeterliydi; artık `relationTo` şart.
    */
    videoFile: { relationTo: 'media', value: v.id },
    /*
      SÜRE UYDURULMAZ. İlk sürümde buraya "18 dk" yazılmıştı; dosyanın
      gerçek süresi 3 dk 51 sn çıktı ve kart ziyaretçiye YANLIŞ bilgi
      gösteriyordu (tarayıcıda ölçüldü: video.duration = 231.2 sn).
      Sunucu tarafında süre okumak ffprobe gerektirir ve bu makinede kurulu
      değildir; bu yüzden değer betiğe PARAMETRE olarak geçilir ve
      varsayılanı bu dosyanın gerçek süresidir. Editör panelden düzeltebilir.
    */
    videoDuration: process.env.DEMO_VIDEO_DURATION ?? '3 dk 51 sn',
    allowVideoDownload: true,
    coverImage: (cover as unknown as { id: number }).id,
    ...(fireTopic ? { topics: [fireTopic.id] } : {}),
    downloads: 0,
    _status: 'published',
  } as never,
})

const created = record as unknown as { id: number }
console.log('\nkütüphane kaydı oluşturuldu:')
console.log('   id    =', created.id)
console.log('   slug  =', SLUG)
console.log('   konu  =', fireTopic ? (fireTopic as { title?: string }).title : '(konu yok)')

// --- 5) Geri okuyup ilişkinin gerçekten bağlandığını doğrula ---------------
const check = await payload.findByID({
  collection: 'library-resources',
  id: created.id,
  locale: 'tr',
  depth: 2,
})

const linked = (check as unknown as { videoFile?: { relationTo?: string; value?: unknown } })
  .videoFile
const linkedValue = linked?.value as { id?: number; url?: string; mimeType?: string } | undefined

console.log('\ngeri okuma:')
console.log('   videoFile.relationTo =', linked?.relationTo)
console.log('   videoFile.value.id   =', linkedValue?.id)
console.log('   videoFile.value.url  =', linkedValue?.url)
console.log('   videoFile.mimeType   =', linkedValue?.mimeType)
console.log('   _status              =', (check as unknown as { _status?: string })._status)

const linkedCover = (check as unknown as { coverImage?: { id?: number; url?: string } }).coverImage
console.log('   coverImage.id        =', linkedCover?.id)
console.log('   coverImage.url       =', linkedCover?.url?.split('/').pop())

const ok = linked?.relationTo === 'media' && Boolean(linkedValue?.url) && Boolean(linkedCover?.url)
console.log(ok ? '\nSONUÇ: ilişki bağlı.' : '\nSONUÇ: İLİŞKİ BAĞLANMADI.')
process.exit(ok ? 0 : 1)
