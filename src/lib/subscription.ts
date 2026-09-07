/**
 * ABONELİK DURUMU — TEK KAYNAK  (Commerce B2B · Kılavuz 5.6)
 * ============================================================================
 * Bu dosya, "bu hesabın geçerli bir aboneliği var mı?" sorusunun TEK cevabıdır.
 * İki taraf da buradan okur:
 *
 *   SUNUCU  `src/access/index.ts` → kütüphane ve belge dosyası erişim kuralları
 *   İSTEMCİ `src/components/account/SubscriptionBanner.tsx` → uyarı şeridi
 *
 * ---------------------------------------------------------------------------
 * NEDEN AYRI BİR DOSYA
 * ---------------------------------------------------------------------------
 * Kural erişim modülünde kalsaydı, şerit onu ya içeri alamaz (o modül sunucu
 * tarafı erişim kurallarıyla doludur) ya da KENDİ KOPYASINI yazardı. İkinci
 * hâl daha sinsi: kopya bir gün asıl kuraldan ayrışır ve şerit YALAN söyler —
 * ya erişimi olan kullanıcıya "aboneliğiniz bitti" der, ya da içerik sessizce
 * kaybolurken hiçbir şey demez. Şeridin var oluş sebebi tam olarak o sessiz
 * kaybı açıklamaktır; kendi kendine yeni bir sessizlik üretmemelidir.
 *
 * Dosya BAĞIMLILIKSIZDIR (yalnızca tip): istemci paketine, Edge middleware'e
 * ve Payload yapılandırmasına aynı şekilde girer. `lib/passwordPolicy.ts` ile
 * aynı gerekçe.
 * ============================================================================
 */

/** Yalnızca bu dosyanın okuduğu alanlar. Payload `User`ına da uyar, `/me` yanıtına da. */
export type AbonelikOkunabilirHesap = {
  /** Hedef kitle rolü — `Users.role`. */
  role?: unknown
  /** Panel rolleri — `Users.roles`. Boş dizi = panel yetkisi yok. */
  roles?: unknown
  subscriptionPlan?: unknown
  subscriptionEndsAt?: unknown
}

/**
 * BİR GÜNÜN MİLİSANİYESİ.
 *
 * `subscriptionEndsAt` GÜN olarak seçilir (`pickerAppearance: 'dayOnly'`) ve
 * günün BAŞINDA saklanır. Karşılaştırma ham değerle yapılsaydı "31.12.2026'ya
 * kadar geçerli" yazan bir abonelik 31 Aralık saat 00:00'da biterdi — yani
 * editörün panelde okuduğu ve müşteriye söylenen tarihten BİR GÜN ÖNCE.
 * Bu yüzden bitiş GÜNÜNÜN SONUNA kadar geçerli sayılır.
 *
 * Ödemesi alınmış bir aboneliği bir gün erken kesmek, bir gün fazla açık
 * bırakmaktan ağır bir hatadır; belirsizlik müşteri lehine çözülür.
 */
const GUN_MS = 24 * 60 * 60 * 1000

/**
 * ABONELİK KAPISINDAN MUAF HEDEF KİTLE ROLLERİ
 * ===========================================================================
 * Kurumun KENDİ tarafı. Bir OGM/UOEM personelinin, eğitmenin veya yöneticinin
 * kuruma abone olması anlamsızdır; abonelik DIŞARIDAN gelen katılımcıyı
 * ilgilendirir. Muafiyet listesi ACIK durur ve TERSİNDEN yazılır (kim muaf),
 * çünkü "muaf olmayan" bir rolün sessizce eklenmesi o roldeki herkesi
 * kilitler — hatanın GÖRÜLEBİLİR olması istendi.
 */
export const ABONELIKTEN_MUAF_ROLLER = ['admin', 'staff', 'instructor'] as const

/**
 * Hesabın abonelik açısından bulunduğu durum.
 *
 *   oturum-yok   : hesap yok (anonim). Abonelik sorusu anlamsızdır.
 *   muaf         : kurum içi rol; abonelik aranmaz.
 *   gecerli      : paket var, tarih geçmemiş.
 *   suresi-doldu : paket VARDI, tarih geçti.
 *   abonelik-yok : hiç paket atanmamış ya da tarih hiç girilmemiş.
 *
 * Son iki durum erişim açısından AYNIDIR (ikisi de kapıyı kapatır) ama
 * kullanıcıya söylenecek cümle farklıdır: hiç aboneliği olmamış birine
 * "süreniz doldu" demek yanlış bilgidir.
 */
export type AbonelikDurumu = 'oturum-yok' | 'muaf' | 'gecerli' | 'suresi-doldu' | 'abonelik-yok'

