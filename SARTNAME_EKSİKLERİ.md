# Şartname Uygunluk Analizi — Eksikler Raporu

**Kaynak belge:** `D:\şartname\Teknik Şartname.docx` (01.09.2026, GCP/SEC/024/TUR)
**İncelenen kod tabanı:** `D:\aiftc-web` — Next.js 15.5 + Payload CMS 3.88
**Rapor tarihi:** 6 Eylül 2026
**Kapsam:** EK-1 (Web Sayfası) ve EK-2 (Dijital Kütüphane) maddelerinin tamamı

> Bu rapor **yalnızca tespit** içerir; hiçbir kod değişikliği yapılmamıştır.
> Her bulgu ya çalışan sistem üzerinde ölçülerek ya da şema/dosya taraması ile
> doğrulanmıştır. Ölçüm yapılan yerlerde yöntem belirtilmiştir.

---

## Yönetici Özeti

| Başlık | Durum | En kritik eksik |
|---|---|---|
| 1. Kütüphane meta-verisi (EK-2 M.1.2) | ⚠️ Kısmi | 20 zorunlu alandan **7'si hiç yok**, 5'i yanlış koleksiyonda |
| 2. Sayfa mimarisi (EK-1 M.6) | ❌ Ciddi eksik | Tanımlı 13 rotanın **5'i 404 veriyor** |
| 3. Çok dillilik (M.5) | ⚠️ Kısmi | Altyapı tam, **içerik slug'ları 3 koleksiyonda TR-only** → EN/RU detay 404 |
| 4. Erişilebilirlik (M.13) | ⚠️ Kısmi | Temeller sağlam; **hedef boyutu (2.5.8)** ve **video altyazı (1.2.2)** açık |

**Öncelik sırası önerisi:** 2 → 3 → 1 → 4
(Sayfası olmayan bir bölümün meta-verisini iyileştirmenin faydası yok.)

---

## 1. Dijital Kütüphane Meta-Veri Alanları (EK-2, Madde 1.2)

Şartname her kütüphane kaydı için **20 asgari alan** sayıyor.
`src/collections/LibraryResources.ts` içindeki mevcut alanlar tarandı.

### 1.1 Hiç bulunmayan alanlar — 7 adet

| # | Şartname alanı | Durum |
|---|---|---|
| 5 | **Kurum** | ❌ Yok. Kaydı yayımlayan kurum bilgisi tutulmuyor. |
| 7 | **Ülke** | ❌ Yok. `FOCUS_COUNTRIES` listesi var ama kütüphaneye bağlı değil. |
| 9 | **Anahtar kelimeler** | ❌ Yok. Arama yalnızca başlık/özet üzerinden çalışıyor. |
| 15 | **Eğitim bağlantısı** | ❌ Yok. Kayıttan eğitime ilişki kurulamıyor. |
| 16 | **Proje bağlantısı** | ❌ Yok. `Projects` koleksiyonu var ama kütüphaneye bağlı değil. |
| 17 | **DOI / ISBN / ISSN** | ❌ Yok. |
| 19 | **Yükleyen kullanıcı** | ❌ Yok. Kaydı kimin girdiği izlenmiyor. |

> **Not (15):** `TrainingPrograms` içinde `libraryCollectionKey` adında bir metin
> alanı var, ancak bu bir **ilişki değil**, serbest metin anahtarı. Şartnamenin
> istediği çift yönlü bağlantıyı kurmuyor ve M.1.4'teki "eğitim bağlantısına
> göre filtreleme" gereksinimini karşılamıyor.

### 1.2 Yanlış koleksiyonda duran alanlar — 5 adet

Şu alanlar **`DocumentFiles`** (dosya) koleksiyonunda var, **`LibraryResources`**
(katalog kaydı) koleksiyonunda yok:

| Şartname alanı | Nerede | Sorun |
|---|---|---|
| Dil | `DocumentFiles.language` | Kayıt düzeyinde dil filtresi kurulamıyor (M.1.4) |
| Dosya türü | `DocumentFiles.documentType` | Aynı |
| Dosya boyutu | `DocumentFiles.humanFileSize` | — |
| Sürüm | `DocumentFiles.version` | — |
| Lisans / Telif | `DocumentFiles.license`, `copyrightHolder` | M.1.8'in tamamı dosyada, katalogda değil |

**Neden önemli:** Bir katalog kaydı `externalUrl` ile dış bir adrese işaret
edebiliyor (dosyasız kayıt). O durumda dil, lisans ve telif bilgisi **hiç
tutulamıyor**. Ayrıca aynı dosya birden çok kayda bağlanabildiği için lisans
bilgisi kayıt bazında farklılaşamıyor.

