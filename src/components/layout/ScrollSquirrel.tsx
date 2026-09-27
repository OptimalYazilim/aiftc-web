'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * BAŞA DÖN — SEVİMLİ SİNCAP
 * ============================================================================
 * Sağ alt köşede duran, tıklanınca sayfanın başına götüren düğme.
 *
 * DAVRANIŞ (durum makinesi)
 *   gizli   → ekranın sağ dışında bekler
 *   geliyor → sayfa aşağı kaydırılınca SAĞDAN koşarak köşeye gelir
 *   oturuyor→ palamutuyla oynar: çevirir, havaya atıp yakalar, kemirir
 *   kaciyor → tıklanınca (ya da ziyaretçi elle başa dönünce) arkasını
 *             dönüp SAĞA koşarak kaçar, sayfa yumuşakça başa kayar
 *
 * Tıklamadan sonra sayfa başa kayarken sincabın hemen geri gelmemesi için
 * `bekle` kilidi kullanılır: kilit, sayfa gerçekten başa yaklaşınca açılır;
 * ziyaretçi yeniden aşağı indiğinde sincap tekrar koşarak gelir.
 *
 * ERİŞİLEBİLİRLİK
 *   - Gerçek bir <button>; etiket "Başa dön" (footer ile aynı metin, üç dil).
 *   - Gizliyken `tabIndex=-1` + `aria-hidden`: görünmeyen düğme odak almaz.
 *   - Hareket azaltılmışsa (prefers-reduced-motion) koşu animasyonu yoktur;
 *     globals.css kuralı geçişleri anlık yapar, sincap yalnızca belirir/kaybolur.
 *   - Başa dönünce odak atlama hedefine (#main-content) taşınır ki klavye
 *     kullanıcısı sayfanın başından devam etsin.
 *
 * ÇEREZ BANDI
 *   Bant açıkken sincap onun ÜSTÜNDE durur; bant yüksekliği ölçülür.
 * ============================================================================
 */

type Durum = 'gizli' | 'geliyor' | 'oturuyor' | 'kaciyor'

/** Sincabın belireceği kaydırma eşiği (px). */
const ESIK = 480
/** Koşu süresi — globals.css'teki geçiş süresiyle aynı. */
const KOSU_MS = 1100

export const ScrollSquirrel: React.FC = () => {
  const t = useTranslations('footer')
  const [durum, setDurum] = useState<Durum>('gizli')
  const [alt, setAlt] = useState(0)
  const durumRef = useRef<Durum>('gizli')
  const bekle = useRef(false)
  const zamanlayici = useRef<number | undefined>(undefined)

  const gec = useCallback((yeni: Durum) => {
    durumRef.current = yeni
    setDurum(yeni)
    window.clearTimeout(zamanlayici.current)
    if (yeni === 'geliyor') {
      zamanlayici.current = window.setTimeout(() => gec('oturuyor'), KOSU_MS)
    } else if (yeni === 'kaciyor') {
      zamanlayici.current = window.setTimeout(() => gec('gizli'), KOSU_MS)
    }
  }, [])

  /* Kaydırma: eşiği geçince gel, eşiğin altına dönünce kaç. */
  useEffect(() => {
    const kontrol = () => {
      const y = window.scrollY
      const d = durumRef.current

      if (bekle.current) {
        if (y < ESIK / 2) bekle.current = false
        return
      }
      if (y > ESIK && (d === 'gizli' || d === 'kaciyor')) gec('geliyor')
      else if (y <= ESIK && (d === 'oturuyor' || d === 'geliyor')) gec('kaciyor')
    }
    kontrol()
    window.addEventListener('scroll', kontrol, { passive: true })
    return () => {
      window.removeEventListener('scroll', kontrol)
      window.clearTimeout(zamanlayici.current)
    }
  }, [gec])

  /* Çerez bandı açıksa onun üstünde dur. */
  useEffect(() => {
    const olc = () => {
      const bant = document.querySelector<HTMLElement>('[data-cookie-banner]')
      setAlt(bant ? bant.offsetHeight : 0)
    }
    olc()
    const gozlem = new MutationObserver(olc)
    gozlem.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', olc)
    return () => {
      gozlem.disconnect()
      window.removeEventListener('resize', olc)
    }
  }, [])

  const basaDon = () => {
    bekle.current = true
    gec('kaciyor')
    const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: azalt ? 'auto' : 'smooth' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  const gorunur = durum === 'geliyor' || durum === 'oturuyor'

  return (
    <div
      className="sincap-sahne pointer-events-none fixed right-4 z-40 sm:right-6"
      data-durum={durum}
      style={{ bottom: `calc(${alt}px + 1rem)` }}
    >
      <button
        type="button"
        onClick={basaDon}
        aria-label={t('backToTop')}
        aria-hidden={!gorunur}
        tabIndex={gorunur ? 0 : -1}
        className="sincap-dugme group pointer-events-auto relative block rounded-full focus-visible:outline-offset-4"
      >
        {/* Konuşma balonu — fareyle üzerine gelince / klavye odağında */}
        <span
          aria-hidden="true"
          className="sincap-balon pointer-events-none absolute -top-9 right-2 whitespace-nowrap rounded-full bg-shell-950 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {t('backToTop')} ↑
        </span>
        <span className="sincap-yon block">
          <Sincap />
        </span>
      </button>
    </div>
  )
}


/* ============================================================================
   SİNCAP ÇİZİMİ — sevimli çizgi film sincabı, ¾ YANDAN, SOLA bakar
   ============================================================================
   Gerçekçi kıl dokusu BİLİNÇLİ OLARAK kullanılmaz: yumuşak, yuvarlak
   biçimler ve hafif degradelerle "sevimli karakter" dili kurulur.
     - büyük baş / küçük gövde oranı (bebek şeması)
     - iki iri, parlak, koyu göz (yakın göz büyük, uzak göz küçük)
     - pembe yanak, küçük burun, gülümseyen ağız
     - göğsünde iki patisiyle tuttuğu palamut
     - pofuduk, kıvrık kuyruk (üst üste binen yuvarlaklar)
   Yandan çizildiği için koşarken ön ve arka bacaklar görünür.

   Karakterin görünümü bir referans görselden esinlenerek ELLE çizilmiştir;
   dış bir görsel dosyası kullanılmaz.
   ============================================================================ */

type Nokta = [number, number]

const f1 = (n: number) => n.toFixed(1)

/** Çoklu çizgi boyunca eşit aralıklı örnek: konum + t (0..1). */
const ornekle = (noktalar: Nokta[], adet: number) => {
  const uzunluklar = [0]
  for (let i = 1; i < noktalar.length; i++) {
    const [ax, ay] = noktalar[i - 1]
    const [bx, by] = noktalar[i]
    uzunluklar.push(uzunluklar[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const toplam = uzunluklar[uzunluklar.length - 1]
  const sonuc: { x: number; y: number; aci: number; t: number }[] = []
  for (let k = 0; k < adet; k++) {
    const hedef = (k / (adet - 1)) * toplam
    let i = 1
    while (i < uzunluklar.length - 1 && uzunluklar[i] < hedef) i++
    const [ax, ay] = noktalar[i - 1]
    const [bx, by] = noktalar[i]
    const parca = uzunluklar[i] - uzunluklar[i - 1] || 1
    const u = (hedef - uzunluklar[i - 1]) / parca
    sonuc.push({ x: ax + (bx - ax) * u, y: ay + (by - ay) * u, aci: Math.atan2(by - ay, bx - ax), t: hedef / toplam })
  }
  return sonuc
}

/* --- Pofuduk kuyruk: omurga boyunca üst üste binen yuvarlaklar -------------- */
const KUYRUK_OMURGA: Nokta[] = [
  [96, 84], [110, 80], [121, 70], [127, 56], [127, 42], [122, 30], [113, 23], [104, 23], [99, 30],
]
const kuyrukKalinlik = (t: number) => 5 + 13 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.6)
const KUYRUK_ORNEK = ornekle(KUYRUK_OMURGA, 36)

/** Kapalı Catmull-Rom eğrisi → pürüzsüz kübik Bézier yolu. */
const yumusakYol = (p: Nokta[]) => {
  const n = p.length
  let d = `M${f1(p[0][0])} ${f1(p[0][1])}`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p[(i - 1 + n) % n]
    const [x1, y1] = p[i]
    const [x2, y2] = p[(i + 1) % n]
    const [x3, y3] = p[(i + 2) % n]
    d += `C${f1(x1 + (x2 - x0) / 6)} ${f1(y1 + (y2 - y0) / 6)} ${f1(x2 - (x3 - x1) / 6)} ${f1(y2 - (y3 - y1) / 6)} ${f1(x2)} ${f1(y2)}`
  }
  return d + "Z"
}

/** Omurganın iki yanına kalınlık kadar açılan kapalı kuyruk şekli. */
const kuyrukSekli = (olcek: number, kayma = 0) => {
  const sol: Nokta[] = []
  const sag: Nokta[] = []
  for (const p of KUYRUK_ORNEK) {
    const r = kuyrukKalinlik(p.t) * olcek
    const nx = -Math.sin(p.aci)
    const ny = Math.cos(p.aci)
    sol.push([p.x + nx * (r + kayma), p.y + ny * (r + kayma)])
    sag.push([p.x - nx * (r - kayma), p.y - ny * (r - kayma)])
  }
  return yumusakYol([...sol, ...sag.reverse()])
}
const KUYRUK_DIS = kuyrukSekli(1)
const KUYRUK_IC = kuyrukSekli(0.42, -2)
/** Kenarda pofuduk kabarıklıklar — kuyruğun "tüylü" silueti. */
const KUYRUK_KABARIK = KUYRUK_ORNEK.filter((_, i) => i % 3 === 1).flatMap((p) => {
  const r = kuyrukKalinlik(p.t)
  const nx = -Math.sin(p.aci)
  const ny = Math.cos(p.aci)
  return [1, -1].map((yan) => ({ x: p.x + yan * nx * r * 0.82, y: p.y + yan * ny * r * 0.82, r: r * 0.34 }))
})

const Sincap: React.FC = () => (
  <svg
    className="sincap-svg block h-14 w-16 drop-shadow-[0_4px_6px_rgba(4,32,27,0.22)] sm:h-16 sm:w-[4.6rem]"
    viewBox="0 0 140 120"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient id="sincap-kurk" cx="0.4" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#e6ab6d" />
        <stop offset="0.55" stopColor="#bf7a42" />
        <stop offset="1" stopColor="#8f5129" />
      </radialGradient>
      {/* Kullanıcı uzayında: kuyruğun tüm parçaları AYNI degradeyi paylaşır, ek yeri görünmez. */}
      <radialGradient id="sincap-kuyruk-g" gradientUnits="userSpaceOnUse" cx="110" cy="48" r="46">
        <stop offset="0" stopColor="#dca062" />
        <stop offset="1" stopColor="#a8652f" />
      </radialGradient>
      <radialGradient id="sincap-krem" cx="0.45" cy="0.4" r="0.65">
        <stop offset="0" stopColor="#fff6ea" />
        <stop offset="1" stopColor="#f1dcbf" />
      </radialGradient>
      <radialGradient id="sincap-goz-g" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#6b4630" />
        <stop offset="0.5" stopColor="#24150c" />
        <stop offset="1" stopColor="#070403" />
      </radialGradient>
      <linearGradient id="sincap-palamut-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e5a866" />
        <stop offset="0.6" stopColor="#b06a2e" />
        <stop offset="1" stopColor="#81461c" />
      </linearGradient>
      <pattern id="sincap-sapka" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="2.6" height="2.6" fill="#7d4c26" />
        <path d="M0 0h2.6M0 0v2.6" stroke="#57331a" strokeWidth="0.8" />
      </pattern>
    </defs>

    {/* Zemin gölgesi */}
    <ellipse className="sincap-golge" cx="74" cy="108" rx="36" ry="3.6" fill="#04201b" opacity="0.2" />

    <g className="sincap-govde">
      {/* --- Kuyruk: koyu taban + açık iç + birkaç tutam --- */}
      <g className="sincap-kuyruk">
        <g fill="url(#sincap-kuyruk-g)">
          {KUYRUK_KABARIK.map((c, i) => (
            <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={f1(c.r)} />
          ))}
          <path d={KUYRUK_DIS} />
        </g>
        <path d={KUYRUK_IC} fill="#efbd84" opacity="0.5" />
        <path
          d="M101 21c-2-4 0-8 4-9M108 19c1-4 4-6 8-5M129 45c3-1 6 1 7 4M126 66c3 1 5 4 5 7"
          fill="none"
          stroke="#a8652f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      {/* --- Uzak bacaklar (koyu, arkada) --- */}
      <g className="sincap-bacak-on sincap-bacak-uzak">
        <path d="M58 90c-1 5-2 9-3 13" stroke="#8a4d27" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g className="sincap-bacak-arka sincap-bacak-uzak">
        <path d="M84 92c-1 4-3 8-5 11" stroke="#8a4d27" strokeWidth="6.5" strokeLinecap="round" />
      </g>

      {/* --- Gövde + karın --- */}
      <ellipse cx="76" cy="82" rx="24" ry="19" fill="url(#sincap-kurk)" />
      <ellipse cx="65" cy="88" rx="12" ry="13" fill="url(#sincap-krem)" />

      {/* --- Yakın arka bacak: yuvarlak baldır + ayak --- */}
      <g className="sincap-bacak-arka">
        <ellipse cx="90" cy="88" rx="11.5" ry="10.5" fill="url(#sincap-kurk)" />
        <ellipse cx="85" cy="104" rx="8" ry="3.8" fill="#a55f30" />
        <path d="M78.5 104h2M79 106h2" stroke="#6e3a1c" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* --- Yakın ön bacak --- */}
      <g className="sincap-bacak-on">
        <path d="M63 92c-1 5-2 8-3 11" stroke="#b06a36" strokeWidth="6.5" strokeLinecap="round" />
        <ellipse cx="58" cy="104.5" rx="5.5" ry="3.2" fill="#a55f30" />
      </g>

      {/* --- Uzak pati (palamutun arkasına uzanır) --- */}
      <g className="sincap-kollar">
        <path d="M56 78c-6 3-9 9-10 15" stroke="#9c5a2e" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* --- Baş --- */}
      <g className="sincap-bas">
        {/* uzak kulak */}
        <g className="sincap-kulak sincap-kulak-uzak">
          <path d="M34 30c-1-8 1-15 4-19 4 4 7 10 7 17Z" fill="#9a5a2d" />
        </g>
        {/* kafa */}
        <circle cx="48" cy="50" r="28" fill="url(#sincap-kurk)" />
        {/* tepe perçemi */}
        <path d="M44 23c1-4 4-6 7-6M49 23c2-3 5-4 8-3" fill="none" stroke="#bf7a42" strokeWidth="2.6" strokeLinecap="round" />
        {/* yakın kulak */}
        <g className="sincap-kulak sincap-kulak-yakin">
          <path d="M55 28c0-9 3-16 7-20 4 5 6 12 5 20Z" fill="#b06a36" />
          <path d="M58 27c.4-6 2-11 4.4-14 2.2 3.4 3.2 8 2.8 13.6Z" fill="#f2b9a4" />
          <path d="M62 8.5l-.5-4M62.6 8.5l2-3.6" stroke="#8f5129" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* yanaklar + ağız çevresi */}
        <ellipse cx="30" cy="60" rx="14" ry="11" fill="url(#sincap-krem)" />
        <ellipse cx="51" cy="65" rx="13" ry="9" fill="url(#sincap-krem)" />
        <ellipse cx="52" cy="59.5" rx="5.4" ry="3.4" fill="#f4a2a0" opacity="0.55" />

        {/* gözler: uzak (küçük) + yakın (büyük) */}
        <g className="sincap-goz sincap-goz-uzak">
          <ellipse cx="26.4" cy="49" rx="3.8" ry="5.2" fill="url(#sincap-goz-g)" />
          <circle cx="25.4" cy="46.9" r="1.25" fill="#fff" />
        </g>
        <g className="sincap-goz sincap-goz-yakin">
          <ellipse cx="42" cy="48" rx="6" ry="6.9" fill="url(#sincap-goz-g)" />
          <circle cx="39.9" cy="45.3" r="2.2" fill="#fff" />
          <circle cx="44.2" cy="51.2" r="1" fill="#fff" opacity="0.85" />
          <path d="M35.6 42.4c2-3.6 9.2-4.2 12.4-.4" fill="none" stroke="#4a2915" strokeWidth="1.1" strokeLinecap="round" />
        </g>

        {/* burun + ağız */}
        <g className="sincap-burun">
          <ellipse cx="17.6" cy="55.6" rx="3.6" ry="2.8" fill="#5a2e1a" />
          <ellipse cx="16.6" cy="54.6" rx="1.2" ry="0.7" fill="#fff" opacity="0.6" />
          <path d="M19 58.6c1 2.4 3.4 3.2 6 2.2" fill="none" stroke="#5a2e1a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>

      {/* --- Palamut ve yakın pati: BAŞIN ÖNÜNDE çizilir ki havaya atılınca ve
           ağza götürülünce görünür kalsın --- */}
      <g className="sincap-palamut">
        <g transform="translate(-2 7)">
        <ellipse cx="42" cy="86" rx="6.8" ry="7.8" fill="url(#sincap-palamut-g)" />
        <ellipse cx="40" cy="83.5" rx="1.8" ry="3" fill="#ffe0b5" opacity="0.6" />
        <path d="M34.4 81.2c0-4.4 3.4-6.6 7.6-6.6s7.6 2.2 7.6 6.6c-2.4 1.5-12.8 1.5-15.2 0Z" fill="url(#sincap-sapka)" />
        <path d="M42 74.6c.2-1.8 1.2-3 2.6-3.6" fill="none" stroke="#57331a" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>
      <g className="sincap-kollar">
        <path d="M60 79c-4 5-8 10-11.5 16" stroke="#c07b44" strokeWidth="6.5" strokeLinecap="round" />
        <ellipse cx="46.5" cy="95.5" rx="3.6" ry="3" fill="#c98548" />
      </g>
    </g>
  </svg>
)

export default ScrollSquirrel
