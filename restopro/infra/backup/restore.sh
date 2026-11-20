#!/bin/sh
# Foydalanish: docker compose exec backup sh /scripts/restore.sh /backups/restopro-YYYYMMDD-HHMMSS.dump
set -e
if [ -z "$1" ]; then
  echo "Dump fayl yo'lini kiriting"
  exit 1
fi
pg_restore --clean --if-exists -d "$PGDATABASE" "$1"
echo "Tiklandi: $1"