### 1.3 Karşılanan alanlar — 8 adet

Başlık, kısa özet, yayın yılı, yazar, konu kategorisi, kalıcı bağlantı (`slug`),
yayın durumu (`_status` + `reviewStatus`), erişim seviyesi (`accessLevel`).

### 1.4 Arama ve filtreleme (EK-2, Madde 1.4)

Şartname **12 filtreleme boyutu** istiyor. Mevcut
(`src/components/library/LibraryCatalog.tsx`): **3 tanesi**.

| Boyut | Durum |
|---|---|
| Anahtar kelime, Başlık | ✅ (tek arama kutusu) |
| İçerik türü | ✅ |
| Konu | ✅ |
| Yazar · Kurum · Dil · Ülke · Yayın yılı · Eğitim bağlantısı · Proje bağlantısı · Dosya türü | ❌ **8 boyut eksik** |

Bunların çoğu 1.1/1.2'deki alanlar eklenmeden yapılamaz.

### 1.5 Görüntüleme ve indirme (EK-2, Madde 1.5)

| Gereksinim | Durum |
|---|---|
| Video görüntüleme | ✅ HTML5 oynatıcı |
| Görsel görüntüleme | ✅ Lightbox |
| Dosya indirme | ✅ |
| Dosya boyutu bilgisi | ✅ |
| **PDF önizleme** | ❌ **Yok.** Kod tabanında PDF görüntüleyici bulunmuyor; PDF yalnızca indiriliyor. |
| Lisans / kaynak gösterme bilgisi | ⚠️ Yalnızca dosyaya bağlıysa gösterilebiliyor (bkz. 1.2) |

### 1.6 Dijital koruma ve arşivleme (EK-2, Madde 1.9)

| Gereksinim | Durum |
|---|---|
| İçerik sürüm geçmişi | ✅ `versions.drafts` sekiz koleksiyonda aktif |
| **PDF/A arşiv formatı** | ❌ Kontrol/dönüştürme yok |
| **Checksum / fixity kontrolü** | ❌ Yok |
| **Yapay zekâ destekli OCR ve otomatik meta-veri** | ❌ Yok |
| Yayından kaldırılan içeriğin kayıt geçmişi | ⚠️ Sürüm geçmişi var; silme kaydı ayrıca tutulmuyor |

---

## 2. Sayfa Mimarisi (EK-1, Madde 6)

### 2.1 EN KRİTİK BULGU — Tanımlı 5 rota 404 veriyor

`src/i18n/routes.ts` içinde **13 bölüm rotası tanımlı**, ancak
`src/app/(frontend)/[locale]/` altında karşılık gelen sayfa dizini yok.
Çalışan sunucu üzerinde ölçüldü:

| Şartname maddesi | Rota | Ölçülen | Veri durumu |
|---|---|---|---|
| M.6.2 Kuruluş | `/tr/kurulus` | **404** | — |
| **M.6.3 Eğitim Konuları** | `/tr/egitim-konulari` | **404** | `training-topics` koleksiyonunda **6 kayıt hazır** |
| **M.6.8 Galeri ve Medya** | `/tr/galeri` | **404** | `gallery-albums` koleksiyonunda 1 kayıt |
| M.8.1 Uluslararası Katılımcılar | `/tr/uluslararasi-katilimcilar` | **404** | `international-guide` **0 kayıt** |
| M.10 Projeler | `/tr/projeler` | **404** | `projects` koleksiyonunda 1 kayıt |

**Ayrıca detay rotaları da eksik:** `DETAIL_ROUTES` içinde tanımlı olan
`training-topic`, `gallery-album` ve `project` için de sayfa yok.

**Somut zincirleme etki:**
- Ana sayfadaki eğitim konusu etiketleri `/tr/egitim-konulari/<slug>` adresine
  bağlanıyor → **kırık bağlantı**.
- `sitemap.ts` bu üç detay rotasını **sitemap'e yazıyor** → arama motorlarına
  var olmayan sayfalar bildiriliyor.
- Ana menüde bu bölümler yok, dolayısıyla ziyaretçi 404'ü yalnızca iç
  bağlantılardan veya sitemap'ten görüyor — sessiz bir hata.

### 2.2 Mevcut ve çalışan sayfalar

