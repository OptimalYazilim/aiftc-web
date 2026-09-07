# Erişim Kontrolü Kılavuzu

**Şartname Madde 1.6 — İçerik Yönetim İş Akışı**
**Şartname Madde 1.7 — Erişim Seviyeleri**
Teslimat kapsamı: Madde 16 (kurum kılavuzlarına altlık)

Bu belge, AIFTC web platformunda "kim neyi görebilir" sorusunun teknik
karşılığını anlatır. İki okuyucusu vardır:

- **Panel editörü** → "Bu kaydı kime açtım?" (Bölüm 1–3)
- **Sistem yöneticisi / geliştirici** → "Kural nerede zorlanıyor?" (Bölüm 4–6)

> **Kod yazacaksanız önce Bölüm 9 ve 10'u okuyun.** Orada, doğru yazılmış bir
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

## 5. Bilinen sınırlar

Bu bölüm hem **kapatılmış** hem **hâlâ açık** maddeleri tutar; kapatılanlar
tarih damgasıyla işaretlidir ve gerekçeleri geçmişi göstermek için
bırakılmıştır. Açık kalanlar kuruma teslimde ayrıca raporlanmalıdır.

| Madde | Durum |
|---|---|
| 5.1 Belge dosyalarının adresleri | ✅ Kapatıldı (2026-09-07) |
| 5.1.1 `media` bilerek açık | ⚠️ Kalan sınır — kurum kararı bekliyor |
| 5.1.2 S3 kovası | ⚠️ Kurulum şartı |
| 5.2 Ziyaretçi kayıt / giriş ekranı | ✅ Kuruldu (2026-09-07) |
| 5.2.1 Parola alt sınırı | ✅ Eklendi (2026-09-07) |
| 5.2.2 Devralınan veritabanında kilitli hesap | ⚠️ Kurulum kontrolü |
| 5.3 `DocumentFiles.accessLevel` | ✅ Artık zorlanıyor (2026-09-07) |
| 5.4 Hız sınırlama (kimlik uçları) | ✅ Kuruldu (2026-09-07) — ters vekil katmanı yine gerekli |
| 5.5 E-posta adaptörü | ✅ Kuruldu (2026-09-07) |
| 5.5.1 Site tarafı sıfırlama akışı | ✅ Kuruldu (2026-09-07) |
| 5.5.2 Parola politikası sıfırlamada atlanıyordu | ✅ Kapatıldı (2026-09-07) |

### 5.1 Belge dosyalarının adresleri — **KAPATILDI (2026-09-07)**

> Bu madde bir zamanlar açık bir eksikti. Artık kapatılmıştır; ölçüm ve
> kalan sınırlar aşağıdadır. Ayrıntılı gerekçe: **Bölüm 10**.

`document-files` koleksiyonundaki her dosya artık kendi `accessLevel`
alanına göre korunur. Yetkisiz istek dosyayı **alamaz**:

```
GET /api/document-files/file/<ad>        anonim, accessLevel=staff   → 403
GET /documents/<ad>                      (eski statik yol)           → 404
```

İki ayrı değişiklik gerekti; **tek başına hiçbiri yetmezdi**:

1. `access.read` gerçek bir kurala bağlandı (`documentFileReadAccess`).
   Öncesinde `() => true` idi.
2. `upload.staticDir` `public/documents` → `private/documents` taşındı.
   Next.js `public/` altındaki her şeyi **hiçbir kod çalıştırmadan** servis
   eder; dosya orada durdukça erişim kuralının hiçbir hükmü yoktu.

### 5.1.1 KALAN SINIR — `media` koleksiyonu bilerek açıktır

`media` (logolar, kapak görselleri, galeri kareleri) **korunmaz ve
korunmamalıdır**: bu dosyalar anonim ziyaretçinin sayfayı görebilmesi için
gereklidir.

Bunun ölçülebilir bir sonucu vardır: erişimi kısıtlı bir kütüphane kaydının
**fotoğrafları** `media` içinde durur ve doğrudan adresle indirilebilir.
Kayıt listede görünmez, künyesi 404 döner, ama kareye adresini bilen
ulaşabilir.

**Kapatmak için gereken karar kurumundur.** İki yol var:

| Yol | Bedeli |
|---|---|
| Kısıtlı görselleri `document-files`e yüklemek | Editör disiplini gerektirir; bugün de yapılabilir |
| `media`ya `accessLevel` eklemek | Her kapak görselinin seviyesi girilmeli; boş kalan alanlar siteyi kırar |

