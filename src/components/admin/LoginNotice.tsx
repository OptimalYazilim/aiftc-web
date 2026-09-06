import React from 'react'

/**
 * Panele giris ekraninda gosterilen kisa bilgi.
 * Sartname 12.1 - guclu parola politikasi ve yetkisiz erisim uyarisi.
 */
export const LoginNotice: React.FC = () => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h2 style={{ margin: '0 0 .5rem', fontSize: '1.1rem' }}>
      AIFTC İçerik Yönetim Sistemi
    </h2>
    <p style={{ margin: 0, opacity: 0.75, fontSize: '.85rem', lineHeight: 1.5 }}>
      Bu panel yalnızca yetkili OGM / UOEM personeli içindir. Erişim kayıtları tutulmaktadır.
      Parolanızı kimseyle paylaşmayın.
    </p>
  </div>
)

export default LoginNotice
