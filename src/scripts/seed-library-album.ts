/**
 * DİJİTAL KÜTÜPHANE — ÖRNEK FOTOĞRAF ALBÜMÜ
 * ============================================================================
 * "2026 Uluslararası Yangın Tatbikatı Fotoğraf Albümü" kaydını kurar.
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/seed-library-album.ts
 *   corepack pnpm exec tsx src/scripts/seed-library-album.ts --temizle
 *   corepack pnpm exec tsx src/scripts/seed-library-album.ts foto1.jpg foto2.jpg ...
 *
 * TEKRAR ÇALIŞTIRILABİLİR: aynı slug varsa kayıt SİLİNİP yeniden kurulur.
 *
 * ============================================================================
 * GÖRSELLER TEMSİLİDİR — KURUMUN KENDİ TATBİKAT FOTOĞRAFI DEĞİLDİR
 * ============================================================================
 * Buradaki dört fotoğraf Unsplash'ten indirilmiş, ÜCRETSİZ LİSANSLI
 * (Unsplash License — ticari kullanım serbest, atıf zorunlu değil) stok
 * görsellerdir. Unsplash+ / Getty kapsamındaki ücretli görseller BİLEREK
 * elenmiştir; seçim yapılırken her adayın URL'i `images.unsplash.com`
 * (ücretsiz) mi yoksa `plus.unsplash.com` (abonelik) mi diye denetlendi.
 *
 * ANCAK ŞU AÇIKÇA BİLİNMELİDİR:
 * Kayıt "2026 Uluslararası Yangın Tatbikatı" adında BELİRLİ BİR ETKİNLİĞİN
 * albümü olarak adlandırılmıştır. Stok fotoğraflar o etkinliğin belgesi
 * DEĞİLDİR ve öyleymiş gibi yayımlanmaları yanıltıcı olur.
 *
 * Bu yüzden her görselin `caption` alanı "temsili görsel" ibaresi taşır ve
 * `credit` alanında fotoğrafçı + kaynak + lisans yazılıdır. Yayına
 * çıkmadan önce İKİSİNDEN BİRİ yapılmalıdır:
 *   a) görseller merkezin kendi tatbikat fotoğraflarıyla değiştirilir, veya
 *   b) kaydın başlığı belirli bir etkinliği iddia etmeyecek şekilde
 *      değiştirilir (örn. "Yangın Müdahalesi — Temsili Görseller").
 *
 * Kendi fotoğraflarınızı bağlamak için:
 *   corepack pnpm exec tsx src/scripts/seed-library-album.ts "D:/foto/1.jpg" ...
 * ============================================================================
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../payload.config.js'

/** Revalidate hook'ları betik bağlamında `next/cache` bulamaz. */
const CTX = { context: { skipRevalidate: true } }

const SLUG = '2026-uluslararasi-yangin-tatbikati-fotograf-albumu'
/** Bu önek temizlik modunda da kullanılır. */
const ALBUM_ALT_PREFIX = 'Tatbikat albümü'

type Shot = {
  /** \`TEMP\` dizinindeki dosya adı (indirme betiğiyle üretilir). */
  file: string
  alt: string
  caption: string
  credit: string
}

/**
 * Dört tema — kullanıcının istediği kapsam:
 * orman yangını · itfaiye müdahalesi · hava müdahalesi · saha koordinasyonu
 *
 * `alt`: WCAG 1.1.1 — görseli göremeyen kullanıcıya NE GÖSTERDİĞİNİ anlatır.
 * `caption`: temsili olduğunu SÖYLER; kartta/lightbox'ta künye olarak durur.
 * `credit`: Şartname 10.2 görünürlük kuralları — kaynak ve lisans kayıtlı.
 */
const SHOTS: Shot[] = [
  {
    file: 'aiftc-albm-1-orman-yangini.jpg',
    alt: `${ALBUM_ALT_PREFIX} — yoğun duman altında alevlerin sardığı iğne yapraklı orman kesimi`,
    caption: 'Temsili görsel — orman yangını.',
    credit: 'Emma Renly / Unsplash (Unsplash License)',
  },
  {
    file: 'aiftc-albm-2-mudahale.jpg',
    alt: `${ALBUM_ALT_PREFIX} — koruyucu teçhizatlı iki itfaiye eri hortumla alevlere su tutuyor`,
    caption: 'Temsili görsel — yer ekiplerinin söndürme müdahalesi.',
    credit: 'Matt C / Unsplash (Unsplash License)',
  },
  {
    file: 'aiftc-albm-3-hava-mudahalesi.jpg',
    alt: `${ALBUM_ALT_PREFIX} — altına su kovası bağlı söndürme helikopteri havada seyir hâlinde`,
    caption: 'Temsili görsel — helikopterle hava müdahalesi.',
    credit: 'insung yoon / Unsplash (Unsplash License)',
  },
  {
    file: 'aiftc-albm-4-koordinasyon.jpg',
    alt: `${ALBUM_ALT_PREFIX} — teçhizatlı bir itfaiye ekibi olay yerine doğru birlikte ilerliyor`,
    caption: 'Temsili görsel — saha koordinasyonu ve ekip sevki.',
    credit: 'Albert Stoynov / Unsplash (Unsplash License)',
  },
]

const payload = await getPayload({ config })
const args = process.argv.slice(2)