Kurum bir karar verene kadar **kısıtlı görsel `media`ya yüklenmemelidir**.

### 5.1.2 KALAN SINIR — S3 kovası

`MEDIA_STORAGE_ADAPTER=s3` iken dosyalar yine Payload'ın ucundan sunulur ve
erişim kuralı geçerlidir. Ancak **kovanın kendisi herkese açıksa** S3/MinIO
adresi doğrudan çalışır ve Payload devre dışı kalır.

**Kurulumda zorunlu:** kova `private` olmalı, nesnelere yalnızca uygulamanın
kimlik bilgileriyle erişilmelidir.

### 5.2 Ziyaretçi kayıt / giriş ekranı — **KURULDU (2026-09-07)**

Ekranlar yayında:

| Sayfa | TR · EN · RU |
|---|---|
| Giriş | `/giris` · `/login` · `/vhod` |
| Kayıt | `/kayit` · `/register` · `/registratsiya` |

Bağlantı üst hizmet şeridindedir (menüde değil — gerekçe: `TopUtilityBar.tsx`).
Sayfalar `robots: noindex` taşır ve sitemap'e girmez.

Formlar **istemci bileşenidir ve doğrudan `fetch` kullanır**; Server Action
DEĞİL. Zorunluluktur: oturum çerezi tarayıcıya `Set-Cookie` ile gelir ve
Payload'ın CSRF koruması isteğin `Origin` başlığını arar — ikisini de yalnızca
tarayıcının kendi isteği sağlar (bkz. **Bölüm 10.4**).

Ölçülmüş akış (gerçek tarayıcı, 2026-09-07):

```
POST /api/users        -> 201   hesap trainee + pending doğar
POST /api/users/login  -> 403   errors[0].data.code = 'account_pending'
        (yönetici onayından sonra)
POST /api/users/login  -> 200   çerez kurulur, /api/users/me kullanıcıyı döner
```

`beforeLogin` artık makine okunabilir bir kod taşır (`account_pending` /
`account_suspended`); form bu kodu kendi dilindeki açıklamaya çevirir. Metin
ayrıştırılmaz — cümle düzeltildiğinde eşleşme sessizce bozulurdu.

E-posta adaptörü **kuruldu** (bkz. 5.5). Kayıt başarı ekranındaki "e-posta
gönderimi etkin değildir" notu, SMTP tanımlı olmayan kurulumlar için hâlâ
doğrudur ve yerinde bırakılmıştır.

### 5.2.1 Parola alt sınırı — **EKLENDİ (2026-09-07)**

Payload'ın varsayılanında asgari parola uzunluğu yoktur. Ölçüldü: kayıt ucu
dışarıya açıkken `{ password: '123' }` isteği **201** dönüyordu.

Artık sunucu tarafında en az **10 karakter** zorunludur
(`Users.ts → MIN_PAROLA`, `hooks.beforeValidate`). Formdaki kontrol bir
kolaylıktır; API'ye doğrudan istek atan istemci onu görmez, kural sunucudadır.

### 5.2.2 KURULUM UYARISI — mevcut hesaplar kilitlenebilir

`accountStatus` sonradan eklenen bir alandır. Alan eklenirken mevcut satırlar
`approved` ile GERİ DOLDURULMAZSA, `beforeLogin` herkesi dışarıda bırakır —
yöneticinin kendisi dahil. O noktada bekleyen kayıtları onaylayabilecek kimse
kalmaz.

Bu tam olarak yaşandı ve düzeltildi: migration
`20260906_114030_mevcut_sema_senkronu` sütunu `NOT NULL` ve **varsayılansız**
ekliyordu — dolu bir tabloda bu ifade zaten hata verir. Şimdi
`DEFAULT 'approved'` ile eklenip varsayılan düşürülüyor.

> **Devralınan bir veritabanına geçerken kontrol edin:**
> ```sql
> SELECT email, account_status FROM users WHERE account_status <> 'approved';
> ```
> Panel rolü taşıyan bir hesap bu listede çıkıyorsa kilitlidir.

### 5.3 `DocumentFiles.accessLevel` zorlanmıyor — **ARTIK ZORLANIYOR (2026-09-07)**

> Bu madde geçersizdir. Alan artık hem panel listelerinde hem **dosyanın
> indirme adresinde** zorlanır; ölçülmüş matris **Bölüm 10.3**'tedir.
> Aşağıdaki metin, kararın geçmişini göstermek için bırakılmıştır.

