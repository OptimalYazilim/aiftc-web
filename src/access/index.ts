import type { Access, FieldAccess, Where } from 'payload'

import { ACCESS_LEVEL_TO_ROLE, DOCUMENT_ACCESS_LEVEL_TO_ROLES } from '@/fields/options'
import { genelKayitAcik } from '@/lib/publicRegistration'
import { aboneligiEksik } from '@/lib/subscription'
import type { User } from '@/payload-types'

/**
 * Rol tabanli yetkilendirme (Sartname 12.1).
 *
 *  admin   : Tam yetki. Kullanici, ayar ve tum icerik yonetimi.
 *  editor  : Icerik olusturur, duzenler VE yayimlar.
 *  author  : Icerik olusturur/duzenler ancak yayimlayamaz (taslak birakir).
 *  viewer  : Yalnizca admin panelinde okuma (rapor/kontrol amacli).
 */
export type Role = NonNullable<User['roles']>[number]

const rolesOf = (user: unknown): Role[] => {
  const roles = (user as User | null | undefined)?.roles
  return Array.isArray(roles) ? (roles as Role[]) : []
}

export const hasRole =
  (...allowed: Role[]) =>
  (user: unknown): boolean =>
    rolesOf(user).some((role) => allowed.includes(role))

// --- Collection-level access ------------------------------------------------

/** Herkese acik okuma; taslaklar yalnizca oturum acmis personele gorunur. */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    _status: { equals: 'published' },
  }
}

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAdmin: Access = ({ req: { user } }) => hasRole('admin')(user)

export const isAdminOrEditor: Access = ({ req: { user } }) => hasRole('admin', 'editor')(user)

/** Icerik olusturma/duzenleme: admin, editor, author. */
export const canAuthorContent: Access = ({ req: { user } }) =>
  hasRole('admin', 'editor', 'author')(user)

/** Silme yalnizca admin ve editorde; author icerik silemez. */
export const canDeleteContent: Access = ({ req: { user } }) => hasRole('admin', 'editor')(user)

/** Kendi kaydini veya admin ise her kaydi okuyabilir (Users icin). */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole('admin')(user)) return true
  return { id: { equals: user.id } }
}

// --- Field-level access -----------------------------------------------------

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => hasRole('admin')(user)

/** Yayimlama yetkisi alan bazinda: author "published" secemez. */
export const canPublishFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole('admin', 'editor')(user)

/**
 * Alan bazli okuma: yalnizca admin ve editor.
 * `isAdminOrEditor` KOLEKSIYON tipindedir (`Access`) ve alan uzerinde
 * kullanilamaz — Payload alan erisimine `FieldAccess` bekler, iki tipin `id`
 * parametresi farklidir. Sanal sinif parolalari bu fonksiyonla korunur.
 */
export const isAdminOrEditorFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole('admin', 'editor')(user)

// ---------------------------------------------------------------------------
// ERISIM SEVIYELERI  (Sartname 1.7)
// ---------------------------------------------------------------------------

/** Hedef kitle rolu — `Users.role`. Panel rolu (`roles`) ile karistirmayin. */
export type AudienceRole = 'admin' | 'staff' | 'instructor' | 'trainee'

const audienceRoleOf = (user: unknown): AudienceRole | null => {
  const value = (user as { role?: unknown } | null | undefined)?.role
  return typeof value === 'string' ? (value as AudienceRole) : null
}

// ---------------------------------------------------------------------------
// ABONELIK KAPISI  (Commerce — B2B · Kilavuz 5.6)
// ---------------------------------------------------------------------------

/*
  KURAL BURADA DEGIL, `lib/subscription.ts` ICINDE.

  Sebep: ayni soruyu SITE TARAFI da soruyor — aboneligi biten kullaniciya
  neyin neden kayboldugunu anlatan uyari seridi (SubscriptionBanner) ayni
  cevabi vermek zorunda. Kural bu dosyada kalsaydi serit ya bu modulu
  (sunucu erisim kurallariyla dolu) istemci paketine cekerdi, ya da KENDI
  KOPYASINI yazardi. Kopya bir gun asil kuraldan ayrisir ve serit yalan
  soyler — oysa seridin var olma sebebi tam olarak o sessiz sapmayi
  onlemektir.

  Gerekceler (gun sonu kurali, tarihsiz aboneligin gecersizligi, muafiyet
  listesinin neden tersinden yazildigi) o dosyadadir. Buradan yalnizca
  YENIDEN DISA AKTARILIR ki mevcut cagrilar ve belgelerdeki isaretler
  (`access/index.ts -> aboneligiEksik`) kirilmasin.
*/
export { abonelikDurumu, aboneligiEksik, aboneligiGecerliMi } from '@/lib/subscription'
export type { AbonelikDurumu } from '@/lib/subscription'

