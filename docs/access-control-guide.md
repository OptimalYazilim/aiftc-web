# Erişim Kontrolü Kılavuzu

**Şartname Madde 1.6 — İçerik Yönetim İş Akışı**
**Şartname Madde 1.7 — Erişim Seviyeleri**
Teslimat kapsamı: Madde 16 (kurum kılavuzlarına altlık)

Bu belge, AIFTC web platformunda "kim neyi görebilir" sorusunun teknik
karşılığını anlatır. İki okuyucusu vardır:

- **Panel editörü** → "Bu kaydı kime açtım?" (Bölüm 1–3)
- **Sistem yöneticisi / geliştirici** → "Kural nerede zorlanıyor?" (Bölüm 4–6)

> **Kod yazacaksanız önce Bölüm 9'u okuyun.** Orada, doğru yazılmış bir
> erişim kuralının hiç çalışmadığı üç gerçek durum anlatılıyor. Kuralın var
> olması, uygulandığı anlamına gelmiyor.

---

## 1. İki ayrı rol ekseni vardır — karıştırmayın

Panelde bir kullanıcı kaydında **iki farklı rol alanı** görürsünüz. Adları bir
harf farklıdır ve bambaşka şeyleri yönetirler.

| Alan | Panelde adı | Değerler | Neyi belirler |
|---|---|---|---|
| `roles` (çoğul) | **Roller** | admin, editor, author, viewer | **Panelde ne yapabilir**: içerik oluşturma, yayımlama, silme |
| `role` (tekil) | **Erişim Rolü** | admin, staff, instructor, trainee | **Sitede ne görebilir**: kütüphane kayıtlarının erişim seviyesi |

İki eksen **dikeydir**:

- Bir **eğitmen** (`role: instructor`) panelde hiçbir yetkiye sahip olmayabilir.
- Bir **editör** (`roles: [editor]`) eğitim katılımcısı olmayabilir.

> **Yaygın hata:** kodda `user.roles` yerine `user.role` (veya tersi) yazmak.
> Erişim seviyesi kontrolünde **`user.role`**, panel yetkisi kontrolünde
> **`user.roles`** kullanılır.

---

## 2. Erişim seviyeleri

Her kütüphane kaydında **Erişim Seviyesi** alanı vardır:

| Seviye | Kimler görür |
|---|---|
| `public` — Herkese Açık | Herkes, oturum açmadan |
| `staff` — OGM / UOEM Personeli | `role: staff` olan oturumlar |
| `instructor` — Eğitmenler | `role: instructor` olan oturumlar |
| `trainee` — Eğitim Katılımcıları | `role: trainee` olan oturumlar |

Kullanıcının **Erişim Rolü** ile kaydın **Erişim Seviyesi** birebir eşleşir.
`admin` bir seviye değildir; her seviyeyi görür.

### Varsayılan `staff`'tır, `public` değil

Yeni bir kayıt açtığınızda erişim seviyesi **OGM / UOEM Personeli** gelir.
Bu bilinçlidir: editör alanı doldurmayı unutursa kayıt **kapalı** kalır.
Kapalı bir kaydın yanlışlıkla herkese açılması, açık bir kaydın yanlışlıkla
kapalı kalmasından çok daha pahalıdır.

**Kaydı yayımlarken erişim seviyesini mutlaka gözden geçirin.**

---

## 3. Editör için pratik kurallar

- Kayıt **yayımlanmamışsa** (taslak), erişim seviyesinden bağımsız olarak
  sitede görünmez. Yalnızca panel personeli görür.
- Erişim seviyesi `public` **değilse**, kaydı görmek için oturum açmak
  **zorunludur**. Oturumu olmayan ziyaretçi kaydın var olduğunu bile bilmez —
  arama sonuçlarında ve listelerde hiç çıkmaz.
- Erişim seviyesini değiştirdiğinizde etki **anında**dır; yeniden yayımlamaya
  gerek yoktur.

---

## 4. Kural nerede zorlanıyor

Tek bir yerde: `src/access/index.ts` → **`libraryReadAccess`**
Bağlandığı yer: `src/collections/LibraryResources.ts` → `access.read`

### Karar sırası (ilk eşleşen kazanır)

