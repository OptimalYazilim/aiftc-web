import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { ExternalService, TrainingProgram } from '@/payload-types'

import type { Locale } from '@/i18n/locales'
import { href } from '@/i18n/routes'
import { resolveApplicationHref } from '@/lib/externalLinks'
import { isApplicationOpen } from '@/lib/trainingStatus'

import { ExternalLink } from '../ui/ExternalLink'

import { ApplicationCtaLink } from './ApplicationCtaLink'

/**
 * BAŞVURU AKSİYONU  (Şartname 6.4, 12.2)
 * ============================================================================
 * KAPSAM KURALI — EK-1 başvuru FORMU barındırmaz. Kişisel veri toplanmaz;
 * ziyaretçi yalnızca yönetim portalına, harici bir adrese, e-postaya veya
 * iletişim sayfasına YÖNLENDİRİLİR (`applicationTarget`).
 *
 * BUTON NE ZAMAN AKTİF?
 * Yalnızca eğitim durumu "Başvuruya açık" iken. Diğer tüm durumlarda buton
 * `disabled` gelir ve YANINDA nedeni açıklayan bir bildirim basılır.
 * Devre dışı buton klavyeyle odaklanılamaz; bu yüzden açıklama butonun
 * içinde değil, okuma sırasındaki AYRI bir `role="status"` öğesindedir —
 * aksi halde klavye kullanıcısı butonun neden çalışmadığını öğrenemezdi
 * (WCAG 2.2 — 3.3.1 Hata Tanımlama mantığının aynısı).
 *
 * Portal "yakında" durumundaysa `resolveApplicationHref` null döner: sisteme
 * hazır olmadan kullanıcı gönderilmez.
 * ============================================================================
 */

/** Durum → bildirim çeviri anahtarı. Aktif başvuru dışındaki her hâl. */
const NOTICE_KEY_BY_STATUS: Record<string, string> = {
  planned: 'noticePlanned',
  'applications-closed': 'noticeApplicationsClosed',
  ongoing: 'noticeOngoing',
  completed: 'noticeCompleted',
  postponed: 'noticePostponed',
  cancelled: 'noticeCancelled',
}

type Props = {
  locale: Locale
  /** Basvuru talebine iliskilendirilecek egitim kaydi. */
  trainingId?: number
  /**
   * Egitimin slug'i — kutuphaneye `?egitim=<slug>` olarak tasinir.
   * Kimlik (id) DEGIL slug kullanilir: adres paylasilabilir ve okunabilir
   * olmali, ayrica icerik gocunde id'ler degisebilir.
   */
  trainingSlug?: string | null
  status: TrainingProgram['status']
  target: TrainingProgram['applicationTarget']
  services: ExternalService
}

const BUTTON_BASE =
  'inline-flex min-h-11 w-full items-center justify-center rounded px-5 text-center font-semibold'