/**
 * KUTUPHANE OKUMA ERISIMI  (Sartname 1.7)
 * ===========================================================================
 * Kayitlar `accessLevel` alaniyla etiketlenir; kullanici `role` alaniyla.
 * Kural, ikisinin esitligine indirgenmistir — ayri bir eslestirme tablosu
 * tutulsaydi biri guncellenip digeri unutuldugunda sessiz bir yetki acigi
 * olusurdu.
 *
 * KARAR SIRASI (ilk eslesen kazanir)
 * ---------------------------------------------------------------------------
 *  1. OTURUM YOK      -> yalnizca YAYIMLANMIS ve accessLevel = 'public'
 *  2. Panel yoneticisi (roles icinde 'admin')  -> her sey
 *  3. Panel personeli  (editor / author / viewer) -> her sey
 *     Gerekce: bu kisiler kutuphaneyi YONETIR; goremedikleri bir kaydi
 *     duzeltemezler. Yayimlama yetkisi ayrica `canAuthorContent` ile sinirli.
 *  4. ABONELIK KAPISI: disaridan katilimci (`role = trainee`) ve gecerli
 *     abonelik YOK -> yalnizca YAYIMLANMIS ve accessLevel = 'public'
 *     (bkz. `aboneligiEksik`)
 *  5. Diger oturumlar (yalnizca `role` tasiyan site hesaplari)
 *                     -> YAYIMLANMIS ve accessLevel IN ('public', rolun karsiligi)
 *
 * NEDEN `Where` DONUYOR, `false` DEGIL
 * ---------------------------------------------------------------------------
 * `false` dondurmek koleksiyonu tumden kapatirdi. `Where` filtresi Payload
 * tarafindan SORGUYA eklenir: kullanici yetkisi olan kayitlari gorur, digerleri
 * liste sonuclarinda HIC gorunmez (var olduklari da belli olmaz). Tekil kayit
 * istegi de ayni filtreden gectigi icin 404 doner — 403 degil; yani yetkisiz
 * kisi kaydin VARLIGINI da ogrenemez.
 *
 * BU FONKSIYON DOSYA INDIRMEYI KORUMAZ
 * ---------------------------------------------------------------------------
 * Kayit gizlense bile, ekli dosyanin dogrudan URL'si (`/media/...`) hala
 * calisir; statik dosyalar Payload erisim kontrolunden GECMEZ. Gercek koruma
 * icin dosyalarin imzali URL ile veya bir route handler arkasindan sunulmasi
 * gerekir — ACIK MADDE, bkz. docs/access-control-guide.md
 * ===========================================================================
 */
/**
 * DAİRE KOŞULU — seviyeli kütüphane kaydı ve belge dosyası için ORTAK
 * ===========================================================================
 * Kurum kararı (29.09.2026): eğitim içeriklerine personel DAİRESİNE göre
 * erişir. Kayıt `restrictToDepartments` işaretliyse, seviyesi uyan kişi
 * ancak dairesi `departments` listesindeyse görür. İşaretli değilse (ya da
 * alan henüz yoksa → NULL) yalnız seviye kuralı geçerlidir.
 *
 * Kullanıcının dairesi yoksa kısıtlı kayıt ona hiç açılmaz. Anahtar açık,
 * liste boşsa kayıt hiçbir daireye açılmaz — hata kapalı tarafa düşer.
 *
 * `req.user.department` jetondan kimlik, veritabanından dolu nesne olarak
 * gelebilir; ikisi de karşılanır. Bu koşul yalnızca SEVİYELİ dala eklenir:
 * herkese açık kayıt ve panel rolleri etkilenmez (fields/departmentAccess.ts).
 */
