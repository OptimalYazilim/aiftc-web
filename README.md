# AIFTC Web — EK-1 Kurumsal Web Sitesi

Antalya Uluslararası Ormancılık Eğitim Merkezi (AIFTC) kurumsal web sitesi.
Proje: **GCP/SEC/024/TUR** — FAO / Tarım ve Orman Bakanlığı, Orman Genel Müdürlüğü.

**Yığın:** Next.js 15 (App Router, TypeScript) + gömülü Payload CMS 3.x + PostgreSQL (Drizzle).

---

## Kapsam sınırı — önce bunu okuyun

| | Kim geliştiriyor | Nerede çalışır |
|---|---|---|
| **EK-1 — Web Sitesi** | **Biz** | `aiftc.org` (ana alan adı) |
| **EK-2 — Dijital Kütüphane / Yönetim Portalı** | Başka ekip | `kutuphane.aiftc.org`, `portal.aiftc.org` (subdomain) |

Bu depo yalnızca EK-1'i içerir. Kütüphane ve portal **barındırılmaz**; site onlara
yalnızca dile duyarlı, izlenebilir bağlantı üretir. Tüm dış adresler tek yerden
yönetilir: **`src/globals/ExternalServices.ts`**. Kodun hiçbir yerinde subdomain
adresi sabit yazılmaz.

---

## 1. Kurulum

### 1.1 Ön koşullar

```bash
node -v          # >= 20.9  (22 LTS önerilir)
corepack enable  # pnpm için
docker -v && docker compose version
```

### 1.2 Depoyu hazırlama

```bash
# Depo klonlandıysa doğrudan bağımlılıklar:
pnpm install

# Sıfırdan başlanıyorsa Payload'ın resmi iskeleti de kullanılabilir:
#   pnpm create payload-app@latest -- --name aiftc-web --db postgres --template blank
# ardından bu depodaki src/, docker-compose.yml ve konfigürasyon dosyaları üzerine kopyalanır.
```

### 1.3 Ortam değişkenleri

```bash
cp .env.example .env
# PAYLOAD_SECRET üretin:
openssl rand -base64 32
```

`.env` içinde en az `PAYLOAD_SECRET`, `DATABASE_URI` ve `NEXT_PUBLIC_SERVER_URL`
doldurulmalıdır.

### 1.4 Veritabanını ayağa kaldırma

```bash
docker compose up -d db
docker compose ps            # db "healthy" olmalı
```

Yerel MinIO (S3 uyumlu depolama) denenecekse:

```bash
docker compose --profile s3 up -d minio    # konsol: http://localhost:9001
```

### 1.5 İlk çalıştırma

```bash
pnpm generate:importmap      # admin özel bileşenlerini kaydet (build öncesi zorunlu)
pnpm dev                     # http://localhost:3000
```

İlk `pnpm dev` çalışmasında Payload şemayı Postgres'e uygular
(`push: true`, yalnızca geliştirme ortamında) ve `http://localhost:3000/admin`
adresinde ilk yönetici hesabını oluşturmanızı ister.

```bash
pnpm generate:types          # payload-types.ts'i gerçek şemadan üret
```

> `src/payload-types.ts` depoda **placeholder** olarak gelir. `generate:types`
> çalıştırıldığında tamamen değişir; bu normaldir.

### 1.6 Üretim akışı (migration zorunlu)

```bash
pnpm migrate:create ilk_surum   # SQL migration üretir -> src/migrations/
pnpm migrate                    # uygular
pnpm migrate:status
pnpm build && pnpm start
```

`push` yalnızca `NODE_ENV !== 'production'` iken açıktır. Canlıda şema
değişikliği **sadece** migration ile yapılır (Şartname 11.1 — sürdürülebilir bakım).

### 1.7 Tümünü konteynerde çalıştırma

```bash
docker compose --profile app up -d --build
```

### 1.8 Günlük komutlar

```bash
pnpm dev                # geliştirme
pnpm typecheck          # tip kontrolü
pnpm lint
pnpm generate:types     # şema değiştiyse
pnpm generate:importmap # admin bileşeni eklendiyse/değiştiyse
```

---

## 2. Klasör yapısı

