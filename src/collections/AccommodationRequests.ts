import { ValidationError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { canApproveAccounts, canDeleteContent, canManageRegistrations } from '@/access'
import { ayarlariCoz, doluGeceler, geceler, gunOf } from '@/lib/accommodation'

/**
 * ONAYDA KAPASİTE DENETİMİ
 * ============================================================================
 * Başvuru formu dolu geceye talebi reddeder (basvuru/actions.ts), ama doluluk
 * yalnızca ONAYLI taleplerden hesaplanır. Aynı geceye iki BEKLEYEN talep
 * gelebilir — ikisi de başvuru anında geçerlidir. Denetim yalnızca formda
 * kalsaydı personel ikisini de onaylayıp kapasiteyi aşabilirdi ve sistem
 * bunu fark etmezdi.
 *
 * Bu kanca, bir talep "Onaylandı" durumuna GEÇERKEN aynı hesabı
 * (lib/accommodation.ts → doluGeceler) diğer onaylı taleplerle yeniden yapar.
 * Dolu bir gece varsa onay reddedilir ve hangi gece olduğu söylenir.
 *
 *   - Yalnızca geçişte çalışır: zaten onaylı bir kaydın notunu düzenlemek
 *     engellenmez.
 *   - Kapasite girilmemişse (boş) doluluk hesaplanmaz; kurum rakamı girene
 *     kadar onay serbesttir — ayarın açıklaması da bunu söyler.
 *   - Kapalı dönemler burada DENETLENMEZ: dönemi kapatan da talebi onaylayan
 *     da kurumdur; kapalı bir döneme bilerek istisna yapabilmelidir. Kapasite
 *     ise fiziksel bir sınırdır.
 * ============================================================================
 */
const onaydaKapasiteDenetimi: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (data?.status !== 'approved') return data
  if (operation === 'update' && originalDoc?.status === 'approved') return data

  const ayar = ayarlariCoz(
    await req.payload.findGlobal({ slug: 'accommodation-settings', depth: 0, req }).catch(() => null),
  )
  if (!ayar.capacity) return data

  const giris = gunOf(data.checkIn ?? originalDoc?.checkIn)
  const cikis = gunOf(data.checkOut ?? originalDoc?.checkOut)
  if (!giris || !cikis) return data

  const digerleri = await req.payload.find({
    collection: 'accommodation-requests',
    where: {
      and: [
        { status: { equals: 'approved' } },
        { checkOut: { greater_than_equal: `${giris}T00:00:00.000Z` } },
        ...(originalDoc?.id != null ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
    req,
    select: { checkIn: true, checkOut: true } as never,
  })
  const dolu = doluGeceler(
    (digerleri.docs as unknown as { checkIn?: string; checkOut?: string }[])
      .map((d) => ({ checkIn: gunOf(d.checkIn), checkOut: gunOf(d.checkOut) }))
      .filter((d): d is { checkIn: string; checkOut: string } => Boolean(d.checkIn && d.checkOut)),
    ayar.capacity,
  )
  const doluGece = geceler(giris, cikis).find((g) => dolu.has(g))
  if (doluGece) {
    const tarih = new Date(`${doluGece}T00:00:00Z`).toLocaleDateString('tr-TR', { timeZone: 'UTC' })
    throw new ValidationError({
      collection: 'accommodation-requests',
      errors: [
        {
          path: 'status',
          message: `${tarih} gecesi için kapasite dolu (gecelik kapasite: ${ayar.capacity}). Çakışan bir talebi reddedin ya da Konaklama Ayarları'ndan kapasiteyi artırın.`,
        },
      ],
    })
  }
  return data
}

/**
 * KONAKLAMA TALEPLERİ — panelde ayrı bölüm  (kurum kararı, 29.09.2026)
 * ============================================================================
 * Eğitim başvurusunda "konaklamak istiyorum" seçilince başvuruyla birlikte bu
 * kayıt da açılır (basvuru/actions.ts). Kurum:
 *   1. listede telefon/e-posta/tarihleri görür,
 *   2. müsaitliğe bakıp talebi onaylar ya da reddeder,
 *   3. kişiyi arar ya da yazar. ONLINE ÖDEME YOKTUR.
 *
 * Tarihler, gece dağılımı ve tahmini ücret başvuru anında SUNUCUDA hesaplanıp
 * yazılır ve elle değiştirilemez (lib/accommodation.ts): kişiye gösterilen
 * tahminle kayıttaki rakam aynı kalmalı. Tarifeler sonradan değişirse eski
 * talebin tahmini değişmez — o, başvuru anındaki bilgidir.
 *
 * Genel API'den kayıt AÇILMAZ (`create: false`); tek giriş kapısı başvuru
 * formudur. Kişisel veri taşır: okuma/güncelleme yalnızca başvuruları
 * yöneten personeldedir.
 * ============================================================================
 */
export const AccommodationRequests: CollectionConfig = {
  slug: 'accommodation-requests',
  labels: {
    singular: { tr: 'Konaklama Talebi', en: 'Accommodation request', ru: 'Запрос на проживание' },
    plural: { tr: 'Konaklama Talepleri', en: 'Accommodation requests', ru: 'Запросы на проживание' },
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'training', 'checkIn', 'checkOut', 'nights', 'status', 'phone'],
    group: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' },
    listSearchableFields: ['fullName', 'email', 'phone'],
    description: {
      tr: 'Eğitim başvurusuyla gelen konaklama ön başvuruları. Müsaitliğe bakıp onaylayın ya da reddedin ve kişiyle iletişime geçin; online ödeme alınmaz. KVKK: kişisel veri içerir.',
      en: 'Accommodation pre-applications made with a training application. Check availability, approve or reject, and contact the person; no online payment.',
      ru: 'Предварительные заявки на проживание. Онлайн-оплаты нет.',
    },
  },
  access: {
    read: canManageRegistrations,
    create: () => false,
    update: canManageRegistrations,
    delete: canDeleteContent,
  },
  defaultSort: 'checkIn',
  hooks: {
    beforeChange: [onaydaKapasiteDenetimi],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { value: 'pending', label: { tr: 'Bekliyor', en: 'Pending', ru: 'Ожидает' } },
        { value: 'approved', label: { tr: 'Onaylandı', en: 'Approved', ru: 'Одобрено' } },
        { value: 'rejected', label: { tr: 'Reddedildi', en: 'Rejected', ru: 'Отклонено' } },
      ],
      label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
      access: { update: canApproveAccounts },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Yalnızca "Onaylandı" talepler doluluğa sayılır. Gecelik kapasite girilmişse, dolu bir geceye denk gelen talep onaylanamaz.',
          en: 'Only approved requests count towards occupancy. If a nightly capacity is set, a request overlapping a full night cannot be approved.',
          ru: 'В занятость засчитываются только одобренные. Если задана вместимость, запрос на заполненную ночь одобрить нельзя.',
        },
      },
    },
    {
      name: 'staffNote',
      type: 'textarea',
      label: { tr: 'Personel notu', en: 'Staff note', ru: 'Заметка сотрудника' },
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', label: { tr: 'Ad Soyad', en: 'Name', ru: 'Имя' }, admin: { readOnly: true, width: '34%' } },
        { name: 'phone', type: 'text', label: { tr: 'Telefon', en: 'Phone', ru: 'Телефон' }, admin: { readOnly: true, width: '33%' } },
        { name: 'email', type: 'email', label: { tr: 'E-posta', en: 'E-mail', ru: 'E-mail' }, admin: { readOnly: true, width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'registration', type: 'relationship', relationTo: 'registrations', label: { tr: 'Eğitim başvurusu', en: 'Registration', ru: 'Заявка' }, admin: { readOnly: true, width: '50%' } },
        { name: 'training', type: 'relationship', relationTo: 'training-programs', index: true, label: { tr: 'Eğitim', en: 'Training', ru: 'Обучение' }, admin: { readOnly: true, width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'checkIn', type: 'date', required: true, index: true, label: { tr: 'Giriş', en: 'Check-in', ru: 'Заезд' }, admin: { readOnly: true, width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        { name: 'checkOut', type: 'date', required: true, label: { tr: 'Çıkış', en: 'Check-out', ru: 'Выезд' }, admin: { readOnly: true, width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'nights', type: 'number', label: { tr: 'Gece', en: 'Nights', ru: 'Ночей' }, admin: { readOnly: true, width: '25%' } },
        { name: 'nightsInTraining', type: 'number', label: { tr: 'Eğitim içi gece', en: 'Nights in training', ru: 'Во время обучения' }, admin: { readOnly: true, width: '25%' } },
        { name: 'nightsOutside', type: 'number', label: { tr: 'Eğitim dışı gece', en: 'Nights outside', ru: 'Вне обучения' }, admin: { readOnly: true, width: '25%' } },
        {
          name: 'estimatedCost',
          type: 'number',
          label: { tr: 'Tahmini ücret', en: 'Estimated cost', ru: 'Ориентировочная стоимость' },
          admin: {
            readOnly: true,
            width: '25%',
            description: {
              tr: 'Başvuru anındaki tarifelerle. Boşsa tarife girilmemişti.',
              en: 'At the rates in force when applying. Empty = no rates were set.',
              ru: 'По тарифам на момент заявки.',
            },
          },
        },
      ],
    },
    { name: 'currency', type: 'text', label: { tr: 'Para birimi', en: 'Currency', ru: 'Валюта' }, admin: { readOnly: true } },
  ],
}

export default AccommodationRequests
