#!/usr/bin/env bash
# ===========================================================================
# AIFTC — VERİTABANI YEDEĞİ (dbaiftc)
# ===========================================================================
# pg_dump özel biçimde (-Fc) yedek alır, eski yedekleri siler.
#
#   ./yedekle.sh                       # elle
#   crontab -e  →  30 2 * * * /opt/aiftc/deploy/db/yedekle.sh >> /var/log/aiftc-yedek.log 2>&1
#
# GERİ YÜKLEME (dikkat: mevcut verinin ÜZERİNE yazar):
#   docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < /var/backups/aiftc/aiftc-YYYYAAGG-SSDD.dump
#
# Yedekler bu sunucunun diskindedir; sunucu kaybedilirse yedek de gider.
# Dizini kurumun yedekleme sistemine dahil ettirin ya da başka bir yere kopyalayın.
# ===========================================================================
set -euo pipefail

cd "$(dirname "$0")"

# İsteğe bağlı ayarlar .env'den okunur (yalnızca bu iki değişken).
if [ -f .env ]; then
  YEDEK_DIZINI="${YEDEK_DIZINI:-$(sed -n 's/^YEDEK_DIZINI=//p' .env | tail -1)}"
  YEDEK_SAKLAMA_GUN="${YEDEK_SAKLAMA_GUN:-$(sed -n 's/^YEDEK_SAKLAMA_GUN=//p' .env | tail -1)}"
fi
HEDEF="${YEDEK_DIZINI:-/var/backups/aiftc}"
SAKLA_GUN="${YEDEK_SAKLAMA_GUN:-14}"

mkdir -p "$HEDEF"
chmod 700 "$HEDEF"

dosya="$HEDEF/aiftc-$(date +%Y%m%d-%H%M).dump"

# Kimlik bilgileri konteynerin kendi ortamından okunur; parola bu betikte geçmez.
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$dosya.tmp"

# Boş ya da yarım dosya "başarılı yedek" sayılmasın.
if [ ! -s "$dosya.tmp" ]; then
  rm -f "$dosya.tmp"
  echo "$(date '+%F %T') HATA: yedek boş çıktı" >&2
  exit 1
fi
mv "$dosya.tmp" "$dosya"
chmod 600 "$dosya"

find "$HEDEF" -name 'aiftc-*.dump' -mtime +"$SAKLA_GUN" -delete

echo "$(date '+%F %T') yedek alındı: $dosya ($(du -h "$dosya" | cut -f1))"
