#!/bin/sh
# Kunlik to'liq dump. PITR uchun WAL arxivi docker-compose'da yoqilgan (walarchive volume).
# Eski dumplar BACKUP_KEEP_DAYS kundan keyin olib tashlanadi.
set -e
TS=$(date +%Y%m%d-%H%M%S)
FILE="/backups/restopro-$TS.dump"
pg_dump -Fc -f "$FILE"
echo "Backup tayyor: $FILE"
find /backups -maxdepth 1 -name 'restopro-*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -exec rm -f {} \;
