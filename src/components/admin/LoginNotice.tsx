import React from 'react'

/**
 * Panele giris ekraninda gosterilen kisa bilgi.
 * Sartname 12.1 - guclu parola politikasi ve yetkisiz erisim uyarisi.
 * Bicim: admin-theme.css -> `.aiftc-giris-notu`.
 */
export const LoginNotice: React.FC = () => (
  <div className="aiftc-giris-notu">
    <h2 className="aiftc-giris-notu__baslik">Yönetim paneline giriş</h2>
    <p className="aiftc-giris-notu__metin">
      Bu panel yalnızca yetkili OGM / UOEM personeli içindir. Erişim kayıtları tutulmaktadır.
      Parolanızı kimseyle paylaşmayın.
    </p>
  </div>
)

export default LoginNotice