const rolOku = (hesap: AbonelikOkunabilirHesap | null | undefined): string | null =>
  typeof hesap?.role === 'string' ? hesap.role : null

/** İlişki alanı hem ham kimlik (depth 0) hem nesne (populate) gelebilir. */
const planVarMi = (plan: unknown): boolean => {
  if (plan === null || plan === undefined) return false
  if (typeof plan === 'object') return true
  return Boolean(plan)
}

/**
 * Bitiş tarihini okur. Geçersiz/boş değer `null` döner — çağıran taraf bunu
 * "abonelik yok" sayar, "süresiz" DEĞİL.
 */
const bitisZamani = (deger: unknown): number | null => {
  if (!deger) return null
  const zaman = new Date(deger as string | number | Date).getTime()
  return Number.isFinite(zaman) ? zaman : null
}

/**
 * TARİHSİZ ABONELİK GEÇERSİZDİR — bilinçli seçim.
 * `subscriptionEndsAt` boşsa "süresiz" değil "eksik kayıt" sayılır. Tersi
 * varsayılsaydı, tarihi girmeyi UNUTMAK sınırsız ve kalıcı bir bedava erişim
 * verirdi; unutmanın sonucu sessizce açılan bir kapı olmamalıdır.
 */
export const abonelikDurumu = (
  hesap: AbonelikOkunabilirHesap | null | undefined,
  simdi: Date = new Date(),
): AbonelikDurumu => {
  if (!hesap) return 'oturum-yok'

  /*
    PANEL ROLÜ TAŞIYAN HERKES MUAFTIR.
    Erişim kuralları zaten bu kişileri kapıya HİÇ getirmez; `hasRole(...)`
    kontrolü daha yukarıda `true` döner. Kontrol yine de buraya yazıldı, çünkü
    site tarafındaki şerit o kısa devreyi GÖRMEZ: `role` alanı `trainee`
    kalmış bir editöre "aboneliğiniz doldu" derdi — oysa erişimi tamdır.
    İki taraf aynı cevabı vermek zorunda.
  */
  const panelRolleri = hesap.roles
  if (Array.isArray(panelRolleri) && panelRolleri.length > 0) return 'muaf'

  const rol = rolOku(hesap)
  if (rol && (ABONELIKTEN_MUAF_ROLLER as readonly string[]).includes(rol)) return 'muaf'

  if (!planVarMi(hesap.subscriptionPlan)) return 'abonelik-yok'

  const biter = bitisZamani(hesap.subscriptionEndsAt)
  if (biter === null) return 'abonelik-yok'

  return simdi.getTime() < biter + GUN_MS ? 'gecerli' : 'suresi-doldu'
}

/** Kısayol: yalnızca "geçerli mi" sorusunu soranlar için. */
export const aboneligiGecerliMi = (
  hesap: AbonelikOkunabilirHesap | null | undefined,
  simdi: Date = new Date(),
): boolean => {
  const durum = abonelikDurumu(hesap, simdi)
  return durum === 'gecerli' || durum === 'muaf'
}

/**
 * ABONELİK KAPISI KAPALI MI?  (Kılavuz 5.6)
 * ===========================================================================
 * `true` dönerse çağıran erişim kuralı kullanıcıyı HERKESE AÇIK içeriğe
 * düşürür.
 *
 * NEDEN "KAPALIYA DÜŞÜRMEK", "REDDETMEK" DEĞİL
 * ---------------------------------------------------------------------------
 * `false` döndürmek koleksiyonu tümden kapatırdı: aboneliği biten bir
 * katılımcı, herkese açık duyuru ekini bile indiremezdi. Şartname "public"
 * içeriğin herkese açık kalmasını ister. Kapı, kullanıcıyı ANONİM ZİYARETÇİ
 * seviyesine indirir — daha aşağı değil.
 *
 * PANEL ROLLERİ BU FONKSİYONA HİÇ GELMEZ
 * ---------------------------------------------------------------------------
 * Çağıran kurallar önce `hasRole(...)` ile panel yetkisini denetler ve `true`
 * döner. Bu bilerek böyledir: kütüphaneyi YÖNETEN kişi, kurumun abonelik
 * listesinde olmadığı için yönettiği kaydı göremez duruma düşemez.
 *
 * OTURUMSUZ İSTEK `false` DÖNER — anonim ziyaretçinin erişimi bu kuralla
 * DEĞİL, çağıran kuralın kendi anonim dalıyla belirlenir; burada `true`
 * dönseydi aynı kısıt iki kez uygulanırdı.
 */
export const aboneligiEksik = (hesap: AbonelikOkunabilirHesap | null | undefined): boolean => {
  const durum = abonelikDurumu(hesap)
  return durum === 'suresi-doldu' || durum === 'abonelik-yok'
}
