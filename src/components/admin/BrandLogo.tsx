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
 * Biçim admin-theme.css → `.aiftc-logo` (projenin Tailwind katmanı admin
 * rotalarında ÇALIŞMAZ). Renkler Payload'ın tema değişkenlerinden gelir;
 * açık/koyu temada da doğru kontrast verirler.
 * ============================================================================
 */
export const BrandLogo: React.FC = () => (
  <div className="aiftc-logo">
    <span className="aiftc-logo__isaret" aria-hidden="true">
      <BrandMark size={26} />
    </span>
    <span>
      <strong className="aiftc-logo__ad">Antalya Uluslararası Ormancılık Eğitim Merkezi</strong>
      <span className="aiftc-logo__alt">T.C. Tarım ve Orman Bakanlığı — Orman Genel Müdürlüğü</span>
    </span>
  </div>
)

export default BrandLogo
