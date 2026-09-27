/**
 * TAMAMLAYICI ÖRNEK VERİ — pnpm exec tsx src/scripts/seed-tamamlayici.ts
 * ============================================================================
 * `seed.ts`, `seed-training-demo.ts` ve `seed-virtual-classroom.ts` sonrasında
 * BOŞ kalan her bölümü üç dilde doldurur:
 *
 *   görseller      konu / eğitim / haber kapakları, ana sayfa arka planı,
 *                  sayfa üst görselleri, galeri kareleri
 *   haberler       dört ek haber/duyuru (kapaklı)
 *   kuruluş        Kuruluş sayfası + Tarihçe, Misyon ve Vizyon alt sayfaları
 *   SSS            sekiz soru (sekiz grubun her biri)
 *   rehber         altı Uluslararası Katılımcı Rehberi bölümü
 *   galeri         üç albüm
 *   belgeler       beş örnek PDF (site belgeleri)
 *   kütüphane      iki belge kaydı (rapor + teknik rehber)
 *   abonelik       üç kurumsal paket
 *   çeviriler      örnek eğitim (#AIFTC-IFM-2027-01) ve ana proje EN/RU
 *   ayarlar        iletişim, harita konumu, görünürlük beyanı, çerez bandı
 *
 * Seçenek:
 *   --yalnizca-gorsel   yalnızca TEMP altına görsel üretir ve çıkar.
 *                       `seed-simulation-centre.ts` ve `seed-library-album.ts`
 *                       bu dosyaları kullanır; onlardan ÖNCE çalıştırılmalıdır.
 *
 * TEKRAR ÇALIŞTIRILABİLİR: slug ile bulunan kayıt yeniden oluşturulmaz.
 * ÜRETİMDE ÇALIŞMAZ.
 *
 * ============================================================================
 * GÖRSELLER VE BELGELER TEMSİLİDİR
 * ============================================================================
 * Görseller `sharp` ile bu betikte ÇİZİLEN soyut illüstrasyonlardır. Hiçbir
 * gerçek etkinliği belgelemez, üçüncü taraf lisansı taşımaz. Alt metinleri ve
 * künyeleri "temsili" olduklarını açıkça söyler. PDF'ler "ÖRNEK BELGE"
 * ibaresi taşır. Kurumun kendi fotoğraf ve belgeleriyle değiştirilmelidir.
 *
 * Kişi adı, telefon numarası ve sosyal medya hesabı UYDURULMAZ: bu alanlar
 * görev tanımıyla doldurulur ya da boş bırakılır.
 * ============================================================================
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import { NEWS_CATEGORIES } from '../fields/options.js'
import config from '../payload.config.js'

if (process.env.NODE_ENV === 'production') {
  console.error('seed-tamamlayici üretimde çalıştırılmaz.')
  process.exit(1)
}

const CTX = { context: { skipRevalidate: true } } as const
type Locale = 'tr' | 'en' | 'ru'
type L<T = string> = Record<Locale, T>
const DILLER: Locale[] = ['tr', 'en', 'ru']

const TMP = process.env.TEMP ?? process.env.TMPDIR ?? '.'
const GORSEL_DIZINI = path.join(TMP, 'aiftc-gorsel')

// ===========================================================================
// YARDIMCILAR
// ===========================================================================

const richText = (...paragraphs: string[]) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      })),
    },
  }) as never

/** Tohumlu sözde rastgele sayı üreteci — aynı tohum her seferinde aynı görseli verir. */
const prng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ===========================================================================
// GÖRSEL ÜRETİMİ — soyut, temsili illüstrasyonlar
// ===========================================================================

type Tema =
  | 'orman'
  | 'yangin'
  | 'restorasyon'
  | 'cbs'
  | 'fidan'
  | 'iklim'
  | 'sahil'
  | 'kampus'
  | 'toplanti'
  | 'simulasyon'

type Palet = { sky: [string, string]; sun: string; layers: string[]; ground: string }

const PALETLER: Record<Exclude<Tema, 'simulasyon' | 'toplanti'>, Palet> = {
  orman: { sky: ['#9fc3d8', '#e9efe3'], sun: '#fff6d8', layers: ['#9db3a6', '#6f8f7c', '#3f6552', '#1f3f31'], ground: '#17301f' },
  yangin: { sky: ['#3b1d1a', '#f08a3c'], sun: '#ffd27a', layers: ['#8a4a36', '#5b2f25', '#3a1d18', '#1c0e0c'], ground: '#120807' },
  restorasyon: { sky: ['#b9d3c4', '#f1f0de'], sun: '#fffbe6', layers: ['#a9c2a0', '#7fa477', '#557f52', '#2f5a33'], ground: '#23452a' },
  cbs: { sky: ['#0d1b2e', '#1f4a6b'], sun: '#8fd3ff', layers: ['#27526e', '#1d4058', '#142f42', '#0b1f2d'], ground: '#08161f' },
  fidan: { sky: ['#bfe0e8', '#f3f6df'], sun: '#fffbe0', layers: ['#b4cfa6', '#93b886', '#6f9a63'], ground: '#8a6a45' },
  iklim: { sky: ['#264653', '#e9c46a'], sun: '#fff1c1', layers: ['#5b7f78', '#3f6560', '#2a4b47', '#16302d'], ground: '#10221f' },
  sahil: { sky: ['#6fa8dc', '#f7e8c8'], sun: '#fff5d6', layers: ['#8aa4b8', '#62809a'], ground: '#1e5f86' },
  kampus: { sky: ['#a7c7dc', '#eef1e6'], sun: '#fff7dc', layers: ['#a3b8aa', '#6d8c78'], ground: '#2b4a35' },
}

const sirt = (r: () => number, W: number, base: number, amp: number, step = 40) => {
  const pts: [number, number][] = []
  let y = base
  for (let x = -step; x <= W + step; x += step) {
    y += (r() - 0.5) * amp
    y = Math.max(base - amp * 1.6, Math.min(base + amp * 0.8, y))
    pts.push([x, y])
  }
  return pts
}

const agac = (x: number, y: number, h: number, renk: string) => {
  const w = h * 0.42
  const kat = [0, 0.3, 0.55].map((k, i) => {
    const top = y - h + k * h
    const bw = w * (0.6 + i * 0.25)
    return `<polygon points="${x},${top} ${x - bw / 2},${top + h * 0.45} ${x + bw / 2},${top + h * 0.45}" fill="${renk}"/>`
  })
  return `<rect x="${x - h * 0.03}" y="${y - h * 0.12}" width="${h * 0.06}" height="${h * 0.14}" fill="${renk}"/>${kat.join('')}`
}

const manzara = (tema: keyof typeof PALETLER, seed: number, W = 1600, H = 1000) => {
  const r = prng(seed)
  const p = PALETLER[tema]
  const sunX = 250 + r() * (W - 500)
  const sunY = tema === 'yangin' ? 520 : 180 + r() * 180
  let body = ''

  // Gökyüzü ayrıntıları
  if (tema === 'cbs') {
    for (let x = 0; x <= W; x += 80) body += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#8fd3ff" stroke-opacity=".07"/>`
    for (let y = 0; y <= H; y += 80) body += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#8fd3ff" stroke-opacity=".07"/>`
    const sx = 300 + r() * 900
    body += `<g transform="translate(${sx},150) rotate(-18)"><rect x="-18" y="-12" width="36" height="24" fill="#d8e6f0"/><rect x="-92" y="-8" width="66" height="16" fill="#3d86b8"/><rect x="26" y="-8" width="66" height="16" fill="#3d86b8"/></g>`
    body += `<path d="M${sx} 170 L${sx - 260} ${H} L${sx + 260} ${H} Z" fill="#8fd3ff" fill-opacity=".06"/>`
  } else {
    body += `<circle cx="${sunX}" cy="${sunY}" r="220" fill="url(#glow)"/>`
    body += `<circle cx="${sunX}" cy="${sunY}" r="${tema === 'yangin' ? 90 : 60}" fill="${p.sun}" opacity=".9"/>`
    if (tema !== 'yangin') {
      for (let i = 0; i < 4; i++) {
        const cx = r() * W
        const cy = 90 + r() * 220
        body += `<ellipse cx="${cx}" cy="${cy}" rx="${120 + r() * 160}" ry="${22 + r() * 18}" fill="#ffffff" opacity=".35" filter="url(#blur)"/>`
      }
    }
  }

  if (tema === 'sahil') {
    // Toros silueti + deniz
    const d1 = sirt(r, W, 520, 70, 60)
    body += `<path d="M0 ${H} ${d1.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${H} Z" fill="${p.layers[0]}"/>`
    const d2 = sirt(r, W, 600, 50, 50)
    body += `<path d="M0 ${H} ${d2.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${H} Z" fill="${p.layers[1]}"/>`
    body += `<rect x="0" y="660" width="${W}" height="${H - 660}" fill="url(#deniz)"/>`
    for (let i = 0; i < 26; i++) {
      const y = 680 + r() * 300
      body += `<line x1="${r() * W}" y1="${y}" x2="${r() * W}" y2="${y}" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`
    }
    return svgSar(W, H, p, body)
  }

  if (tema === 'kampus') {
    const d1 = sirt(r, W, 560, 60, 60)
    body += `<path d="M0 ${H} ${d1.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${H} Z" fill="${p.layers[0]}"/>`
    body += `<rect x="0" y="700" width="${W}" height="${H - 700}" fill="${p.ground}"/>`
    // Bina
    const bx = 420
    body += `<rect x="${bx}" y="470" width="760" height="240" fill="#e7e2d6"/><rect x="${bx - 20}" y="455" width="800" height="22" fill="#9c5b3c"/>`
    for (let c = 0; c < 12; c++)
      for (let row = 0; row < 3; row++)
        body += `<rect x="${bx + 30 + c * 61}" y="${500 + row * 64}" width="34" height="40" fill="#5f7f95" opacity=".85"/>`
    body += `<rect x="${bx + 330}" y="630" width="100" height="80" fill="#6b4a33"/>`
    for (let i = 0; i < 16; i++) {
      const x = r() * W
      if (x > bx - 30 && x < bx + 790) continue
      body += agac(x, 720 + r() * 40, 150 + r() * 120, '#1f3f2b')
    }
    return svgSar(W, H, p, body)
  }

  // Katmanlı dağ + orman
  const katmanSayisi = p.layers.length
  p.layers.forEach((renk, i) => {
    const base = 470 + i * (tema === 'fidan' ? 90 : 115)
    const pts = sirt(r, W, base, 60 - i * 8, 50)
    body += `<path d="M0 ${H} ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${H} Z" fill="${renk}"/>`
    if (i >= katmanSayisi - 2 && tema !== 'fidan') {
      const olcek = i === katmanSayisi - 1 ? 1 : 0.6
      let x = -20
      while (x < W + 20) {
        const idx = Math.max(0, Math.min(pts.length - 1, Math.round((x + 50) / 50)))
        const y = pts[idx][1] + 8
        const yanmis = tema === 'yangin' && r() < 0.35
        body += agac(x, y, (70 + r() * 90) * olcek, yanmis ? '#050202' : renk)
        x += (14 + r() * 26) * olcek
      }
    }
    if ((tema === 'orman' || tema === 'restorasyon' || tema === 'iklim') && i < katmanSayisi - 1)
      body += `<rect x="0" y="${base - 10}" width="${W}" height="60" fill="#ffffff" opacity=".12" filter="url(#blur)"/>`
  })

  if (tema === 'yangin') {
    for (let i = 0; i < 9; i++) {
      const cx = 200 + r() * (W - 400)
      body += `<ellipse cx="${cx}" cy="${260 + r() * 260}" rx="${140 + r() * 180}" ry="${90 + r() * 120}" fill="#6b6360" opacity=".45" filter="url(#blur)"/>`
    }
    body += `<rect x="0" y="600" width="${W}" height="90" fill="#ff7a2a" opacity=".35" filter="url(#blur)"/>`
  }

  if (tema === 'fidan') {
    body += `<rect x="0" y="760" width="${W}" height="${H - 760}" fill="${p.ground}"/>`
    for (let row = 0; row < 7; row++) {
      const y = 790 + row * 32
      const s = 0.4 + row * 0.16
      for (let x = 20 + (row % 2) * 30; x < W; x += 60 * s + 12) {
        body += `<polygon points="${x},${y - 34 * s} ${x - 12 * s},${y} ${x + 12 * s},${y}" fill="#4f8a3c"/>`
      }
    }
  }

  if (tema === 'cbs') {
    for (let i = 0; i < 7; i++) {
      const cx = 200 + r() * (W - 400)
      const cy = 650 + r() * 250
      for (let k = 1; k <= 4; k++)
        body += `<ellipse cx="${cx}" cy="${cy}" rx="${k * 45}" ry="${k * 22}" fill="none" stroke="#8fd3ff" stroke-opacity="${0.35 - k * 0.06}"/>`
    }
    for (let i = 0; i < 5; i++) {
      const x = 120 + r() * (W - 400)
      const y = 640 + r() * 250
      body += `<polygon points="${x},${y} ${x + 160},${y - 30} ${x + 220},${y + 40} ${x + 60},${y + 70}" fill="#e76f51" fill-opacity=".22" stroke="#e76f51" stroke-opacity=".6"/>`
    }
  }

  return svgSar(W, H, p, body)
}

