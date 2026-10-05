# syntax=docker/dockerfile:1

# ============================================================================
# AIFTC WEB — ÜRETİM İMAJI
# ============================================================================
# Aşamalar:
#   base     ortak taban (Node + pnpm + libc6-compat)
#   deps     yalnızca bağımlılık kurulumu — kaynak değişince yeniden kurulmaz
#   migrator veritabanı göçlerini çalıştıran TEK SEFERLİK imaj (Next derlemesi YOK)
#   builder  Payload importMap + Next derlemesi — VERİTABANI ERİŞİMİ İSTER
#   runner   çalışan imaj — standalone çıktı, kaynak kod YOK
#
# SIRA ZORUNLU: önce göç, sonra derleme. Statik sayfalar (sitemap, eğitim,
# haber… sayfaları) derleme anında veritabanından üretilir. Ölçüldü
# (2026-10-05): veritabanına ulaşamayan derleme "/sitemap.xml" üretiminde
# "cannot connect to Postgres" ile DURUYOR. Boş veritabanında da tablolar
# göçten önce yoktur. CI aynı sırayı izler (göç → derleme).
# Kurulumda bu sırayı deploy/web/kur.sh uygular.
#
# Elle derleme:
#   docker build --target migrator -t aiftc-migrate .
#   docker run --rm -e DATABASE_URI=... -e PAYLOAD_SECRET=... aiftc-migrate
#   DATABASE_URI=... docker build --target runner -t aiftc-app \
#     --secret id=database_uri,env=DATABASE_URI \
#     --build-arg NEXT_PUBLIC_SERVER_URL=https://aiftc.org .
# ============================================================================

ARG NODE_VERSION=22-alpine

# --- base -------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
# libc6-compat: `sharp` (görsel türevleri) ve bazı yerel eklentiler Alpine'in
# musl libc'sinde glibc uyumluluğu ister. Eskiden YALNIZCA deps aşamasında
# kuruluydu; runner'da bulunmayınca sharp çalışma anında düşebiliyordu.
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# --- deps -------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `--frozen-lockfile`: kilit dosyası ile package.json çelişirse derleme DURUR.
# Üretim imajının sessizce farklı sürüm kurması kabul edilemez.
RUN pnpm install --frozen-lockfile

# --- migrator ---------------------------------------------------------------
# Göçler runner imajında ÇALIŞTIRILAMAZ: standalone çıktı yalnızca çalışma
# zamanı bağımlılıklarını taşır, Payload CLI'yi ve `src/migrations` kaynağını
# içermez. Bu yüzden göç için kaynak ve tam node_modules taşıyan ayrı bir
# hedef vardır. Compose'da tek seferlik servis olarak çalışır.
#
# Next derlemesini İÇERMEZ (eskiden builder'dan türüyordu): göç derlenmiş
# siteye ihtiyaç duymaz, derleme ise göç uygulanmış veritabanına ihtiyaç
# duyar. Builder'dan türeseydi boş veritabanında ikisi birbirini beklerdi.
# İlk yönetici betiği (pnpm ilk-yonetici) de bu imajla çalışır.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
CMD ["pnpm", "payload", "migrate"]

# --- builder ----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* DEĞİŞKENLERİ DERLEME ANINDA GÖMÜLÜR.
# Çalışma anında verilmeleri ETKİSİZDİR: Next bu değerleri istemci paketine
# yazar. Bu yüzden build-arg olarak alınırlar. Verilmezse site kendi mutlak
# adresini bilemez; `next.config.mjs` içindeki `images.remotePatterns` boş
# kalır ve uzak görseller optimize edilemez.
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_LIBRARY_URL
ARG NEXT_PUBLIC_PORTAL_URL
ARG NEXT_PUBLIC_ANALYTICS_DOMAIN
ARG NEXT_PUBLIC_ANALYTICS_SCRIPT_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    NEXT_PUBLIC_LIBRARY_URL=${NEXT_PUBLIC_LIBRARY_URL} \
    NEXT_PUBLIC_PORTAL_URL=${NEXT_PUBLIC_PORTAL_URL} \
    NEXT_PUBLIC_ANALYTICS_DOMAIN=${NEXT_PUBLIC_ANALYTICS_DOMAIN} \
    NEXT_PUBLIC_ANALYTICS_SCRIPT_URL=${NEXT_PUBLIC_ANALYTICS_SCRIPT_URL}

# Payload derleme sırasında yapılandırmayı yükler ve gizli anahtar ister.
# Bu değer İMAJA GİRMEZ (yalnızca builder aşamasında yaşar) ve gerçek üretim
# sırrı DEĞİLDİR; çalışma anındaki PAYLOAD_SECRET compose'dan gelir.
ENV PAYLOAD_SECRET=build-time-placeholder-not-a-real-secret
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Bellek: `next build` bu projede tip denetimi + statik üretimi birlikte yapar
# ve varsayılan yığınla "Zone Allocation failed" ile düşebiliyor (yaşandı).
ENV NODE_OPTIONS=--max-old-space-size=4096

# importMap, admin panelinin özel bileşenlerini çözer ve DERLEMEDEN ÖNCE
# üretilmelidir; aksi halde panel boş bileşenlerle derlenir.
#
# VERİTABANI ADRESİ BİR DERLEME SIRRI OLARAK GELİR (--secret id=database_uri).
# build-arg KULLANILMAZ: build-arg değerleri imaj geçmişinde (docker history)
# okunur ve parola imajla birlikte taşınırdı. Sır yalnızca bu RUN adımında
# /run/secrets altında bulunur; hiçbir katmana yazılmaz.
RUN --mount=type=secret,id=database_uri \
    if [ ! -s /run/secrets/database_uri ]; then \
      echo "HATA: database_uri derleme sırrı verilmedi. Statik sayfalar derlemede veritabanından üretilir (bkz. Dockerfile başı, deploy/web/kur.sh)." >&2; \
      exit 1; \
    fi \
 && export DATABASE_URI="$(cat /run/secrets/database_uri)" \
 && pnpm payload generate:importmap \
 && pnpm build

# --- runner -----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# HEALTHCHECK için gerekli; imaja eklenen tek ekstra araç.
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone çıktı: kaynak kod, devDependencies ve Payload CLI imajda YOKTUR.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Yerel disk depolamada (MEDIA_STORAGE_ADAPTER=local) Payload buraya yazar.
# S3/MinIO kullanılıyorsa bu dizinler boş kalır — yine de var olmalıdırlar,
# yoksa yükleme "ENOENT" ile düşer.
#
# İKİ AYRI DİZİN, İKİ AYRI GEREKÇE — KARIŞTIRILMAMALI:
#   public/media      → Next bunları doğrudan diskten servis eder. Logolar ve
#                       kapak görselleri anonim ziyaretçiye açık OLMALIDIR.
#   private/documents → `public/` DIŞINDA. Belgeler yalnızca Payload'ın erişim
#                       denetiminden geçen uç noktadan sunulur. Bu dizin
#                       `public/` altına taşınırsa erişim kuralı ATLANIR ve
#                       her belge adresini bilene açılır (ölçüldü 2026-09-07;
#                       bkz. collections/DocumentFiles.ts).
RUN mkdir -p public/media private/documents \
 && chown -R nextjs:nodejs public private

USER nextjs
EXPOSE 3000

# `--spider` yerine curl: 127.0.0.1 üzerinden, dış ağa çıkmadan.
# start-period, ilk açılıştaki derlenmiş sayfa yüklemesine pay bırakır.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