const daireKosulu = (user: unknown): Where => {
  const ham = (user as { department?: unknown } | null | undefined)?.department
  const daireId =
    ham && typeof ham === 'object' ? (ham as { id?: number | string }).id : (ham as number | string | undefined)
  const kisitsiz: Where[] = [
    { restrictToDepartments: { equals: false } },
    { restrictToDepartments: { exists: false } },
  ]
  return { or: daireId != null ? [...kisitsiz, { departments: { in: [daireId] } }] : kisitsiz }
}

/** Herkese açık VEYA (izinli seviye VE daire koşulu). Seviye yoksa yalnız herkese açık. */
const seviyeVeDaire = (seviyeler: string[], user: unknown): Where =>
  seviyeler.length === 0
    ? { accessLevel: { equals: 'public' } }
    : {
        or: [
          { accessLevel: { equals: 'public' } },
          { and: [{ accessLevel: { in: seviyeler } }, daireKosulu(user)] },
        ],
      }

export const libraryReadAccess: Access = ({ req: { user } }) => {
  /* `Where` olarak tiplenir: dizi icindeki nesneler farkli alanlar tasidigi
     icin TypeScript aksi halde ortak bir tip cikaramiyor. */
  const yayimlanmisVe = (seviye: Where): Where => ({
    and: [{ _status: { equals: 'published' } }, seviye],
  })

  if (!user) return yayimlanmisVe({ accessLevel: { equals: 'public' } })

  // Panel yetkisi olan herkes (admin dahil) tum kayitlari gorur.
  if (hasRole('admin', 'editor', 'author', 'viewer')(user)) return true

  const audience = audienceRoleOf(user)
  if (audience === 'admin') return true

  /*
    ABONELIK KAPISI  (Kilavuz 5.6)
    Disaridan gelen bir katilimcinin ROLU yetse bile, gecerli bir aboneligi
    yoksa seviyeli kayitlara ulasamaz. Anonim ziyaretci seviyesine duser;
    herkese acik kayitlar acik KALIR.
    Sira onemli: panel rolleri ve `role = admin` yukarida `true` dondugu icin
    buraya HIC gelmez — kutuphaneyi yoneten kisi kilitlenmez.
  */
  if (aboneligiEksik(user)) return yayimlanmisVe({ accessLevel: { equals: 'public' } })

  /*
    Rolden ERISIM SEVIYESINE ters eslestirme. `ACCESS_LEVEL_TO_ROLE` seviye ->
    rol yonunde tanimlidir; burada tersi gerekir. Tek kaynaktan turetilir ki
    iki liste ayrisamasin.
  */
  const seviyeler = Object.entries(ACCESS_LEVEL_TO_ROLE)
    .filter(([, rol]) => rol === audience)
    .map(([seviye]) => seviye)

  /* Seviyeli kayıtta daire kısıtı da aranır (daireKosulu). */
  return yayimlanmisVe(seviyeVeDaire(seviyeler, user))
}

/**
 * BELGE DOSYASI OKUMA ERISIMI  (Sartname 1.7 / 12.1 · Kilavuz 5.1)
 * ===========================================================================
 * `document-files` koleksiyonunun `read` kurali. ONEMLI OLAN SU: bu kural
 * yalnizca panel listelerini degil, DOSYANIN KENDISINI de korur. Payload'in
 * `/api/document-files/file/<ad>` ucu bu kuraldan gecer; yetkisi olmayan
 * istek dosyayi HIC ALAMAZ.
 *
 * ONCEKI DURUM — OLCULDU (2026-09-07)
 * ---------------------------------------------------------------------------
 * Kural `read: () => true` idi. Yani her belge, seviyesi ne olursa olsun,
 * adresini bilen herkese aciktir. Kilavuzun 5.1 maddesi bunu "bilinen sinir"
 * olarak sayiyordu; artik sinir degil, kapatilmis bir aciktir.
 *
 * ARSIVLENMIS BELGELER GORUNUR KALIR
 * ---------------------------------------------------------------------------
 * `isArchived` listelerden gizler ama MEVCUT BAGLANTILARI kirmaz — koleksiyon
 * alaninin kendi aciklamasi bunu soyluyor. Bu yuzden erisim kuralina
 * KARISTIRILMAZ: arsivlemek bir gorunurluk tercihi, erisim seviyesi bir yetki
 * kararidir. Ikisini birlestirmek, arsivlenen bir formun daha once paylasilmis
 * baglantisini sessizce 403'e cevirirdi.
 *
 * DEGERI OLMAYAN KAYIT
 * ---------------------------------------------------------------------------
 * `accessLevel` zorunlu ve varsayilani `public`'tir; yine de bos bir deger
 * veritabaninda bulunursa sorgu onu ESLESTIRMEZ ve dosya kapali kalir.
 * Yine guvenli taraf.
 */