const svgSar = (W: number, H: number, p: Palet, body: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${p.sun}" stop-opacity=".7"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
    <linearGradient id="deniz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b8fc0"/><stop offset="1" stop-color="${p.ground}"/></linearGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${body}
</svg>`

/** Simülasyon / harekât salonu. */
const salon = (seed: number, W = 1600, H = 1000) => {
  const r = prng(seed)
  let b = `<rect width="${W}" height="${H}" fill="#0c1419"/><rect width="${W}" height="620" fill="#111d24"/>`
  const cols = 4 + Math.floor(r() * 2)
  const sw = (W - 160) / cols
  for (let c = 0; c < cols; c++)
    for (let row = 0; row < 2; row++) {
      const x = 80 + c * sw + 8
      const y = 90 + row * 230
      const w = sw - 16
      const h = 210
      const renk = ['#1d3a2c', '#3a2418', '#16324a', '#2a3a1c'][Math.floor(r() * 4)]
      b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${renk}" stroke="#2f4d5c" stroke-width="3"/>`
      for (let k = 0; k < 5; k++) {
        const px = x + r() * w
        const py = y + r() * h
        b += `<circle cx="${px}" cy="${py}" r="${6 + r() * 20}" fill="${r() < 0.4 ? '#ff8a3c' : '#6fe0b0'}" opacity=".55"/>`
      }
      for (let k = 0; k < 3; k++)
        b += `<polyline points="${Array.from({ length: 6 }, (_, i) => `${x + (i * w) / 5},${y + h * (0.3 + r() * 0.5)}`).join(' ')}" fill="none" stroke="#8fd3ff" stroke-opacity=".45" stroke-width="2"/>`
    }
  b += `<rect x="0" y="600" width="${W}" height="60" fill="#8fd3ff" opacity=".08" filter="url(#blur)"/>`
  for (let d = 0; d < 2; d++) {
    const y = 720 + d * 150
    b += `<rect x="60" y="${y}" width="${W - 120}" height="46" rx="6" fill="#1b262c"/>`
    for (let x = 110; x < W - 150; x += 170) {
      b += `<rect x="${x}" y="${y - 70}" width="110" height="66" rx="4" fill="#223540" stroke="#3a5a6a"/>`
      b += `<rect x="${x + 6}" y="${y - 64}" width="98" height="54" fill="${r() < 0.5 ? '#1f4a3a' : '#1f3a55'}"/>`
      b += `<circle cx="${x + 55}" cy="${y + 95}" r="26" fill="#0a1013"/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter></defs>${b}</svg>`
}

/** Toplantı / çalıştay salonu. */
const toplanti = (seed: number, W = 1600, H = 1000) => {
  const r = prng(seed)
  let b = `<rect width="${W}" height="${H}" fill="#e9e4da"/><rect y="${H - 330}" width="${W}" height="330" fill="#b9a58a"/>`
  b += `<rect x="430" y="90" width="740" height="400" fill="#1f3b33"/><rect x="450" y="110" width="700" height="360" fill="#f4f1ea"/>`
  for (let i = 0; i < 7; i++) {
    const h = 60 + r() * 240
    b += `<rect x="${500 + i * 90}" y="${440 - h}" width="54" height="${h}" fill="${i % 2 ? '#2f6f57' : '#d98c3a'}"/>`
  }
  b += `<line x1="480" y1="440" x2="1120" y2="440" stroke="#555" stroke-width="3"/>`
  for (let row = 0; row < 4; row++) {
    const y = 620 + row * 95
    const s = 0.75 + row * 0.12
    for (let x = 80 + (row % 2) * 40; x < W - 40; x += 120 * s) {
      const renk = ['#2d3e48', '#4a3b33', '#1f3b33', '#5a4a3a'][Math.floor(r() * 4)]
      b += `<rect x="${x - 34 * s}" y="${y}" width="${68 * s}" height="${80 * s}" rx="${22 * s}" fill="${renk}"/>`
      b += `<circle cx="${x}" cy="${y - 16 * s}" r="${24 * s}" fill="#3a2c24"/>`
    }
  }
  b += `<rect x="1230" y="360" width="120" height="200" fill="#7a5a40"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`
}

const gorselDosyasi = async (ad: string, tema: Tema, seed: number, dizin = GORSEL_DIZINI) => {
  fs.mkdirSync(dizin, { recursive: true })
  const hedef = path.join(dizin, ad)
  if (fs.existsSync(hedef)) return hedef
  const svg = tema === 'simulasyon' ? salon(seed) : tema === 'toplanti' ? toplanti(seed) : manzara(tema, seed)
  await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toFile(hedef)
  return hedef
}

/** Diğer seed betiklerinin TEMP altında beklediği dosyalar. */
const harici = async () => {
  await gorselDosyasi('aiftc-sim-hero.jpg', 'simulasyon', 11, TMP)
  await gorselDosyasi('aiftc-sim-oymes.jpg', 'simulasyon', 12, TMP)
  await gorselDosyasi('aiftc-sim-btes.jpg', 'simulasyon', 13, TMP)
  await gorselDosyasi('aiftc-albm-1-orman-yangini.jpg', 'yangin', 21, TMP)
  await gorselDosyasi('aiftc-albm-2-mudahale.jpg', 'yangin', 22, TMP)
  await gorselDosyasi('aiftc-albm-3-hava-mudahalesi.jpg', 'yangin', 23, TMP)
  await gorselDosyasi('aiftc-albm-4-koordinasyon.jpg', 'toplanti', 24, TMP)
}

if (process.argv.includes('--yalnizca-gorsel')) {
  await harici()
  console.log('Görseller üretildi:', TMP)
  process.exit(0)
}

// ===========================================================================
// PDF ÜRETİMİ — tek sayfalık, bağımlılıksız örnek belge
// ===========================================================================

/** PDF standart yazı tipleri Türkçe harflerin bir kısmını taşımaz; ASCII'ye indirilir. */
const ascii = (s: string) =>
  s
    .replace(/[çÇ]/g, (c) => (c === 'ç' ? 'c' : 'C'))
    .replace(/[ğĞ]/g, (c) => (c === 'ğ' ? 'g' : 'G'))
    .replace(/[ıİ]/g, (c) => (c === 'ı' ? 'i' : 'I'))
    .replace(/[öÖ]/g, (c) => (c === 'ö' ? 'o' : 'O'))
    .replace(/[şŞ]/g, (c) => (c === 'ş' ? 's' : 'S'))
    .replace(/[üÜ]/g, (c) => (c === 'ü' ? 'u' : 'U'))
    .replace(/[’‘]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/([\\()])/g, '\\$1')

const pdfUret = (dosya: string, baslik: string, satirlar: string[]) => {
  const hedef = path.join(GORSEL_DIZINI, dosya)
  fs.mkdirSync(GORSEL_DIZINI, { recursive: true })
  if (fs.existsSync(hedef)) return hedef

  const akis = [
    'BT /F2 20 Tf 60 770 Td (' + ascii(baslik) + ') Tj ET',
    'BT /F1 10 Tf 60 745 Td (' + ascii('Antalya Uluslararasi Ormancilik Egitim Merkezi - AIFTC') + ') Tj ET',
    '0.12 0.36 0.27 RG 2 w 60 732 m 535 732 l S',
    ...satirlar.map((s, i) => `BT /F1 11 Tf 60 ${705 - i * 18} Td (${ascii(s)}) Tj ET`),
    '0.6 0.1 0.1 rg BT /F2 12 Tf 60 70 Td (' + ascii('ORNEK BELGE - temsili icerik, resmi belge degildir.') + ') Tj ET',
  ].join('\n')

  const nesneler = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(akis)} >>\nstream\n${akis}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const ofsetler: number[] = []
  nesneler.forEach((n, i) => {
    ofsetler.push(Buffer.byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${n}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${nesneler.length + 1}\n0000000000 65535 f \n`
  pdf += ofsetler.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${nesneler.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  fs.writeFileSync(hedef, pdf, 'latin1')
  return hedef
}

// ===========================================================================
// ÇALIŞTIRMA
// ===========================================================================

await harici()
const payload: Payload = await getPayload({ config })
const log = (m: string) => payload.logger.info(m)

/** TR slug ile kayıt bulur. */
const slugIle = async (collection: string, slug: string) => {
  const r = await payload.find({
    collection: collection as never,
    locale: 'tr',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (r.docs[0] as { id: number } | undefined)?.id ?? null
}

/** Görseli üretir, medya kütüphanesine yükler (dosya adı aynıysa yeniden yüklemez). */
const medya = async (ad: string, tema: Tema, seed: number, alt: L, mediaType = 'photo') => {
  /* Media koleksiyonu yüklemeyi WebP'ye çevirir; dosya adı uzantısıyla değişir. */
  const onceki = await payload.find({
    collection: 'media',
    where: { filename: { in: [ad, ad.replace(/\.jpe?g$/, '.webp')] } },
    limit: 1,
    depth: 0,
  })
  if (onceki.docs[0]) return (onceki.docs[0] as { id: number }).id

  const filePath = await gorselDosyasi(ad, tema, seed)
  const kunye: L = {
    tr: 'Temsili illüstrasyon — kurumun kendi görseliyle değiştirilecektir.',
    en: 'Representative illustration — to be replaced with the centre’s own image.',
    ru: 'Иллюстрация-заглушка — будет заменена собственным изображением центра.',
  }
  const doc = (await payload.create({
    collection: 'media',
    locale: 'tr',
    ...CTX,
    filePath,
    data: { alt: alt.tr, caption: kunye.tr, credit: 'AIFTC (temsili)', mediaType } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await payload.update({
      collection: 'media',
      id: doc.id,
      locale: dil,
      ...CTX,
      data: { alt: alt[dil], caption: kunye[dil] } as never,
    })
  return doc.id
}

/** Tek dilde güncelleme kısayolu. */
const guncelle = (collection: string, id: number, locale: Locale, data: Record<string, unknown>) =>
  payload.update({ collection: collection as never, id, locale, ...CTX, data: data as never })

/**
 * Dile bağlı ALT ALANI olan dizileri çevirir. Dizi dile bağlı değilse satır
 * kimlikleri korunmalıdır; aksi hâlde güncelleme satırları yeniden oluşturur
 * ve TR değerleri kaybolur.
 */
const diziCevir = async (
  collection: string,
  id: number,
  alan: string,
  locale: Locale,
  ceviri: (satir: Record<string, unknown>, i: number) => Record<string, unknown>,
) => {
  const doc = (await payload.findByID({ collection: collection as never, id, locale: 'tr', depth: 0 })) as Record<
    string,
    unknown
  >
  const satirlar = (doc[alan] as Record<string, unknown>[] | undefined) ?? []
  await guncelle(collection, id, locale, { [alan]: satirlar.map((s, i) => ({ ...s, ...ceviri(s, i) })) })
}

// ---------------------------------------------------------------------------
// 1. KAPAK GÖRSELLERİ — konular, eğitimler, haberler
// ---------------------------------------------------------------------------

const KONU_TEMA: Record<string, [Tema, L]> = {
  'entegre-orman-yangini-yonetimi': ['yangin', { tr: 'Temsili illüstrasyon: dumanlı gökyüzü altında ormanlık yamaçlar', en: 'Illustration: forested slopes under a smoky sky', ru: 'Иллюстрация: лесистые склоны под задымлённым небом' }],
  'surdurulebilir-orman-yonetimi': ['orman', { tr: 'Temsili illüstrasyon: sisli sabahta katman katman çam ormanı', en: 'Illustration: layered pine forest on a misty morning', ru: 'Иллюстрация: многоярусный сосновый лес туманным утром' }],
  'orman-peyzaj-restorasyonu': ['restorasyon', { tr: 'Temsili illüstrasyon: yeniden yeşeren tepeler', en: 'Illustration: hills turning green again', ru: 'Иллюстрация: вновь зеленеющие холмы' }],
  'cbs-ve-uzaktan-algilama': ['cbs', { tr: 'Temsili illüstrasyon: uydu, koordinat ızgarası ve eş yükselti eğrileri', en: 'Illustration: satellite, coordinate grid and contour lines', ru: 'Иллюстрация: спутник, координатная сетка и изолинии' }],
  'fidanlik-ve-agaclandirma': ['fidan', { tr: 'Temsili illüstrasyon: sıra sıra dikilmiş fidanlar', en: 'Illustration: rows of planted seedlings', ru: 'Иллюстрация: ряды посаженных саженцев' }],
  'iklim-degisikligi-ve-ormancilik': ['iklim', { tr: 'Temsili illüstrasyon: gün batımında ormanlık vadiler', en: 'Illustration: forested valleys at dusk', ru: 'Иллюстрация: лесные долины на закате' }],
}

const konular = await payload.find({ collection: 'training-topics', locale: 'tr', limit: 50, depth: 0 })
for (const [i, k] of (konular.docs as unknown as { id: number; slug: string; coverImage?: number }[]).entries()) {
  const [tema, alt] = KONU_TEMA[k.slug] ?? ['orman', KONU_TEMA['surdurulebilir-orman-yonetimi'][1]]
  if (!k.coverImage) {
    const id = await medya(`aiftc-konu-${k.slug}.jpg`, tema, 100 + i, alt)
    await guncelle('training-topics', k.id, 'tr', { coverImage: id })
  }
}
log('Eğitim konusu kapakları hazır.')

const programlar = await payload.find({ collection: 'training-programs', locale: 'tr', limit: 50, depth: 1 })
for (const [i, p] of (programlar.docs as unknown as { id: number; slug: string; coverImage?: unknown; topics?: { slug?: string }[] }[]).entries()) {
  if (p.coverImage) continue
  const konuSlug = p.topics?.[0]?.slug ?? ''
  const [tema, alt] = KONU_TEMA[konuSlug] ?? ['orman', KONU_TEMA['surdurulebilir-orman-yonetimi'][1]]
  const id = await medya(`aiftc-egitim-${p.id}.jpg`, tema, 200 + i, alt)
  await guncelle('training-programs', p.id, 'tr', { coverImage: id, featured: true })
}
log('Eğitim programı kapakları hazır; tüm programlar öne çıkarıldı.')

// ---------------------------------------------------------------------------
// 2. EK HABERLER VE DUYURULAR
// ---------------------------------------------------------------------------

type HaberSeed = {
  kind: 'news' | 'announcement'
  category: string
  featured: boolean
  publishedAt: string
  expiresAt?: string
  countries?: string[]
  tema: Tema
  alt: L
} & Record<Locale, { slug: string; title: string; summary: string; body: string[] }>

const HABERLER: HaberSeed[] = [
  {
    kind: 'announcement',
    category: 'announcement',
    featured: true,
    publishedAt: '2026-09-15T08:00:00.000Z',
    expiresAt: '2027-03-20T21:00:00.000Z',
    countries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    tema: 'yangin',
    alt: KONU_TEMA['entegre-orman-yangini-yonetimi'][1],
    tr: {
      slug: 'uluslararasi-entegre-yangin-yonetimi-egitimi-basvurulari-acildi',
      title: 'Uluslararası Entegre Yangın Yönetimi Eğitimi Başvuruları Açıldı',
      summary: 'Mayıs 2027’de düzenlenecek on iki günlük uluslararası eğitimin başvuruları katılımcı ülkelerin orman idareleri aracılığıyla alınıyor.',
      body: [
        'Merkezimizin 2027 yılının ilk uluslararası programı olan Uluslararası Entegre Yangın Yönetimi Eğitimi için başvurular açıldı. Eğitim, 10–21 Mayıs 2027 tarihleri arasında AIFTC kampüsü ve Düzlerçamı Uygulama Ormanı’nda yüz yüze yapılacak.',
        'Program; yangın davranışı, tehlike indeksleri, karar destek sistemleri, simülatör uygulamaları ve saha tatbikatlarını kapsıyor. Kontenjan 28 katılımcı ile sınırlıdır.',
        'Başvurular katılımcı ülkelerin orman idareleri aracılığıyla 20 Mart 2027’ye kadar yapılabilir. Bireysel başvuru kabul edilmemektedir.',
      ],
    },
    en: {
      slug: 'applications-open-international-integrated-fire-management',
      title: 'Applications Open for International Integrated Fire Management Course',
      summary: 'Applications for the twelve-day international course in May 2027 are accepted through the forest administrations of participating countries.',
      body: [
        'Applications are now open for the International Integrated Fire Management course, the centre’s first international programme of 2027. It will run in person from 10 to 21 May 2027 on the AIFTC campus and in the Düzlerçamı Training Forest.',
        'The programme covers fire behaviour, danger indices, decision support systems, simulator exercises and field drills. Places are limited to 28 participants.',
        'Applications must be submitted through national forest administrations by 20 March 2027. Individual applications are not accepted.',
      ],
    },
    ru: {
      slug: 'otkryt-priem-zayavok-na-kurs-po-integrirovannomu-upravleniyu-pozharami',
      title: 'Открыт приём заявок на международный курс по интегрированному управлению пожарами',
      summary: 'Заявки на двенадцатидневный международный курс в мае 2027 года принимаются через лесные ведомства стран-участниц.',
      body: [
        'Открыт приём заявок на международный курс по интегрированному управлению лесными пожарами — первую международную программу центра в 2027 году. Курс пройдёт очно с 10 по 21 мая 2027 года в кампусе AIFTC и учебном лесу Дюзлерчамы.',
        'Программа охватывает поведение пожара, индексы пожарной опасности, системы поддержки решений, тренажёрные упражнения и полевые учения. Количество мест ограничено — 28 участников.',
        'Заявки подаются через национальные лесные ведомства до 20 марта 2027 года. Индивидуальные заявки не принимаются.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'training',
    featured: true,
    publishedAt: '2026-09-05T10:00:00.000Z',
    countries: ['KZ', 'KG', 'UZ'],
    tema: 'cbs',
    alt: KONU_TEMA['cbs-ve-uzaktan-algilama'][1],
    tr: {
      slug: 'uzaktan-algilama-egitimi-tamamlandi',
      title: 'Uzaktan Algılama ile Orman İzleme Eğitimi Tamamlandı',
      summary: 'Kazakistan, Kırgızistan ve Özbekistan’dan katılımcılar, uydu verisiyle orman örtüsü değişimini izleme yöntemlerini uygulamalı olarak çalıştı.',
      body: [
        'Uzaktan Algılama ile Orman İzleme eğitimi, üç ülkeden gelen orman envanteri uzmanlarının katılımıyla tamamlandı. Katılımcılar açık erişimli uydu görüntüleriyle orman örtüsü değişimini haritalama üzerine çalıştı.',
        'Eğitimin son gününde her ülke ekibi, kendi ülkesinden seçtiği bir pilot alan için değişim analizi sundu. Çalışmalar, bölgesel veri paylaşımı için ortak bir yöntem önerisiyle sonuçlandı.',
      ],
    },
    en: {
      slug: 'remote-sensing-course-completed',
      title: 'Forest Monitoring with Remote Sensing Course Completed',
      summary: 'Participants from Kazakhstan, Kyrgyzstan and Uzbekistan practised methods for tracking forest cover change with satellite data.',
      body: [
        'The Forest Monitoring with Remote Sensing course has been completed with forest inventory specialists from three countries. Participants worked on mapping forest cover change using open-access satellite imagery.',
        'On the final day each country team presented a change analysis for a pilot area in their own country. The work concluded with a proposal for a shared regional data-exchange method.',
      ],
    },
    ru: {
      slug: 'zavershen-kurs-po-distantsionnomu-zondirovaniyu',
      title: 'Завершён курс «Мониторинг лесов с помощью дистанционного зондирования»',
      summary: 'Участники из Казахстана, Кыргызстана и Узбекистана отработали методы отслеживания изменений лесного покрова по спутниковым данным.',
      body: [
        'Курс «Мониторинг лесов с помощью дистанционного зондирования» завершился при участии специалистов по лесной инвентаризации из трёх стран. Участники картировали изменения лесного покрова по открытым спутниковым снимкам.',
        'В последний день каждая национальная команда представила анализ изменений для пилотного участка в своей стране. Итогом стало предложение общего метода регионального обмена данными.',
      ],
    },
  },
  {
    kind: 'announcement',
    category: 'announcement',
    featured: false,
    publishedAt: '2026-09-01T07:00:00.000Z',
    tema: 'kampus',
    alt: { tr: 'Temsili illüstrasyon: çam ağaçlarıyla çevrili kampüs binası', en: 'Illustration: campus building surrounded by pines', ru: 'Иллюстрация: здание кампуса в окружении сосен' },
    tr: {
      slug: 'kutuphane-ve-okuma-salonu-calisma-saatleri',
      title: 'Kütüphane ve Okuma Salonu Çalışma Saatleri Güncellendi',
      summary: 'Eğitim dönemi boyunca merkez kütüphanesi ve okuma salonu hafta içi 08.30–20.00 saatleri arasında katılımcılara açık olacak.',
      body: [
        'Eğitim dönemi boyunca merkez kütüphanesi ve okuma salonu hafta içi 08.30–20.00, cumartesi 10.00–16.00 saatleri arasında hizmet verecektir.',
        'Dijital kütüphane hizmete girdiğinde basılı koleksiyonun kataloğu da çevrim içi olarak erişilebilir olacaktır.',
      ],
    },
    en: {
      slug: 'library-and-reading-room-opening-hours',
      title: 'Library and Reading Room Opening Hours Updated',
      summary: 'During the training season the centre’s library and reading room will be open to participants on weekdays from 08:30 to 20:00.',
      body: [
        'During the training season the centre’s library and reading room will be open on weekdays from 08:30 to 20:00 and on Saturdays from 10:00 to 16:00.',
        'Once the digital library goes live, the catalogue of the printed collection will also be available online.',
      ],
    },
    ru: {
      slug: 'chasy-raboty-biblioteki-i-chitalnogo-zala',
      title: 'Обновлены часы работы библиотеки и читального зала',
      summary: 'В период обучения библиотека и читальный зал центра открыты для участников по будням с 08:30 до 20:00.',
      body: [
        'В период обучения библиотека и читальный зал центра работают по будням с 08:30 до 20:00, по субботам — с 10:00 до 16:00.',
        'После запуска цифровой библиотеки каталог печатного фонда также станет доступен онлайн.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'cooperation',
    featured: true,
    publishedAt: '2026-08-12T09:00:00.000Z',
    countries: ['TR', 'AZ', 'TJ', 'TM'],
    tema: 'restorasyon',
    alt: KONU_TEMA['orman-peyzaj-restorasyonu'][1],
    tr: {
      slug: 'orman-peyzaj-restorasyonu-saha-ziyareti',
      title: 'Orman Peyzaj Restorasyonu Katılımcıları Saha Çalışması Yaptı',
      summary: 'Eğitici eğitimi programının katılımcıları, yangın sonrası rehabilitasyon alanlarında toprak koruma ve dikim tekniklerini yerinde inceledi.',
      body: [
        'Orman Peyzaj Restorasyonu Eğitici Eğitimi programına katılan uzmanlar, Antalya’daki yangın sonrası rehabilitasyon alanlarında iki günlük saha çalışması yaptı.',
        'Katılımcılar; erozyon kontrol yapıları, doğal gençleştirme gözlemleri ve dikim sonrası izleme yöntemlerini yerinde inceledi. Edinilen deneyimler, katılımcıların kendi ülkelerinde düzenleyecekleri eğitimlerin içeriğine aktarılacak.',
      ],
    },
    en: {
      slug: 'forest-landscape-restoration-field-visit',
      title: 'Forest Landscape Restoration Participants Complete Field Study',
      summary: 'Participants of the training-of-trainers programme examined soil protection and planting techniques at post-fire rehabilitation sites.',
      body: [
        'Specialists attending the Forest Landscape Restoration Training of Trainers programme carried out a two-day field study at post-fire rehabilitation sites in Antalya.',
        'Participants examined erosion control structures, natural regeneration and post-planting monitoring methods on site. The experience will feed into the courses they will run in their own countries.',
      ],
    },
    ru: {
      slug: 'uchastniki-kursa-po-vosstanovleniyu-lesnyh-landshaftov-proveli-polevye-raboty',
      title: 'Участники курса по восстановлению лесных ландшафтов провели полевые работы',
      summary: 'Участники программы подготовки тренеров изучили методы защиты почв и посадки на участках послепожарной реабилитации.',
      body: [
        'Специалисты программы подготовки тренеров по восстановлению лесных ландшафтов провели двухдневные полевые работы на участках послепожарной реабилитации в Анталье.',
        'Участники на месте изучили противоэрозионные сооружения, естественное возобновление и методы мониторинга после посадки. Полученный опыт будет использован в курсах, которые они проведут в своих странах.',
      ],
    },
  },
]

// Haber kategorisi değerlerini şemadan doğrula; bilinmeyen değer 'news'e düşer.
const haberKategorileri = new Set(NEWS_CATEGORIES.map((o) => o.value))

for (const [i, h] of HABERLER.entries()) {
  if (await slugIle('news', h.tr.slug)) continue
  const kapak = await medya(`aiftc-haber-${h.tr.slug.slice(0, 40)}.jpg`, h.tema, 300 + i, h.alt)
  const kategori = haberKategorileri.has(h.category) ? h.category : [...haberKategorileri][0]
  const doc = (await payload.create({
    collection: 'news',
    locale: 'tr',
    ...CTX,
    data: {
      slug: h.tr.slug,
      title: h.tr.title,
      summary: h.tr.summary,
      content: richText(...h.tr.body),
      kind: h.kind,
      category: kategori,
      featured: h.featured,
      publishedAt: h.publishedAt,
      expiresAt: h.expiresAt,
      countries: h.countries,
      coverImage: kapak,
      _status: 'published',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('news', doc.id, dil, {
      slug: h[dil].slug,
      title: h[dil].title,
      summary: h[dil].summary,
      content: richText(...h[dil].body),
      _status: 'published',
    })
  log(`Haber eklendi: ${h.tr.title}`)
}

// Kapaksız eski haberlere kapak
const HABER_TEMALARI: Tema[] = ['toplanti', 'fidan', 'kampus', 'toplanti', 'simulasyon']
const haberler = await payload.find({ collection: 'news', locale: 'tr', limit: 100, depth: 0, sort: 'createdAt' })
for (const [i, n] of (haberler.docs as unknown as { id: number; slug: string; title: string; coverImage?: number }[]).entries()) {
  if (n.coverImage) continue
  const tema = HABER_TEMALARI[i % HABER_TEMALARI.length]
  const alt: L = {
    tr: `Temsili illüstrasyon: ${n.title}`,
    en: 'Representative illustration for the news item',
    ru: 'Иллюстрация к новости',
  }
  const id = await medya(`aiftc-haber-${n.slug.slice(0, 40)}.jpg`, tema, 400 + i, alt)
  await guncelle('news', n.id, 'tr', { coverImage: id })
}
log('Haber kapakları hazır.')

// ---------------------------------------------------------------------------
// 3. ÖRNEK EĞİTİM (AIFTC-IFM-2027-01) — EN/RU ÇEVİRİSİ
// ---------------------------------------------------------------------------

const ornekEgitim = await slugIle('training-programs', 'uluslararasi-entegre-yangin-yonetimi')
if (ornekEgitim) {
  const mevcut = (await payload.findByID({ collection: 'training-programs', id: ornekEgitim, locale: 'en', fallbackLocale: false as never, depth: 0 })) as { slug?: string }
  if (!mevcut.slug) {
    const EGITIM: Record<'en' | 'ru', Record<string, unknown>> = {
      en: {
        slug: 'international-integrated-fire-management',
        title: 'International Integrated Fire Management',
        summary: 'A two-week international course treating prevention, preparedness, response and recovery as a single management cycle, supported by decision support systems and simulator exercises.',
        venue: 'AIFTC Campus, Simulation Centre and Düzlerçamı Training Forest, Antalya',
        targetAudience: 'Mid- and senior-level technical staff who dispatch fire response teams in the forest administrations of Central Asia and neighbouring countries; fire operations centre officers.',
        objective: richText(
          'The course enables participants to treat forest fire not merely as an incident but as an integrated management cycle of risk reduction, preparedness, response and recovery.',
          'By the end of the programme participants should be able to interpret decision support outputs in their own operations centres and apply regional cooperation protocols.',
        ),
        learningOutcomes: [
          { text: 'Distinguishes meteorological and topographic factors that drive fire behaviour.' },
          { text: 'Reads fire danger indices and sets the daily preparedness level.' },
          { text: 'Turns decision support outputs into dispatch decisions.' },
          { text: 'Applies radio communication protocols between air and ground crews.' },
          { text: 'Carries out post-fire damage assessment and restoration prioritisation.' },
          { text: 'Assesses regional mutual assistance mechanisms for their own country.' },
        ],
        assessmentMethod: richText(
          'Assessment has three components: attendance at lectures and field exercises (30%), a group project presentation (35%) and a written exam (35%).',
          'The pass mark is 70 out of 100. Participants attending less than 80% of field exercises are not assessed.',
        ),
        certificateConditions: richText(
          'A Certificate of Attendance is issued to all participants attending at least 80% of the programme.',
          'The Certificate of Achievement additionally requires an assessment average of 70 or above. It bears the joint logos of the General Directorate of Forestry and FAO.',
        ),
        applicationRequirements: richText(
          'Applications are made through the forest administrations of participating countries; individual applications are not accepted.',
          'Candidates need at least three years of field experience and a working command of English or Turkish.',
        ),
      },
      ru: {
        slug: 'mezhdunarodnoe-integrirovannoe-upravlenie-pozharami',
        title: 'Международное интегрированное управление пожарами',
        summary: 'Двухнедельный международный курс, рассматривающий профилактику, готовность, реагирование и восстановление как единый цикл управления, с системами поддержки решений и тренажёрными упражнениями.',
        venue: 'Кампус AIFTC, Центр моделирования и учебный лес Дюзлерчамы, Анталья',
        targetAudience: 'Технический персонал среднего и высшего звена лесных ведомств Центральной Азии и соседних стран, направляющий команды реагирования на пожары; сотрудники оперативных центров.',
        objective: richText(
          'Цель курса — научить участников рассматривать лесной пожар не только как инцидент, а как целостный цикл управления: снижение риска, готовность, реагирование и восстановление.',
          'По итогам программы участники смогут интерпретировать данные систем поддержки решений в своих оперативных центрах и применять протоколы регионального сотрудничества.',
        ),
        learningOutcomes: [
          { text: 'Различает метеорологические и топографические факторы поведения пожара.' },
          { text: 'Читает индексы пожарной опасности и определяет суточный уровень готовности.' },
          { text: 'Преобразует выводы системы поддержки решений в решения о направлении сил.' },
          { text: 'Применяет протокол радиосвязи между авиационными и наземными командами.' },
          { text: 'Проводит оценку ущерба после пожара и определяет приоритеты восстановления.' },
          { text: 'Оценивает региональные механизмы взаимопомощи для своей страны.' },
        ],
        assessmentMethod: richText(
          'Оценка состоит из трёх компонентов: посещаемость занятий и полевых упражнений (30%), презентация группового проекта (35%) и письменный экзамен (35%).',
          'Проходной балл — 70 из 100. Участники, посетившие менее 80% полевых занятий, к оценке не допускаются.',
        ),
        certificateConditions: richText(
          'Свидетельство об участии выдаётся всем, кто посетил не менее 80% программы.',
          'Для сертификата об успешном окончании дополнительно требуется средний балл не ниже 70. Сертификат оформляется с логотипами Генерального управления лесного хозяйства и ФАО.',
        ),
        applicationRequirements: richText(
          'Заявки подаются через лесные ведомства стран-участниц; индивидуальные заявки не принимаются.',
          'Кандидаты должны иметь не менее трёх лет полевого опыта и рабочее владение английским или турецким языком.',
        ),
      },
    }
    for (const dil of ['en', 'ru'] as const) {
      await guncelle('training-programs', ornekEgitim, dil, { ...EGITIM[dil], _status: 'published' })
      await diziCevir('training-programs', ornekEgitim, 'trainers', dil, (_s, i) => ({
        titleAndRole: dil === 'en'
          ? ['Fire operations specialist', 'Integrated fire management adviser'][i]
          : ['Специалист по пожарным операциям', 'Консультант по интегрированному управлению пожарами'][i],
      }))
    }
    log('Örnek eğitim EN/RU çevirileri yazıldı.')
  }
}

// ---------------------------------------------------------------------------
// 4. ANA PROJE — EN/RU, ortaklar
// ---------------------------------------------------------------------------

const projeId = await slugIle('projects', 'gcp-sec-024-tur')
if (projeId) {
  const en = (await payload.findByID({ collection: 'projects', id: projeId, locale: 'en', fallbackLocale: false as never, depth: 0 })) as { slug?: string }
  if (!en.slug) {
    await guncelle('projects', projeId, 'tr', {
      nationalCounterpart: 'T.C. Tarım ve Orman Bakanlığı — Orman Genel Müdürlüğü',
      partners: [
        { name: 'Birleşmiş Milletler Gıda ve Tarım Örgütü (FAO)', url: 'https://www.fao.org' },
        { name: 'Orman Genel Müdürlüğü (OGM)', url: 'https://www.ogm.gov.tr' },
      ],
      objective: richText(
        'Projenin amacı, Antalya Uluslararası Ormancılık Eğitim Merkezinin Orta Asya ve komşu ülkelere yönelik eğitim kapasitesini güçlendirmek; yangın yönetimi, sürdürülebilir orman yönetimi ve restorasyon alanlarında bölgesel bir mükemmeliyet merkezi hâline gelmesini desteklemektir.',
      ),
      capacityStatement: richText(
        'Proje kapsamında eğitim programları yeniden tasarlanmış, simülasyon merkezi karar destek sistemleriyle donatılmış ve üç dilde hizmet veren dijital altyapı kurulmuştur.',
      ),
    })
    const PROJE = {
      en: {
        slug: 'gcp-sec-024-tur',
        title: 'Strengthening the Capacity of the International Forestry Training Centre',
        nationalCounterpart: 'Ministry of Agriculture and Forestry — General Directorate of Forestry',
        objective: richText('The project aims to strengthen the training capacity of the Antalya International Forestry Training Centre for Central Asia and neighbouring countries and to support its development into a regional centre of excellence in fire management, sustainable forest management and restoration.'),
        capacityStatement: richText('Under the project, training programmes have been redesigned, the simulation centre has been equipped with decision support systems and a trilingual digital infrastructure has been established.'),
        partners: ['Food and Agriculture Organization of the United Nations (FAO)', 'General Directorate of Forestry (OGM)'],
      },
      ru: {
        slug: 'gcp-sec-024-tur',
        title: 'Укрепление потенциала Международного учебного центра лесного хозяйства',
        nationalCounterpart: 'Министерство сельского и лесного хозяйства — Генеральное управление лесного хозяйства',
        objective: richText('Цель проекта — укрепить учебный потенциал Анталийского международного учебного центра лесного хозяйства для стран Центральной Азии и соседних стран и поддержать его становление как регионального центра передового опыта в области управления пожарами, устойчивого лесопользования и восстановления.'),
        capacityStatement: richText('В рамках проекта обновлены учебные программы, центр моделирования оснащён системами поддержки решений и создана трёхъязычная цифровая инфраструктура.'),
        partners: ['Продовольственная и сельскохозяйственная организация ООН (ФАО)', 'Генеральное управление лесного хозяйства (OGM)'],
      },
    }
    /* Ortak adı dile bağlı VE zorunlu: satırlar adlarıyla birlikte aynı
       güncellemede gönderilmezse EN/RU doğrulaması düşer. */
    const trProje = (await payload.findByID({ collection: 'projects', id: projeId, locale: 'tr', depth: 0 })) as {
      partners?: Record<string, unknown>[]
    }
    for (const dil of ['en', 'ru'] as const) {
      const { partners, ...rest } = PROJE[dil]
      await guncelle('projects', projeId, dil, {
        ...rest,
        partners: (trProje.partners ?? []).map((s, i) => ({ ...s, name: partners[i] })),
        _status: 'published',
      })
    }
    log('Ana proje EN/RU ve ortaklar yazıldı.')
  }
}

// ---------------------------------------------------------------------------
// 5. SİTE AYARLARI VE ANA SAYFA
// ---------------------------------------------------------------------------

const heroId = await medya('aiftc-anasayfa-hero.jpg', 'orman', 7, {
  tr: 'Temsili illüstrasyon: sabah ışığında Toros eteklerindeki çam ormanları',
  en: 'Illustration: pine forests on the Taurus foothills in morning light',
  ru: 'Иллюстрация: сосновые леса у подножия Тавра в утреннем свете',
})
await payload.updateGlobal({ slug: 'homepage', locale: 'tr', ...CTX, data: { hero: { backgroundImage: heroId } } as never })

const ogId = await medya('aiftc-paylasim-gorseli.jpg', 'orman', 8, {
  tr: 'Temsili illüstrasyon: ormanlık vadi', en: 'Illustration: forested valley', ru: 'Иллюстрация: лесная долина',
})

const AYAR: L<{ adres: string; tarif: string[]; beyan: string; cerez: string }> = {
  tr: {
    adres: 'Antalya Uluslararası Ormancılık Eğitim Merkezi, Antalya, Türkiye',
    tarif: [
      'Antalya Havalimanı’ndan merkeze kara yoluyla yaklaşık 30 dakikada ulaşılır. Uluslararası katılımcılar için eğitim dönemlerinde havalimanı transferi sağlanır.',
      'Harita konumu yaklaşık Antalya merkez koordinatıdır; kurumun kesin konumu ile güncellenmelidir.',
    ],
    beyan: 'Bu web sitesi, FAO ve T.C. Tarım ve Orman Bakanlığı Orman Genel Müdürlüğü iş birliğinde yürütülen GCP/SEC/024/TUR projesi kapsamında geliştirilmiştir. İçerik FAO’nun görüşlerini yansıtmak zorunda değildir.',
    cerez: 'Bu site, yalnızca çalışması için gerekli çerezleri kullanır. Ziyaret istatistikleri için onayınızı istiyoruz.',
  },
  en: {
    adres: 'Antalya International Forestry Training Centre, Antalya, Türkiye',
    tarif: [
      'The centre is about 30 minutes by road from Antalya Airport. Airport transfers are provided for international participants during training periods.',
      'The map pin shows approximate Antalya city-centre coordinates and should be updated with the exact location.',
    ],
    beyan: 'This website was developed under project GCP/SEC/024/TUR, implemented in cooperation between FAO and the General Directorate of Forestry of the Republic of Türkiye. Its content does not necessarily reflect the views of FAO.',
    cerez: 'This site uses only the cookies it needs to work. We ask for your consent to collect visit statistics.',
  },
  ru: {
    adres: 'Анталийский международный учебный центр лесного хозяйства, Анталья, Турция',
    tarif: [
      'От аэропорта Антальи до центра около 30 минут на автомобиле. Для иностранных участников в период обучения организуется трансфер из аэропорта.',
      'Метка на карте указывает приблизительные координаты центра Антальи и должна быть уточнена.',
    ],
    beyan: 'Сайт разработан в рамках проекта GCP/SEC/024/TUR, реализуемого ФАО совместно с Генеральным управлением лесного хозяйства Турецкой Республики. Содержание не обязательно отражает точку зрения ФАО.',
    cerez: 'Сайт использует только необходимые для работы файлы cookie. Для сбора статистики посещений мы просим ваше согласие.',
  },
}

const gizlilikSayfasi = await slugIle('pages', 'gizlilik-ilkeleri')
const kvkkSayfasi = await slugIle('pages', 'kvkk-aydinlatma-metni')

for (const dil of DILLER) {
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: dil,
    ...CTX,
    data: {
      ...(dil === 'tr'
        ? {
            logos: { ogImage: ogId },
            primaryProject: projeId,
            privacyNoticePage: kvkkSayfasi,
            analytics: { enabled: false, anonymizeIp: true, requiresConsent: true },
          }
        : {}),
      contact: {
        address: AYAR[dil].adres,
        email: 'bilgi@aiftc.org',
        map: { latitude: 36.8969, longitude: 30.7133, directions: richText(...AYAR[dil].tarif) },
      },
      visibilityStatement: richText(AYAR[dil].beyan),
      cookieBanner: { enabled: true, text: AYAR[dil].cerez, allowPreferenceManagement: true, ...(dil === 'tr' ? { policyPage: gizlilikSayfasi } : {}) },
    } as never,
  })
}
log('Site ayarları (iletişim, harita, görünürlük beyanı, çerez bandı) yazıldı.')

// ---------------------------------------------------------------------------
// 6. SIK SORULAN SORULAR
// ---------------------------------------------------------------------------

type SssSeed = { group: string; order: number } & L<{ q: string; a: string[] }>

const SSS: SssSeed[] = [
  {
    group: 'applications', order: 10,
    tr: { q: 'Eğitimlere nasıl başvurabilirim?', a: ['Uluslararası eğitimlere başvurular, katılımcı ülkelerin orman idareleri aracılığıyla yapılır. Her eğitimin sayfasında başvuru koşulları ve son başvuru tarihi yer alır.'] },
    en: { q: 'How can I apply for a course?', a: ['Applications for international courses are made through the forest administrations of participating countries. Each course page lists the requirements and the application deadline.'] },
    ru: { q: 'Как подать заявку на обучение?', a: ['Заявки на международные курсы подаются через лесные ведомства стран-участниц. Требования и сроки указаны на странице каждого курса.'] },
  },
  {
    group: 'languages', order: 20,
    tr: { q: 'Eğitimler hangi dillerde veriliyor?', a: ['Eğitimler Türkçe, İngilizce veya Rusça verilir. Eğitim dili her programın sayfasında belirtilir; gerektiğinde ardıl veya simültane çeviri sağlanır.'] },
    en: { q: 'In which languages are courses delivered?', a: ['Courses are delivered in Turkish, English or Russian. The language is stated on each course page; consecutive or simultaneous interpretation is provided where needed.'] },
    ru: { q: 'На каких языках проводится обучение?', a: ['Обучение проводится на турецком, английском или русском языке. Язык указан на странице каждого курса; при необходимости обеспечивается последовательный или синхронный перевод.'] },
  },
  {
    group: 'certificates', order: 30,
    tr: { q: 'Eğitim sonunda belge veriliyor mu?', a: ['Evet. Programın en az %80’ine katılanlara Katılım Belgesi verilir. Değerlendirmeli programlarda başarı koşulunu sağlayanlar Başarı Sertifikası alır.'] },
    en: { q: 'Is a certificate issued at the end of a course?', a: ['Yes. A Certificate of Attendance is issued to those attending at least 80% of the programme. In assessed courses, participants meeting the pass criteria receive a Certificate of Achievement.'] },
    ru: { q: 'Выдаётся ли документ по окончании обучения?', a: ['Да. Посетившим не менее 80% программы выдаётся свидетельство об участии. В курсах с оценкой успешно сдавшие получают сертификат об успешном окончании.'] },
  },
  {
    group: 'accommodation', order: 40,
    tr: { q: 'Konaklama nasıl sağlanıyor?', a: ['Uluslararası katılımcılar eğitim süresince merkezin kampüsündeki konukevinde konaklar. Konaklama ve yemek giderleri program kapsamında karşılanır.'] },
    en: { q: 'How is accommodation arranged?', a: ['International participants stay at the guesthouse on the centre’s campus for the duration of the course. Accommodation and meals are covered by the programme.'] },
    ru: { q: 'Как организовано проживание?', a: ['Иностранные участники проживают в гостевом доме на территории кампуса центра. Расходы на проживание и питание покрываются программой.'] },
  },
  {
    group: 'materials', order: 50,
    tr: { q: 'Eğitim materyallerine sonradan erişebilir miyim?', a: ['Sunumlar ve okuma materyalleri eğitim sonunda katılımcılarla paylaşılır. Dijital kütüphane hizmete girdiğinde materyaller katılımcı erişimiyle çevrim içi sunulacaktır.'] },
    en: { q: 'Can I access training materials afterwards?', a: ['Presentations and reading materials are shared with participants at the end of the course. Once the digital library is live, materials will be available online with participant access.'] },
    ru: { q: 'Смогу ли я получить учебные материалы после курса?', a: ['Презентации и материалы для чтения передаются участникам по окончании курса. После запуска цифровой библиотеки материалы будут доступны онлайн для участников.'] },
  },
  {
    group: 'format', order: 60,
    tr: { q: 'Çevrim içi veya karma eğitim var mı?', a: ['Evet. Bazı programlar çevrim içi ya da karma (hibrit) biçimde yürütülür. Çevrim içi oturumlar merkezin sanal sınıfları üzerinden yapılır; katılım bilgileri yalnızca kayıtlı katılımcılarla paylaşılır.'] },
    en: { q: 'Are there online or blended courses?', a: ['Yes. Some programmes run online or in a blended (hybrid) format. Online sessions take place in the centre’s virtual classrooms; joining details are shared only with registered participants.'] },
    ru: { q: 'Есть ли онлайн или смешанные курсы?', a: ['Да. Некоторые программы проводятся онлайн или в смешанном формате. Онлайн-занятия проходят в виртуальных классах центра; данные для подключения сообщаются только зарегистрированным участникам.'] },
  },
  {
    group: 'simulation', order: 70,
    tr: { q: 'Simülasyon merkezinde neler yapılıyor?', a: ['Simülasyon merkezinde yangın harekât ve karar destek sistemleriyle senaryo tabanlı uygulamalar yapılır. Katılımcılar gerçek zamanlı sevk kararlarını güvenli bir ortamda deneyimler.'] },
    en: { q: 'What happens in the simulation centre?', a: ['The simulation centre runs scenario-based exercises with fire operations and decision support systems. Participants practise real-time dispatch decisions in a safe environment.'] },
    ru: { q: 'Чем занимаются в центре моделирования?', a: ['В центре моделирования проводятся сценарные упражнения с системами управления пожарными операциями и поддержки решений. Участники отрабатывают решения о направлении сил в реальном времени в безопасной среде.'] },
  },
  {
    group: 'contact', order: 80,
    tr: { q: 'Sorularım için kiminle iletişime geçebilirim?', a: ['İletişim sayfasındaki formu kullanabilir veya bilgi@aiftc.org adresine yazabilirsiniz. Başvuru süreçleriyle ilgili sorular için ülkenizin orman idaresindeki irtibat kişisiyle de görüşebilirsiniz.'] },
    en: { q: 'Whom can I contact with questions?', a: ['Use the form on the contact page or write to bilgi@aiftc.org. For application questions you can also contact the focal point at your national forest administration.'] },
    ru: { q: 'Куда обращаться с вопросами?', a: ['Воспользуйтесь формой на странице контактов или напишите на bilgi@aiftc.org. По вопросам заявок также можно обратиться к контактному лицу в лесном ведомстве вашей страны.'] },
  },
]

const sssIdleri: number[] = []
for (const s of SSS) {
  const var_ = await payload.find({ collection: 'faqs', locale: 'tr', where: { question: { equals: s.tr.q } }, limit: 1, depth: 0 })
  if (var_.docs[0]) {
    sssIdleri.push((var_.docs[0] as { id: number }).id)
    continue
  }
  const doc = (await payload.create({
    collection: 'faqs',
    locale: 'tr',
    ...CTX,
    data: { question: s.tr.q, answer: richText(...s.tr.a), group: s.group, order: s.order, _status: 'published' } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('faqs', doc.id, dil, { question: s[dil].q, answer: richText(...s[dil].a), _status: 'published' })
  sssIdleri.push(doc.id)
}
log(`SSS hazır (${sssIdleri.length} soru).`)

// ---------------------------------------------------------------------------
// 7. SİTE BELGELERİ (PDF)
// ---------------------------------------------------------------------------

type BelgeSeed = { dosya: string; documentType: string; satirlar: string[]; title: L; description: L }

const BELGELER: BelgeSeed[] = [
  {
    dosya: 'aiftc-ifm-2027-program.pdf', documentType: 'programme',
    satirlar: ['Uluslararasi Entegre Yangin Yonetimi - Egitim Programi', 'Tarih: 10-21 Mayis 2027 | Yer: AIFTC Kampusu, Antalya', 'Gun 1: Yangin yonetimi dongusu', 'Gun 3: Yangin davranisi ve tehlike indeksleri', 'Gun 6: Karar destek ve simulasyon', 'Gun 9: Saha uygulamasi', 'Gun 12: Degerlendirme ve kapanis'],
    title: { tr: 'Uluslararası Entegre Yangın Yönetimi — Program Akışı', en: 'International Integrated Fire Management — Programme Outline', ru: 'Международное интегрированное управление пожарами — программа' },
    description: { tr: 'Günlük oturum planı ve değerlendirme ölçütleri.', en: 'Daily session plan and assessment criteria.', ru: 'Ежедневный план занятий и критерии оценки.' },
  },
  {
    dosya: 'aiftc-basvuru-formu.pdf', documentType: 'form',
    satirlar: ['Egitim Basvuru Formu', '1. Aday bilgileri (ad soyad, kurum, gorev)', '2. Egitim bilgileri (program kodu, donem)', '3. Dil yeterliligi', '4. Kurum onayi (imza ve muhur)', 'Form, ulkenin orman idaresi araciligiyla iletilir.'],
    title: { tr: 'Eğitim Başvuru Formu Şablonu', en: 'Training Application Form Template', ru: 'Шаблон заявки на обучение' },
    description: { tr: 'Orman idareleri aracılığıyla iletilecek başvuru formu.', en: 'Application form to be submitted via forest administrations.', ru: 'Форма заявки, подаваемая через лесные ведомства.' },
  },
  {
    dosya: 'aiftc-katilimci-rehberi.pdf', documentType: 'guide',
    satirlar: ['Uluslararasi Katilimci Rehberi', 'Vize ve seyahat', 'Antalya\'ya varis ve havalimani transferi', 'Konaklama ve yemek', 'Egitim dili ve ceviri', 'Iletisim ve acil durum bilgileri'],
    title: { tr: 'Uluslararası Katılımcı Rehberi (Broşür)', en: 'International Participant Guide (Brochure)', ru: 'Памятка для иностранных участников (брошюра)' },
    description: { tr: 'Vize, ulaşım, konaklama ve pratik bilgiler.', en: 'Visa, travel, accommodation and practical information.', ru: 'Виза, проезд, проживание и практическая информация.' },
  },
  {
    dosya: 'aiftc-2026-faaliyet-ozeti.pdf', documentType: 'report',
    satirlar: ['2026 Faaliyet Ozeti', 'Duzenlenen egitim programi: 7', 'Katilimci ulke sayisi: 7', 'Simulasyon merkezi uygulama saati: temsili', 'Proje: GCP/SEC/024/TUR'],
    title: { tr: '2026 Faaliyet Özeti', en: '2026 Activity Summary', ru: 'Обзор деятельности за 2026 год' },
    description: { tr: 'Yılın eğitim ve iş birliği faaliyetlerinin özeti.', en: 'Summary of the year’s training and cooperation activities.', ru: 'Краткий обзор учебной деятельности и сотрудничества за год.' },
  },
  {
    dosya: 'aiftc-yangin-tehlike-indeksleri.pdf', documentType: 'guide',
    satirlar: ['Orman Yangini Tehlike Indeksleri - Teknik Rehber', '1. Meteorolojik girdiler', '2. Yakit nemi kodlari', '3. Gunluk hazirlik seviyesinin belirlenmesi', '4. Indekslerin sevk kararina donusturulmesi'],
    title: { tr: 'Orman Yangını Tehlike İndeksleri — Teknik Rehber', en: 'Forest Fire Danger Indices — Technical Guide', ru: 'Индексы лесной пожарной опасности — техническое руководство' },
    description: { tr: 'Tehlike indekslerinin hesaplanması ve yorumlanması.', en: 'Calculating and interpreting danger indices.', ru: 'Расчёт и интерпретация индексов опасности.' },
  },
]

const belgeIdleri: Record<string, number> = {}
for (const b of BELGELER) {
  const var_ = await payload.find({ collection: 'document-files', where: { filename: { equals: b.dosya } }, limit: 1, depth: 0 })
  if (var_.docs[0]) {
    belgeIdleri[b.dosya] = (var_.docs[0] as { id: number }).id
    continue
  }
  const doc = (await payload.create({
    collection: 'document-files',
    locale: 'tr',
    ...CTX,
    filePath: pdfUret(b.dosya, b.title.tr, b.satirlar),
    data: {
      title: b.title.tr,
      description: b.description.tr,
      documentType: b.documentType,
      language: ['tr'],
      version: '1.0',
      accessLevel: 'public',
      copyrightHolder: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('document-files', doc.id, dil, { title: b.title[dil], description: b.description[dil] })
  belgeIdleri[b.dosya] = doc.id
}
log(`Site belgeleri hazır (${Object.keys(belgeIdleri).length} PDF).`)

if (ornekEgitim)
  await guncelle('training-programs', ornekEgitim, 'tr', {
    attachments: [belgeIdleri['aiftc-ifm-2027-program.pdf'], belgeIdleri['aiftc-basvuru-formu.pdf']],
  })

// ---------------------------------------------------------------------------
// 8. ULUSLARARASI KATILIMCI REHBERİ
// ---------------------------------------------------------------------------

type RehberSeed = { sectionKey: string; order: number; tema?: Tema } & L<{ slug: string; title: string; summary: string; body: string[] }>

const REHBER: RehberSeed[] = [
  {
    sectionKey: 'about-centre', order: 10, tema: 'kampus',
    tr: { slug: 'merkez-hakkinda', title: 'Merkez Hakkında', summary: 'AIFTC, Orta Asya ve komşu ülkelerin ormancılık personeline yönelik uluslararası eğitimler düzenler.', body: ['Antalya Uluslararası Ormancılık Eğitim Merkezi, Orman Genel Müdürlüğü bünyesinde, FAO ile iş birliği içinde uluslararası eğitim programları yürütür.', 'Kampüste derslikler, simülasyon merkezi, kütüphane, konukevi ve uygulama ormanı bulunur.'] },
    en: { slug: 'about-the-centre', title: 'About the Centre', summary: 'AIFTC runs international courses for forestry staff from Central Asia and neighbouring countries.', body: ['The Antalya International Forestry Training Centre operates under the General Directorate of Forestry and runs international training programmes in cooperation with FAO.', 'The campus includes classrooms, a simulation centre, a library, a guesthouse and a training forest.'] },
    ru: { slug: 'o-tsentre-dlya-uchastnikov', title: 'О центре', summary: 'AIFTC проводит международные курсы для специалистов лесного хозяйства Центральной Азии и соседних стран.', body: ['Анталийский международный учебный центр лесного хозяйства работает в составе Генерального управления лесного хозяйства и проводит международные программы в сотрудничестве с ФАО.', 'На территории кампуса расположены учебные аудитории, центр моделирования, библиотека, гостевой дом и учебный лес.'] },
  },
  {
    sectionKey: 'visa', order: 20,
    tr: { slug: 'vize', title: 'Vize', summary: 'Vize gerekliliği uyruğa göre değişir; davet mektubu merkez tarafından düzenlenir.', body: ['Katılımcı ülkelerin bir kısmının vatandaşları Türkiye’ye vizesiz giriş yapabilir. Vize gereken durumlarda merkez, başvuru için resmî davet mektubu düzenler.', 'Güncel vize bilgisi için Türkiye Cumhuriyeti Dışişleri Bakanlığı’nın resmî kaynakları esas alınmalıdır.'] },
    en: { slug: 'visa', title: 'Visa', summary: 'Visa requirements depend on nationality; the centre issues invitation letters.', body: ['Citizens of some participating countries can enter Türkiye visa-free. Where a visa is required, the centre issues an official invitation letter for the application.', 'Always check the official sources of the Ministry of Foreign Affairs of the Republic of Türkiye for current visa rules.'] },
    ru: { slug: 'viza', title: 'Виза', summary: 'Визовые требования зависят от гражданства; центр оформляет письмо-приглашение.', body: ['Граждане ряда стран-участниц могут въезжать в Турцию без визы. Если виза нужна, центр оформляет официальное письмо-приглашение.', 'Актуальные визовые правила уточняйте в официальных источниках МИД Турецкой Республики.'] },
  },
  {
    sectionKey: 'arrival-antalya', order: 30, tema: 'sahil',
    tr: { slug: 'antalyaya-varis', title: 'Antalya’ya Varış', summary: 'Antalya Havalimanı’na uluslararası ve iç hat bağlantılarıyla ulaşılabilir.', body: ['Antalya Havalimanı, İstanbul üzerinden ve doğrudan uluslararası seferlerle bölgeye bağlıdır.', 'Uçuş bilgilerinizi eğitim başlamadan en az bir hafta önce merkeze iletmeniz, transfer planlaması için gereklidir.'] },
    en: { slug: 'arriving-in-antalya', title: 'Arriving in Antalya', summary: 'Antalya Airport is served by international and domestic connections.', body: ['Antalya Airport has direct international flights as well as connections via Istanbul.', 'Please send your flight details to the centre at least one week before the course starts so that transfers can be arranged.'] },
    ru: { slug: 'pribytie-v-antalyu', title: 'Прибытие в Анталью', summary: 'Аэропорт Антальи обслуживает международные и внутренние рейсы.', body: ['В аэропорт Антальи летают прямые международные рейсы, а также рейсы с пересадкой в Стамбуле.', 'Сообщите данные о перелёте в центр не позднее чем за неделю до начала курса для организации трансфера.'] },
  },
  {
    sectionKey: 'accommodation', order: 40,
    tr: { slug: 'konaklama', title: 'Konaklama', summary: 'Katılımcılar kampüsteki konukevinde tek kişilik odalarda konaklar.', body: ['Konukevi odalarında internet erişimi, çalışma masası ve banyo bulunur. Kahvaltı, öğle ve akşam yemekleri kampüs yemekhanesinde verilir.', 'Özel beslenme ihtiyaçlarınızı başvuru sırasında bildirmeniz rica olunur.'] },
    en: { slug: 'accommodation', title: 'Accommodation', summary: 'Participants stay in single rooms at the campus guesthouse.', body: ['Guesthouse rooms have internet access, a desk and a private bathroom. Breakfast, lunch and dinner are served in the campus dining hall.', 'Please state any dietary requirements in your application.'] },
    ru: { slug: 'prozhivanie', title: 'Проживание', summary: 'Участники размещаются в одноместных номерах гостевого дома кампуса.', body: ['В номерах есть интернет, рабочий стол и собственная ванная комната. Завтрак, обед и ужин подаются в столовой кампуса.', 'Просим сообщить об особых требованиях к питанию при подаче заявки.'] },
  },
  {
    sectionKey: 'language', order: 50,
    tr: { slug: 'egitim-dili', title: 'Eğitim Dili ve Çeviri', summary: 'Eğitimler Türkçe, İngilizce veya Rusça yürütülür.', body: ['Her programın eğitim dili kendi sayfasında belirtilir. Çok dilli gruplarda ardıl ya da simültane çeviri sağlanır.', 'Eğitim materyalleri mümkün olduğunca üç dilde hazırlanır.'] },
    en: { slug: 'language-of-instruction', title: 'Language and Interpretation', summary: 'Courses are delivered in Turkish, English or Russian.', body: ['The language of each programme is stated on its page. Consecutive or simultaneous interpretation is provided for multilingual groups.', 'Training materials are prepared in all three languages wherever possible.'] },
    ru: { slug: 'yazyk-obucheniya', title: 'Язык обучения и перевод', summary: 'Курсы проводятся на турецком, английском или русском языке.', body: ['Язык каждой программы указан на её странице. Для многоязычных групп обеспечивается последовательный или синхронный перевод.', 'Учебные материалы по возможности готовятся на трёх языках.'] },
  },
  {
    sectionKey: 'certificate', order: 60,
    tr: { slug: 'sertifika', title: 'Sertifika', summary: 'Katılım ve başarı koşullarını sağlayan katılımcılara belge verilir.', body: ['Katılım Belgesi, programın en az %80’ine katılan herkese verilir. Değerlendirmeli programlarda Başarı Sertifikası için ayrıca başarı eşiği aranır.', 'Belgeler OGM ve FAO ortak logolarıyla düzenlenir.'] },
    en: { slug: 'certificate', title: 'Certificates', summary: 'Certificates are issued to participants meeting attendance and assessment criteria.', body: ['A Certificate of Attendance is issued to everyone attending at least 80% of the programme. Assessed programmes also require the pass mark for a Certificate of Achievement.', 'Certificates carry the joint logos of OGM and FAO.'] },
    ru: { slug: 'sertifikat', title: 'Сертификаты', summary: 'Документы выдаются участникам, выполнившим требования по посещаемости и оценке.', body: ['Свидетельство об участии выдаётся всем, кто посетил не менее 80% программы. Для сертификата об успешном окончании в курсах с оценкой требуется проходной балл.', 'Документы оформляются с логотипами OGM и ФАО.'] },
  },
]

const rehberBelgesi = belgeIdleri['aiftc-katilimci-rehberi.pdf']
for (const [i, r] of REHBER.entries()) {
  if (await slugIle('international-guide', r.tr.slug)) continue
  const gorsel = r.tema
    ? await medya(`aiftc-rehber-${r.tr.slug}.jpg`, r.tema, 500 + i, {
        tr: `Temsili illüstrasyon: ${r.tr.title}`,
        en: `Illustration: ${r.en.title}`,
        ru: `Иллюстрация: ${r.ru.title}`,
      })
    : undefined
  const doc = (await payload.create({
    collection: 'international-guide',
    locale: 'tr',
    ...CTX,
    data: {
      slug: r.tr.slug,
      sectionKey: r.sectionKey,
      order: r.order,
      title: r.tr.title,
      summary: r.tr.summary,
      content: richText(...r.tr.body),
      countries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
      ...(gorsel ? { image: gorsel } : {}),
      ...(rehberBelgesi ? { attachments: [rehberBelgesi] } : {}),
      relatedFaqs: sssIdleri.slice(0, 3),
      _status: 'published',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('international-guide', doc.id, dil, {
      slug: r[dil].slug,
      title: r[dil].title,
      summary: r[dil].summary,
      content: richText(...r[dil].body),
      _status: 'published',
    })
}
log(`Uluslararası katılımcı rehberi hazır (${REHBER.length} bölüm).`)

// ---------------------------------------------------------------------------
// 9. GALERİ ALBÜMLERİ
// ---------------------------------------------------------------------------

type AlbumSeed = { albumType: string; date: string; kareler: [Tema, number][]; egitim?: string } & L<{ slug: string; title: string; description: string }>

const ALBUMLER: AlbumSeed[] = [
  {
    albumType: 'photo', date: '2026-06-15', kareler: [['orman', 601], ['restorasyon', 602], ['fidan', 603], ['orman', 604]],
    tr: { slug: 'duzlercami-uygulama-ormani', title: 'Düzlerçamı Uygulama Ormanı', description: 'Saha uygulamalarının yapıldığı uygulama ormanından kareler. Görseller temsilidir.' },
    en: { slug: 'duzlercami-training-forest', title: 'Düzlerçamı Training Forest', description: 'Views of the training forest where field exercises take place. Images are representative.' },
    ru: { slug: 'uchebnyy-les-dyuzlerchamy', title: 'Учебный лес Дюзлерчамы', description: 'Кадры учебного леса, где проходят полевые занятия. Изображения условные.' },
  },
  {
    albumType: 'simulation', date: '2026-07-20', kareler: [['simulasyon', 611], ['simulasyon', 612], ['simulasyon', 613]], egitim: 'uluslararasi-entegre-yangin-yonetimi',
    tr: { slug: 'simulasyon-merkezi-uygulamalari', title: 'Simülasyon Merkezi Uygulamaları', description: 'Yangın harekât ve karar destek sistemleriyle yapılan senaryo çalışmaları. Görseller temsilidir.' },
    en: { slug: 'simulation-centre-exercises', title: 'Simulation Centre Exercises', description: 'Scenario exercises with fire operations and decision support systems. Images are representative.' },
    ru: { slug: 'zanyatiya-v-tsentre-modelirovaniya', title: 'Занятия в центре моделирования', description: 'Сценарные упражнения с системами пожарных операций и поддержки решений. Изображения условные.' },
  },
  {
    albumType: 'photo', date: '2026-05-28', kareler: [['toplanti', 621], ['toplanti', 622], ['kampus', 623]],
    tr: { slug: 'orta-asya-calistayi-2026', title: 'Orta Asya Ormancılık İş Birliği Çalıştayı 2026', description: 'Bölgesel iş birliği çalıştayının oturumlarından kareler. Görseller temsilidir.' },
    en: { slug: 'central-asia-workshop-2026', title: 'Central Asia Forestry Cooperation Workshop 2026', description: 'Scenes from the regional cooperation workshop sessions. Images are representative.' },
    ru: { slug: 'seminar-tsentralnaya-aziya-2026', title: 'Семинар по лесному сотрудничеству в Центральной Азии 2026', description: 'Кадры с сессий регионального семинара. Изображения условные.' },
  },
]

for (const a of ALBUMLER) {
  if (await slugIle('gallery-albums', a.tr.slug)) continue
  const kareIdleri: number[] = []
  for (const [k, [tema, seed]] of a.kareler.entries())
    kareIdleri.push(
      await medya(`aiftc-galeri-${a.tr.slug}-${k + 1}.jpg`, tema, seed, {
        tr: `${a.tr.title} — temsili illüstrasyon ${k + 1}`,
        en: `${a.en.title} — illustration ${k + 1}`,
        ru: `${a.ru.title} — иллюстрация ${k + 1}`,
      }),
    )
  const egitimId = a.egitim ? await slugIle('training-programs', a.egitim) : null
  const doc = (await payload.create({
    collection: 'gallery-albums',
    locale: 'tr',
    ...CTX,
    data: {
      slug: a.tr.slug,
      albumType: a.albumType,
      date: a.date,
      title: a.tr.title,
      description: a.tr.description,
      coverImage: kareIdleri[0],
      images: kareIdleri,
      ...(egitimId ? { relatedTraining: egitimId } : {}),
      _status: 'published',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('gallery-albums', doc.id, dil, { slug: a[dil].slug, title: a[dil].title, description: a[dil].description, _status: 'published' })
}
log(`Galeri hazır (${ALBUMLER.length} albüm).`)

// ---------------------------------------------------------------------------
// 10. KURULUŞ SAYFASI VE ALT SAYFALARI
// ---------------------------------------------------------------------------

const kurulusGorsel = await medya('aiftc-kurulus-kampus.jpg', 'kampus', 701, {
  tr: 'Temsili illüstrasyon: merkezin kampüs binası', en: 'Illustration: the centre’s campus building', ru: 'Иллюстрация: здание кампуса центра',
})
const tarihceGorsel = await medya('aiftc-kurulus-tarihce.jpg', 'orman', 702, {
  tr: 'Temsili illüstrasyon: yaşlı çam ormanı', en: 'Illustration: mature pine forest', ru: 'Иллюстрация: спелый сосновый лес',
})
const misyonGorsel = await medya('aiftc-kurulus-misyon.jpg', 'restorasyon', 703, {
  tr: 'Temsili illüstrasyon: yeşeren tepeler', en: 'Illustration: greening hills', ru: 'Иллюстрация: зеленеющие холмы',
})

const kurulusDuzeni = (dil: Locale) => {
  const t = {
    tr: {
      giris: ['Antalya Uluslararası Ormancılık Eğitim Merkezi (AIFTC), Orman Genel Müdürlüğü bünyesinde ormancılık alanında ulusal ve uluslararası eğitimler düzenleyen bir eğitim merkezidir.', 'Merkez, FAO ile yürütülen GCP/SEC/024/TUR projesi kapsamında Orta Asya ve komşu ülkelerin ormancılık personeline yönelik bölgesel bir eğitim merkezi olarak güçlendirilmektedir.'],
      rakamBaslik: 'Rakamlarla AIFTC', rakam: [['7', 'katılımcı ülke'], ['6', 'eğitim alanı'], ['3', 'eğitim dili'], ['2', 'simülasyon sistemi']],
      zamanBaslik: 'Kilometre taşları',
      zaman: [['2024', 'Proje başlangıcı', 'GCP/SEC/024/TUR projesi FAO ve OGM iş birliğiyle başladı.'], ['2025', 'Simülasyon merkezi', 'Yangın harekât ve karar destek sistemleri kuruldu.'], ['2026', 'Üç dilli dijital altyapı', 'Web sitesi, sanal sınıf ve e-öğrenme altyapısı devreye alındı.'], ['2027', 'Bölgesel eğitim takvimi', 'On bir uluslararası programdan oluşan takvim uygulanıyor.']],
      ortakBaslik: 'Ortaklar', yonetimBaslik: 'Yönetim',
      kisiler: [['Merkez Müdürlüğü', 'Merkez Müdürü', 'Orman Genel Müdürlüğü'], ['Eğitim Koordinasyon Birimi', 'Eğitim koordinasyonu', 'AIFTC'], ['Uluslararası İlişkiler Birimi', 'Uluslararası iş birliği', 'AIFTC']],
      cta: ['Eğitim programlarımızı inceleyin', 'Başvuruya açık ve planlanan uluslararası programları görün.', 'Eğitim programları'],
      sssBaslik: 'Sık sorulan sorular',
    },
    en: {
      giris: ['The Antalya International Forestry Training Centre (AIFTC) is a training centre of the General Directorate of Forestry that runs national and international forestry courses.', 'Under project GCP/SEC/024/TUR, implemented with FAO, the centre is being strengthened as a regional training hub for forestry staff from Central Asia and neighbouring countries.'],
      rakamBaslik: 'AIFTC in numbers', rakam: [['7', 'participating countries'], ['6', 'training areas'], ['3', 'languages of instruction'], ['2', 'simulation systems']],
      zamanBaslik: 'Milestones',
      zaman: [['2024', 'Project launch', 'Project GCP/SEC/024/TUR started in cooperation between FAO and OGM.'], ['2025', 'Simulation centre', 'Fire operations and decision support systems were installed.'], ['2026', 'Trilingual digital platform', 'The website, virtual classrooms and e-learning infrastructure went live.'], ['2027', 'Regional training calendar', 'A calendar of eleven international programmes is under way.']],
      ortakBaslik: 'Partners', yonetimBaslik: 'Management',
      kisiler: [['Directorate of the Centre', 'Director', 'General Directorate of Forestry'], ['Training Coordination Unit', 'Training coordination', 'AIFTC'], ['International Relations Unit', 'International cooperation', 'AIFTC']],
      cta: ['Explore our training programmes', 'See international programmes that are open for applications or planned.', 'Training programmes'],
      sssBaslik: 'Frequently asked questions',
    },
    ru: {
      giris: ['Анталийский международный учебный центр лесного хозяйства (AIFTC) — учебный центр Генерального управления лесного хозяйства, проводящий национальные и международные курсы.', 'В рамках проекта GCP/SEC/024/TUR, реализуемого с ФАО, центр укрепляется как региональный учебный центр для специалистов лесного хозяйства Центральной Азии и соседних стран.'],
      rakamBaslik: 'AIFTC в цифрах', rakam: [['7', 'стран-участниц'], ['6', 'направлений обучения'], ['3', 'языка обучения'], ['2', 'системы моделирования']],
      zamanBaslik: 'Ключевые этапы',
      zaman: [['2024', 'Старт проекта', 'Проект GCP/SEC/024/TUR начат ФАО совместно с OGM.'], ['2025', 'Центр моделирования', 'Установлены системы пожарных операций и поддержки решений.'], ['2026', 'Трёхъязычная цифровая платформа', 'Запущены сайт, виртуальные классы и инфраструктура электронного обучения.'], ['2027', 'Региональный учебный календарь', 'Реализуется календарь из одиннадцати международных программ.']],
      ortakBaslik: 'Партнёры', yonetimBaslik: 'Руководство',
      kisiler: [['Дирекция центра', 'Директор', 'Генеральное управление лесного хозяйства'], ['Отдел координации обучения', 'Координация обучения', 'AIFTC'], ['Отдел международных связей', 'Международное сотрудничество', 'AIFTC']],
      cta: ['Ознакомьтесь с нашими программами', 'Международные программы, открытые для заявок и запланированные.', 'Учебные программы'],
      sssBaslik: 'Часто задаваемые вопросы',
    },
  }[dil]
  return [
    { blockType: 'richText', content: richText(...t.giris) },
    { blockType: 'statsBlock', heading: t.rakamBaslik, items: t.rakam.map(([value, label]) => ({ value, label })) },
    { blockType: 'mediaBlock', media: kurulusGorsel, width: 'wide' },
    { blockType: 'timelineBlock', heading: t.zamanBaslik, entries: t.zaman.map(([year, title, description]) => ({ year, title, description })) },
    { blockType: 'peopleBlock', heading: t.yonetimBaslik, people: t.kisiler.map(([name, role, unit]) => ({ name, role, unit })) },
    {
      blockType: 'partnersBlock',
      heading: t.ortakBaslik,
      partners: [
        { name: dil === 'ru' ? 'ФАО' : 'FAO', url: 'https://www.fao.org' },
        { name: dil === 'tr' ? 'Orman Genel Müdürlüğü' : dil === 'en' ? 'General Directorate of Forestry' : 'Генеральное управление лесного хозяйства', url: 'https://www.ogm.gov.tr' },
      ],
    },
    { blockType: 'faqBlock', heading: t.sssBaslik, faqs: sssIdleri.slice(0, 4) },
    { blockType: 'ctaBlock', heading: t.cta[0], text: t.cta[1], target: 'internal', href: `/${dil}/${dil === 'tr' ? 'egitim-programlari' : dil === 'en' ? 'training-programmes' : 'programmy-obucheniya'}`, buttonLabel: t.cta[2] },
  ]
}

const KURULUS: L<{ slug: string; title: string; subtitle: string }> = {
  tr: { slug: 'kurulus', title: 'Kuruluş', subtitle: 'Ormancılıkta bölgesel eğitim ve iş birliği merkezi' },
  en: { slug: 'about', title: 'About the Centre', subtitle: 'A regional hub for forestry training and cooperation' },
  ru: { slug: 'o-tsentre', title: 'О центре', subtitle: 'Региональный центр обучения и сотрудничества в лесном хозяйстве' },
}

let kurulusId = await slugIle('pages', 'kurulus')
if (!kurulusId) {
  const doc = (await payload.create({
    collection: 'pages',
    locale: 'tr',
    ...CTX,
    data: { ...KURULUS.tr, pageType: 'institution', heroImage: kurulusGorsel, layout: kurulusDuzeni('tr'), _status: 'published' } as never,
  })) as unknown as { id: number }
  kurulusId = doc.id
  for (const dil of ['en', 'ru'] as const)
    await guncelle('pages', doc.id, dil, { ...KURULUS[dil], layout: kurulusDuzeni(dil), _status: 'published' })
  log('Kuruluş sayfası oluşturuldu.')
}

const ALT_SAYFALAR: { gorsel: number; metin: L<{ slug: string; title: string; subtitle: string; body: string[] }> }[] = [
  {
    gorsel: tarihceGorsel,
    metin: {
      tr: { slug: 'tarihce', title: 'Tarihçe', subtitle: 'Ulusal eğitim merkezinden uluslararası merkeze', body: ['Merkez, Orman Genel Müdürlüğü’nün personel eğitimlerini yürüten bir birim olarak kurulmuş; zamanla uluslararası programlara ev sahipliği yapmaya başlamıştır.', 'FAO ile yürütülen proje, merkezin Orta Asya ve komşu ülkelere yönelik düzenli bir eğitim takvimi uygulamasını mümkün kılmıştır. Bu metin temsilidir; kurumun resmî tarihçesiyle değiştirilmelidir.'] },
      en: { slug: 'history', title: 'History', subtitle: 'From a national training unit to an international centre', body: ['The centre was established as a unit delivering staff training for the General Directorate of Forestry and gradually began hosting international programmes.', 'The project implemented with FAO has enabled a regular training calendar for Central Asia and neighbouring countries. This text is representative and should be replaced with the official history.'] },
      ru: { slug: 'istoriya', title: 'История', subtitle: 'От национального учебного подразделения к международному центру', body: ['Центр был создан как подразделение, обучающее персонал Генерального управления лесного хозяйства, и со временем начал принимать международные программы.', 'Проект, реализуемый с ФАО, позволил ввести регулярный учебный календарь для стран Центральной Азии и соседних стран. Текст условный и должен быть заменён официальной историей.'] },
    },
  },
  {
    gorsel: misyonGorsel,
    metin: {
      tr: { slug: 'misyon-ve-vizyon', title: 'Misyon ve Vizyon', subtitle: 'Neden varız, nereye gidiyoruz', body: ['Misyonumuz: ormancılık personelinin yangın yönetimi, sürdürülebilir orman yönetimi ve restorasyon alanlarındaki yetkinliklerini uygulamalı ve çok dilli eğitimlerle geliştirmek.', 'Vizyonumuz: Orta Asya ve komşu ülkeler için ormancılık eğitiminde bölgesel başvuru merkezi olmak.'] },
      en: { slug: 'mission-and-vision', title: 'Mission and Vision', subtitle: 'Why we exist and where we are heading', body: ['Our mission: to build the skills of forestry staff in fire management, sustainable forest management and restoration through practical, multilingual training.', 'Our vision: to be the regional reference centre for forestry training in Central Asia and neighbouring countries.'] },
      ru: { slug: 'missiya-i-videnie', title: 'Миссия и видение', subtitle: 'Зачем мы работаем и куда движемся', body: ['Наша миссия — развивать компетенции специалистов лесного хозяйства в управлении пожарами, устойчивом лесопользовании и восстановлении с помощью практического многоязычного обучения.', 'Наше видение — стать региональным опорным центром лесного образования для Центральной Азии и соседних стран.'] },
    },
  },
]

for (const s of ALT_SAYFALAR) {
  if (await slugIle('pages', s.metin.tr.slug)) continue
  const { body: trBody, ...trAlan } = s.metin.tr
  const doc = (await payload.create({
    collection: 'pages',
    locale: 'tr',
    ...CTX,
    data: { ...trAlan, pageType: 'institution', parent: kurulusId, heroImage: s.gorsel, layout: [{ blockType: 'richText', content: richText(...trBody) }], _status: 'published' } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const) {
    const { body, ...alan } = s.metin[dil]
    await guncelle('pages', doc.id, dil, { ...alan, layout: [{ blockType: 'richText', content: richText(...body) }], _status: 'published' })
  }
}
log('Kuruluş alt sayfaları (Tarihçe, Misyon ve Vizyon) hazır.')

// ---------------------------------------------------------------------------
// 11. DİJİTAL KÜTÜPHANE — BELGE KAYITLARI
// ---------------------------------------------------------------------------

type KutuphaneSeed = { resourceType: string; dosya: string; tema: Tema; seed: number; year: number; keywords: L<string[]> } & L<{ slug: string; title: string; description: string }>

const KUTUPHANE: KutuphaneSeed[] = [
  {
    resourceType: 'report', dosya: 'aiftc-2026-faaliyet-ozeti.pdf', tema: 'kampus', seed: 801, year: 2026,
    keywords: { tr: ['faaliyet raporu', 'eğitim', 'iş birliği'], en: ['activity report', 'training', 'cooperation'], ru: ['отчёт о деятельности', 'обучение', 'сотрудничество'] },
    tr: { slug: '2026-faaliyet-ozeti', title: '2026 Faaliyet Özeti', description: 'Merkezin 2026 yılında düzenlediği eğitimlerin ve iş birliği faaliyetlerinin özeti. Örnek belgedir.' },
    en: { slug: '2026-activity-summary', title: '2026 Activity Summary', description: 'Summary of the centre’s 2026 training and cooperation activities. Sample document.' },
    ru: { slug: 'obzor-deyatelnosti-2026', title: 'Обзор деятельности за 2026 год', description: 'Обзор учебной деятельности и сотрудничества центра в 2026 году. Образец документа.' },
  },
  {
    resourceType: 'technical-guide', dosya: 'aiftc-yangin-tehlike-indeksleri.pdf', tema: 'yangin', seed: 802, year: 2026,
    keywords: { tr: ['yangın tehlike indeksi', 'hazırlık seviyesi', 'karar destek'], en: ['fire danger index', 'preparedness level', 'decision support'], ru: ['индекс пожарной опасности', 'уровень готовности', 'поддержка решений'] },
    tr: { slug: 'orman-yangini-tehlike-indeksleri-teknik-rehber', title: 'Orman Yangını Tehlike İndeksleri — Teknik Rehber', description: 'Meteorolojik tehlike indekslerinin hesaplanması ve günlük hazırlık seviyesine dönüştürülmesi. Örnek belgedir.' },
    en: { slug: 'forest-fire-danger-indices-technical-guide', title: 'Forest Fire Danger Indices — Technical Guide', description: 'Calculating meteorological danger indices and turning them into daily preparedness levels. Sample document.' },
    ru: { slug: 'indeksy-lesnoy-pozharnoy-opasnosti-rukovodstvo', title: 'Индексы лесной пожарной опасности — техническое руководство', description: 'Расчёт метеорологических индексов опасности и их перевод в суточный уровень готовности. Образец документа.' },
  },
]

const yanginKonusu = await slugIle('training-topics', 'entegre-orman-yangini-yonetimi')
for (const k of KUTUPHANE) {
  if (await slugIle('library-resources', k.tr.slug)) continue
  const kapak = await medya(`aiftc-kutuphane-${k.tr.slug.slice(0, 40)}.jpg`, k.tema, k.seed, {
    tr: `Temsili kapak: ${k.tr.title}`, en: `Illustrative cover: ${k.en.title}`, ru: `Условная обложка: ${k.ru.title}`,
  })
  const belge = belgeIdleri[k.dosya]
  const doc = (await payload.create({
    collection: 'library-resources',
    locale: 'tr',
    ...CTX,
    data: {
      slug: k.tr.slug,
      title: k.tr.title,
      description: k.tr.description,
      author: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
      institution: 'Orman Genel Müdürlüğü',
      keywords: k.keywords.tr,
      resourceType: k.resourceType,
      publicationYear: k.year,
      accessLevel: 'public',
      language: ['tr'],
      countries: ['TR'],
      ...(yanginKonusu ? { topics: [yanginKonusu] } : {}),
      ...(ornekEgitim && k.resourceType === 'technical-guide' ? { relatedTrainings: [ornekEgitim] } : {}),
      ...(projeId ? { relatedProjects: [projeId] } : {}),
      ...(belge ? { file: { relationTo: 'document-files', value: belge } } : {}),
      fileFormat: 'pdf',
      version: '1.0',
      coverImage: kapak,
      featured: true,
      _status: 'published',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('library-resources', doc.id, dil, {
      slug: k[dil].slug,
      title: k[dil].title,
      description: k[dil].description,
      author: dil === 'en' ? 'Antalya International Forestry Training Centre' : 'Анталийский международный учебный центр лесного хозяйства',
      institution: dil === 'en' ? 'General Directorate of Forestry' : 'Генеральное управление лесного хозяйства',
      keywords: k.keywords[dil],
      _status: 'published',
    })
}
log('Kütüphane belge kayıtları hazır.')

// ---------------------------------------------------------------------------
// 12. KURUMSAL ABONELİK PAKETLERİ (B2B)
// ---------------------------------------------------------------------------

type PaketSeed = { order: number; monthly: number; yearly: number; featured: boolean } & L<{ slug: string; name: string; description: string; features: string[] }>

const PAKETLER: PaketSeed[] = [
  {
    order: 10, monthly: 150, yearly: 1500, featured: false,
    tr: { slug: 'kurumsal-temel', name: 'Kurumsal Temel', description: 'Küçük ekipler için kütüphane ve kayıtlı eğitim erişimi.', features: ['5 kullanıcıya kadar', 'Katılımcı düzeyi kütüphane erişimi', 'Kayıtlı eğitim videoları'] },
    en: { slug: 'institutional-basic', name: 'Institutional Basic', description: 'Library and recorded course access for small teams.', features: ['Up to 5 users', 'Participant-level library access', 'Recorded training videos'] },
    ru: { slug: 'bazovyy-korporativnyy', name: 'Базовый корпоративный', description: 'Доступ к библиотеке и записям курсов для небольших команд.', features: ['До 5 пользователей', 'Доступ к библиотеке уровня участника', 'Видеозаписи курсов'] },
  },
  {
    order: 20, monthly: 400, yearly: 4000, featured: true,
    tr: { slug: 'kurumsal-standart', name: 'Kurumsal Standart', description: 'Orman idareleri için kapsamlı kütüphane ve sanal sınıf erişimi.', features: ['25 kullanıcıya kadar', 'Tüm katılımcı içerikleri', 'Sanal sınıf oturumlarına katılım', 'Üç aylık kullanım raporu'] },
    en: { slug: 'institutional-standard', name: 'Institutional Standard', description: 'Comprehensive library and virtual classroom access for forest administrations.', features: ['Up to 25 users', 'All participant content', 'Access to virtual classroom sessions', 'Quarterly usage report'] },
    ru: { slug: 'standartnyy-korporativnyy', name: 'Стандартный корпоративный', description: 'Полный доступ к библиотеке и виртуальным классам для лесных ведомств.', features: ['До 25 пользователей', 'Все материалы для участников', 'Участие в занятиях виртуальных классов', 'Ежеквартальный отчёт об использовании'] },
  },
  {
    order: 30, monthly: 900, yearly: 9000, featured: false,
    tr: { slug: 'kurumsal-kapsamli', name: 'Kurumsal Kapsamlı', description: 'Ulusal ölçekte eğitim programı yürüten kurumlar için.', features: ['Sınırsız kullanıcı', 'Eğitmen düzeyi içerik erişimi', 'Kuruma özel sanal sınıf', 'Öncelikli destek'] },
    en: { slug: 'institutional-premium', name: 'Institutional Premium', description: 'For institutions running national-scale training programmes.', features: ['Unlimited users', 'Instructor-level content access', 'Dedicated virtual classroom', 'Priority support'] },
    ru: { slug: 'rasshirennyy-korporativnyy', name: 'Расширенный корпоративный', description: 'Для организаций, реализующих учебные программы национального масштаба.', features: ['Неограниченное число пользователей', 'Доступ к материалам уровня преподавателя', 'Выделенный виртуальный класс', 'Приоритетная поддержка'] },
  },
]

for (const p of PAKETLER) {
  if (await slugIle('subscription-plans', p.tr.slug)) continue
  const doc = (await payload.create({
    collection: 'subscription-plans',
    locale: 'tr',
    ...CTX,
    data: {
      slug: p.tr.slug,
      order: p.order,
      name: p.tr.name,
      description: p.tr.description,
      features: p.tr.features.map((text) => ({ text })),
      currency: 'EUR',
      monthlyPrice: p.monthly,
      yearlyPrice: p.yearly,
      defaultBillingPeriod: 'yearly',
      featured: p.featured,
      _status: 'published',
    } as never,
  })) as unknown as { id: number }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('subscription-plans', doc.id, dil, {
      slug: p[dil].slug,
      name: p[dil].name,
      description: p[dil].description,
      features: p[dil].features.map((text) => ({ text })),
      _status: 'published',
    })
}
log(`Abonelik paketleri hazır (${PAKETLER.length} paket, fiyatlar örnektir).`)

// ---------------------------------------------------------------------------
// 13. ÖNCEKİ BETİKLERİN BIRAKTIĞI BOŞLUKLAR
// ---------------------------------------------------------------------------

/* `seed-library-album.ts` albümü yalnızca TR yazar; EN/RU detay sayfası 404 olurdu. */
const albumId = await slugIle('library-resources', '2026-uluslararasi-yangin-tatbikati-fotograf-albumu')
if (albumId) {
  const ALBUM = {
    en: {
      slug: '2026-international-fire-drill-photo-album',
      title: '2026 International Fire Drill Photo Album',
      description: 'Scenes from the international fire drill with teams from Central Asia and neighbouring countries: suppression, air support and field coordination. Images are currently representative.',
      author: 'Antalya International Forestry Training Centre',
    },
    ru: {
      slug: 'fotoalbom-mezhdunarodnyh-pozharnyh-ucheniy-2026',
      title: 'Фотоальбом международных пожарных учений 2026',
      description: 'Кадры международных пожарных учений с участием команд из Центральной Азии и соседних стран: тушение, авиаподдержка и полевая координация. Изображения пока условные.',
      author: 'Анталийский международный учебный центр лесного хозяйства',
    },
  }
  for (const dil of ['en', 'ru'] as const)
    await guncelle('library-resources', albumId, dil, { ...ALBUM[dil], _status: 'published' })
  log('Kütüphane albümü EN/RU çevirisi yazıldı.')
}

/* `seed-simulation-centre.ts` sayfa global'ini taslak bırakır. */
for (const dil of DILLER)
  await payload.updateGlobal({ slug: 'simulation-center', locale: dil, ...CTX, data: { _status: 'published' } as never })
log('Simülasyon Merkezi sayfası yayımlandı.')

log('TAMAMLAYICI SEED BİTTİ.')
process.exit(0)