| # | Durum | Sonuç |
|---|---|---|
| 1 | Oturum yok | Yalnızca **yayımlanmış** ve `accessLevel = public` |
| 2 | `roles` içinde `admin` | Her şey |
| 3 | `roles` içinde editor / author / viewer | Her şey |
| 4 | Yalnızca `role` taşıyan site hesabı | **Yayımlanmış** ve `accessLevel ∈ (public, role)` |

**3. satırın gerekçesi:** panel personeli kütüphaneyi *yönetir*; göremediği bir
kaydı düzeltemez. Yayımlama yetkisi ayrıca `canAuthorContent` ile sınırlıdır.

### Neden `false` değil, filtre dönüyor

Erişim fonksiyonu yetkisiz kullanıcıya `false` döndürmez; Payload'a bir
**sorgu filtresi** verir. Fark önemlidir:

- `false` → koleksiyon tümden kapanır, "yetkiniz yok" hatası döner.
- Filtre → yetkisi olan kayıtlar görünür, **diğerleri hiç var olmamış gibi**
  davranır. Tekil kayıt isteği de aynı filtreden geçtiği için **404** döner,
  403 değil.

İkincisi tercih edildi: yetkisiz kişi kaydın **varlığını** da öğrenemez.
Bir belgenin adının bile bilgi taşıdığı durumlar vardır.

---

## 5. Bilinen sınırlar — AÇIK MADDELER

Bunlar bilinen ve kabul edilmiş eksiklerdir; kuruma teslimde ayrıca
raporlanmalıdır.

### 5.1 Dosya adresleri korunmuyor

Erişim kuralı **katalog kaydını** gizler. Ekli dosyanın doğrudan adresi
(`/media/rapor.pdf`) **hâlâ çalışır** — statik dosyalar Payload'ın erişim
kontrolünden geçmez.

Yani: yetkisiz bir kullanıcı kaydı bulamaz, ama adresi **başka bir yoldan**
öğrenmişse (paylaşılan bir bağlantı, arşivlenmiş bir sayfa) dosyayı indirebilir.

**Gerçek koruma için gereken:** dosyaların imzalı (süreli) URL ile veya erişimi
denetleyen bir route handler arkasından sunulması. Kurulmadı.

### 5.2 Sitede ziyaretçi girişi yok

Katılımcılar artık dışarıdan kayıt olabilir (bkz. Bölüm 8) ve onaylandıktan
sonra giriş yapabilirler. `staff`/`instructor` rolleri ise yalnızca panelden
atanır.

ANCAK sitede henüz bir kayıt/giriş EKRANI yoktur — akış şu an yalnızca API
üzerinden çalışır. Ön yüz formları ayrıca yapılmalıdır.

Ayrıca e-posta adaptörü tanımlı değildir — şifre sıfırlama e-postaları
kullanıcıya **ulaşmaz**, yalnızca sunucu günlüğüne yazılır.

Bu kurulmadan `trainee`/`instructor` seviyeleri pratikte kullanılamaz;
`public` ve `staff` çalışır durumdadır.

### 5.3 `DocumentFiles.accessLevel` zorlanmıyor

`document-files` koleksiyonunda **eski** bir `accessLevel` alanı vardır
(değerler: public / staff / participants / trainers / internal). Bu alan
yalnızca bir **etikettir** — hiçbir erişim kuralı ona bakmaz.

İki liste karıştırılmamalıdır:

| | Koleksiyon | Zorlanıyor mu | Değerler |
|---|---|---|---|
| `LIBRARY_ACCESS_LEVELS` | `library-resources` | **Evet** | public, staff, instructor, trainee |
| `ACCESS_LEVELS` (eski) | `document-files` | Hayır | public, staff, participants, trainers, internal |

**Öneri:** `document-files` de aynı kurala bağlanmalı ve değerler tek listede
birleştirilmelidir. Mevcut kayıtlarda `participants` → `trainee`,
`trainers` → `instructor`, `internal` → `staff` eşlemesiyle bir veri göçü
gerekir.

### 5.4 Hız sınırlama uygulama katmanında yok

Oturum açma denemeleri `maxLoginAttempts: 5` + 15 dakika kilit ile sınırlıdır
(`Users` koleksiyonu). Bunun ötesinde uygulama katmanında hız sınırlama
**yoktur**; ters vekil / WAF katmanında tanımlanmalıdır.