export const documentFileReadAccess: Access = ({ req: { user } }) => {
  if (!user) return { accessLevel: { equals: 'public' } }

  // Panel yetkisi olan herkes (admin dahil) tum belgeleri gorur.
  if (hasRole('admin', 'editor', 'author', 'viewer')(user)) return true

  const audience = audienceRoleOf(user)
  if (audience === 'admin') return true

  /*
    ABONELIK KAPISI  (Kilavuz 5.6)
    Bu kural DOSYANIN KENDISINI korudugu icin kapinin buradaki etkisi
    dogrudandir: aboneligi bitmis bir katilimci, dosyanin tam adresini bilse
    bile indiremez. Herkese acik belgeler etkilenmez.
  */
  if (aboneligiEksik(user)) return { accessLevel: { equals: 'public' } }

  /*
    Rolden SEVIYEYE ters eslestirme; harita seviye -> roller yonunde
    tanimlidir (fields/options.ts). Tek kaynaktan turetilir ki iki liste
    ayrisamasin.
  */
  const seviyeler = Object.entries(DOCUMENT_ACCESS_LEVEL_TO_ROLES)
    .filter(([, roller]) => (audience ? roller.includes(audience) : false))
    .map(([seviye]) => seviye)

  /* Kütüphane kaydıyla AYNI daire koşulu: dosya adresinden indirme de daireye bağlı. */
  return seviyeVeDaire(seviyeler, user)
}

/**
 * FORM BASVURULARI — OKUMA ERISIMI  (KVKK / Sartname 12.2)
 * ===========================================================================
 * OLCULMUS SIZINTI (2026-09-24)
 * ---------------------------------------------------------------------------
 * Kural `read: isAuthenticated` idi. Bu, koleksiyon yazildiginda dogruydu:
 * o tarihte "oturum acmis kullanici" demek PANEL PERSONELI demekti.
 *
 * Ziyaretci kaydi acildiginda (Sartname 1.7) bu varsayim SESSIZCE COKTU.
 * Olcum, onaylanmis sirdan bir `trainee` hesabiyla yapildi:
 *
 *     GET /api/form-requests  ->  HTTP 200, 5 kayit
 *     donen alanlar: baskalarinin AD SOYAD, E-POSTA ve MESAJ metinleri
 *
 * Yani siteye kaydolup onaylanan herkes, kuruma gonderilmis butun iletisim
 * ve basvuru formlarini okuyabiliyordu. Bu bir yetki asimi degil, KISISEL
 * VERI IFSASIDIR.
 *
 * YENI KURAL
 * ---------------------------------------------------------------------------
 *   panel rolu (admin/editor/author/viewer)  -> tumunu gorur
 *   hedef kitle rolu admin veya staff        -> tumunu gorur (talebi onlar isler)
 *   diger oturumlar                          -> YALNIZCA KENDI e-postasiyla
 *                                               gonderilmis kayitlari gorur
 *   oturum yok                               -> hicbir sey
 *
 * KENDI KAYDINI GORMESI BILINCLIDIR: KVKK'nin "ilgili kisinin kendi verisine
 * erisimi" hakkidir ve profil sayfasi bunun uzerine kurulur.
 *
 * ESLESME E-POSTA UZERINDENDIR — SINIRI ACIK SOYLENIR.
 * Basvuru formu KIMLIK DOGRULAMAZ; ziyaretci istedigi adresi yazabilir ve
 * form kaydi bir kullanici hesabina ILISKI ile bagli DEGILDIR. Dolayisiyla:
 *   - hesabinin e-postasini degistiren kisi eski basvurularini goremez,
 *   - baskasinin adresini yazarak gonderilmis bir form, o adresin sahibine
 *     gorunur (kendi adresine gelen bir talebi gormesi zaten makuldur).
 * Gercek bir kayit iliskisi icin formun kullaniciya baglanmasi gerekir; bu
 * ayri bir istir (bkz. docs/access-control-guide.md).
 */
