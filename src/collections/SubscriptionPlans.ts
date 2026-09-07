import type { CollectionConfig } from 'payload'

import { canManageCommerce, canDeleteContent, publishedOrAuthenticated } from '@/access'
import { BILLING_PERIODS, CURRENCIES } from '@/fields/options'
import { translationStatusField } from '@/fields/publishing'
import { slugField } from '@/fields/slug'
import { syncTranslationStatus } from '@/hooks/syncTranslationStatus'

/**
 * ABONELİK SEVİYELERİ  (Commerce — B2B)
 * ============================================================================
 * Kurumların merkezin hizmetlerine erişim düzeyini tanımlayan paketler.
 * Kayıt bir SATIŞ nesnesi değil, bir TANIMDIR: fiyat listesi burada durur,
 * bir kuruma verilmiş abonelik `users` üzerinde (bkz. Users.ts → B2B
 * Abonelik sekmesi), pazarlık edilmiş özel koşullar ise `quotes` içinde.
 *
 * ---------------------------------------------------------------------------
 * İKİ FİYAT ALANI, TEK PARA BİRİMİ
 * ---------------------------------------------------------------------------
 * Aylık ve yıllık fiyat AYRI alanlardır; yıllık fiyat aylıktan
 * HESAPLANMAZ. Sebep: yıllık abonelikte indirim uygulamak kuralın kendisidir
 * ("12 ay öde, 10 ay kullan"), ve o indirim oranı pakete göre değişir.
 * Türetilmiş bir alan, kurumu tek bir orana mahkûm ederdi.
 *
 * İkisi de İSTEĞE BAĞLIDIR: yalnızca yıllık satılan bir paket, aylık alanı
 * boş bırakır ve arayüz o seçeneği hiç göstermez. Sıfır yazmak "ücretsiz"
 * demektir ve bambaşka bir şeydir — bu yüzden `0` ile boş ayrılır.
 *
 * ---------------------------------------------------------------------------
 * PARA — ANA BİRİMDE SAKLANIR, KURUŞTA HESAPLANIR
 * ---------------------------------------------------------------------------
 * Alanlar ana birimdedir (1500.00). Bu değerlerle yapılan HER aritmetik
 * `lib/money.ts` üzerinden geçmelidir; kayan nokta toplaması sessizce yanlış
 * sonuç verir. Gerekçe o dosyada.
 *
 * ---------------------------------------------------------------------------
 * FİYATLAR VERGİ HARİÇTİR
 * ---------------------------------------------------------------------------
 * Alan etiketleri bunu AÇIKÇA söyler. Vergi oranı ŞEMAYA KONMADI: merkez bir
 * kamu kuruluşudur ve KDV muafiyeti/oranı kurumun mali mevzuatına bağlıdır —
 * varsayılan bir oran uydurmak, kurumu yanlış bir tutar beyanına sokardı.
 * Vergi işlenecekse bu ayrı ve bilinçli bir karardır.
 *
 * ---------------------------------------------------------------------------
 * ÇOK DİLLİLİK
 * ---------------------------------------------------------------------------
 * Ad, açıklama ve özellik satırları yerelleştirilmiştir. Fiyat ve para birimi
 * DEĞİLDİR: 1500 TRY her dilde 1500 TRY'dir.
 * ============================================================================
 */