---

## 6. Değişiklik yaparken

- Erişim seviyesi listesine yeni bir değer eklerseniz, **`AUDIENCE_ROLES`
  listesine de aynı değeri ekleyin**. İkisi birebir eşleşmek zorundadır;
  eşleşme bozulursa o seviyedeki kayıtları kimse göremez.
  Her ikisi de: `src/fields/options.ts`
- `role` alanını kullanıcı **kendisi değiştiremez**: alan düzeyinde
  `create`/`update` yetkisi yalnızca `admin` rolündedir. Bu kısıt
  kaldırılmamalıdır — aksi hâlde kullanıcı kendi erişim seviyesini yükseltir.
- Şema değişikliği yaptıysanız üretim için migration üretin:
  `node src/scripts/run-migrate-create.mjs <ad>`

---

## 7. İçerik yönetim iş akışı (Madde 1.6)

### İki durum alanı vardır — biri diğerinin yerine geçmez

| Alan | Kim yönetir | Ne anlatır |
|---|---|---|
| `_status` | Payload (`versions.drafts`) | **Teknik** yayın durumu: kayıt sitede görünüyor mu? Sürüm geçmişi ve geri alma buna bağlıdır. |
| `reviewStatus` | Editör | **Editöryal** süreç: Taslak → Editör Kontrolünde → Onaylandı → Yayında |

Bir kayıt `approved` olup **henüz yayımlanmamış** olabilir (onay verildi, yayın
tarihi bekleniyor). Tek alanla ifade edilseydi bu durum kaybolurdu.

> Kaydın sitede görünmesi için `reviewStatus` yetmez — sağ üstteki **Yayımla**
> düğmesine de basmanız gerekir.

### “Yayında” değerini kim seçebilir

| Rol | Taslak | Editör Kontrolünde | Onaylandı | **Yayında** |
|---|---|---|---|---|
| `admin` (rol veya panel) | ✅ | ✅ | ✅ | ✅ |
| panel `editor` | ✅ | ✅ | ✅ | ✅ |
| `staff` | ✅ | ✅ | ✅ | ❌ |
| `trainee` / `instructor` | ❌ (yazma yetkisi yok) | ❌ | ❌ | ❌ |

`staff` **kasıtlı olarak** dışarıdadır: Madde 1.6 personelin içerik üretmesini
ve incelemeye göndermesini ister, yayına almasını değil. Yayın kararının ikinci
bir göz tarafından verilmesi iş akışının amacıdır.

Kural alan düzeyi `access` ile **değil**, `validate` ile uygulanır. Sebep:
Payload alan erişimi işlem bazlıdır (yazabilir/yazamaz) ve **gelen değeri**
göremez. Oysa kural değere bağlıdır — personel `in_review` yazabilmeli ama
`published` yazamamalıdır. `validate` hem değeri hem `req.user`ı görür.

Bu tercihin bir bedeli vardır: `validate` alan **değişmese de** her
güncellemede çalışır. İlk sürüm bunu hesaba katmadığı için indirme sayacını
ve yazarın düzenleme yetkisini kilitlemişti — ölçüm ve düzeltme
**Bölüm 9.3**'te.

Reddedilen değer kullanıcıya anlaşılır bir mesajla döner:

> *Yayına alma yetkiniz yok. Kaydı “Onaylandı” durumuna getirin; yayımlamayı
> editör veya yönetici yapar.*

### Hangi koleksiyonlarda var

`library-resources`, `news`, `training-programs`.
Sürüm geçmişi (`versions.drafts`) ise **sekiz** içerik koleksiyonunun
tamamında zaten etkindi; bu turda değişmedi.

### Doğrulanmış davranış

```
role=staff       -> "in_review"  KABUL
role=staff       -> "approved"   KABUL
role=staff       -> "published"  RED
roles=[editor]   -> "published"  KABUL
role=admin       -> "published"  KABUL
role=trainee     -> "in_review"  RED (yazma yetkisi yok)
```

---

## 8. Kayıt ve onay akışı (Madde 1.7)

### Hesap durumu

