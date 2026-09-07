import type { CollectionConfig } from 'payload'

import { canManageCommerce, isAdmin, quoteReadAccess } from '@/access'
import { CURRENCIES, QUOTE_STATUSES } from '@/fields/options'
import { kalemTutari, toplamTutar } from '@/lib/money'

/**
 * TEKLİFLER  (Commerce — B2B)
 * ============================================================================
 * Bir kuruma hazırlanan fiyat teklifi. `subscription-plans` bir LİSTE
 * FİYATIDIR; bu koleksiyon PAZARLIK EDİLMİŞ olanı tutar: kalemler, adetler,
 * geçerlilik süresi ve onay durumu.
 *
 * ---------------------------------------------------------------------------
 * TOPLAM ELLE YAZILMAZ — HESAPLANIR
 * ---------------------------------------------------------------------------
 * `lineTotal` ve `total` alanları SALT OKUNURDUR ve `beforeChange` kancasında
 * kalemlerden üretilir. Editörün yazdığı bir toplam, kalemler değiştiğinde
 * sessizce yanlış kalır ve bu hatayı fark etmek zordur: ekranda hem kalemler
 * hem toplam "doğru görünür", yalnızca birbirini tutmaz.
 *
 * Hesap `lib/money.ts` üzerinden KURUŞ aritmetiğiyle yapılır; kayan noktayla
 * doğrudan toplama `19.99 * 3 = 59.97000000000001` üretir. Gerekçe o dosyada.
 *
 * ---------------------------------------------------------------------------
 * KUR DÖNÜŞÜMÜ YOKTUR
 * ---------------------------------------------------------------------------
 * Bir teklifin TEK bir para birimi vardır ve tüm kalemler o birimdedir.
 * Kalem başına para birimi konsaydı toplam alabilmek için kur gerekirdi; kur
 * ise tarihe bağlıdır, kaynağı vardır ve teklif dondurulduğunda saklanması
 * gerekir. Bu ayrı bir sistemdir ve kurum onu istemeden kurulmamalıdır.
 *
 * ---------------------------------------------------------------------------
 * VERGİ ŞEMADA YOKTUR
 * ---------------------------------------------------------------------------
 * Alan etiketi toplamın VERGİLER HARİÇ olduğunu açıkça söyler. Bir KDV oranı
 * uydurmak, kamu kurumunu yanlış bir tutar beyanına sokardı: merkez bir kamu
 * kuruluşudur ve muafiyet/oran mali mevzuatına bağlıdır. Vergi işlenecekse
 * bu bilinçli bir karardır ve oranın kaynağı kurumdur.
 *
 * ---------------------------------------------------------------------------
 * "SÜRESİ DOLMUŞ" BİR DURUM DEĞİLDİR
 * ---------------------------------------------------------------------------
 * `QUOTE_STATUSES` içinde `expired` yoktur. Süre dolması `validUntil`
 * alanından TÜRETİLİR; ayrı bir durum olarak saklansaydı onu güncelleyecek
 * bir zamanlayıcı gerekirdi ve zamanlayıcı kurulmadığı gün her kayıt
 * "geçerli" görünmeye devam ederdi. Sorgu: `validUntil < bugün`.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİM — TİCARİ VE KİŞİSEL VERİ
 * ---------------------------------------------------------------------------
 * Kayıtlar müşteri adı, iletişim kişisi ve fiyat taşır.
 *   read   → personel tümünü; diğer oturumlar YALNIZCA kendi teklifini
 *            (`quoteReadAccess`, filtre döner — yetkisiz istek 404 alır,
 *            bir teklifin var olduğunu bile öğrenemez)
 *   yazma  → yalnızca `canManageCommerce`
 *   silme  → yalnızca `admin`; teklif ticari bir kayıttır, editör silemez
 *
 * `create` ANONİME KAPALIDIR. Ziyaretçi teklif TALEBİ `form-requests`
 * üzerinden gelir; buraya yazma açılsaydı koleksiyon doğrudan spam hedefi
 * olurdu.
 * ============================================================================
 */