```
aiftc-web/
├─ docker-compose.yml            Postgres (+ opsiyonel MinIO, app profilleri)
├─ Dockerfile                    Çok aşamalı üretim imajı (standalone)
├─ next.config.mjs               withPayload + next-intl + güvenlik başlıkları
├─ .env.example
├─ messages/                     Arayüz metinleri (buton, etiket) — içerik DEĞİL
│  ├─ tr.json  en.json  ru.json
└─ src/
   ├─ payload.config.ts          ★ CMS ana konfigürasyonu
   ├─ payload-types.ts           (otomatik üretilir)
   ├─ middleware.ts              /tr /en /ru dil yönlendirmesi
   │
   ├─ i18n/
   │  ├─ locales.ts              ★ DİLLERİN TEK KAYNAĞI (yeni dil buraya)
   │  ├─ routing.ts              URL yapısı ve dil bazlı yol takma adları
   │  └─ request.ts              next-intl istek konfigürasyonu
   │
   ├─ access/
   │  └─ index.ts                Rol tabanlı yetkilendirme (admin/editor/author/viewer)
   │
   ├─ fields/
   │  ├─ slug.ts                 Çok dilli slug alanı
   │  ├─ publishing.ts           Yayın tarihi + çeviri durumu alanı
   │  └─ options.ts              Paylaşılan seçenek listeleri (ISO kodları)
   │
   ├─ hooks/
   │  ├─ formatSlug.ts           Kiril/Türkçe → URL dostu slug
   │  ├─ syncTranslationStatus.ts Eksik çeviri takibi (Şartname 5)
   │  └─ revalidate.ts           Yayınlandığında ISR tazeleme
   │
   ├─ collections/               ★ VERİ ŞEMALARI
   │  ├─ TrainingTopics.ts        6.3  Eğitim Konuları
   │  ├─ TrainingPrograms.ts      6.4 + EK-2 2.1–2.4  Eğitimler ve Programlar
   │  ├─ SimulationSystems.ts     6.5, 9.1–9.3  OYMES / BTES ve diğerleri
   │  ├─ News.ts                  6.7, 10.3  Haberler ve Duyurular
   │  ├─ InternationalGuide.ts    8.1–8.2  Uluslararası Katılımcı Rehberi
   │  ├─ Faqs.ts                  8.3  Sık Sorulan Sorular
   │  ├─ GalleryAlbums.ts         6.8  Galeri ve Medya
   │  ├─ Pages.ts                 6.1, 6.2, 6.9  Serbest sayfalar (blok tabanlı)
   │  ├─ Projects.ts              10.1  Proje bilgi alanı
   │  ├─ DocumentFiles.ts         11.3  Site belgeleri (EK-2 DEĞİL)
   │  ├─ Media.ts                 Görsel/video, localized alt metin
   │  ├─ Users.ts                 11.2, 12.1  Panel kullanıcıları
   │  └─ index.ts
   │
   ├─ globals/                   ★ TEKİL AYARLAR
   │  ├─ SiteSettings.ts          Kurum kimliği, iletişim, KVKK/çerez, logolar
   │  ├─ Navigation.ts            Menü yönetimi (ağaç dilden bağımsız)
   │  ├─ ExternalServices.ts      ★ EK-2 KÖPRÜSÜ (kütüphane/portal adresleri)
   │  ├─ SimulationCenter.ts      Simülasyon Merkezi sayfa metni
   │  └─ index.ts
   │
   ├─ lib/
   │  └─ externalLinks.ts        Kütüphane/portal URL üreticileri
   │
   ├─ components/admin/          Panel özelleştirmeleri
   │  ├─ TranslationOverview.tsx  Kontrol panelinde eksik çeviri özeti
   │  ├─ MenuRowLabel.tsx         Menü satır etiketleri
   │  └─ LoginNotice.tsx
   │
   └─ app/
      ├─ (payload)/              Admin paneli + REST API (dil önekinden muaf)
      └─ (frontend)/[locale]/    Genel site
```

Ekibe kural: **yeni bir içerik türü = `collections/` altında yeni bir dosya + `collections/index.ts`'e bir satır.**
Başka hiçbir yere dokunulmaz.

---

## 3. Çok dilli mimari

### Karar: alan bazında localization

Payload'ın yerleşik `localized: true` alanları kullanılır. Bir eğitim = tek kayıt,
üç dilde alanlar. Gerekçe:

- Şartname 5: *"Eğitim materyallerinin Türkçe, İngilizce ve Rusça sürümleri
  ilişkilendirilebilmelidir."* → Zaten aynı kayıt; ilişkilendirme kendiliğinden.
- Şartname 5: *"Menü yapısı diller arasında tutarlı olmalıdır."* → Menü ağacı
  `localized` **değil**, yalnızca etiketler `localized`. Editör RU menüsüne
  fazladan öğe ekleyemez.
- Slug'lar `localized`: `/tr/egitimler/...`, `/en/trainings/...`, `/ru/obucheniya/...`

### Yeni dil ekleme

`src/i18n/locales.ts` içindeki diziye bir satır; `messages/<kod>.json` dosyası.
Payload localization, hreflang, sitemap ve middleware bu tek kaynaktan beslenir.

### Eksik çeviri takibi (Şartname 5)

`syncTranslationStatus` hook'u her kayıt değişiminde dokümanı `locale: 'all'` ile
okur ve dile bağlı olmayan `translationStatus` alanına `{ complete, missing }`
yazar. Kontrol panelindeki **Çeviri Durumu** tablosu bunu bölüm ve dil bazında
özetler.

`fallback: true` açıktır: RU çevirisi girilmemiş bir alan TR değeriyle doldurulur,
böylece site yarım görünmez — ama eksik olduğu panelde işaretli kalır.

---

## 4. EK-2 köprüsü nasıl çalışır

`ExternalServices` global'i tüm dış adreslerin tek kaynağıdır:

- **Durum yönetimi:** `live` / `coming-soon` / `maintenance` / `hidden`.
  Kütüphane henüz yayında değilse menü öğesi tıklanamaz hale gelir ve
  bilgilendirme metni gösterilir. Site, kütüphaneden bağımsız canlıya alınabilir.
- **Şablonlu derin bağlantı:** `{locale}`, `{subject}`, `{trainingCode}`, `{query}`
  yer tutucuları. Ziyaretçi RU dilindeyse kütüphaneye de RU filtresiyle gider.
- **Kod tarafı:** `src/lib/externalLinks.ts` → `buildLibraryLink()`,
  `buildPortalLink()`, `resolveApplicationHref()`. Bileşenlerde elle URL
  birleştirilmez.

Eğitim konularındaki `librarySubjectKey` ve eğitim programlarındaki
`libraryCollectionKey` alanları, iki sistem arasındaki **ortak sözlüktür**.
Bu iki alanın değerleri kütüphane ekibiyle yazılı olarak mutabık kalınmalıdır.

Portal tarafında kimlik doğrulama tamamen EK-2'dedir. Web sitesi hiçbir kimlik
bilgisi tutmaz, saklamaz veya iletmez.

---

## 4b. Frontend kabuğu

### Stil: Tailwind CSS 4, konfigürasyon dosyası yok

Tüm tasarım token'ları `src/app/(frontend)/globals.css` içindeki `@theme`
bloğundadır. `tailwind.config.js` **yoktur** ve oluşturulmamalıdır.

Paletin tamamı WCAG 2.2 AA'ya göre ölçülmüştür; değerler dosyanın başındaki
yorumda kayıtlıdır. Üç kural:

- `brand-500` metin rengi olarak **kullanılmaz** (3.62:1) — yalnızca dolgu/ikon.
- `line` (#D6DEDF) yalnızca dekoratif ayraçtır. Form kenarlığı ve UI sınırı
  için `line-strong` (#7F8C8F, 3.47:1) kullanılır — WCAG 1.4.11.
- Odak halkası hiçbir koşulda kaldırılmaz; `forced-colors` modunda `Highlight`
  rengine düşer.

Yazı tipi `next/font/google` ile **build sırasında indirilip kendi
origin'imizden** servis edilir. Çalışma anında Google'a istek gitmez, yani
ziyaretçinin IP'si üçüncü tarafa ulaşmaz — KVKK açısından kritik fark.
`cyrillic` alt kümesi zorunludur.

### URL mimarisi

`src/i18n/routes.ts` tek kaynaktır. Bölüm segmentleri her dilde yerelleştirilir:

```
/tr/egitim-programlari/orman-yangini-yonetimi
/en/training-programmes/forest-fire-management
/ru/programmy-obucheniya/upravlenie-lesnymi-pozharami
```

**Klasör adlandırma kuralı:** `app/(frontend)/[locale]/` altındaki klasör adları
**Türkçe (kanonik)** segmentlerdir. next-intl gelen `/en/training-programmes`
isteğini `/[locale]/egitim-programlari` dosya yoluna yeniden yazar. Yeni bölüm
eklerken üç yere birden eklenir: `routes.ts`, `globals/Navigation.ts` içindeki
"Sistem bölümü" seçenekleri, ve klasör.

**Bağlantı üretme kuralı — karıştırmayın:**

| Durum | Kullanılacak |
|---|---|
| CMS içeriğine bağlantı | `href()` / `detailHref()` / `pageHref()` + düz `next/link` |
| Dil değiştirme | next-intl'in `usePathname` / `useRouter` (`@/i18n/routing`) |

next-intl'in `Link`'i zaten yerelleştirilmiş bir yolu ikinci kez
yerelleştirmeye çalışır; ikisi bir arada kullanılmaz.

### Aktif menü tespiti neden `canonicalPath` üzerinden?

`next/navigation`'ın `usePathname`'i sunucuda **yeniden yazılmış** yolu,
istemcide tarayıcıdaki **yerelleştirilmiş** yolu döndürür. İkisini
karşılaştırmak hidrasyon uyuşmazlığı üretir. Bu yüzden `ResolvedNavLink`
hem `href` (ziyaretçinin göreceği) hem `canonicalPath` (karşılaştırma için)
taşır ve `MainNav` next-intl'in `usePathname`'ini kullanır.

### Menü erişilebilirliği: disclosure, `role="menu"` değil

Alt menüsü olan başlık `<button aria-expanded aria-controls>`, açtığı panel
sıradan bir `<ul>`. `role="menu"` bilinçli olarak kullanılmaz — o desen
masaüstü uygulama menüleri içindir, ekran okuyucuyu "uygulama moduna" sokar
ve ok tuşuyla gezinmeyi zorunlu kılar. Menü hover ile açılmaz; dokunmatik
eşitliği ve 2.5.8 hedef boyutu için tıklama esastır.

### EK-2 durum makinesi arayüzde

| Durum | Menüde | Ana sayfada |
|---|---|---|
| `live` | Bağlantı + yeni sekme uyarısı | Kütüphane bölümü + öne çıkan koleksiyonlar |
| `coming-soon` | Tıklanamaz metin + "Yakında" rozeti | Bölüm görünür, `role="status"` ile bilgilendirme |
| `maintenance` | Tıklanamaz | Uyarı gösterilir, bağlantı verilmez |
| `hidden` | Menüden çıkarılır | Bölüm hiç render edilmez |

Kütüphane hazır olmadan site canlıya alınabilir; tek yapılacak `ExternalServices`
global'inde durumu değiştirmektir. Kod dokunulmaz.

### Analitik ve onay

`lib/analytics.ts` bir analitik sistemi **değildir**, bağlanma noktasıdır.
Çerez onayı verilmeden hiçbir olay gönderilmez. Gönderilen veri: olay adı,
kararlı hedef anahtarı (`library`, `portal`, `ext:<host>`) ve dil. Tam URL,
sorgu parametresi veya kişisel veri asla gönderilmez. Kurumsal araç
(Matomo/Plausible) seçildiğinde yalnızca `dispatch` bloğu doldurulur.

### Yeni bileşen eklerken

```
src/components/
  layout/   Sayfa kabuğu (header, footer, menü, çerez)
  ui/       Yeniden kullanılabilir küçük parçalar
  ek2/      Kütüphane/portal köprüsü — dış bağlantı üreten her şey buraya
  admin/    Yalnızca Payload paneli
```

Sunucu bileşeni varsayılandır. `'use client'` yalnızca durum, olay veya
tarayıcı API'si gerektiğinde. Veri her zaman `lib/queries.ts` üzerinden
çekilir — bileşenler `getPayload`'ı doğrudan çağırmaz.

## 5. Şartname izlenebilirlik tablosu

| Şartname | Karşılandığı yer |
|---|---|
| 5 Çok dilli yapı | `i18n/locales.ts`, `payload.config.ts > localization`, `hooks/syncTranslationStatus.ts` |
| 6.1 Ana sayfa | `Pages.ts` (`pageType: home`) + `Navigation.ts > quickAccess` |
| 6.2 Kuruluş | `Pages.ts` (`pageType: institution`, `peopleBlock`, `timelineBlock`, `partnersBlock`) |
| 6.3 Eğitim konuları | `TrainingTopics.ts` |
| 6.4 Eğitim programları ve duyurular | `TrainingPrograms.ts` |
| 6.5 / 9.1–9.3 Simülasyon merkezi | `SimulationSystems.ts` + `globals/SimulationCenter.ts` |
| 6.6 Dijital kütüphane | `globals/ExternalServices.ts` (yönlendirme; EK-2 ayrı ekip) |
| 6.7 Haberler ve duyurular | `News.ts` |
| 6.8 Galeri ve medya | `GalleryAlbums.ts` |
| 6.9 İletişim | `SiteSettings.ts > contact` + form-builder eklentisi |
| 7.1 Sertifika bilgisi | `TrainingPrograms.ts > certificateType` |
| 7.3 Sertifika doğrulama | `ExternalServices.ts > portal.certificateVerifyPath` (portal tarafı) |
| 8.1–8.2 Uluslararası katılımcı rehberi | `InternationalGuide.ts` |
| 8.3 SSS | `Faqs.ts` |
| 10.1–10.3 Proje görünürlüğü | `Projects.ts`, `SiteSettings.ts > primaryProject`, `News.ts > isProjectOutput` |
| 11.2 Yönetim paneli | Payload admin + `components/admin/*` |
| 11.3 Dosya yönetimi | `DocumentFiles.ts` (MIME beyaz listesi, sürüm, erişim seviyesi, arşiv) |
| 11.4 Arama altyapısı | `@payloadcms/plugin-search`, `localize: true` |
| 12.1 Güvenlik | `Users.ts` (kilitleme, oturum süresi), `next.config.mjs` başlıkları, `graphQL.disable`, MIME beyaz listeleri |
| 12.2 KVKK | `formSubmissionOverrides` (yazma kapalı), `consentText`, `retentionDays`; katılımcı adı tutulmaz |
| 12.3 Çerez/analitik | `SiteSettings.ts > cookieBanner`, `analytics.anonymizeIp` |
| 13 WCAG 2.2 AA | `Media.alt` localized ve zorunlu, `ariaLabel`, `captionsUrl`, skip-link, `prefers-reduced-motion`, h2'den başlayan başlık hiyerarşisi |
| 14.1 Performans | ISR + `revalidate.ts`, WebP dönüşümü, imageSizes, CDN alanı |
| 21 ISO kodları | `fields/options.ts` (ISO 639-1 / 3166-1) |

---

## 6. Bilinçli olarak yapılmayanlar

- **LMS yok.** Şartname EK-2 2. madde açıkça *"tam kapsamlı bir LMS zorunluluğu
  doğurmadan"* diyor. Başvurular alınmaz, yönlendirilir (`applicationTarget`).
- **Ziyaretçi üyeliği yok.** `Users` yalnızca panel kullanıcılarıdır (12.2:
  "gereksiz kişisel veri toplanmayacaktır").
- **Katılımcı listesi tutulmaz.** Eğitim sonucunda yalnızca toplam katılımcı sayısı.
- **GraphQL kapalı.** EK-1 ihtiyacı yok; saldırı yüzeyini küçültür.
- **Dijital kütüphane şeması burada yok.** Dublin Core meta-verisi, OAI-PMH,
  checksum/fixity, OCR — hepsi EK-2 kapsamındadır.

---

## 7. Yayına alma öncesi kontrol listesi

- [ ] `PAYLOAD_SECRET` üretimde farklı ve gizli
- [ ] `DATABASE_SSL=true` (kurumsal Postgres)
- [ ] `ALLOWED_ORIGINS` yalnızca gerçek alan adlarını içeriyor
- [ ] `pnpm migrate:status` temiz
- [ ] `aiftc.com` ve `aiftc.net` → `aiftc.org` 301 yönlendirmesi (reverse proxy)
- [ ] `ExternalServices` içindeki kütüphane/portal adresleri doğrulandı
- [ ] Her koleksiyonda en az bir kayıt üç dilde tam (Çeviri Durumu tablosu boş)
- [ ] Erişilebilirlik denetimi: axe / Lighthouse + klavye ile tam gezinme
- [ ] Yönetici ve içerik editörü kılavuzları teslim edildi (Şartname 14.2)
