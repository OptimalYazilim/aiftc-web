'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { abonelikDurumu, type AbonelikDurumu } from '@/lib/subscription'

/**
 * ABONELİK UYARI ŞERİDİ — SESSİZ YETKİ DÜŞÜMÜNÜN AÇIKLAMASI
 * ============================================================================
 * Kılavuz 5.6.1'de "kalan sınır" olarak yazılan sorunun karşılığı budur.
 *
 * SORUN
 * ---------------------------------------------------------------------------
 * Abonelik kapısı (5.6) sunucuda kusursuz çalışır: süresi geçmiş bir katılımcı
 * seviyeli içeriğe ulaşamaz. Ama kullanıcı bunu bir AÇIKLAMA olarak görmez —
 * korumalı bir belgenin bağlantısına tıkladığında çıplak bir 403 alır, API
 * üzerinden gelen kayıt 404 döner. Hiçbiri "aboneliğiniz bitti" demez. Bu,
 * "site bozulmuş" diye okunur ve kuruma yanlış bir arıza bildirimi olarak
 * döner.
 *
 * Şerit o boşluğu doldurur: kısıtın SEBEBİNİ ve NE YAPILACAĞINI söyler.
 *
 * ---------------------------------------------------------------------------
 * METİN NE DEMEZ — ÖLÇÜLDÜ (2026-09-07)
 * ---------------------------------------------------------------------------
 * İlk taslak "kayıtlar artık listelerde görünmüyor" diyordu. ÖLÇÜM bunu
 * çürüttü: site sayfaları Local API'ye `user` GEÇMEZ, yani her sorgu anonim
 * değerlendirilir. Aboneliği GEÇERLİ olan bir katılımcı bile kütüphane
 * listesinde yalnızca herkese açık kayıtları görüyor:
 *
 *     aynı oturum, /api/library-resources  -> 3 kayıt (1 public + 2 trainee)
 *     aynı oturum, /tr/kutuphane           -> "1 yayın"
 *
 * Yani listede kaybolan bir şey YOK; hiç var olmamış. Metin buna göre
 * düzeltildi ve artık yalnızca doğru olanı söylüyor: kapalı kayıtlar ve
 * korumalı belgeler AÇILAMAZ. Ayrıntı ve bunun ne zaman değişeceği:
 * docs/access-control-guide.md § 5.6.2
 *
 * ---------------------------------------------------------------------------
 * KURALI KENDİ HESAPLAMAZ
 * ---------------------------------------------------------------------------
 * Durum `lib/subscription.ts` içindeki `abonelikDurumu` ile belirlenir —
 * sunucudaki erişim kuralının okuduğu AYNI fonksiyon. Şerit kendi kopyasını
 * taşısaydı, kopya bir gün asıl kuraldan ayrışır ve şerit yalan söylerdi:
 * ya erişimi olan kullanıcıyı uyarır, ya da içerik kaybolurken susardı. İkinci
 * hâl, şeridin çözmek için var olduğu sorunun ta kendisidir.
 *
 * ---------------------------------------------------------------------------
 * NEDEN İKİ AYRI METİN
 * ---------------------------------------------------------------------------
 * `suresi-doldu` ile `abonelik-yok` erişim açısından aynıdır, ama kullanıcıya
 * söylenecek cümle farklıdır. Hiç aboneliği olmamış birine "süreniz doldu"
 * demek YANLIŞ BİLGİDİR ve kurumu olmayan bir kaydı aramaya iter.
 *
 * ---------------------------------------------------------------------------
 * TASARIM — UYARI DEĞİL, BİLGİ
 * ---------------------------------------------------------------------------
 * Kırmızı yoktur, ikon yoktur, panik yoktur. Bu bir arıza değil, bir hesap
 * durumudur; kırmızı bir şerit kullanıcıyı sisteme güvensizleştirir ve tam da
 * önlemeye çalıştığımız "bozuldu" algısını üretir. Biçim editoryaldır:
 * yatay ince çizgiler, kemik zemin, kavis ve gölge yok.
 *
 * ERİŞİLEBİLİRLİK
 *  - `role="status"`: sayfa yüklendikten SONRA belirdiği için ekran okuyucuya
 *    kibarca duyurulur. `alert` DEĞİL — acil bir durum değildir ve odağı
 *    çalmamalıdır.
 *  - Bilgi rengin kendisinde değil METİNDEDİR (WCAG 1.4.1); zaten renk yok.
 *  - Bağlantı hedefi ≥44px (2.5.8) ve altı çizili — link olduğu renkten
 *    bağımsız anlaşılır.
 *
 * KAPATILABİLİR DEĞİLDİR — bilinçli.
 * Kapatılabilseydi kullanıcı şeridi kapatır, ertesi gün aynı boşluğa yeniden
 * düşerdi. Durum kalıcı ve eyleme dönüktür; abonelik yenilendiği an şerit
 * kendiliğinden kaybolur.
 * ============================================================================
 */