| Madde | Rota | Durum |
|---|---|---|
| M.6.1 Ana Sayfa | `/tr` | ✅ |
| M.6.4 Eğitim Programları ve Duyurular | `/tr/egitim-programlari` (+ detay) | ✅ |
| EK-2 M.2.2 Eğitim Takvimi | `/tr/egitim-takvimi` | ✅ |
| **M.6.5 / M.9 Simülasyon Merkezi** | `/tr/simulasyon-merkezi` (+ detay) | ✅ OYMES ve BTES kayıtlı, eğitimlerle çapraz bağlı |
| M.6.6 Dijital Kütüphane | `/tr/kutuphane` | ✅ |
| M.6.7 Haberler ve Duyurular | `/tr/haberler` (+ detay) | ✅ |
| M.6.9 İletişim | `/tr/iletisim` | ✅ Form + harita + KVKK rızası |
| M.11.4 Arama | `/tr/arama` | ✅ (filtre eksiği için bkz. 2.4) |
| EK-2 M.2.x Sanal Sınıf | `/tr/sanal-sinif/[id]` | ✅ Şifre korumalı |

### 2.3 Sık Sorulan Sorular (M.8.3)

- `Faqs` koleksiyonu **var**, arama dizinine dahil.
- Ancak **hiç kayıt yok (0)** ve **SSS sayfası yok**.
- `arama/page.tsx:98` içinde FAQ satırları için `return null` — yani arama
  sonucunda çıksa bile bağlanacak bir adres olmadığı için **gizleniyor**.

### 2.4 Arama altyapısı (M.11.4)

Şartname 7 filtre istiyor: anahtar kelime, başlık, konu, **dil**, **yıl**,
**içerik türü**, **eğitim konusu**.
Mevcut `/arama` sayfasında yalnızca **serbest metin araması** var; hiçbir filtre
yok.

### 2.5 Sertifika modülü (M.7)

| Madde | Durum |
|---|---|
| M.7.1 Her eğitimde belge türü belirtilmesi | ✅ `certificateType` zorunlu alan |
| M.7.2 Dijital sertifika üretimi | ❌ Yok (şartnamede "uygun görülmesi hâlinde") |
| M.7.3 Sertifika doğrulama | ⚠️ Yalnızca **dış portala bağlantı** var (`ExternalServices.portal.certificateVerifyPath`); doğrulama modülü yok |

### 2.6 Diğer tespitler

| Madde | Durum |
|---|---|
| M.10.1 Proje bilgi alanı | ⚠️ `Projects` koleksiyonu ve 1 kayıt var, **sayfası yok** |
| M.17 Raporlama ve istatistikler | ⚠️ Analitik altyapısı var (`lib/analytics.ts`, IP anonimleştirme); **şartnamedeki 10 gösterge için rapor ekranı yok**. Kütüphanede yalnızca `downloads` sayacı var. |
| M.21 Dublin Core meta-veri yaklaşımı | ❌ Alan eşlemesi yok |
| M.21 OAI-PMH | ❌ Yok ("ileri aşama" olarak işaretli) |
| M.21 REST API | ⚠️ Payload'ın kendi REST ucu var; kurumsal entegrasyon için ayrıca tasarlanmamış |
| M.6.5 CDN | ⚠️ Yalnızca alan açıklamasında geçiyor; CDN entegrasyonu yok |

---

## 3. Çok Dillilik (EK-1, Madde 5)

### 3.1 Altyapı — tam

| Asgari gereksinim | Durum |
|---|---|
| Kullanıcı dil seçimi | ✅ `LanguageSwitcher` |
| Menü tutarlılığı | ✅ Menü CMS'ten üç dilde |
| Çok dilli URL yapısı | ✅ `/tr/...`, `/en/...`, `/ru/...` — **yollar da yerelleştirilmiş** (`/en/training-programmes`, `/ru/programmy-obucheniya`) |
| Eğitim duyurularının dil bazlı yayımı | ✅ `localized: true` |
| Kütüphane kaydında dil alanı | ❌ **Yok** (bkz. 1.2 — dosyada var, kayıtta yok) |
| Materyallerin TR/EN/RU sürümlerinin ilişkilendirilmesi | ✅ Payload localization ile aynı kayıt üzerinde |
| **Eksik çevirinin panelde görülmesi** | ✅ `translationStatusField` — hangi dilin eksik olduğunu yazıyor |
| ISO dil/ülke kodları | ✅ `tr/en/ru`, `FOCUS_COUNTRIES` ISO 3166-1 alpha-2 |
| Esneklik (yeni dil eklenebilmesi) | ✅ `LOCALES` tek kaynak |

`fallback: true` — çevirisi girilmemiş alan Türkçeye düşüyor, sayfa boş kalmıyor.
`hreflang` alternatifleri ve `x-default` üretiliyor.

### 3.2 İÇERİK TARAFINDA GERÇEK EKSİK