| Durum | Giriş yapabilir mi | Nasıl oluşur |
|---|---|---|
| `pending` — Onay Bekliyor | ❌ | Dışarıdan yapılan her kayıt |
| `approved` — Onaylandı | ✅ | Yönetici/personel onaylar; panelden açılan hesaplar doğrudan |
| `suspended` — Askıya Alındı | ❌ | Yönetici/personel askıya alır |

### Dışarıdan kayıt nasıl güvenli tutuluyor

`users` koleksiyonunun `create` erişimi **herkese açıktır**. Güvenlik üç
katmanda sağlanır:

1. **Alan düzeyi erişim** — `roles`, `role`, `accountStatus` alanlarını
   yetkisiz istek yazamaz; Payload alanı **sessizce düşürür**.
2. **`beforeValidate` kancası** — oturumsuz kayıtta değerleri ZORLAR:
   `roles=[]`, `role=trainee`, `accountStatus=pending`. İstemcinin ne
   gönderdiğine bakılmaz.
3. **`beforeLogin` kancası** — onaysız hesap doğru parolayla bile giremez.

Ölçülen davranış — kayıt isteği kendini yönetici yapmaya çalıştı:

```
gonderilen : roles=[admin]  role=admin  accountStatus=approved
olusan     : roles=[]       role=trainee accountStatus=pending
```

### Kim onaylayabilir

| Rol | Başkasının hesabını onaylayabilir |
|---|---|
| `admin` (panel veya erişim rolü) | ✅ |
| `staff` | ✅ |
| `instructor` | ❌ |
| `trainee` / kullanıcının kendisi | ❌ |

Kullanıcı kendi kaydını güncelleyebilir (profil, şifre) ama `accountStatus`
alanı **sessizce düşürülür** — istek başarılı görünür, durum değişmez.
Ölçüldü: kendi hesabını onaylamayı deneyen katılımcının kaydı `pending`
kaldı.

### Panelden açılan hesaplar

Yönetici panelden bir hesap açtığında `accountStatus` doğrudan **`approved`**
gelir — yöneticinin kendi açtığı hesabı ayrıca onaylatması anlamsız bir adım
olurdu. `staff` ve `instructor` rolleri dışarıdan kayda kapalıdır; bu roller
yalnızca panelden atanabilir.

### Bu turda kapatılan iki açık

Kayıt dışarıya açılmadan önce iki hata düzeltildi:

| Sorun | Etkisi | Düzeltme |
|---|---|---|
| `roles` varsayılanı `[author]` idi | Dışarıdan kayıt olan **panel içerik yetkisi** alırdı | Varsayılan `[]`, zorunluluk kaldırıldı |
| `access.admin` = `Boolean(user)` | Oturum açan **herkes** `/admin` panelini açabilirdi | `canAccessAdminPanel` — panel rolü şart |

### AÇIK MADDE — spam koruması yok

Kayıt ucunda **CAPTCHA ve hız sınırlama yoktur**. Bir bot sınırsız sayıda
`pending` hesap açabilir. Erişim açısından zararsızdır (hiçbiri giriş yapamaz)
ama yönetici listesini kirletir ve veritabanını şişirir.
**Ters vekil / WAF katmanında sınırlama zorunludur.**

E-posta adaptörü de tanımlı olmadığı için onay bildirimi ve şifre sıfırlama
e-postaları kullanıcıya ulaşmaz (bkz. 5.2).

---

## 9. Ölçülmüş tuzaklar — kural yazmak yetmiyor, ÇAĞRILDIĞINI doğrulayın

Bu bölüm, **doğru yazılmış bir erişim kuralının hiç çalışmadığı** üç durumu
anlatır. Üçü de bu depoda gerçekten oluştu, ölçüldü ve düzeltildi. Yeni bir
sayfa veya uç nokta yazan herkesin okuması gerekir: kuralın var olması, o
kuralın uygulandığı anlamına **gelmiyor**.

### 9.1 Local API'de `overrideAccess` varsayılanı `true`'dur

`payload.find()` / `findByID()` / `update()` çağrılarına `overrideAccess: false`
**yazılmazsa koleksiyonun `read` kuralı hiç çalışmaz.** Erişim kuralı yerinde
durur, kimse silmemiştir, ama sorgudan geçmez.