export const ApplicationCta = async ({
  locale,
  trainingId,
  trainingSlug,
  status,
  target,
  services,
}: Props) => {
  const t = await getTranslations('training')

  const open = isApplicationOpen(status)
  const applicationHref = resolveApplicationHref(target, services)
  const type = target?.type ?? 'contact'

  // --- Başvuru alınmıyor: durumdan bağımsız, kalıcı bilgi ------------------
  if (type === 'none') {
    return (
      <p role="status" className="rounded-card border border-line bg-surface-alt p-4 text-ink-700">
        {t('noticeNotAccepting')}
      </p>
    )
  }

  // --- Başvuruya kapalı: devre dışı buton + gerekçe ------------------------
  if (!open) {
    const noticeKey = NOTICE_KEY_BY_STATUS[status ?? ''] ?? 'noticeApplicationsClosed'

    return (
      <div>
        <button
          type="button"
          disabled
          className={`${BUTTON_BASE} cursor-not-allowed border border-line-strong bg-surface-alt text-ink-500`}
        >
          {t('apply')}
        </button>
        <p role="status" className="mt-3 text-sm text-ink-700">
          {t(noticeKey)}
        </p>
      </div>
    )
  }

  // --- Başvuruya açık ------------------------------------------------------
  const activeClass = `${BUTTON_BASE} bg-brand-700 text-white hover:bg-brand-800 focus-visible:bg-brand-800`

  /*
    İletişim birimine yönlendirme: harici sistem yok, iletişim sayfasına gider.

    Sorgu dizesi taşınır (`?tur=basvuru&egitim=<id>`): iletişim sayfasındaki
    form "Eğitim Başvurusu" türüyle ve bu program seçili olarak açılır. Aksi
    hâlde ziyaretçi hangi eğitimden geldiğini elle yazmak zorunda kalır ve
    panele düşen kayıtta "Bağlı Eğitim" ilişkisi boş kalırdı.

    Form EK-1 gereği eğitim sayfasına GÖMÜLMEZ; kişisel veri yalnızca açık
    rıza metninin bulunduğu iletişim sayfasında toplanır.
  */
  /*
    'contact' ARTIK BAŞVURU ALMAZ — "iletişim birimine yazın" demektir.
    Başvuru süreci panelde yürütülür (Registrations); iletişim formundaki
    "Eğitim Başvurusu" türü kaldırıldı. Editör bu türü seçtiyse ziyaretçi
    genel iletişim sayfasına gider ve düğme öyle der. Eski 'contact'
    kayıtları göçle 'registration'a çevrildi; bu dal ancak editörün BİLİNÇLİ
    seçimiyle görülür.
  */
  if (type === 'contact') {
    return (
      <div>
        <Link href={href('contact', locale)} className={activeClass}>
          {t('contactUnitLink')}
        </Link>
        {target?.contactUnit ? (
          <p className="mt-3 text-sm text-ink-600">
            {t('contactUnit')}: {target.contactUnit}
          </p>
        ) : null}
      </div>
    )
  }

  /*
    SİTE İÇİ BAŞVURU ('registration') — ve hedefi çözülemeyen her tür.
    Portal "yakında" olduğu için `applicationHref` null dönerse ziyaretçi
    yine site içi forma alınır: editör portalı seçmiş olsa da başvuruyu
    kaybetmek en kötü sonuçtur; kayıt panelde görülür ve gerekirse portala
    elle aktarılır.
  */
  if (type === 'registration' || !applicationHref) {
    const contactHref = trainingId
      ? `${href('application', locale)}?egitim=${trainingId}`
      : href('application', locale)

    /*
      BUTON OTURUMA GÖRE DEĞİŞİR  (UX — aynı düğme iki kitleye hitap edemez)
      --------------------------------------------------------------------
      Önceki sürümde herkes aynı "Bilgi Al" düğmesini görüyordu. Giriş yapmış
      bir katılımcı için bu YANLIŞ EYLEMDİR: o kişi zaten kayıtlıdır, aradığı
      şey eğitimin materyalidir.

        oturum YOK → "Ön Başvuru Yap"            iletişim formuna gider
        oturum VAR → "Eğitim Materyallerine Git" kütüphaneye gider

      Karar İSTEMCİDE verilir (çerez httpOnly'dir); bu sunucu bileşeni iki
      olasılığı da hazırlar, seçimi `ApplicationCtaLink` yapar. Görsel
      sınıflar iki hâlde de AYNI — değişen yalnızca metin ve hedef.

      Hedef, egitimin materyallerine SUZULMUS kutuphanedir
      (`?egitim=<slug>`). Kutuphane sayfasi artik oturumu sunucuda
      okuyor, yani katilimci kendi seviyesindeki kayitlari da gorur.
    */
    return (
      <div>
        <ApplicationCtaLink
          bilgiHref={contactHref}
          bilgiEtiketi={t('preApply')}
          materyalHref={
            trainingSlug
              ? `${href('library', locale)}?egitim=${encodeURIComponent(trainingSlug)}`
              : href('library', locale)
          }
          materyalEtiketi={t('goToMaterials')}
          className={activeClass}
        />
        {target?.contactUnit ? (
          <p className="mt-3 text-sm text-ink-600">
            {t('contactUnit')}: {target.contactUnit}
          </p>
        ) : null}
      </div>
    )
  }

  // E-posta (mailto:) yeni sekmede açılmaz; harici adres ve portal açılır.
  if (type === 'email') {
    return (
      <a href={applicationHref} className={activeClass}>
        {t('apply')}
      </a>
    )
  }

  return (
    <ExternalLink href={applicationHref} trackId={`application:${type}`} className={activeClass}>
      {t('apply')}
    </ExternalLink>
  )
}

export default ApplicationCta