`document-files` koleksiyonunun `accessLevel` alanı bir zamanlar yalnızca bir
**etiketti** — hiçbir erişim kuralı ona bakmıyordu.

İki liste hâlâ **ayrıdır** ve karıştırılmamalıdır:

| | Koleksiyon | Zorlanıyor mu | Değerler |
|---|---|---|---|
| `LIBRARY_ACCESS_LEVELS` | `library-resources` | **Evet** | public, staff, instructor, trainee |
| `ACCESS_LEVELS` | `document-files` | **Evet** (2026-09-07'den beri) | public, staff, participants, trainers, internal |

Değerler **birleştirilmedi**. Birleştirmek, yüklü her belgenin seviyesini
değiştiren bir veri göçü gerektirirdi ve `internal` gibi bir seviyenin
kütüphanede karşılığı yoktur. Bunun yerine eşleşme açık yazıldı:
`DOCUMENT_ACCESS_LEVEL_TO_ROLES` (bkz. **Bölüm 10.2**). Tek kaynak, açık
harita, veri göçü yok.

### 5.4 Hız sınırlama — **KURULDU (2026-09-07)**

> **Payload 3'te yerleşik hız sınırlama YOKTUR.** Payload 2'nin `rateLimit`
> config alanı 3'te tamamen kaldırılmıştır; doğrulandı (3.88.0):
> `grep -rn "rateLimit" node_modules/payload/dist/config/` → hiç sonuç.
> Config'e böyle bir nesne yazmak onu sessizce yok saydırır ve korunuyormuş
> yanılsaması üretir. Bu yüzden gerçek bir sınırlayıcı yazıldı.

`src/middleware.ts` + `src/lib/rateLimit.ts` — IP bazlı, **yalnızca POST**:

| Uç | Varsayılan | Ortam değişkeni |
|---|---|---|
| `/api/users` (kayıt) | 5 / 60 dk | `RATE_LIMIT_REGISTER_MAX`, `..._WINDOW_MIN` |
| `/api/users/login` (giriş) | 20 / 10 dk | `RATE_LIMIT_LOGIN_MAX`, `..._WINDOW_MIN` |

**Payload'ın hesap kilidinin yerine geçmez, boşluğunu kapatır.**
`maxLoginAttempts: 5` HESAP bazlıdır: tek IP'den bin ayrı hesaba birer deneme
yapan bir saldırgan onu hiç tetiklemez. Bu katman IP bazlıdır.

Ölçüldü (2026-09-07, sınır 4'e düşürülerek):

```
giriş  1..4 → 401     5,6 → 429      (başka IP'nin ilk denemesi → 401)
kayıt  1..3 → 201     4,5 → 429
GET /api/users        → hiç sınırlanmaz
429 gövdesi: { errors:[{ message, data:{ code:'rate_limited', retryAfter }}]}
başlıklar:   Retry-After: 558 · Cache-Control: no-store
```

Yanıt Payload'ın hata biçimindedir; kimlik formları zaten bu şekli okur.

**ÜÇ SINIRI — abartılmamalı:**

1. **Sayaç bellektedir.** Süreç yeniden başlayınca sıfırlanır; birden çok
   örnek çalıştırılırsa her biri kendi sayacını tutar. Bu kurulumda uygulama
   tek konteynerde çalışır (`docker-compose.yml`), yani pratikte etkilidir.
   Yatay ölçeklemede Redis gibi paylaşılan bir sayaç gerekir.
2. **IP `x-forwarded-for`den okunur** ve bu başlık **uydurulabilir**. Yalnızca
   güvenilen bir ters vekil arkasında anlamlıdır; vekil başlığı **kendisi**
   yazmalıdır: `proxy_set_header X-Forwarded-For $remote_addr;`
3. **Ters vekil / WAF sınırlamasının yerine geçmez.** Uygulamaya hiç
   ulaşmadan durdurulan istek her zaman daha ucuzdur.

### 5.5 E-posta adaptörü — **KURULDU (2026-09-07)**

`@payloadcms/email-nodemailer`, `payload.config.ts` içinde bağlıdır ve SMTP
ayarlarını ortamdan okur.

**Koşullu bağlanır:** adaptör yalnızca `SMTP_HOST` doluyken kurulur. Boşsa
Payload'ın konsol davranışına düşülür — SMTP'si olmayan bir geliştirme
makinesinde uygulama yine çalışır. **Üretimde boş bırakılmamalıdır**, aksi
hâlde parola sıfırlama ve onay bildirimi kullanıcıya ulaşmaz.

Ölçüldü (yerel test SMTP alıcısı, 2026-09-07): parola sıfırlama isteği
gerçek bir mesaj üretti —

```
MAIL FROM: <no-reply@aiftc.test>   RCPT TO: <…>
From: AIFTC Test <no-reply@aiftc.test>
Subject: Parolanızı Sıfırlayın
gövdede sıfırlama bağlantısı: /admin/reset/<token>
```

`SMTP_SECURE`: 465 (doğrudan TLS) için `true`, 587 (STARTTLS) için `false`.
`SMTP_USER` boşsa `auth` hiç gönderilmez — kimlik doğrulaması istemeyen iç ağ
röleleri için gereklidir.

### 5.5.1 Site tarafı sıfırlama akışı — **KURULDU (2026-09-07)**

Bağlantı artık `/admin/reset/<token>` değil, sitenin kendi sayfasıdır.

| Sayfa | TR · EN · RU |
|---|---|
| Şifremi unuttum | `/sifremi-unuttum` · `/forgot-password` · `/vosstanovlenie-parolya` |
| Yeni parola belirle | `/sifre-sifirla` · `/reset-password` · `/sbros-parolya` |

E-posta şablonu `lib/forgotPasswordEmail.ts` içinde ezilir ve **dile
duyarlıdır**. Dil sırası: `X-AIFTC-Locale` başlığı (kendi formumuz açıkça
gönderir) → `Referer` yolundaki dil öneki → varsayılan.
`user.preferredAdminLanguage` kullanılmaz: o alan PANEL dilidir ve dışarıdan
kayıt olan herkeste `tr` olarak durur; Rusça gezinen bir katılımcıya Türkçe
e-posta gönderirdi.

Ölçüldü (yerel SMTP alıcısı):

```
X-AIFTC-Locale: tr → http://…/tr/sifre-sifirla?token=…   konu: "Parolanızı sıfırlayın — AIFTC"
X-AIFTC-Locale: ru → http://…/ru/sbros-parolya?token=…   konu: "Сброс пароля — AIFTC"
/admin/reset içeriyor mu: hayır
```

Uçtan uca akış (7/7):

```
forgot-password           → 200   jeton üretildi
reset-password  '123'     → 400   kısa parola REDDEDİLDİ
reset-password  geçerli   → 200
yeni parolayla giriş      → 200
eski parola               → 401
jeton ikinci kez          → 403
```

### 5.5.2 PAROLA POLİTİKASI SIFIRLAMA YOLUNDAN ATLANABİLİYORDU

Kural önce yalnızca `Users.hooks.beforeValidate` içindeydi. Ölçüldü:

```
POST /api/users/reset-password { token, password: '123' }  →  200
```

Sebep Payload'ın kaynağında görünür (`auth/operations/resetPassword.js`):
işlem parolayı **önce hash'ler**, kancayı sonra çağırır —

```js
user.salt = salt
user.hash = hash
…
hook({ data: user, operation: 'update', … })
```

Kancaya giden `data` içinde `password` **yoktur**; `salt` ve `hash` vardır.
Düz metni göremeyen bir kural onu doğrulayamaz.

**Düzeltme:** sıfırlama yolu artık istek Payload'a ulaşmadan `middleware.ts`
içinde denetlenir. Sayı ve mesaj tek yerde: `lib/passwordPolicy.ts`. İki
sunucu noktası, tek kural.

> **Kural:** Payload'ın bir işlemine kanca yazarken, o kancanın gerçekten
> beklediğiniz veriyi alıp almadığını **ölçün**. `beforeValidate` her yolda
> aynı `data`yı almaz.

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

## 10. Dosya erişimi — ölçülmüş matris

Belge dosyalarının korunması iki katmanlıdır ve **ikisi de gereklidir**.

### 10.1 Neden `read` kuralı tek başına yetmiyordu

Dosyalar `public/documents` altında duruyordu. Next.js `public/` içindeki
her şeyi diskten doğrudan verir — istek Payload'a **hiç uğramaz**. Yani
kurala ne yazılırsa yazılsın, dosyanın ikinci ve tamamen korumasız bir
adresi vardı.

Ölçüm (2026-09-07, anonim istek, düzeltme öncesi):

```
GET /api/document-files/file/videoplayback%20(1).mp4   → 206
GET /documents/videoplayback%20(1).mp4                 → 206
```

`staticDir` `private/documents`e taşındı. İkinci adres artık **404**.

> **Kural:** yüklenen dosyaların dizini `public/` altına ASLA konmaz —
> `media` dışında; o koleksiyon zaten herkese açıktır ve öyle olmalıdır.

### 10.2 Seviye → rol eşleşmesi

`document-files` koleksiyonu `ACCESS_LEVELS` listesini kullanır ve bu liste
kütüphanenin listesiyle **aynı değerleri taşımaz**. Eşleşme açık yazılır:
`fields/options.ts → DOCUMENT_ACCESS_LEVEL_TO_ROLES`.

| Seviye | İndirebilen `role` |
|---|---|
| `public` | herkes (anonim dahil) |
| `staff` | `staff` |
| `participants` | `trainee` |
| `trainers` | `instructor` |
| `internal` | yalnızca `admin` |

Panel rolü olan (`admin`, `editor`, `author`, `viewer`) herkes tümünü görür.

Bir seviye haritaya yazılmazsa o seviyedeki dosyayı **kimse** indiremez —
hata güvenli tarafa düşer. `internal` bilinçli olarak en dar yoruma
(`admin`) eşlenmiştir; kurum "kurum içi" ile personeli de kastediyorsa
haritaya `staff` eklenir. Tersini varsaymak sızıntı üretir.

### 10.3 Doğrulanmış matris

Her hücre, **dosyanın kendisine** atılmış gerçek bir HTTP isteğidir
(panel listesi değil). Hem tarayıcı çerezi hem `Authorization: JWT` ile
ölçülmüş, ikisi de aynı sonucu vermiştir.

```
seviye          anonim      staff       trainee     instructor
--------------------------------------------------------------
public          İNDİ 206    İNDİ 206    İNDİ 206    İNDİ 206
staff           RED  403    İNDİ 206    RED  403    RED  403
participants    RED  403    RED  403    İNDİ 206    RED  403
trainers        RED  403    RED  403    RED  403    İNDİ 206
internal        RED  403    RED  403    RED  403    RED  403
```

Kapatmayı olduğu kadar **açmayı** da ölçmek şarttır: yalnızca "403 aldı mı"
bakılsaydı, her şeyi kilitleyen bozuk bir kural da "başarılı" görünürdü.

### 10.4 Ölçüm tuzağı — çerez `Origin` başlığı ister

Payload'ın CSRF koruması (`payload.config.ts → csrf: allowedOrigins`) çerez
kimliğini yalnızca izinli bir `Origin` başlığıyla kabul eder. Gerçek tarayıcı
bu başlığı her zaman gönderir; sunucu tarafı `fetch` göndermez.

```
gerçek çerez                 → 403   (oturum yok sayıldı)
gerçek çerez + Origin        → 206   (oturum tanındı)
Authorization: JWT <token>   → 206
```

Bu başlık unutulursa ölçüm "yetkili kullanıcı da indiremiyor" gibi **yanlış**
bir tablo üretir ve çalışan bir kural bozuk sanılır.

İkinci tuzak: çerezin adı `payload-token` **değildir** — `cookiePrefix: 'aiftc'`
ayarı yüzünden `aiftc-token`'dır. Adı elle yazmak yerine yanıtın `set-cookie`
başlığı ayrıştırılmalıdır.

### 10.5 Arşivleme bir erişim kararı değildir

`isArchived` belgeyi listelerden gizler ama **mevcut bağlantıları kırmaz** —
alanın kendi açıklaması bunu söyler. Bu yüzden erişim kuralına
karıştırılmamıştır: arşivlemek bir görünürlük tercihi, erişim seviyesi bir
yetki kararıdır. İkisi birleştirilseydi, arşivlenen bir formun daha önce
paylaşılmış bağlantısı sessizce 403'e dönerdi.

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
| Belge dosyası erişimi | `src/access/index.ts` → `documentFileReadAccess` |
| Belge seviyesi → rol haritası | `src/fields/options.ts` → `DOCUMENT_ACCESS_LEVEL_TO_ROLES` |
| Dosyaların diskteki yeri | `src/collections/DocumentFiles.ts` → `upload.staticDir` |
| Üretimde dizin/cilt | `Dockerfile`, `docker-compose.yml` |
| Şema sorusu sürücüsü | `src/scripts/run-with-schema-prompts.mjs` |
