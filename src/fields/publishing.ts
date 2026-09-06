import type { Field } from 'payload'

import { canPublishContent, canPublishFieldLevel } from '@/access'
import { REVIEW_STATUSES } from '@/fields/options'

/**
 * Yayin bilgileri (Sartname EK-2 1.6 icerik yonetim is akisi ile uyumlu,
 * EK-1 tarafinda haber/egitim/duyuru yayimlama icin kullanilir).
 *
 * Not: taslak/yayin durumunun kendisi (`_status`) Payload'in `versions.drafts`
 * ozelligi tarafindan yonetilir. Buradaki alanlar tarih ve sorumluluk bilgisidir.
 */
export const publishingFields: Field = {
  type: 'row',
  fields: [
    {
      name: 'publishedAt',
      type: 'date',
      label: { tr: 'Yayın Tarihi', en: 'Published at', ru: 'Дата публикации' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
      },
      access: { update: canPublishFieldLevel },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) return new Date().toISOString()
            return value
          },
        ],
      },
    },
  ],
}

/**
 * Icerigin hangi dillerde tamamlandigini gosteren, DILE BAGLI OLMAYAN alan.
 *
 * Sartname 5: "Eksik ceviri bulunan icerikler yonetim panelinde gorulebilmelidir."
 * Bu alan `syncTranslationStatus` hook'u tarafindan otomatik doldurulur ve
 * admin listesinde kolon olarak gosterilir; editor elle doldurmaz.
 */
export const translationStatusField: Field = {
  name: 'translationStatus',
  type: 'json',
  localized: false,
  label: { tr: 'Çeviri Durumu', en: 'Translation status', ru: 'Статус перевода' },
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: {
      tr: 'Otomatik hesaplanır. Eksik dilleri gösterir.',
      en: 'Calculated automatically. Shows missing locales.',
      ru: 'Рассчитывается автоматически. Показывает недостающие языки.',
    },
  },
}

/**
 * ICERIK YONETIM IS AKISI ALANI  (Sartname 1.6)
 * ============================================================================
 * `_status` ILE FARKI — ikisi de gerekli, biri digerinin yerine gecmez
 * ---------------------------------------------------------------------------
 *   _status       Payload'in kendi alani. TEKNIK yayin durumu: kayit sitede
 *                 gorunuyor mu? `versions.drafts` bunu yonetir ve surum
 *                 gecmisi/geri alma bu alana baglidir.
 *   reviewStatus  EDITORYAL surec: kayit hangi asamada? Kim inceledi?
 *
 * Bir kayit `approved` olup HENUZ YAYIMLANMAMIS olabilir (onay verildi, yayin
 * tarihi bekleniyor). Tek alanla ifade edilseydi bu durum kaybolurdu.
 *
 * ---------------------------------------------------------------------------
 * "YAYINDA" DEGERINI HERKES SECEMEZ
 * ---------------------------------------------------------------------------
 * Kural alan duzeyi `access` ile DEGIL, `validate` ile uygulanir. Sebep:
 * Payload'in alan erisimi islem bazlidir (yazabilir/yazamaz) ve GELEN DEGERI
 * goremez. Oysa kural degere baglidir — personel `in_review` yazabilmeli ama
 * `published` yazamamalidir. `validate` hem degeri hem `req.user`i gorur.
 *
 * Reddedilen deger kullaniciya ANLASILIR bir mesajla doner; sessizce
 * yok sayilmaz.
 * ============================================================================
 */
export const reviewStatusField: Field = {
  name: 'reviewStatus',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  index: true,
  options: REVIEW_STATUSES,
  label: { tr: 'İş Akışı Durumu', en: 'Workflow status', ru: 'Статус процесса' },
  /**
   * YAYINA ALMA YETKİSİ — ÜÇ KAPILI KONTROL
   * ---------------------------------------------------------------------------
   * Alan `access` yerine `validate` ile korunur, çünkü Payload'ın alan
   * erişimi İŞLEM tabanlıdır (create/update) ve GELEN DEĞERİ göremez; oysa
   * kural değere bağlıdır: "published" yasak, "approved" serbest.
   *
   * İlk sürüm yalnızca değere bakıyordu ve İKİ ARIZA üretti — ikisi de
   * ölçüldü (2026-09-06):
   *
   *   1. İNDİRME SAYACI SESSİZCE ÖLDÜ. `/api/library/[id]/hit` ucu
   *      `overrideAccess: true` ve kullanıcısız çalışır; yayımlanmış bir
   *      kaydın `downloads` alanını artırmak istediğinde bu doğrulama
   *      devreye giriyor ve tüm güncellemeyi reddediyordu:
   *          ValidationError → "Yayına alma yetkiniz yok" (path: reviewStatus)
   *      Uç nokta hatayı bilerek yuttuğu için sayaç 3'te takılı kalmış,
   *      hiçbir yerde hata görünmemişti.
   *
   *   2. YAZAR, YAYIMLANMIŞ BİR KAYDI HİÇ DÜZENLEYEMİYORDU. Yayına alma
   *      yetkisi olmayan bir yazar, zaten yayımlanmış bir kaydın yalnızca
   *      özetini düzeltmek istese bile doğrulama patlıyordu — çünkü
   *      `reviewStatus` alanı DEĞİŞMESE DE her güncellemede yeniden
   *      doğrulanır. Oysa ortada yetkilendirilecek bir eylem yoktur:
   *      kayıt zaten yayında.
   *
   * Kural şu üç kapıdan geçer:
   *
   *   a) Değer "published" değilse — sorulacak bir şey yok.
   *   b) `overrideAccess` true ise erişim denetimi ZATEN atlanmıştır (sunucu
   *      içi betikler, hook'lar, sayaç ucu). Bu bir yetki kontrolüdür ve
   *      Payload'ın geri kalanıyla aynı bayrağa uymalıdır. Panel ve REST
   *      isteklerinde bu bayrak DAİMA false'tur, dolayısıyla kural orada
   *      tam olarak çalışmaya devam eder.
   *   c) Değer DEĞİŞMİYORSA (`previousValue === 'published'`) yetkilendirilecek
   *      bir geçiş yoktur.
   *
   * Ancak bunlardan sonra "kim yayına alıyor" sorusu sorulur. `previousValue`
   * gelmezse (tip tanımında isteğe bağlıdır) kapı (c) atlanır ve kontrol
   * GÜVENLİ tarafa, yani yetki sorgusuna düşer.
   */
  validate: (value: unknown, options: unknown) => {
    if (value !== 'published') return true

    const opts = options as
      | { req?: { user?: unknown }; overrideAccess?: boolean; previousValue?: unknown }
      | undefined

    if (opts?.overrideAccess) return true
    if (opts?.previousValue === 'published') return true
    if (canPublishContent(opts?.req?.user)) return true

    return 'Yayına alma yetkiniz yok. Kaydı “Onaylandı” durumuna getirin; yayımlamayı editör veya yönetici yapar.'
  },
  admin: {
    position: 'sidebar',
    description: {
      tr: 'Şartname 1.6. Editöryal süreç. Sitede görünürlük için ayrıca kaydı YAYIMLAMANIZ gerekir (sağ üstteki Yayımla düğmesi).',
      en: 'Spec 1.6. Editorial workflow. Visibility on the site still requires publishing the record.',
      ru: 'П. 1.6. Редакционный процесс. Для показа на сайте запись нужно опубликовать.',
    },
  },
}
