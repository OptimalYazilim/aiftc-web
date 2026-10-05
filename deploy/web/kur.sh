#!/usr/bin/env bash
# ===========================================================================
# AIFTC — WEB SUNUCUSU: İLK KURULUM VE GÜNCELLEME (webaiftc)
# ===========================================================================
#   ./kur.sh                  # ilk kurulumda ve her `git pull` sonrasında
#
# SIRA ZORUNLUDUR (gerekçe: Dockerfile başı):
#   1. göç imajı derlenir           — Next derlemesi içermez, veritabanı gerekmez
#   2. veritabanı göçleri uygulanır — boş veritabanında tablolar burada oluşur
#   3. uygulama derlenir            — statik sayfalar için VERİTABANINA BAĞLANIR
#   4. servisler başlatılır          — migrate (boşta geçer) → app → nginx
#
# `docker compose up -d --build` tek başına bu sırayı sağlamaz: compose bütün
# imajları ÖNCE derler, göçü SONRA çalıştırır; boş veritabanında derleme düşer.
# ===========================================================================
set -euo pipefail

cd "$(dirname "$0")"
ENV_DOSYASI=.env.production

if [ ! -f "$ENV_DOSYASI" ]; then
  echo "HATA: $ENV_DOSYASI yok. Kurulum kılavuzu: deploy/README.md (4.1)" >&2
  exit 1
fi

# Derleme sırrı (database_uri) compose'a kabuk ortamından verilir. Dosyadan
# YALNIZCA bu satır okunur; dosyanın tamamı kabuğa yüklenmez (parolalardaki
# özel karakterler kabukta yorumlanırdı). Çevreleyen tırnaklar ayıklanır.
DATABASE_URI="$(sed -n 's/^DATABASE_URI=//p' "$ENV_DOSYASI" | tail -1)"
DATABASE_URI="${DATABASE_URI%\"}"; DATABASE_URI="${DATABASE_URI#\"}"
DATABASE_URI="${DATABASE_URI%\'}"; DATABASE_URI="${DATABASE_URI#\'}"
if [ -z "$DATABASE_URI" ]; then
  echo "HATA: $ENV_DOSYASI içinde DATABASE_URI tanımlı değil (README 4.1)." >&2
  exit 1
fi
export DATABASE_URI

dc() { docker compose --env-file "$ENV_DOSYASI" "$@"; }

echo "[1/4] Göç imajı derleniyor…"
dc build migrate

echo "[2/4] Veritabanı göçleri uygulanıyor…"
dc run --rm migrate

echo "[3/4] Uygulama derleniyor (veritabanına bağlanır; ilk seferde 10–15 dk)…"
dc build app

echo "[4/4] Servisler başlatılıyor…"
dc up -d

dc ps
if curl -fsS http://127.0.0.1/api/health > /dev/null; then
  echo "Hazır: http://127.0.0.1/api/health yanıt veriyor."
else
  echo "Uyarı: sağlık ucu henüz yanıt vermiyor. Günlük: docker compose --env-file $ENV_DOSYASI logs app" >&2
fi
echo "Eski imajları temizlemek için (70 GB disk): docker image prune -f"