Yerelleştirilmiş `slug` alanı **yalnızca TR'de dolu** olan koleksiyonlarda,
EN/RU detay sayfaları **404 döner**. Sorgu `where: { slug: { equals } }` ile o
dilin sütununa baktığı için `fallback: true` bunu **kurtarmaz** — fallback
görüntülemede çalışır, sorguda çalışmaz.

Veritabanı üzerinde ölçüldü:

| Koleksiyon | Kayıt | TR slug | EN slug | RU slug |
|---|---|---|---|---|
| `news` | 5 | 5 | 5 | 5 ✅ |
| `simulation-systems` | 2 | 2 | 2 | 2 ✅ |
| `training-topics` | 6 | 6 | 6 | 6 ✅ |
| `training-programs` | 7 | 7 | **6** | **6** ⚠️ 1 kayıt eksik |
| **`library-resources`** | 2 | 2 | **0** | **0** ❌ |
| **`gallery-albums`** | 1 | 1 | **0** | **0** ❌ |
| **`projects`** | 1 | 1 | **0** | **0** ❌ |

> Bu bir **içerik girişi eksiği**, mimari hata değil. Ancak kabul testlerindeki
> "çok dillilik kontrolü" (M.19) bu hâliyle geçmez.

### 3.3 Panel dili

Payload admin arayüzü TR/EN/RU olarak yapılandırılmış, `fallbackLanguage: 'tr'`.
Kullanıcı bazında `preferredAdminLanguage` alanı var. ✅

---

## 4. Erişilebilirlik (EK-1, Madde 13 — WCAG 2.2 AA)

Ölçüm: çalışan site üzerinde tarayıcı içi DOM ve kontrast analizi
(`/tr/kutuphane`, 1280×1200).

### 4.1 Karşılanan ölçütler

| Ölçüt | Ölçüm |
|---|---|
| 1.1.1 Alternatif metin | Alt niteliği olmayan görsel: **0** |
| 1.3.1 Başlık hiyerarşisi | h1 sayısı **1**, seviye atlaması **0** |
| 3.3.2 Form etiketleri | Etiketsiz girdi: **0** |
| 2.4.4 Bağlantı amacı | Boş bağlantı **0**, "buraya tıklayın" tipi **0** |
| 2.4.1 Blokları atlama | Skip-link **var** |
| 1.3.6 Landmark yapısı | header/main/footer birer adet, nav'lar adlandırılmış |
| 3.1.1 Sayfa dili | `<html lang="tr-TR">` ✅ |
| 2.4.7 / 2.4.11 Odak görünürlüğü | Genel `:focus-visible` 3px kural; `focus:outline-none` kullanımı **yok** |
| 1.4.3 Metin kontrastı | Ölçülen tüm metin çiftleri ≥ 4.5:1 (gövde 7.39:1, ikincil 4.80:1) |
| 1.4.11 UI sınır kontrastı | Form/hap kenarlıkları 3.37:1 (eşik 3) |
| 2.3.3 Hareket | `prefers-reduced-motion` tüm geçişleri 0.01ms'ye indiriyor |
| 1.4.1 Renk tek taşıyıcı değil | Durum rozetleri metin taşıyor; aktif filtre onay işareti taşıyor |

### 4.2 AÇIK EKSİKLER

#### 4.2.1 Hedef boyutu — WCAG 2.5.8 (AA) ❌

44×44 CSS pikselin altında kalan etkileşimli öğe: **17 adet**.

| Konum | Adet | Örnek | Yükseklik |
|---|---|---|---|
| Header | 4 | Dil değiştirici (TR/EN/RU), "Ara" | **36px** |
| Footer | 13 | Menü bağlantıları | **40px** |

24×24 altında öğe yok, yani **2.5.8'in "Minimum" alt eşiği geçiliyor**; ancak
AA hedefi olan 44px sağlanmıyor. Dil değiştirici, uluslararası hedef kitle için
en kritik denetimlerden biri olduğundan önceliklidir.

#### 4.2.2 Video altyazısı — WCAG 1.2.2 (A) ❌

- `LibraryResources` şemasında **altyazı alanı yok** (`captionsUrl` yok).
- `MediaDialog.tsx` içinde **`<track>` etiketi basılmıyor**.
- Karşılaştırma: `GalleryAlbums` ve `SimulationSystems` koleksiyonlarında
  `captionsUrl` alanı **var** — yani tutarsızlık, bilinçli bir karar değil.

Şartname M.13: *"Video içerikleri için altyazı veya açıklama desteği"* ve
M.21: *"WCAG 2.2 AA"*. Altyazı **A seviyesi** ölçüttür; AA hedefi için zorunludur.