export const SubscriptionPlans: CollectionConfig = {
  slug: 'subscription-plans',
  labels: {
    singular: { tr: 'Abonelik Seviyesi', en: 'Subscription plan', ru: 'Тарифный план' },
    plural: { tr: 'Abonelik Seviyeleri', en: 'Subscription plans', ru: 'Тарифные планы' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'monthlyPrice', 'yearlyPrice', 'currency', '_status'],
    group: { tr: 'Ticari', en: 'Commerce', ru: 'Коммерция' },
    listSearchableFields: ['name'],
    description: {
      tr: 'Kurumsal abonelik paketleri ve liste fiyatları. Bir kuruma verilmiş abonelik Kullanıcılar altında tanımlanır.',
      en: 'Institutional subscription packages and list prices. A granted subscription is set on the user record.',
      ru: 'Пакеты корпоративной подписки и прейскурант.',
    },
  },
  access: {
    /*
      Paketler bir FİYAT LİSTESİDİR ve yayımlandığında herkese açıktır —
      ileride bir "paketler" sayfası kurulacaksa anonim ziyaretçi görmelidir.
      Taslak paketler yalnızca oturum açmış personele görünür.
    */
    read: publishedOrAuthenticated,
    create: canManageCommerce,
    update: canManageCommerce,
    delete: canDeleteContent,
  },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  defaultSort: 'order',
  hooks: {
    afterChange: [syncTranslationStatus(['name', 'description'])],
  },
  fields: [
    slugField({ from: 'name' }),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: { tr: 'Sıralama', en: 'Sort order', ru: 'Порядок' },
      admin: {
        position: 'sidebar',
        step: 10,
        description: {
          tr: 'Paketler bu sıraya göre listelenir. Alfabetik değil, kurumun sunmak istediği sıradır.',
          en: 'Plans are listed in this order — the order the institution wants, not alphabetical.',
          ru: 'Планы отображаются в этом порядке.',
        },
      },
    },
    translationStatusField,
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      label: { tr: 'Paket Adı', en: 'Plan name', ru: 'Название плана' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 400,
      label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' },
      admin: {
        description: {
          tr: 'Paketin kimin için olduğunu bir-iki cümlede söyleyin.',
          en: 'One or two sentences on who the plan is for.',
          ru: 'Одно-два предложения о том, для кого этот план.',
        },
      },
    },
    {
      /*
        ÖZELLİKLER — DİZİ, SERBEST METİN DEĞİL.
        Tek bir çok satırlı metin alanı da işi görürdü; dizi tercih edildi
        çünkü arayüz her satırı ayrı bir madde olarak basar ve editörün
        satır sonu koyup koymadığına bağlı kalmaz.
      */
      name: 'features',
      type: 'array',
      localized: true,
      label: { tr: 'Paket Özellikleri', en: 'Plan features', ru: 'Возможности плана' },
      labels: {
        singular: { tr: 'Özellik', en: 'Feature', ru: 'Возможность' },
        plural: { tr: 'Özellikler', en: 'Features', ru: 'Возможности' },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: { tr: 'Özellik', en: 'Feature', ru: 'Возможность' },
        },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'TRY',
      options: CURRENCIES,
      label: { tr: 'Para Birimi', en: 'Currency', ru: 'Валюта' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Aşağıdaki iki fiyat da bu para birimindedir.',
          en: 'Both prices below are in this currency.',
          ru: 'Обе цены указаны в этой валюте.',
        },
      },
    },
    {
      name: 'monthlyPrice',
      type: 'number',
      min: 0,
      label: { tr: 'Aylık Fiyat (vergiler hariç)', en: 'Monthly price (excl. tax)', ru: 'Цена в месяц (без налогов)' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Ana birimde yazın: 1500.00. BOŞ = aylık satılmıyor. 0 = ücretsiz — ikisi aynı şey değildir.',
          en: 'In major units, e.g. 1500.00. EMPTY = not sold monthly. 0 = free — these are not the same.',
          ru: 'В основных единицах. ПУСТО = не продаётся помесячно. 0 = бесплатно.',
        },
      },
    },
    {
      name: 'yearlyPrice',
      type: 'number',
      min: 0,
      label: { tr: 'Yıllık Fiyat (vergiler hariç)', en: 'Yearly price (excl. tax)', ru: 'Цена в год (без налогов)' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Aylık fiyattan HESAPLANMAZ; yıllık indirim oranı pakete göre değişir. BOŞ = yıllık satılmıyor.',
          en: 'Not derived from the monthly price — the annual discount differs per plan. EMPTY = not sold yearly.',
          ru: 'Не вычисляется из месячной цены. ПУСТО = не продаётся на год.',
        },
      },
    },
    {
      /*
        VARSAYILAN DÖNEM — yalnızca arayüz için bir tercihtir.
        Fiyatlandırma sayfasında hangi sekmenin açık geleceğini söyler;
        bir kısıt DEĞİLDİR. Kısıt, fiyat alanının boş olup olmamasıdır.
      */
      name: 'defaultBillingPeriod',
      type: 'select',
      defaultValue: 'yearly',
      options: BILLING_PERIODS,
      label: { tr: 'Öne Çıkan Dönem', en: 'Highlighted period', ru: 'Основной период' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Fiyat gösteriminde varsayılan olarak açılacak dönem. Satış kısıtı değildir.',
          en: 'Which period the price display opens on. Not a sales restriction.',
          ru: 'Период, открываемый по умолчанию. Не является ограничением.',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { tr: 'Önerilen paket', en: 'Recommended plan', ru: 'Рекомендуемый план' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Listede vurgulanır. Birden fazla paket işaretlenirse vurgu anlamını yitirir.',
          en: 'Highlighted in the list. Marking several plans defeats the purpose.',
          ru: 'Выделяется в списке.',
        },
      },
    },
  ],
}

export default SubscriptionPlans
