import React from 'react'

import { BrandMark } from './BrandIcon'

/**
 * SOL MENÜNÜN ÜSTÜNDEKİ KURUM BLOĞU  (admin.components.beforeNavLinks)
 * ============================================================================
 * Payload'ın menüsünde marka alanı yoktur; logo yalnızca üst şeritteki
 * "ana sayfa" kırıntısında görünür. Koyu menünün başında kurum adı ve
 * işareti, hangi sistemde olunduğunu her ekranda gösterir ve kontrol
 * paneline dönüş bağlantısıdır.
 *
 * İşaret RESMÎ AMBLEM DEĞİLDİR — bkz. BrandIcon içindeki not.
 * Biçim: admin-theme.css → `.aiftc-nav-marka`.
 * ============================================================================
 */
export const NavBrand: React.FC = () => (
  <a className="aiftc-nav-marka" href="/admin">
    <span className="aiftc-nav-marka__isaret" aria-hidden="true">
      <BrandMark size={22} />
    </span>
    <span>
      <span className="aiftc-nav-marka__ad">AİFTC Portal</span>
      <span className="aiftc-nav-marka__alt">Yönetim Paneli</span>
    </span>
  </a>
)

export default NavBrand
