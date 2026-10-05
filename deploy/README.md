# AIFTC — İki sunuculu kurulum (dbaiftc + webaiftc)

Bu klasör, sitenin kurumun verdiği iki Ubuntu 24.04 sunucusuna kurulması içindir:

| Sunucu     | Görevi                                          | Klasör        |
|------------|-------------------------------------------------|---------------|
| `dbaiftc`  | PostgreSQL 16                                   | `deploy/db`   |
| `webaiftc` | Uygulama (Next.js + Payload), göç adımı, nginx  | `deploy/web`  |

```
İnternet ──> [F5 / kurum vekili, HTTPS] ──> webaiftc: nginx :80 ──> app :3000 ──> dbaiftc: PostgreSQL :5432
```

**Dosyalar (görsel, video, belge)** şimdilik `webaiftc` diskinde durur
(`MEDIA_STORAGE_ADAPTER=local`). Video/fotoğraf arşivi için kurumdan depolama
istendi; gelince yalnızca ayar değişir (bkz. [8. Depolama](#8-depolama-kurum-s3-verdiğinde)).

> Kökteki `docker-compose.yml` her şeyi TEK sunucuda çalıştırır. Bu kurulumda
> onu değil, bu klasördekileri kullanın.

---

## 0. Kurulumdan önce kurumdan alınması gerekenler

- [ ] Sunucuların internete (Docker, npm, GitHub) çıkışı var mı? Yoksa → [10. Çevrimdışı kurulum](#10-çevrimdışı-kurulum)
- [ ] Sitenin alan adı (derleme anında uygulamaya gömülür, sonradan değişirse yeniden derlenir)
- [ ] HTTPS'i kim sonlandıracak: F5 mi, bu sunucudaki nginx mi? (bkz. [9. TLS](#9-tls))
- [ ] F5 / vekil kullanılıyorsa onun iç IP'si (gerçek ziyaretçi IP'si için)
- [ ] `webaiftc` → `dbaiftc` 5432/TCP erişimi açık mı?
- [ ] SMTP sunucusu bilgileri (onay e-postası, parola sıfırlama)
- [ ] `sudo` yetkisi (Docker kurulumu için)

---

## 1. Her iki sunucuda: Docker kurulumu

Docker'ın resmî Ubuntu kurulumu (internet gerekir):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"     # sonra oturumu kapatıp yeniden açın
docker compose version              # doğrulama
```

## 2. Kodu sunuculara alma (her iki sunucu)

```bash
sudo mkdir -p /opt/aiftc && sudo chown "$USER" /opt/aiftc
git clone https://github.com/OptimalYazilim/aiftc-web.git /opt/aiftc
```

Depo özel ise GitHub'a erişim için salt okunur bir *deploy key* tanımlanır.
GitHub'a erişim yoksa kod arşiv olarak taşınır (`git archive --format=tar.gz -o aiftc.tar.gz HEAD`).

---

## 3. Veritabanı sunucusu (dbaiftc)

```bash
cd /opt/aiftc/deploy/db
cp .env.example .env && chmod 600 .env
nano .env
```

`.env` içinde:

- `POSTGRES_PASSWORD` — uzun ve rastgele. Yalnızca harf ve rakam olsun (URL'de kodlama gerektirmesin):
  `openssl rand -base64 32 | tr -d '/+=' | cut -c1-32`
- `DB_BIND_ADDR` — bu sunucunun iç IP'si (port yalnızca bu adreste açılır)

`pg_hba.conf` içindeki `WEB_SUNUCU_IP` yazısını web sunucusunun IP'siyle değiştirin:

```bash
sed -i 's/WEB_SUNUCU_IP/<webaiftc-ic-IP>/' pg_hba.conf
grep '/32' pg_hba.conf     # doğru IP yazıldı mı?
docker compose up -d
docker compose ps          # db "healthy" olmalı
```

> Değiştirilmezse Postgres bilerek başlamaz ("invalid IP address").

**Erişim nasıl sınırlanıyor:** port yalnızca iç IP'de açılır ve `pg_hba.conf`
yalnızca web sunucusundan parolayla bağlantı kabul eder.
**UFW tek başına yetmez:** Docker, yayınladığı portlar için UFW'nin kurallarını atlar.

**Yedekleme** (her gece 02:30, 14 gün saklanır):

```bash
chmod +x yedekle.sh && ./yedekle.sh          # elle bir kez deneyin
crontab -e
# 30 2 * * * /opt/aiftc/deploy/db/yedekle.sh >> /var/log/aiftc-yedek.log 2>&1
```

Yedekler `/var/backups/aiftc` altındadır; bu dizini kurumun yedekleme sistemine dahil ettirin.
Geri yükleme komutu `yedekle.sh` başındadır.

---

## 4. Web sunucusu (webaiftc)

### 4.1 Ortam dosyası

```bash
cd /opt/aiftc/deploy/web
cp ../../.env.production.example .env.production && chmod 600 .env.production
nano .env.production
```

Şablon tek sunucu için yazılmıştır. **İki sunuculu düzen için değişiklikler:**

| Değişken | Değer |
|---|---|
| `DATABASE_URI` | `postgres://aiftc:<POSTGRES_PASSWORD>@<dbaiftc-ic-IP>:5432/aiftc` — şablon "tanımlamayın" der; **bu kurulumda ZORUNLUDUR** |
| `POSTGRES_USER/PASSWORD/DB` | Burada kullanılmaz, silebilirsiniz |
| `MEDIA_STORAGE_ADAPTER` | `local` (depolama gelene kadar) |
| `GUVENILIR_VEKIL` | Satırı ekleyin: F5 / vekilin IP'si ya da ağı (ör. `10.200.0.0/16`). Vekil yoksa eklemeyin |

Ayrıca şablondaki her zamanki değerler:

- `NEXT_PUBLIC_SERVER_URL`, `ALLOWED_ORIGINS` → sitenin `https://` adresi
- `PAYLOAD_SECRET`, `CRON_SECRET`, `REVALIDATION_SECRET` → her biri için `openssl rand -hex 32`
- `SMTP_*` → kurumun e-posta sunucusu
- `MAX_UPLOAD_MB` → nginx de bu değeri kullanır

### 4.2 Derleme ve başlatma

```bash
chmod +x kur.sh
./kur.sh
```

`kur.sh` şu sırayı uygular (ilk derleme 10–15 dakika sürebilir):

1. göç imajı derlenir (veritabanı gerekmez)
2. **veritabanı göçleri** uygulanır — boş veritabanında tablolar burada oluşur
3. **uygulama derlenir** — statik sayfalar için `dbaiftc`'ye bağlanır
4. servisler başlar: migrate → app → nginx

> `docker compose up -d --build` doğrudan **kullanılmaz**: compose tüm imajları
> göçten önce derler ve boş veritabanında derleme düşer (ölçüldü). Derleme
> veritabanına bağlandığı için `webaiftc` → `dbaiftc` 5432 erişimi derleme
> sırasında da açık olmalıdır. Veritabanı adresi derlemeye Docker'ın *secret*
> mekanizmasıyla gider; imaja ve imaj geçmişine yazılmaz.

```bash
docker compose --env-file .env.production ps                 # app "healthy", nginx "running"
docker compose --env-file .env.production logs migrate       # "Done." ile bitmeli
curl -fsS http://127.0.0.1/api/health                        # {"status":"ok"}
```

### 4.3 İlk yönetici hesabı

Boş veritabanında panelin "ilk kullanıcıyı oluştur" ekranı **kullanılmaz**
(oradan açılan hesap güvenlik kuralı gereği rolsüz ve onaysız olur). Hesap
sunucuda açılır; parola komut satırına yazılmaz:

```bash
read -r  -p 'Yönetici e-postası: ' ILK_YONETICI_EPOSTA
read -rs -p 'Parola (en az 10 karakter): ' ILK_YONETICI_PAROLA; echo
export ILK_YONETICI_EPOSTA ILK_YONETICI_PAROLA
docker compose --env-file .env.production run --rm \
  -e ILK_YONETICI_EPOSTA -e ILK_YONETICI_PAROLA migrate pnpm ilk-yonetici
unset ILK_YONETICI_PAROLA
```

Beklenen çıktı: `Yönetici hesabı açıldı ve giriş doğrulandı`. Veritabanında
zaten bir yönetici varsa betik hiçbir şey yapmaz. Sonraki hesaplar panelden açılır.

### 4.4 KVKK temizlik görevi

Süresi dolan form gönderimlerini siler. Zamanlayıcı kurulmazsa hiç çalışmaz:

```bash
crontab -e
# 15 3 * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" http://127.0.0.1/api/kvkk/temizlik >> /var/log/aiftc-kvkk.log 2>&1
```

Önce kuru çalıştırma (hiçbir şey silmez):
`curl -H "Authorization: Bearer <CRON_SECRET>" http://127.0.0.1/api/kvkk/temizlik`

---

## 5. Yayına almadan önce

`.env.production.example` sonundaki **DAĞITIM KONTROL LİSTESİ**'nin tamamı.
Bu kurulumla birlikte gelenler:

- [x] nginx yükleme sınırı ve zaman aşımları (`MAX_UPLOAD_MB`, 300 sn)
- [x] Oturum uçlarında hız sınırı (dakikada 10, anlık 5)
- [x] `X-Forwarded-For` başlığını nginx kendisi yazar
- [ ] TLS (F5 ya da [9. TLS](#9-tls))
- [ ] Sunucuların varsayılan parolaları değiştirildi, SSH anahtarına geçildi

## 6. Günlükler ve izleme

```bash
cd /opt/aiftc/deploy/web
docker compose --env-file .env.production logs -f app       # uygulama
docker compose --env-file .env.production logs -f nginx     # erişim
docker system df                                            # disk kullanımı
```

## 7. Güncelleme

```bash
cd /opt/aiftc && git pull
cd deploy/web && ./kur.sh
docker image prune -f        # eski imajları temizler (70 GB disk sınırlı)
```

Yeni veritabanı göçleri derlemeden önce kendiliğinden uygulanır.
Önemli güncellemelerden önce `dbaiftc`'de elle yedek alın: `./yedekle.sh`.

## 8. Depolama (kurum S3 verdiğinde)

`.env.production`:

```
MEDIA_STORAGE_ADAPTER=s3
S3_ENDPOINT=https://<kurumun-s3-adresi>
S3_BUCKET=<kova>
S3_ACCESS_KEY_ID=<anahtar>
S3_SECRET_ACCESS_KEY=<gizli-anahtar>
S3_FORCE_PATH_STYLE=true
S3_ACL=private        # depolama ACL desteklemiyorsa: none
```

```bash
docker compose --env-file .env.production up -d
docker compose --env-file .env.production run --rm migrate pnpm s3:denetle   # "KAPALI" demeli
```

Kova **herkese açık olmamalıdır**; `s3:denetle` "KOVA HERKESE AÇIK" derse
yayına geçilmez. Daha önce yerel diske yüklenmiş dosyaların kovaya taşınması
ayrı bir adımdır ve geçişten önce planlanmalıdır.

## 9. TLS

- **F5 sonlandırıyorsa (önerilen):** F5 → `webaiftc:80`. F5 `X-Forwarded-For` ve
  `X-Forwarded-Proto: https` göndermeli. `GUVENILIR_VEKIL` F5'in IP'sine ayarlanır.
- **Bu sunucu sonlandıracaksa:** sertifika ve anahtar `nginx/certs/` altına
  (git'e girmez), ardından:

  ```bash
  cp nginx/aiftc-tls.conf.ornek nginx/templates/aiftc.conf.template
  docker compose --env-file .env.production up -d nginx
  ```

## 10. Çevrimdışı kurulum

Derleme sırasında internet gerekir: Docker imajları (Docker Hub), npm paketleri
ve Docker'ın kendi paketleri indirilir. **En kolay yol**, kurumun kurulum ve
güncelleme sırasında geçici internet erişimi ya da bir vekil sunucu (proxy)
sağlamasıdır.

İmajı dışarıda derleyip taşımak **kısıtlıdır**: uygulama derlemesi üretim
veritabanına bağlanmak zorundadır (statik sayfalar derlemede üretilir). Bu,
ancak derleme yapılan makineden `dbaiftc`'ye erişim (ör. SSH tüneli) varsa
mümkündür. Veritabanı gerektirmeyen imajlar sorunsuz taşınır:

```bash
# İnternetli makinede:
docker pull postgres:16-alpine nginx:1.30-alpine
docker save postgres:16-alpine | gzip > aiftc-db-imaj.tar.gz
docker save nginx:1.30-alpine  | gzip > aiftc-nginx-imaj.tar.gz
# Sunucuda:
gunzip -c aiftc-db-imaj.tar.gz | docker load
```

Bu yol gerekiyorsa derleme adımını birlikte planlamak gerekir.

## 11. Sorun giderme

| Belirti | Bakılacak yer |
|---|---|
| Derleme "database_uri derleme sırrı verilmedi" | Derleme `kur.sh` ile değil doğrudan compose ile başlatılmış; `./kur.sh` kullanın |
| Derleme "cannot connect to Postgres" | `webaiftc` → `dbaiftc` 5432 erişimi, `pg_hba.conf` IP'si, `DATABASE_URI` |
| `app` başlamıyor | `logs migrate` — göç düştüyse uygulama bilerek başlamaz |
| Veritabanına bağlanamıyor | `dbaiftc`'de `pg_hba.conf` IP'si; `webaiftc` → 5432 güvenlik duvarı; `DATABASE_URI` parolası |
| 1 MB üstü yükleme 413 | `MAX_UPLOAD_MB` değeri ve nginx'in yeniden başlatılması |
| 502 Bad Gateway | `logs app`; uygulama sağlık denetimini geçmeden nginx başlamaz |
| Disk doluyor | `docker system df`, `docker image prune -f`, `/var/backups/aiftc` |
