import type { Access, FieldAccess, Where } from 'payload'

import { ACCESS_LEVEL_TO_ROLE, DOCUMENT_ACCESS_LEVEL_TO_ROLES } from '@/fields/options'
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
// ABONELIK KAPISI  (Commerce — B2B)
// ---------------------------------------------------------------------------

/**
 * BIR GUNUN MILISANIYESI.
 *
 * `subscriptionEndsAt` GUN olarak secilir (`pickerAppearance: 'dayOnly'`) ve
 * gunun BASINDA saklanir. Karsilastirma ham degerle yapilsaydi "31.12.2026'ya
 * kadar gecerli" yazan bir abonelik 31 Aralik saat 00:00'da biterdi — yani
 * editorun panelde okudugu ve musteriye soylenen tarihten BIR GUN ONCE.
 * Bu yuzden bitis GUNUNUN SONUNA kadar gecerli sayilir.
 *
 * Odemesi alinmis bir aboneligi bir gun erken kesmek, bir gun fazla acik
 * birakmaktan agir bir hatadir; belirsizlik musteri lehine cozulur.
 */
const GUN_MS = 24 * 60 * 60 * 1000

/**
 * ABONELIK KAPISINDAN MUAF HEDEF KITLE ROLLERI
 * ===========================================================================
 * Kurumun KENDI tarafi. Bir OGM/UOEM personelinin, egitmenin veya yoneticinin
 * kuruma abone olmasi anlamsizdir; abonelik DISARIDAN gelen katilimciyi
 * ilgilendirir. Muafiyet listesi burada ACIK durur, cunku "muaf olmayan" bir
 * rolun sessizce eklenmesi tum o kullanicilari kilitler — hatanin GORULEBILIR
 * olmasi icin liste tersinden (kim muaf) yazilir.
 */
const ABONELIKTEN_MUAF: AudienceRole[] = ['admin', 'staff', 'instructor']

/**
 * ABONELIK GECERLI MI?
 * ===========================================================================
 * Iki kosul da saglanmalidir: bir PAKET atanmis olacak VE bitis tarihi
 * gecmemis olacak.
 *
 * TARIHSIZ ABONELIK GECERSIZDIR — bilincli secim.
 * `subscriptionEndsAt` bos ise "suresiz" degil "eksik kayit" sayilir. Tersi
 * varsayilsaydi, tarihi girmeyi UNUTMAK sinirsiz ve kalici bir bedava erisim
 * verirdi; unutmanin cezasi, sessizce acilan bir kapi olmamalidir. Panelde
 * alan aciklamasi bunu soyler.
 *
 * `subscriptionPlan` hem sayi (depth 0) hem nesne (populate edilmis) gelebilir;
 * ikisi de kabul edilir. Payload'in oturum kullanicisi normalde ham kimlik
 * tasir, ama bu fonksiyon cagrildigi derinlige bagimli OLMAMALIDIR.
 */
export const aboneligiGecerliMi = (user: unknown, simdi: Date = new Date()): boolean => {
  const hesap = user as
    | { subscriptionPlan?: unknown; subscriptionEndsAt?: unknown }
    | null
    | undefined
  if (!hesap) return false

  const plan = hesap.subscriptionPlan
  const planVar =
    typeof plan === 'object' && plan !== null ? true : typeof plan === 'number' || typeof plan === 'string' ? Boolean(plan) : false
  if (!planVar) return false

  const bitis = hesap.subscriptionEndsAt
  if (!bitis) return false

  const zaman = new Date(bitis as string | number | Date).getTime()
  if (!Number.isFinite(zaman)) return false

  return simdi.getTime() < zaman + GUN_MS
}

/**
 * ABONELIK KAPISI KAPALI MI?  (Kilavuz 5.6)
 * ===========================================================================
 * `true` donerse cagiran kural kullaniciyi HERKESE ACIK icerige dusurur.
 *
 * NEDEN "KAPALIYA DUSURMEK", "REDDETMEK" DEGIL
 * ---------------------------------------------------------------------------
 * `false` dondurmek koleksiyonu tumden kapatirdi: aboneligi biten bir
 * katilimci, herkese acik duyuru ekini bile indiremezdi. Sartname "public"
 * icerigin herkese acik kalmasini ister. Kapi, kullaniciyi ANONIM ZIYARETCI
 * seviyesine indirir — daha asagi degil.
 *
 * PANEL ROLLERI BU FONKSIYONA HIC GELMEZ
 * ---------------------------------------------------------------------------
 * Cagiran kurallar once `hasRole(...)` ile panel yetkisini kontrol eder ve
 * `true` doner. Bu bilerek boyledir: kutuphaneyi YONETEN kisi, kurumun
 * abonelik listesinde olmadigi icin yonettigi kaydi goremez duruma dusemez.
 *
 * MEVCUT VERI UZERINDEKI ETKISI — DIKKAT
 * ---------------------------------------------------------------------------
 * Bu kural devreye girdiginde, paketi OLMAYAN her `trainee` hesabi seviyeli
 * icerigi ANINDA kaybeder. Onceden onaylanmis katilimcilar varsa once onlara
 * paket ve bitis tarihi atanmalidir; yoksa erisimleri sessizce daralir.
 * Kontrol sorgusu docs/access-control-guide.md icinde.
 */
export const aboneligiEksik = (user: unknown): boolean => {
  const audience = audienceRoleOf(user)
  if (audience && ABONELIKTEN_MUAF.includes(audience)) return false
  return !aboneligiGecerliMi(user)
}

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

  return yayimlanmisVe({ accessLevel: { in: ['public', ...seviyeler] } })
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

  return { accessLevel: { in: ['public', ...seviyeler] } }
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
 * DISARIDAN KAYIT  (Sartname 1.7 — katilimci kaydi)
 * ===========================================================================
 * Koleksiyon `create` erisimi HERKESE aciktir; guvenlik alan duzeyinde ve
 * `beforeChange` kancasinda saglanir (bkz. collections/Users.ts):
 *   - `roles` (panel yetkisi) anonim istekte ZORLA bosaltilir
 *   - `role` zorla `trainee`, `accountStatus` zorla `pending` yapilir
 *   - `beforeLogin` onaysiz hesabin girisini engeller
 *
 * ACIK MADDE — SPAM
 * Uygulama katmaninda CAPTCHA ve hiz sinirlama YOKTUR. Bir bot bu uctan
 * sinirsiz sayida `pending` hesap acabilir. Erisim acisindan zararsizdir
 * (hicbiri giris yapamaz) ama yonetici listesini kirletir ve veritabanini
 * sisirir. Ters vekil / WAF katmaninda sinirlama ZORUNLUDUR.
 * Ayrintili not: docs/access-control-guide.md
 */
export const canRegister: Access = () => true

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