export const formRequestReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false

  if (hasRole('admin', 'editor', 'author', 'viewer')(user)) return true
  const audience = audienceRoleOf(user)
  if (audience === 'admin' || audience === 'staff') return true

  const eposta = (user as { email?: unknown }).email
  if (typeof eposta !== 'string' || eposta.length === 0) return false

  /*
    `like`, Payload'in Postgres adaptorunde ILIKE'a cevrilir: form
    alanina "Ad.Soyad@Kurum.TR" yazilmis olsa bile hesabin kucuk harfli
    adresiyle eslesir. `equals` buyuk/kucuk harf duyarli oldugu icin
    kullanicinin kendi kaydini GOREMEDIGI sessiz bir bosluk birakirdi.
  */
  return { email: { like: eposta } }
}

/**
 * TICARI KAYITLARI YONETENLER  (Commerce — teklif ve abonelik)
 * ===========================================================================
 * Teklif kayitlari HEM ticari HEM kisisel veri tasir: musteri adi, iletisim
 * kisisi, fiyatlar. Icerik uretme yetkisiyle (`author`) KARISTIRILMAZ — bir
 * haber yazari, kurumun fiyat teklifini gormek zorunda degildir.
 *
 * Yetki iki eksende de aranir: panel rolu `admin`/`editor` ya da hedef kitle
 * rolu `admin`/`staff`. Ikinci eksen gereklidir cunku teklifi hazirlayan kisi
 * genellikle OGM/UOEM personelidir ve panelde bir icerik rolu tasimayabilir.
 */
export const canManageCommerce: Access = ({ req: { user } }) => {
  if (hasRole('admin', 'editor')(user)) return true
  const audience = audienceRoleOf(user)
  return audience === 'admin' || audience === 'staff'
}

/**
 * TEKLIF OKUMA ERISIMI
 * ===========================================================================
 * Personel tumunu gorur. Bunun disindaki oturumlar YALNIZCA KENDILERINE
 * duzenlenmis teklifi gorur — `customerUser` alani uzerinden.
 *
 * `false` degil FILTRE doner: yetkisiz kisi baskasinin teklifini istediginde
 * "yetkiniz yok" degil 404 alir. Bir teklifin VAR OLDUGUNU ogrenmek bile
 * ticari bilgidir (kim kimden fiyat almis?) — kutuphane kuralindaki ayni
 * gerekce (bkz. `libraryReadAccess`).
 *
 * Oturumsuz istek HICBIR teklifi gormez: `false` doner, filtre degil. Anonim
 * bir ziyaretci icin "kendi teklifi" diye bir sey yoktur.
 */
export const quoteReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false

  if (hasRole('admin', 'editor')(user)) return true
  const audience = audienceRoleOf(user)
  if (audience === 'admin' || audience === 'staff') return true

  return { customerUser: { equals: (user as { id: number }).id } }
}

/**
 * YAYINA ALMA YETKISI  (Sartname 1.6)
 * ===========================================================================
 * `reviewStatus = published` ve `_status = published` yalnizca bu kisilerde:
 *   - panel rolu admin veya editor  (`roles`)
 *   - hedef kitle rolu admin        (`role`)
 *
 * `staff` KASITLI OLARAK DISARIDADIR. Sartname 1.6 personelin icerik
 * uretmesini ve incelemeye gondermesini ister, yayina almasini DEGIL —
 * yayin kararinin ikinci bir goz tarafindan verilmesi is akisinin amacidir.
 *
 * Iki eksene birden bakar cunku kurulumda ikisi de kullanilabilir: bir kisi
 * panelde `editor` olabilir ama hedef kitle rolu `staff` kalabilir.
 */
export const canPublishContent = (user: unknown): boolean => {
  if (hasRole('admin', 'editor')(user)) return true
  return (user as { role?: unknown } | null | undefined)?.role === 'admin'
}

/**
 * ICERIK OLUSTURMA/GUNCELLEME  (Sartname 1.6)
 * Personel dahil tum yetkili roller icerik uretebilir; yayina alma kisiti
 * `reviewStatusField.validate` ve `_status` alan erisimi ile ayrica uygulanir.
 */