/** Kalem dizisinin kanca içindeki en dar tipi. */
type Kalem = {
  description?: unknown
  quantity?: unknown
  unitPrice?: unknown
  lineTotal?: number
}

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: {
    singular: { tr: 'Teklif', en: 'Quote', ru: 'Коммерческое предложение' },
    plural: { tr: 'Teklifler', en: 'Quotes', ru: 'Коммерческие предложения' },
  },
  admin: {
    useAsTitle: 'quoteNumber',
    defaultColumns: ['quoteNumber', 'customerName', 'status', 'total', 'validUntil'],
    group: { tr: 'Ticari', en: 'Commerce', ru: 'Коммерция' },
    listSearchableFields: ['quoteNumber', 'customerName', 'contactEmail'],
    description: {
      tr: 'Kurumlara hazırlanan fiyat teklifleri. Toplam tutar kalemlerden otomatik hesaplanır; elle değiştirilemez.',
      en: 'Price quotes prepared for institutions. The total is computed from line items and cannot be edited.',
      ru: 'Коммерческие предложения. Итог рассчитывается автоматически.',
    },
  },
  access: {
    read: quoteReadAccess,
    create: canManageCommerce,
    update: canManageCommerce,
    delete: isAdmin,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data

        /*
          KALEM TUTARLARI VE TOPLAM — HER KAYITTA YENİDEN HESAPLANIR.
          Gelen değere bakılmaz: alanlar panelde salt okunurdur ama API'ye
          doğrudan istek atan bir istemci onları gönderebilir. Hesabın tek
          kaynağı kalemlerdir.
        */
        const kalemler = Array.isArray(data.items) ? (data.items as Kalem[]) : []

        const hesaplanan = kalemler.map((kalem) => ({
          ...kalem,
          lineTotal: kalemTutari(kalem?.unitPrice, kalem?.quantity),
        }))

        return {
          ...data,
          items: hesaplanan,
          total: toplamTutar(hesaplanan.map((kalem) => kalem.lineTotal)),
        }
      },
    ],
  },
  fields: [
    {
      /*
        TEKLİF NUMARASI — yazışmanın tutamağı.
        Numarasız bir teklif telefonda konuşulamaz. `unique` olması bilinçli
        bir emniyet valfidir: aynı numarayı taşıyan iki kayıt oluşamaz.

        AÇIK MADDE — otomatik numaralandırma YOKTUR. Sıra üretmek ya bir
        veritabanı dizisi ya da "say + 1" gerektirir; ikincisi eşzamanlı iki
        kayıtta aynı numarayı üretir ve `unique` kısıtı isteklerden birini
        reddeder. Görünür bir hata, sessiz bir çakışmadan iyidir — ama iyisi,
        kurumun kendi numaralandırma düzenini (yıl, birim kodu, sıra)
        yazmasıdır. Bu yüzden alan ELLE doldurulur.
      */
      name: 'quoteNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { tr: 'Teklif No', en: 'Quote number', ru: 'Номер предложения' },
      admin: {
        description: {
          tr: 'Kurumun kendi numaralandırma düzeni. Örn. “TKL-2026-014”. Aynı numara iki kez kullanılamaz.',
          en: 'The institution’s own numbering scheme, e.g. “Q-2026-014”. Must be unique.',
          ru: 'Собственная схема нумерации организации. Должен быть уникальным.',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: QUOTE_STATUSES,
      label: { tr: 'Durum', en: 'Status', ru: 'Статус' },
      admin: {
        position: 'sidebar',
        description: {
          tr: '“Süresi dolmuş” bir durum değildir; geçerlilik tarihinden okunur.',
          en: '“Expired” is not a status — it is read from the validity date.',
          ru: '«Истёк» не является статусом — определяется по дате действия.',
        },
      },
    },
    {
      /*
        GEÇERLİLİK TARİHİ — zorunludur.
        Süresiz bir fiyat teklifi kurumu bağlar: iki yıl sonra ortaya çıkan
        bir teklif hâlâ "geçerli" sayılabilir. Tarih zorunlu olduğunda bu
        soru her teklifte bir kez ve bilerek cevaplanır.
      */
      name: 'validUntil',
      type: 'date',
      required: true,
      index: true,
      label: { tr: 'Geçerlilik Tarihi', en: 'Valid until', ru: 'Действительно до' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
        description: {
          tr: 'Bu tarihten sonra teklif bağlayıcı değildir. Zorunludur: süresiz teklif kurumu bağlar.',
          en: 'After this date the quote is not binding. Required — an open-ended quote binds the institution.',
          ru: 'После этой даты предложение необязывающее.',
        },
      },
    },

    // ---------------------------------------------------------------------
    // MÜŞTERİ
    // ---------------------------------------------------------------------
    {
      /*
        KURUM ADI SERBEST METİNDİR, İLİŞKİ DEĞİL.
        Teklif çoğu zaman henüz sistemde hesabı OLMAYAN bir kuruma
        hazırlanır — sıra zaten tersidir: önce teklif, sonra hesap. Zorunlu
        bir ilişki, teklif hazırlamak için önce sahte bir kullanıcı açmayı
        gerektirirdi.
      */
      name: 'customerName',
      type: 'text',
      required: true,
      index: true,
      label: { tr: 'Kurum / Müşteri', en: 'Institution / customer', ru: 'Организация / клиент' },
      admin: {
        description: {
          tr: 'Teklifin hazırlandığı kurumun adı. Sistemde hesabı olması gerekmez.',
          en: 'The institution the quote is for. It does not need an account in the system.',
          ru: 'Организация, для которой готовится предложение.',
        },
      },
    },
    {
      /*
        KULLANICI İLİŞKİSİ İSTEĞE BAĞLIDIR ve iki işi vardır:
          1. Teklifi bir hesaba bağlar,
          2. `quoteReadAccess` bu alana bakarak müşterinin KENDİ teklifini
             görmesini sağlar.
        Boş bırakılan teklifi yalnızca personel görür.
      */
      name: 'customerUser',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: { tr: 'İlgili Kullanıcı Hesabı', en: 'Linked user account', ru: 'Связанная учётная запись' },
      admin: {
        description: {
          tr: 'Doldurulursa bu kullanıcı kendi teklifini sitede görebilir. Boşsa teklifi yalnızca personel görür.',
          en: 'If set, this user can see their own quote. If empty, only staff can see it.',
          ru: 'Если указано, пользователь увидит своё предложение.',
        },
      },
    },
    {
      name: 'contactPerson',
      type: 'text',
      label: { tr: 'İletişim Kişisi', en: 'Contact person', ru: 'Контактное лицо' },
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: { tr: 'İletişim E-postası', en: 'Contact e-mail', ru: 'Электронная почта' },
    },

    // ---------------------------------------------------------------------
    // KALEMLER VE TUTAR
    // ---------------------------------------------------------------------
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
          tr: 'Teklifin TAMAMI bu para birimindedir; kalem başına farklı birim kullanılamaz.',
          en: 'The WHOLE quote is in this currency; per-line currencies are not supported.',
          ru: 'Всё предложение в этой валюте.',
        },
      },
    },
    {
      /*
        KALEMLER — ALT DİZİ, JSON DEĞİL.
        JSON bir sütunda da tutulabilirdi; dizi tercih edildi çünkü:
          - her alan TİPLİDİR ve panelde doğrulanır (adet gerçekten sayıdır),
          - sıra korunur ve editör kalemleri sürükleyerek düzenleyebilir,
          - satırlar sorgulanabilir (hangi tekliflerde şu hizmet geçiyor?).
        JSON'da bunların üçü de elle yazılan koda kalırdı.
      */
      name: 'items',
      type: 'array',
      minRows: 1,
      label: { tr: 'Teklif Kalemleri', en: 'Line items', ru: 'Позиции предложения' },
      labels: {
        singular: { tr: 'Kalem', en: 'Line item', ru: 'Позиция' },
        plural: { tr: 'Kalemler', en: 'Line items', ru: 'Позиции' },
      },
      admin: {
        description: {
          tr: 'En az bir kalem gereklidir. Satır tutarı ve genel toplam otomatik hesaplanır.',
          en: 'At least one line is required. Line and grand totals are computed automatically.',
          ru: 'Нужна минимум одна позиция. Суммы рассчитываются автоматически.',
        },
      },
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
          label: { tr: 'Açıklama', en: 'Description', ru: 'Описание' },
          admin: {
            description: {
              tr: 'Örn. “Entegre Yangın Yönetimi eğitimi — 12 katılımcı”.',
              en: 'e.g. “Integrated Fire Management training — 12 participants”.',
              ru: 'Например: «Обучение — 12 участников».',
            },
          },
        },
        {
          /*
            ADET TAM SAYIDIR. Kesirli adet (2,5 gün) gerekiyorsa birim
            değiştirilir — gerekçe: lib/money.ts → `kalemTutari`.
          */
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          label: { tr: 'Adet', en: 'Quantity', ru: 'Количество' },
          admin: { step: 1 },
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          min: 0,
          label: { tr: 'Birim Fiyat', en: 'Unit price', ru: 'Цена за единицу' },
          admin: {
            description: {
              tr: 'Ana birimde: 1500.00. Teklifin para birimindedir.',
              en: 'In major units, e.g. 1500.00, in the quote’s currency.',
              ru: 'В основных единицах, в валюте предложения.',
            },
          },
        },
        {
          name: 'lineTotal',
          type: 'number',
          label: { tr: 'Satır Tutarı', en: 'Line total', ru: 'Сумма строки' },
          admin: {
            readOnly: true,
            description: {
              tr: 'Birim fiyat × adet. Otomatik hesaplanır; elle değiştirilemez.',
              en: 'Unit price × quantity. Computed; not editable.',
              ru: 'Цена × количество. Рассчитывается автоматически.',
            },
          },
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      index: true,
      label: { tr: 'Toplam (vergiler hariç)', en: 'Total (excl. tax)', ru: 'Итого (без налогов)' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          tr: 'Kalemlerin toplamı. Otomatik hesaplanır. VERGİLER HARİÇTİR — vergi oranı bu şemada tutulmaz.',
          en: 'Sum of the line items, computed automatically. EXCLUDES TAX — no tax rate is stored in this schema.',
          ru: 'Сумма позиций, рассчитывается автоматически. БЕЗ НАЛОГОВ.',
        },
      },
    },
    {
      /*
        İÇ NOT — müşteriye gitmez.
        Teklife eşlik eden pazarlık bilgisi ("indirim genel müdür onayıyla")
        bir yere yazılmalıdır; yazılacak yer olmazsa bu bilgi e-postalarda
        dağılır. Alanın müşteriye gösterilmediği etiketinde yazılıdır.
      */
      name: 'internalNotes',
      type: 'textarea',
      label: { tr: 'İç Notlar (müşteriye gösterilmez)', en: 'Internal notes (not shown to the customer)', ru: 'Внутренние заметки' },
    },
  ],
}

export default Quotes
