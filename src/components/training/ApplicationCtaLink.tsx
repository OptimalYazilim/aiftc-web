'use client'

import Link from 'next/link'
import React from 'react'

import { useOturum } from '@/components/account/SessionProvider'

/**
 * BAŞVURU AKSİYONU — BİRİNCİL DÜĞME HERKESE "BAŞVUR"
 * ============================================================================
 * Kurum kararı (29.09.2026): eğitimlere OGM personeli GİRİŞ YAPARAK başvurur.
 * Önceki sürüm oturum açmış kişiye başvuru düğmesi yerine "Eğitim
 * Materyallerine Git" gösteriyordu — yani eğitime başvurması beklenen kitle
 * başvuru düğmesini hiç görmüyordu. Artık:
 *
 *   oturum YOK → [Başvur]
 *   oturum VAR → [Başvur] + altında ikincil "Eğitim Materyallerine Git"
 *
 * Birincil eylem iki hâlde de aynıdır; oturum yalnızca EK bir bağlantı açar.
 * Başvuru formu oturumu kendisi okur ve kaydı hesaba bağlar (basvuru/actions).
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR İSTEMCİ BİLEŞENİ
 * ---------------------------------------------------------------------------
 * `ApplicationCta` bir SUNUCU bileşenidir: başvuru hedefini, eğitim durumunu
 * ve harici servis ayarlarını çözer. Oturum ise yalnızca istemcide
 * bilinebilir — çerez `httpOnly`dir (bkz. SessionProvider). Ayrım en dar
 * yerde yapılır: sunucu iki bağlantıyı da hazırlar, bu bileşen yalnızca
 * ikincisinin basılıp basılmayacağına karar verir.
 *
 * Oturum `/api/users/me` yanıtlayana kadar bilinmez; o ana kadar ikincil
 * bağlantı basılmaz — henüz doğrulanmamış birine materyal bağlantısı
 * göstermek, onu erişemeyeceği bir yere yollamak olurdu.
 * ============================================================================
 */
export const ApplicationCtaLink: React.FC<{
  /** Site içi başvuru formu (varsa eğitim ön seçimiyle). */
  basvuruHref: string
  basvuruEtiketi: string
  /** Oturumluya ek olarak gösterilen kütüphane bağlantısı. */
  materyalHref: string
  materyalEtiketi: string
  className: string
}> = ({ basvuruHref, basvuruEtiketi, materyalHref, materyalEtiketi, className }) => {
  const { durum } = useOturum()

  return (
    <>
      <Link href={basvuruHref} className={className}>
        {basvuruEtiketi}
      </Link>
      {durum === 'var' ? (
        <p className="mt-3 text-center text-sm">
          <Link
            href={materyalHref}
            className="font-semibold text-brand-800 underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-brand-700 focus-visible:decoration-brand-700"
          >
            {materyalEtiketi}
          </Link>
        </p>
      ) : null}
    </>
  )
}

export default ApplicationCtaLink