export const canManageLibrary: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole('admin', 'editor', 'author')(user)) return true
  const audience = (user as { role?: unknown }).role
  return audience === 'admin' || audience === 'staff'
}

// ---------------------------------------------------------------------------
// KAYIT VE ONAY  (Sartname 1.7 — hesap durumu)
// ---------------------------------------------------------------------------

/** Hesabin onay durumu. */
export type AccountStatus = 'pending' | 'approved' | 'suspended'

/**
 * PANEL ERISIMI — "oturum acmis olmak" YETMEZ
 * ===========================================================================
 * Onceden `admin: Boolean(user)` idi: oturum acan HERKES /admin adresini
 * acabiliyordu. Katilimci kaydi disariya acildigi anda bu bir acik haline
 * gelir — her `trainee` yonetim panelini gorurdu.
 *
 * Panel yalnizca PANEL ROLU (`roles`) tasiyanlara acilir. Hedef kitle rolu
 * (`role`) panel yetkisi vermez; ikisi ayri eksendir.
 */
/* `Access` DEGIL: `admin` erisimi yalnizca boolean kabul eder (Where
   dondurulemez), bu yuzden imza elle yazilir. */
export const canAccessAdminPanel = ({ req }: { req: { user?: unknown } }): boolean =>
  hasRole('admin', 'editor', 'author', 'viewer')(req.user)

/**
 * HESAP DURUMUNU DEGISTIREBILENLER  (Sartname 1.7)
 * Yalnizca sistem yoneticisi ve OGM/UOEM personeli bir hesabi onaylar.
 * Kullanici KENDI durumunu degistiremez — `isAdminOrSelf` guncelleme yetkisi
 * verse bile bu ALAN duzeyi kural devreye girer ve yukseltmeyi engeller.
 */
export const canApproveAccounts: FieldAccess = ({ req: { user } }) => {
  if (hasRole('admin')(user)) return true
  const audience = (user as { role?: unknown } | null | undefined)?.role
  return audience === 'admin' || audience === 'staff'
}

/**
 * HESAP OLUŞTURMA  (Şartname 1.7)
 * ===========================================================================
 *   panel yöneticisi (`roles` içinde admin) -> her zaman
 *   oturumsuz ziyaretçi                     -> YALNIZCA genel kayıt açıksa
 *   oturumlu ama yönetici olmayan           -> HİÇBİR ZAMAN
 *
 * ÖLÇÜLMÜŞ AÇIK (2026-09-30) — NEDEN "HERKESE AÇIK" DEĞİL
 * ---------------------------------------------------------------------------
 * Bu kural `() => true` idi ve güvenlik kancaya bırakılmıştı. Kanca ise
 * "istekte kullanıcı varsa hesabı açan yöneticidir" varsayıyordu. Oturum açmış
 * SIRADAN bir katılımcı `POST /api/users` çağırdığında:
 *
 *     role = staff (alanın varsayılanı)   accountStatus = approved
 *
 * doğan bir hesap elde ediyordu: katılımcıdan PERSONELE yetki yükseltme
 * (personel; seviyeli içeriği görür, hesap ve başvuru onaylar). Panel rolleri
 * (`roles`) doğru biçimde boşaltılıyordu; açık, erişim rolü eksenindeydi.
 *
 * İki katmanda kapatıldı — biri bozulursa öteki tutsun diye:
 *   1. BU KURAL: oturumlu ve yönetici olmayan hiç kimse hesap açamaz.
 *   2. `Users.beforeValidate`: hesabı açan panel yöneticisi DEĞİLSE rol ve
 *      durum her koşulda `trainee` + `pending` olarak zorlanır.
 *
 * GENEL KAYIT — proje kararıyla (30.09.2026) varsayılan KAPALI; anahtar ve
 * gerekçesi lib/publicRegistration.ts. Açıkken dışarıdan kayıt yine kancadan
 * geçer (`trainee` + `pending`), CAPTCHA ve hız sınırıyla korunur
 * (lib/captcha.ts, middleware.ts) ve `beforeLogin` onaysız hesabı içeri almaz.
 *
 * Panelde hesap açmak yöneticinin işidir; personel (erişim rolü `staff`)
 * hesapları ONAYLAR (`canApproveAccounts`) ama açamaz.
 * Ayrıntılı not: docs/access-control-guide.md
 */
