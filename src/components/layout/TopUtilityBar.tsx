import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/locales'
import { authHref, href } from '@/i18n/routes'
import type { PortalLink } from '@/lib/portalLinks'

import { AccountMenu } from '@/components/account/AccountMenu'

import { PortalLinks } from './PortalLinks'

/**
 * ÜST HİZMET ŞERİDİ  (WHO / ILO / FAO portal deseni)
 * ============================================================================
 * Kurumsal portallarda gezinme İKİ KATMANDIR ve ayrım işlevseldir:
 *
 *   üst şerit  → SİTEDEN ÇIKARAN bağlantılar: kardeş portallar, personel
 *                girişi, dil seçimi, arama. İnce ve koyu; ikincil olduğu
 *                boyutundan değil, TONUNDAN anlaşılır.
 *   ana header → SİTE İÇİ bölümler. Ferah, beyaz, tok.
 *
 * Tek katmanlı bir menüde bu iki küme yan yana dizilir ve ziyaretçi
 * "Haberler" ile "Personel Girişi"ni aynı ağırlıkta okur; şablon hissinin
 * kaynaklarından biri budur.
 *
 * ---------------------------------------------------------------------------
 * MOBİLDE PORTAL LİSTESİ GİZLENİR — ÖLÇÜLMÜŞ GEREKÇE
 * ---------------------------------------------------------------------------
 * 375px genişlikte portal bağlantıları + "Yakında" rozetleri şeridi iki-üç
 * satıra sarıyor ve YAPIŞKAN başlığın toplam yüksekliği 197px'e çıkıyordu —
 * 812px'lik bir ekranın dörtte biri. Bu yükseklik her kaydırmada içerikten
 * çalınır.
 *
 * Bu yüzden şeritte mobilde yalnızca dil ve arama kalır; portal listesi
 * mobil menü panelinin içine taşınır (bkz. SiteHeader → HeaderShell
 * `mobileUtility`). Liste iki yerde de `lib/portalLinks.ts` üzerinden
 * kurulur, iki farklı küme oluşmaz.
 *
 * KONTRAST — zemin shell-950 (#04201b), ölçülmüş:
 *     beyaz          17.11:1
 *     white/85       12.58:1
 *     white/75        9.96:1
 *     white/55        5.94:1   ("yakında" sönük metni — AA sınırının üstünde)
 *     brand-100      14.24:1
 * ============================================================================
 */

export const TopUtilityBar = async ({
  locale,
  portals,
  languageSwitcher,
}: {
  locale: Locale
  portals: PortalLink[]
  languageSwitcher: React.ReactNode
}) => {
  const t = await getTranslations('nav')

  return (
    <div className="bg-shell-950 text-sm text-white/75">
      <div className="container-page flex items-center justify-between gap-x-6 py-1">
        {/* --- Sol: kardeş portallar (sm ve üzeri) ------------------------ */}
        {portals.length > 0 ? (
          <nav aria-label={t('portalsLabel')} className="hidden items-center gap-x-1 sm:flex">
            {/*
              Etiket ekran okuyucuya `aria-label` ile zaten veriliyor; görsel
              karşılığı görenlere de kümenin ne olduğunu söyler. Dar ekranda
              gizlenir — bağlantılar kendi başlarına anlaşılır.
            */}
            <span className="hidden pr-2 text-xs font-semibold uppercase tracking-wider text-brand-100 lg:inline">
              {t('portalsLabel')}
            </span>
            <PortalLinks items={portals} variant="bar" comingSoonLabel={t('comingSoonBadge')} />
          </nav>
        ) : (
          <span />
        )}

        {/* --- Sağ: dil + arama ------------------------------------------- */}
        <div className="ml-auto flex items-center gap-1">
          {languageSwitcher}

          <span aria-hidden="true" className="h-4 w-px bg-white/20" />

          {/*
            ZİYARETÇİ GİRİŞİ — menüye DEĞİL, hizmet şeridine konur.
            Ana menü `globals/Navigation` üzerinden editör tarafından
            yönetilir ve oradaki "Sistem bölümü" alanı bir Postgres enum'udur;
            yeni bir değer eklemek on dört ayrı `ALTER TYPE` satırlık bir
            migration gerektirir. Kimlik ekranları bir İÇERİK bölümü değildir,
            editörün sıralamasına da girmemelidir — bu yüzden portal ve arama
            bağlantılarının yanında, sabit olarak durur.

            Soldaki "Personel Girişi" bundan FARKLIDIR: o, EK-2 yönetim
            portalına (ayrı sistem) gider. Bu ise sitenin kendi hesabıdır.
          */}
          {/*
            OTURUMA GÖRE DEĞİŞİR — sunucuda karar verilemez.
            Çerez httpOnly olduğu için istemci onu okuyamaz; durum
            `/api/users/me` ile öğrenilir. Başlığı sunucuda çerezden
            kurmak her sayfayı dinamik hâle getirir ve tüm ISR önbelleğini
            kaldırırdı (bkz. AccountMenu ve SessionProvider docblock'ları).
          */}
          <AccountMenu girisHref={authHref('login', locale)} />

          <span aria-hidden="true" className="h-4 w-px bg-white/20" />

          {/*
            Arama tetikleyicisi GERÇEK BİR BAĞLANTIDIR, açılır kutu değil.
            Sunucuda render edilen bir sayfaya gider (/arama): JavaScript
            kapalıyken de çalışır ve sonuç sayfası paylaşılabilir bir URL'e
            sahiptir. Katalogdaki filtre kutusu bunun yerini tutmaz — o
            yalnızca eğitimleri arar.
          */}
          <Link
            href={href('search', locale)}
            className="inline-flex min-h-9 items-center gap-2 rounded px-2 py-1 font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              width="1em"
              height="1em"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            {t('search')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TopUtilityBar
