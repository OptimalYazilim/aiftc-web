import React from 'react'

/**
 * PANEL AMBLEMİ + PORTAL ADI  (admin.components.graphics.Icon)
 * ============================================================================
 * Yönetim panelinin SOL ÜST köşesinde, Payload'ın varsayılan logosunun yerinde
 * görünür. Yalnızca bir işaret değil, yanında "AİFTC Portal" metni de basılır:
 * panel birden çok paydaşın (Bakanlık, OGM, FAO projesi) bulunduğu bir ortamda
 * çalışıyor; hangi sistemde olunduğunun yazıyla belli olması bir amblemden
 * daha güvenilir bir işarettir.
 *
 * ÖNEMLİ — BU RESMÎ AMBLEM DEĞİLDİR
 * Buradaki yaprak/ağaç işareti kurumun resmî OGM / AIFTC amblemi DEĞİL;
 * yerine geçmesi için çizilmiş nötr bir ormancılık işaretidir. Kurumun görsel
 * kimlik kılavuzuna uygun resmî vektörel dosya sağlandığında bu bileşenin
 * içeriği onunla değiştirilmelidir (Şartname 10.2 görünürlük kuralları).
 *
 * Neden satır içi SVG: panel giriş ekranı veritabanına erişmeden render olur,
 * yüklenmiş bir medya kaydına bağlanamaz. Satır içi SVG ek istek de üretmez.
 *
 * Renk: amblem kurumsal yeşili sabit taşır (her iki temada da koyu zemin
 * üzerinde okunur), metin ise `currentColor` ile temanın metin rengini alır —
 * koyu temada beyaza döner.
 * ============================================================================
 */

const LEAF = '#189a5a'

/**
 * Yalnızca işaret — metinsiz. Giriş ekranındaki `BrandLogo` bunu kendi
 * başlığıyla birleştirir; ad iki kez basılmasın diye ayrı tutulur.
 */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg
    viewBox="0 0 32 32"
    width={size}
    height={size}
    role="img"
    aria-label="AİFTC"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {/* Gövde */}
    <path d="M16 28v-8" fill="none" stroke={LEAF} strokeWidth="2.2" strokeLinecap="round" />
    {/* Üç katmanlı ibreli ağaç silueti */}
    <path d="M16 3 7.5 15h4.5L6 22h20l-6-7h4.5L16 3Z" fill={LEAF} />
  </svg>
)

export const BrandIcon: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      whiteSpace: 'nowrap',
    }}
  >
    <BrandMark />
    {/*
      Metin sarmalanmaz ve TAŞMAZ: Payload'ın nav başlığı dar bir alandır,
      uzun bir ad menüyü iterdi. `max-width` + `ellipsis` bunu güvenceye alır.
    */}
    <span
      style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        maxWidth: '10rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      AİFTC Portal
    </span>
  </span>
)

export default BrandIcon