**Ölçüm (2026-09-06, geliştirme veritabanı).** `/tr/kutuphane` sayfası bu
satırı geçmiyordu:

```
kayıt #15   accessLevel = trainee   _status = published
→ oturum AÇMAMIŞ ziyaretçi "2 yayın listeleniyor" görüyor,
  kaydın başlığını, özetini ve 4 fotoğrafını açabiliyordu.
```

Sitedeki **diğer bütün sayfalar** `overrideAccess: false` geçiyordu; erişim
seviyesi zorlanan **tek** koleksiyonun sayfası geçmiyordu.

```ts
// YANLIŞ — libraryReadAccess hiç çağrılmaz
const result = await payload.find({ collection: 'library-resources', locale, where })

// DOĞRU — sorguya `accessLevel = 'public'` koşulu EKLENİR
const result = await payload.find({
  collection: 'library-resources',
  locale,
  where,
  overrideAccess: false,   // ← kural ancak bununla devreye girer
})
```

`user` verilmediğinde Payload sorguyu **anonim** kabul eder. Bu, ziyaretçiye
açık sayfalar için doğru davranıştır: kısıtlı kayıtlar gizlenmez, **sorguya
hiç alınmaz**.

`generateStaticParams` içinde de aynı satır gerekir — aksi hâlde kısıtlı
kayıtlar önceden üretilmiş HTML olarak CDN'de bekler.

> **Kural:** ziyaretçiye içerik basan her sorgu `overrideAccess: false`
> geçmelidir. `overrideAccess: true` yalnızca **bilinçli** olarak erişimi
> aşması gereken sunucu içi işler içindir (seed betikleri, sayaç ucu,
> bakım görevleri).

### 9.2 `search-index` kaynak koleksiyonun kuralını DEVRALMAZ

Arama eklentisi (`searchPlugin`) indekslediği kayıtları **ayrı bir
koleksiyona** yazar. O koleksiyonun kendi `read` kuralı herkese açıktır ve
kaynak koleksiyonun kuralıyla hiçbir bağı yoktur.

Sonuç: kütüphane listesi `accessLevel: 'staff'` bir kaydı gizlerken, **arama
sayfası aynı kaydın başlığını anonim ziyaretçiye gösteriyordu.** 9.1'de
kapatılan sızıntı yan kapıdan geri açılmıştı.

**Çözüm** (`src/app/(frontend)/[locale]/arama/page.tsx` →
`satirlariZenginlestir`): dizinden dönen satırların kaynak id'leri koleksiyona
göre gruplanır ve her grup için `overrideAccess: false` ile **tek** bir sorgu
atılır. Geri dönmeyen id, o ziyaretçinin göremeyeceği kayıttır; satır listeden
düşürülür.

Aynı sorgu ikinci bir arızayı da kapattı: **arama sonuçlarında hiç bağlantı
yoktu.** Kod, çok hedefli `doc` alanının `depth: 1` ile çözüleceğini
varsayıyordu; ölçüldü, çözülmüyor:

```
başlık "Uluslararası Entegre Yangın Yönetimi"
  relationTo = training-programs
  value      = 7          ← nesne değil, ham SAYI
```

`slug` her zaman `null` kaldığı için sayfada tek bir `<a>` bile basılmıyordu
(`document.querySelectorAll('main a').length === 0`). Slug artık bu erişim
denetimli sorgudan gelir.

> **Kural:** eklenti tarafından üretilen bir koleksiyonu ziyaretçiye
> gösteriyorsanız, kaynak koleksiyonun erişim kuralını **elle** uygulayın.

### 9.3 Alan `validate` kuralı, değer DEĞİŞMESE de çalışır

`reviewStatusField` doğrulaması yalnızca değere bakıyordu. Payload bu
doğrulamayı **her güncellemede** çalıştırır — alan hiç değişmemiş olsa bile.
İki arıza üretti:

| Belirti | Gerçek sebep |
|---|---|
| İndirme sayacı hiç artmıyor, hata da görünmüyor | `/api/library/[id]/hit` ucu `overrideAccess: true` ve kullanıcısız çalışır; yayımlanmış kaydın `downloads` alanını artırırken doğrulama tüm güncellemeyi reddediyor, uç nokta hatayı bilerek yutuyordu |
| Yazar, **yayımlanmış hiçbir kaydı düzenleyemiyor** | Yalnızca özeti düzeltse bile `reviewStatus` yeniden doğrulanıyor ve "Yayına alma yetkiniz yok" dönüyordu — oysa yetkilendirilecek bir geçiş yok, kayıt zaten yayında |

Doğrulama üç kapılı hâle getirildi (`src/fields/publishing.ts`):

1. Değer `published` değilse → sorulacak bir şey yok.
2. `overrideAccess` true ise → erişim denetimi zaten atlanmıştır (sunucu içi
   çağrılar). Panel ve REST isteklerinde bu bayrak **daima** `false`'tur,
   kural orada tam olarak çalışmaya devam eder.
3. `previousValue === 'published'` ise → değer değişmiyor, yetkilendirilecek
   geçiş yok.

Bunlardan sonra "kim yayına alıyor" sorulur. `previousValue` gelmezse kapı 3
atlanır ve kontrol **güvenli tarafa**, yani yetki sorgusuna düşer.

**Doğrulanmış davranış:**

```
overrideAccess + kullanıcı yok, kayıt yayımlanmış   -> sayaç ARTAR (3 → 4)
roles=[author], reviewStatus=published kaydı düzenle -> KABUL
roles=[author], reviewStatus -> "published"          -> RED
```

### 9.4 Test kullanıcısı oluştururken `user` bağlamı vermeyi unutmayın

`Users.beforeValidate` kancası, `req.user` **yokken** gelen her kaydı
"dışarıdan kayıt" sayar ve `roles: []`, `role: 'trainee'`,
`accountStatus: 'pending'` yazar (bkz. Bölüm 8). Bu, tasarımın kendisidir.

Sonucu: kullanıcısız oluşturulan bir test hesabı **rolsüz doğar**. Rol
davranışını ölçmeye çalışan bir betik, ölçmek istediği kuralın yanından bile
geçemez — koleksiyon erişimi çok önce reddeder ve hata mesajı yanıltıcı olur
("Bu işlemi gerçekleştirmek için izniniz yok").

```ts
// Rolleri korunan bir test hesabı için yönetici bağlamı ŞART
const yonetici = (await payload.find({ collection: 'users', limit: 1, overrideAccess: true })).docs[0]
await payload.create({ collection: 'users', overrideAccess: true, user: yonetici, data: { roles: ['author'], … } })
```

---

## Kaynak dosyalar

| Ne | Nerede |
|---|---|
| Erişim kuralı | `src/access/index.ts` → `libraryReadAccess` |
| Rol listeleri | `src/fields/options.ts` → `AUDIENCE_ROLES`, `LIBRARY_ACCESS_LEVELS` |
| Kullanıcı şeması | `src/collections/Users.ts` |
| Kütüphane şeması | `src/collections/LibraryResources.ts` |
| Panel rolleri (ayrı eksen) | `src/access/index.ts` → `hasRole`, `canAuthorContent` |
| İş akışı alanı | `src/fields/publishing.ts` → `reviewStatusField` |
| Yayına alma yetkisi | `src/access/index.ts` → `canPublishContent` |
| Kütüphane yazma yetkisi | `src/access/index.ts` → `canManageLibrary` |
| Kayıt / onay | `src/collections/Users.ts` → `hooks.beforeValidate`, `hooks.beforeLogin` |
| Onay yetkisi | `src/access/index.ts` → `canApproveAccounts`, `canManageAccounts` |
| Panel erişimi | `src/access/index.ts` → `canAccessAdminPanel` |
| Kütüphane listesinde kuralın çağrıldığı yer | `src/app/(frontend)/[locale]/kutuphane/page.tsx` → `overrideAccess: false` |
| Kütüphane künye sayfası | `src/app/(frontend)/[locale]/kutuphane/[slug]/page.tsx` |
| Arama sonuçlarında erişim süzgeci | `src/app/(frontend)/[locale]/arama/page.tsx` → `satirlariZenginlestir` |
| İndirme sayacı ucu | `src/app/api/library/[id]/hit/route.ts` |
| Şema sorusu sürücüsü | `src/scripts/run-with-schema-prompts.mjs` |