// --- Temizlik modu ---------------------------------------------------------
if (args.includes('--temizle')) {
  const removed = await payload.delete({
    collection: 'library-resources',
    locale: 'tr',
    ...CTX,
    where: { slug: { equals: SLUG } },
  })
  const media = await payload.delete({
    collection: 'media',
    locale: 'tr',
    ...CTX,
    where: { alt: { like: ALBUM_ALT_PREFIX } },
  })
  console.log('silinen kayıt:', removed.docs.length, '| silinen görsel:', media.docs.length)
  process.exit(0)
}

// --- Yüklenecek görselleri belirle ----------------------------------------
const tmp = process.env.TEMP ?? '.'
const toUpload: Shot[] =
  args.length > 0
    ? args.map((file, i) => ({
        file,
        alt: `Yangın tatbikatı fotoğrafı ${i + 1}`,
        caption: '',
        credit: '',
      }))
    : SHOTS.map((shot) => ({ ...shot, file: path.join(tmp, shot.file) }))

for (const shot of toUpload) {
  if (!fs.existsSync(shot.file)) {
    console.error('Görsel bulunamadı:', shot.file)
    console.error('Stok görseller indirilmemiş olabilir; kendi fotoğraflarınızı')
    console.error('argüman olarak geçebilirsiniz: ... seed-library-album.ts foto1.jpg foto2.jpg')
    process.exit(1)
  }
}

// --- Eski albüm görsellerini temizle (kopya birikmesin) --------------------
const stale = await payload.delete({
  collection: 'media',
  locale: 'tr',
  ...CTX,
  where: { alt: { like: ALBUM_ALT_PREFIX } },
})
if (stale.docs.length > 0) console.log('eski albüm görseli silindi:', stale.docs.length)

// --- Görselleri yükle ------------------------------------------------------
const uploaded: number[] = []
for (const shot of toUpload) {
  const doc = await payload.create({
    collection: 'media',
    locale: 'tr',
    ...CTX,
    filePath: shot.file,
    data: {
      alt: shot.alt,
      ...(shot.caption ? { caption: shot.caption } : {}),
      ...(shot.credit ? { credit: shot.credit } : {}),
    },
  })
  const d = doc as unknown as { id: number; filename?: string; width?: number; height?: number }
  uploaded.push(d.id)
  console.log(`görsel yüklendi: #${d.id} ${d.filename} (${d.width}x${d.height})`)
}

// --- İlgili konuyu bul -----------------------------------------------------
const topics = await payload.find({
  collection: 'training-topics',
  locale: 'tr',
  limit: 20,
  depth: 0,
})
const fireTopic =
  topics.docs.find((t) => /yang[ıi]n/i.test(String((t as { title?: string }).title ?? ''))) ??
  topics.docs[0]

// --- Kaydı kur -------------------------------------------------------------
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
    title: '2026 Uluslararası Yangın Tatbikatı Fotoğraf Albümü',
    description:
      'Orta Asya ve komşu ülkelerden gelen ekiplerin katılımıyla düzenlenen uluslararası yangın tatbikatından kareler. Söndürme müdahalesi, hava desteği ve saha koordinasyonunu kapsar. Görseller şu an temsilidir.',
    author: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
    resourceType: 'photo-album',
    publicationYear: 2026,
    featured: false,
    gallery: uploaded,
    /*
      KAPAK AÇIKÇA SEÇİLİR. Kart, kapak verilmediğinde albümün ilk görseline
      düşüyor (bkz. LibraryResourceCard) — o davranış korunuyor, ama burada
      kapağı editörün seçtiği durumu da sınamak için MÜDAHALE karesi
      (2. görsel) veriliyor: kartta insan ve eylem olan bir kare, salt
      alevden daha iyi okunur.
    */
    coverImage: uploaded[1] ?? uploaded[0],
    ...(fireTopic ? { topics: [fireTopic.id] } : {}),
    downloads: 0,
    _status: 'published',
  } as never,
})

const created = record as unknown as { id: number }

// --- Geri okuyup doğrula ---------------------------------------------------
const check = await payload.findByID({
  collection: 'library-resources',
  id: created.id,
  locale: 'tr',
  depth: 2,
})

const gallery = ((check as unknown as { gallery?: unknown[] }).gallery ?? []) as {
  id?: number
  url?: string
  width?: number
  height?: number
  alt?: string
}[]
const cover = (check as unknown as { coverImage?: { id?: number; url?: string } }).coverImage

console.log('\nalbüm kaydı oluşturuldu:')
console.log('   id            =', created.id)
console.log('   görsel sayısı =', gallery.length)
for (const g of gallery) {
  console.log(`     #${g.id} ${g.width}x${g.height} ${g.url?.split('/').pop()}`)
}
console.log('   kapak         = #' + cover?.id, cover?.url?.split('/').pop())
console.log('   _status       =', (check as unknown as { _status?: string })._status)

const ok =
  gallery.length === toUpload.length &&
  gallery.every((g) => Boolean(g.url) && (g.width ?? 0) >= 1600) &&
  Boolean(cover?.url)

console.log(ok ? '\nSONUÇ: albüm gerçek görsellerle bağlı.' : '\nSONUÇ: EKSİK VAR.')
process.exit(ok ? 0 : 1)
