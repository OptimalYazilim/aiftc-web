import { APIError, type CollectionConfig } from 'payload'

import {
  canAccessAdminPanel,
  canApproveAccounts,
  canRegister,
  canManageAccounts,
  isAdmin,
  isAdminFieldLevel,
  isAdminOrSelf,
} from '@/access'
import { AUDIENCE_ROLES } from '@/fields/options'

/**
 * Yonetim paneli kullanicilari (Sartname 11.2 + 12.1 rol tabanli yetkilendirme).
 *
 * IKI AYRI ROL EKSENI VARDIR — karistirmayin:
 *   roles (cogul)  PANEL yetkisi: admin / editor / author / viewer
 *   role  (tekil)  SITE erisim seviyesi: admin / staff / instructor / trainee
 * Ayrintili gerekce `role` alaninin ustundeki nottadir.
 *
 * KAPSAM NOTU — ACIK MADDE
 * Bu koleksiyon bugune kadar YALNIZCA icerik yoneticileri icindi; site
 * ziyaretcisi icin uyelik yoktu (12.2: "Gereksiz kisisel veri
 * toplanmayacaktir"). Sartname 1.7 erisim seviyeleri istedigi icin `role`
 * alani eklendi ve kutuphane okumasi ona bagli calisiyor.
 *
 * ANCAK SITEDE HENUZ ZIYARETCI GIRISI YOKTUR: `trainee`/`instructor` rolleri
 * su an yalnizca panelden acilan hesaplara verilebilir. Katilimcilarin kendi
 * hesaplariyla oturum acmasi gerekiyorsa ayri bir kimlik akisi (davetle hesap
 * acma, sifre sifirlama e-postasi) kurulmalidir — bkz.
 * docs/access-control-guide.md, "Bilinen sinirlar".
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { tr: 'Kullanıcı', en: 'User', ru: 'Пользователь' },
    plural: { tr: 'Kullanıcılar', en: 'Users', ru: 'Пользователи' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'updatedAt'],
    group: { tr: 'Sistem', en: 'System', ru: 'Система' },
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 saat
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 dakika kilit (Sartname 12.1)
    useAPIKey: false,
    depth: 0,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: isAdminOrSelf,
    /*
      DISARIDAN KAYDA ACIK — ama guvenli. Anonim istek `beforeChange`
      kancasindan gecer ve rolu/durumu ZORLA katilimci+onay bekliyor yapilir
      (bkz. asagidaki hooks blogu). Gerekce: access/index.ts -> canRegister
    */
    create: canRegister,
    update: canManageAccounts,
    delete: isAdmin,
    /*
      DUZELTME: eskiden `Boolean(user)` idi — oturum acan HERKES paneli
      acabiliyordu. Katilimci kaydi disariya acilinca bu bir acik olurdu.
    */
    admin: canAccessAdminPanel,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { tr: 'Ad Soyad', en: 'Full name', ru: 'ФИО' },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      /*
        ZORUNLU DEGIL ve varsayilani BOS.
        Eskiden `required: true, defaultValue: ['author']` idi. Kayit disariya
        acilinca her katilimci PANEL ICERIK YETKISI ile dogardi. Bos dizi =
        panel erisimi yok; hedef kitle rolu (`role`) ayri eksende durur.
      */
      defaultValue: [],
      saveToJWT: true,
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      label: { tr: 'Roller', en: 'Roles', ru: 'Роли' },
      options: [
        { value: 'admin', label: { tr: 'Yönetici', en: 'Administrator', ru: 'Администратор' } },
        { value: 'editor', label: { tr: 'Editör (yayımlayabilir)', en: 'Editor (can publish)', ru: 'Редактор' } },
        { value: 'author', label: { tr: 'İçerik Girişi (taslak)', en: 'Author (draft only)', ru: 'Автор' } },
        { value: 'viewer', label: { tr: 'Görüntüleyici', en: 'Viewer', ru: 'Наблюдатель' } },
      ],
      admin: {
        description: {
          tr: 'İçerik Girişi rolü yayımlama yapamaz; kayıtları taslak olarak bırakır.',
          en: 'The Author role cannot publish; records stay as drafts.',
          ru: 'Роль «Автор» не может публиковать; записи остаются черновиками.',
        },
      },
    },
    {
      /*
        ============================================================
        `role` (TEKİL) ile `roles` (ÇOĞUL) AYNI ŞEY DEĞİLDİR
        ============================================================
        Adları bir harf farklıdır; karıştırmak sessiz bir yetki açığı
        doğurur. Ayrım şudur:

          roles  → PANELDE ne yapabilir (oluştur / yayımla / sil)
          role   → SİTEDE ne görebilir (kütüphane erişim seviyesi)

        İki eksen dikeydir: bir eğitmenin panelde hiçbir yetkisi
        olmayabilir; bir editör de eğitim katılımcısı olmayabilir.

        Erişim kontrolünde `user.role` KULLANILIR (bkz. access/index.ts →
        `libraryReadAccess`); `user.roles` panel yetkisi içindir.
      */
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      index: true,
      /*
        `saveToJWT`: erişim kontrolü her istekte bu değeri okur. Jetona
        yazılmazsa Payload kullanıcıyı her kontrolde veritabanından çeker.
      */
      saveToJWT: true,
      access: {
        // Kullanıcı kendi erişim seviyesini yükseltemez.
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      options: AUDIENCE_ROLES,
      label: { tr: 'Erişim Rolü', en: 'Access role', ru: 'Роль доступа' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Şartname 1.7. Kullanıcının SİTEDE hangi kütüphane kayıtlarını görebileceğini belirler. Panel yetkisi için üstteki Roller alanına bakın.',
          en: 'Spec 1.7. Controls which library records the user can see ON THE SITE. Panel permissions are the separate Roles field.',
          ru: 'П. 1.7. Определяет, какие записи библиотеки видны пользователю на сайте.',
        },
      },
    },
    {
      /*
        HESAP DURUMU  (Şartname 1.7 — kayıt ve onay)
        ---------------------------------------------------------------------
        Varsayılan `pending`: dışarıdan gelen her kayıt ONAY BEKLER. Değer
        `beforeChange` kancasında ayrıca ZORLANIR — istemcinin gönderdiği
        değere güvenilmez.

        Alanı yalnızca yönetici ve OGM/UOEM personeli değiştirebilir
        (`canApproveAccounts`). Kullanıcı kendi kaydını güncelleyebilir
        (`isAdminOrSelf`) ama BU ALANI değiştiremez — aksi hâlde kendi
        hesabını onaylardı.
      */
      name: 'accountStatus',
      type: 'select',
      required: true,
      /*
        `defaultValue` YOK — bilincli.
        Alan varsayilani `data` nesnesini kanca calismadan ONCE doldurur; o
        durumda "yonetici acikca deger verdi mi?" sorusu yanitlanamiyordu ve
        yoneticinin actigi hesap da `pending` geliyordu (olculdu). Deger
        `beforeValidate` icinde, kimin actigina gore atanir.
      */
      index: true,
      saveToJWT: true,
      access: {
        create: canApproveAccounts,
        update: canApproveAccounts,
      },
      options: [
        { value: 'pending', label: { tr: 'Onay Bekliyor', en: 'Pending', ru: 'Ожидает' } },
        { value: 'approved', label: { tr: 'Onaylandı', en: 'Approved', ru: 'Одобрено' } },
        { value: 'suspended', label: { tr: 'Askıya Alındı', en: 'Suspended', ru: 'Приостановлено' } },
      ],
      label: { tr: 'Hesap Durumu', en: 'Account status', ru: 'Статус аккаунта' },
      admin: {
        position: 'sidebar',
        description: {
          tr: 'Şartname 1.7. “Onaylandı” dışındaki hesaplar GİRİŞ YAPAMAZ. Dışarıdan gelen kayıtlar “Onay Bekliyor” olarak düşer.',
          en: 'Spec 1.7. Accounts other than Approved cannot log in. Public registrations arrive as Pending.',
          ru: 'П. 1.7. Аккаунты кроме «Одобрено» не могут войти.',
        },
      },
    },
    {
      name: 'unit',
      type: 'text',
      label: { tr: 'Birim', en: 'Unit', ru: 'Подразделение' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'preferredAdminLanguage',
      type: 'select',
      defaultValue: 'tr',
      label: { tr: 'Panel Dili', en: 'Admin language', ru: 'Язык панели' },
      options: [
        { value: 'tr', label: 'Türkçe' },
        { value: 'en', label: 'English' },
        { value: 'ru', label: 'Русский' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    /*
      ======================================================================
      DIŞARIDAN KAYIT SANITASYONU  (Şartname 1.7)
      ======================================================================
      Alan düzeyi `access` kuralları istemcinin gönderdiği değeri REDDEDER
      ama bu kanca ayrıca ZORLAR. İki katman bilinçlidir: alan erişimi
      Payload sürümüne ve `overrideAccess` bayrağına bağlıdır; bir seed
      betiği veya iç çağrı yanlışlıkla erişimi aştığında bu kanca son
      savunma hattıdır.

      OTURUM YOKSA (dışarıdan kayıt):
        roles          → []          panel yetkisi VERİLMEZ
        role           → trainee     katılımcı
        accountStatus  → pending     yönetici onayı bekler
      İstemcinin ne gönderdiğine BAKILMAZ.

      YÖNETİCİ PANELDEN AÇIYORSA:
        accountStatus  → approved    (açıkça başka değer verilmediyse)
      Gerekçe: yönetici zaten kimin hesabını açtığını biliyor; kendi açtığı
      hesabı ayrıca onaylatmak anlamsız bir adım olurdu.
    */
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data

        if (!req.user) {
          return {
            ...data,
            roles: [],
            role: 'trainee',
            accountStatus: 'pending',
          }
        }

        return { ...data, accountStatus: data.accountStatus ?? 'approved' }
      },
    ],

    /*
      ======================================================================
      GİRİŞ ENGELİ  (Şartname 1.7)
      ======================================================================
      `beforeLogin` parola DOĞRULANDIKTAN SONRA çalışır. Yani onaysız hesap
      doğru parolayla bile içeri giremez.

      NEDEN BURADA, `access.read` İÇİNDE DEĞİL
      Okuma erişimi kaydı gizler; oturum açmayı engellemez. Onaysız bir
      hesap giriş yapabilseydi kendi kaydını okuyabilir, jetonu alır ve
      `role` alanına bağlı her kapıyı yoklayabilirdi.

      MESAJ AYRIMI BİLİNÇLİ: "onay bekliyor" ile "askıya alındı" farklı
      şeylerdir ve kullanıcının hangisi olduğunu bilmesi gerekir — birine
      beklemek, diğerine kurumla iletişime geçmek düşer.
    */
    beforeLogin: [
      ({ user }) => {
        const durum = (user as { accountStatus?: unknown } | null | undefined)?.accountStatus

        if (durum === 'approved') return user

        if (durum === 'suspended') {
          throw new APIError(
            'Hesabınız askıya alınmıştır. Lütfen eğitim koordinatörünüzle iletişime geçin.',
            403,
          )
        }

        throw new APIError(
          'Hesabınız yönetici onayı beklemektedir. Onaylandığında giriş yapabilirsiniz.',
          403,
        )
      },
    ],
  },
  timestamps: true,
}

export default Users
