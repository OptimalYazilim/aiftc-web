import React from 'react'

import { BrandMark } from './BrandIcon'

/**
 * PANEL LOGOSU  (admin.components.graphics.Logo)
 * ============================================================================
 * Giriş (login) ekranında gösterilen büyük kurumsal başlık. Payload'ın
 * varsayılan logosunun yerini alır.
 *
 * Tasarım kararı: sadece bir işaret değil, kurumun TAM ADI basılır. Panel
 * birden fazla kurumun (OGM, Bakanlık, FAO projesi) paydaş olduğu bir
 * ortamda çalışıyor; giriş ekranında hangi sisteme girildiğinin yazıyla
 * belli olması, bir amblemden daha güvenilir bir işarettir.
 *
 * BU RESMÎ AMBLEM DEĞİLDİR — bkz. BrandIcon içindeki not. Kurumun resmî
 * görsel kimlik dosyası geldiğinde işaret onunla değiştirilmelidir.
 *
 * Satır içi `style` kullanılır: panel kendi CSS'ini yükler, projenin
 * Tailwind katmanı admin rotalarında ÇALIŞMAZ. `currentColor` ve
 * `var(--theme-elevation-*)` Payload'ın kendi tema değişkenleridir;
 * açık/koyu temada da doğru kontrast verirler.
 * ============================================================================
 */
export const BrandLogo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      maxWidth: '22rem',
      textAlign: 'left',
    }}
  >
    <span style={{ flexShrink: 0, display: 'block' }}>
      <BrandMark size={32} />
    </span>

    <span style={{ display: 'block' }}>
      <strong
        style={{
          display: 'block',
          fontSize: '1.05rem',
          lineHeight: 1.25,
          fontWeight: 600,
        }}
      >
        Antalya Uluslararası Ormancılık Eğitim Merkezi
      </strong>
      <span
        style={{
          display: 'block',
          marginTop: '0.25rem',
          fontSize: '0.8rem',
          lineHeight: 1.4,
          opacity: 0.7,
        }}
      >
        T.C. Tarım ve Orman Bakanlığı — Orman Genel Müdürlüğü
      </span>
    </span>
  </div>
)

export default BrandLogo