/** `/api/users/me` yanıtından yalnızca gereken alanlar. */
type MeYaniti = {
  user?: {
    role?: unknown
    roles?: unknown
    subscriptionPlan?: unknown
    subscriptionEndsAt?: unknown
  } | null
}

export const SubscriptionBanner: React.FC<{ contactHref: string }> = ({ contactHref }) => {
  const t = useTranslations('subscription')
  const [durum, setDurum] = useState<AbonelikDurumu | null>(null)

  useEffect(() => {
    /*
      Bileşen sayfadan ayrılırken gelen yanıtı YOK SAY. Şerit yerleşimde
      (layout) durduğu için gezinmede sökülmez, ama sayfa hızlı kapatılırsa
      React "unmounted component" uyarısı verir; bayrak onu keser.
    */
    let gecerli = true

    const oku = async () => {
      try {
        const yanit = await fetch('/api/users/me', {
          /* Oturum çerezi (`aiftc-token`) olmadan yanıt her zaman `user: null`
             olurdu. GET olduğu için CSRF/Origin kısıtı devreye girmez. */
          credentials: 'include',
          /* Şerit KULLANICIYA ÖZELDİR; ara katman veya tarayıcı bu yanıtı
             önbelleğe alırsa bir kullanıcının durumu diğerine gösterilir. */
          cache: 'no-store',
        })
        if (!yanit.ok) {
          if (gecerli) setDurum('oturum-yok')
          return
        }
        const govde = (await yanit.json()) as MeYaniti
        if (gecerli) setDurum(abonelikDurumu(govde?.user ?? null))
      } catch {
        /*
          Ağ hatasında SESSİZ KAL. Şeridi göstermek, aboneliği geçerli olan
          birine "aboneliğiniz doldu" demek olurdu — geçici bir bağlantı
          sorununu kalıcı bir hesap sorunu gibi gösteren bu hata, sessiz
          kalmaktan kötüdür.
        */
        if (gecerli) setDurum('oturum-yok')
      }
    }

    void oku()
    return () => {
      gecerli = false
    }
  }, [])

  // Yanıt gelene kadar hiçbir şey basılmaz: yanıp sönen bir şerit olmaz.
  if (durum !== 'suresi-doldu' && durum !== 'abonelik-yok') return null

  const suresiDoldu = durum === 'suresi-doldu'

  return (
    <div
      role="status"
      className="border-b border-line-strong bg-surface-alt"
      data-abonelik-durumu={durum}
    >
      <div className="container-page flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="text-sm font-bold text-shell-900">
            {suresiDoldu ? t('expiredTitle') : t('noneTitle')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            {suresiDoldu ? t('expiredBody') : t('noneBody')}
          </p>
        </div>

        <Link
          href={contactHref}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-shell-900 underline underline-offset-4 hover:text-brand-800"
        >
          {t('contactLink')}
        </Link>
      </div>
    </div>
  )
}

export default SubscriptionBanner