export const canRegister: Access = async ({ req }) => {
  if (req.user) return hasRole('admin')(req.user)
  return genelKayitAcik(req.payload)
}

/**
 * HESAP KAYDINI GUNCELLEYEBILENLER
 * Kullanici kendi kaydini (profil, sifre) guncelleyebilir; yonetici ve
 * OGM/UOEM personeli BASKALARININ kaydini da guncelleyebilir — onay islemi
 * bunu gerektirir.
 *
 * Hangi ALANI degistirebilecegi ayrica alan duzeyinde sinirlidir:
 * `accountStatus` yalnizca `canApproveAccounts`, `roles`/`role` yalnizca
 * yoneticide. Yani kendi kaydini guncelleyen bir katilimci kendini
 * onaylayamaz veya yetkisini yukseltemez — alan sessizce dusurulur.
 */
export const canManageAccounts: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole('admin')(user)) return true

  const audience = (user as { role?: unknown }).role
  if (audience === 'admin' || audience === 'staff') return true

  return { id: { equals: (user as { id: number }).id } }
}

/**
 * EGITIM BASVURULARI — OKUMA  (Registrations)
 * ===========================================================================
 * Ayni sekil, ayni gerekce: `formRequestReadAccess`. Kayit kisisel veri
 * (ad, e-posta, telefon, kurum) ve bir KARAR (onay/ret) tasir.
 *
 *   personel / panel rolu  -> hepsi         (surec panelde yurutulur)
 *   oturumlu ziyaretci     -> yalnizca KENDISI
 *   oturumsuz              -> hicbiri
 *
 * "KENDISI" iki yoldan eslesir ve ikisi de gerekli:
 *   - `user` iliskisi: oturum acikken yapilan basvuruda dogrudan baglanir.
 *   - e-posta: oturum ACMADAN yapilan basvuru (buna izin verilir) `user`
 *     tasimaz; kisi sonradan ayni adresle hesap acarsa gecmis basvurusunu
 *     gormelidir. `like` -> ILIKE; buyuk/kucuk harf farkini kapatir.
 *
 * Ikinci yolun sinirinin durust ifadesi: e-posta e-Devlet/KPS tarafindan
 * dogrulanmadigi icin, baskasinin adresiyle hesap acan biri o adresle
 * yapilmis basvurulari GOREBILIR. Bu, form-requests icin de ayni oranda
 * gecerli olan, kabul edilmis bir sinirdir; kapatmanin tek yolu e-posta
 * dogrulamadir (Users.auth.verify) ve o ayri bir karardir.
 */
export const registrationReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false

  if (hasRole('admin', 'editor', 'author', 'viewer')(user)) return true
  const audience = audienceRoleOf(user)
  if (audience === 'admin' || audience === 'staff') return true

  const id = (user as { id?: number | string }).id
  const eposta = (user as { email?: unknown }).email

  const kosullar: Where[] = []
  if (id !== undefined) kosullar.push({ user: { equals: id } })
  if (typeof eposta === 'string' && eposta.length > 0) kosullar.push({ email: { like: eposta } })

  if (kosullar.length === 0) return false
  return { or: kosullar }
}

/**
 * EGITIM BASVURULARINI YONETENLER  (karar verme)
 * ===========================================================================
 * Hesap onaylayanla ayni kume: panel yoneticisi ya da hedef kitle rolu
 * admin/staff. Egitmen (`instructor`) BILINCLI OLARAK DISARIDA — kendi
 * egitiminin listesini gormesi makul bir istektir ama "hangi egitim benim"
 * iliskisi bugun kurulmamistir; olmayan bir iliskiye dayanan bir yetki, ya
 * herkese acik ya da hicbir ise yaramaz olurdu.
 *
 * `create` bu kurala BAGLI DEGILDIR: koleksiyonda `create: () => false`.
 * Kayit yalnizca sunucu eyleminden duser (bkz. Registrations.ts).
 */
export const canManageRegistrations: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole('admin', 'editor')(user)) return true
  const audience = audienceRoleOf(user)
  return audience === 'admin' || audience === 'staff'
}