#### 4.2.3 Değerlendirilemeyen ölçütler

Aşağıdakiler otomatik taramayla ölçülemez, **manuel/ekran okuyucu testi**
gerektirir ve şartname M.19'daki "erişilebilirlik kontrolü" kapsamında ayrıca
yapılmalıdır:

- 1.4.10 Yeniden akış (320px genişlik, %400 yakınlaştırma)
- 2.1.2 Klavye tuzağı (modal ve lightbox içinde)
- 4.1.3 Durum mesajlarının ekran okuyucuda gerçekten duyurulması
- 1.4.12 Metin aralığı geçersiz kılma
- 3.2.x Tutarlı yardım ve tanımlama

---

## 5. Şartname Dışı Ama İlgili — Bilinen Açık Maddeler

Bunlar önceki geliştirme turlarında tespit edilip belgelenen, **teslimden önce
kapatılması gereken** maddelerdir:

| Konu | Madde | Durum |
|---|---|---|
| **Hukuki metinler yer tutucu** | M.12.2 | KVKK aydınlatma ve gizlilik metinleri **taslak**; hukuk birimince yazılmalı |
| **Dosya adresleri korunmuyor** | EK-2 M.1.7 | Erişim kuralı katalog kaydını gizler, `/media/...` doğrudan adresi çalışır |
| **Sitede kayıt/giriş ekranı yok** | EK-2 M.1.7 | Kayıt/onay akışı yalnızca API üzerinden |
| **E-posta adaptörü tanımlı değil** | M.12 | Şifre sıfırlama ve onay bildirimi kullanıcıya ulaşmaz |
| **Hız sınırlama / CAPTCHA yok** | M.12.1 | Kayıt ve form uçları korumasız; ters vekil/WAF katmanında zorunlu |
| **Temsilî stok görseller** | M.10.2 | Kütüphane, simülasyon merkezi ve video kapakları **temsilî**; kurumun kendi görselleriyle değiştirilmeli |
| **Simülasyon teknik kapasiteleri temsilî** | M.9.1 | 12/24/36 istasyon sayıları gerçek envanter değil |
| **Üretim migration'ı üretilmedi** | — | Son üç turdaki şema değişiklikleri için migration bekliyor |
| `DocumentFiles.accessLevel` zorlanmıyor | EK-2 M.1.7 | Etiket olarak duruyor, erişim kuralı ona bakmıyor |

---

## 6. Doğrulama Yöntemi

| Bulgu grubu | Yöntem |
|---|---|
| Rota 404'leri | Çalışan sunucuya `curl` ile HTTP durum kodu ölçümü |
| Meta-veri alanları | `src/collections/*.ts` üzerinde alan adı taraması |
| Çok dilli slug sayıları | Payload Local API, `locale: 'all'`, `overrideAccess: true` |
| Erişilebilirlik | Tarayıcı içinde DOM analizi + WCAG bağıl parlaklık formülüyle kontrast hesabı |
| Modül varlığı | Anahtar sözcük taraması; "var" çıkanlar yorum satırı mı diye ayrıca denetlendi |

---

## 7. Önerilen Sıralama

**1. Öncelik — 404 veren sayfalar (M.6.2, 6.3, 6.8, 8.1, 10)**
Koleksiyonlar ve veri hazır; yalnızca sayfa dosyaları yok. En yüksek fayda/emek
oranı. Eğitim Konuları ve Galeri şartnamede **açıkça sayılan** bölümler.

**2. Öncelik — EN/RU içerik girişi**
Kütüphane, galeri ve proje kayıtlarına EN/RU slug + başlık girilmeli; kabul
testindeki çok dillilik kontrolü buna bağlı.

**3. Öncelik — Kütüphane meta-verisi (EK-2 M.1.2)**
7 eksik alan + 5 alanın katalog kaydına taşınması. Ardından M.1.4 filtreleri.

**4. Öncelik — Erişilebilirlik**
Dokunma hedefi 44px'e çıkarılması (header/footer) ve video altyazı alanı +
`<track>` desteği.

**5. Sonra — PDF önizleme, SSS sayfası, arama filtreleri, Dublin Core eşlemesi**

---

*Bu rapor tespit amaçlıdır. Maddelerin hangilerinin sözleşme kapsamında zorunlu,
hangilerinin "uygun görülmesi hâlinde / mümkünse / ileri aşama" nitelikli
olduğu, idare ile birlikte netleştirilmelidir — şartname birkaç maddede bu
ayrımı açıkça yapmaktadır (M.7.2, M.7.3, M.17, M.21).*
