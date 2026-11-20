# O'rnatish va ishga tushirish

## A. Docker bilan (tavsiya etiladi)

```bash
cd infra
cp .env.example .env          # SECRET_KEY va parollarni o'zgartiring
docker compose up -d --build
docker compose exec backend python manage.py seed_demo
docker compose exec backend python manage.py createsuperuser
```

| Manzil | Nima |
|---|---|
| http://localhost | Web panel (Next.js) |
| http://localhost/api/docs/ | Swagger (API hujjatlari) |
| http://localhost/admin/ | Django admin (superadmin) |
| http://localhost:9001 | MinIO konsoli |

## B. Docker'siz (ishlab chiqish)

Talablar: Python 3.12, PostgreSQL 16+, Node 20+, pnpm 9, Flutter 3.27+.

### Backend

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # DATABASE_URL ni o'zingizning PostgreSQL'ga moslang
createdb restopro
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```

Redis o'rnatilmagan bo'lsa `USE_REDIS=0` qoldiring — kesh va WebSocket kanallari xotirada ishlaydi,
Celery vazifalari darhol (eager) bajariladi. SMS kodlari `SMS_PROVIDER=console` rejimida server logiga chiqadi.

Testlar va coverage:

```bash
pytest --cov
```

API sxemasini yangilash (Flutter va Next.js tiplari uchun):

```bash
python manage.py spectacular --file ../openapi.yaml
```

### Web panel

```bash
cd web
pnpm install
pnpm gen:api                  # openapi.yaml -> packages/api-client/src/schema.d.ts
cp apps/dashboard/.env.example apps/dashboard/.env.local
pnpm dev                      # http://localhost:3000
```

### Flutter ilova (Windows kassa)

```bash
cd flutter_app/restopro
flutter create --platforms=windows,android,ios --project-name restopro --org uz.restopro .
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter test
flutter run -d windows
```

Birinchi ishga tushirishda:

1. **Server manzili** — masalan `http://192.168.1.10:8000` (backend ishlayotgan kompyuter IP'si).
2. **Qurilmani ulash** — ega yoki menejer telefon + paroli bilan kiradi, filial va rejim tanlanadi:
   Kassa (asosiy kassa = lokal hub yoki zaxira hub) / Ofitsiant / Oshxona / Boshqaruv / Kuryer.
3. **PIN ekran** — xodim o'z ismini tanlaydi (ixtiyoriy) va 4 xonali PIN kiritadi. F12 — ekranni bloklash.

## Demo ma'lumotlar (`seed_demo`)

| Kim | Kirish |
|---|---|
| Ega | `+998901234567` / `demo1234`, PIN `0000` |
| Menejer | `+998901234568` / `manager123`, PIN `1111` |
| Kassirlar | PIN `2001`, `2002` |
| Ofitsiantlar | PIN `3001`–`3004` |
| Oshpazlar | PIN `4001`, `4002` |

1 kompaniya, 1 filial, 2 zal (Asosiy zal — 12 stol, Ayvon — 8 stol), 3 sex (Issiq, Somsa tandiri, Bar),
40 ta taom va ichimlik (retsept, yarim tayyor mahsulot va tannarx bilan), 4 qurilma (tokenlari buyruq oxirida chiqadi).
Qayta yaratish: `python manage.py seed_demo --reset`.

## Tekshirish (1-bosqich)

```bash
# 1. Sog'liq
curl http://localhost:8000/api/v1/health/

# 2. Ega bilan kirish
curl -X POST http://localhost:8000/api/v1/auth/login/ -H 'Content-Type: application/json' \
     -d '{"phone":"+998901234567","password":"demo1234"}'

# 3. Kassa qurilmasida PIN bilan kirish (token seed_demo chiqishidan)
curl -X POST http://localhost:8000/api/v1/auth/pin-login/ -H 'Content-Type: application/json' \
     -H 'X-Device-Token: dev_...' -d '{"pin":"2001"}'
```

Web panelda: kirish → Xodimlar (qo'shish, PIN berish) → Rollar (huquqlar matritsasi) → Qurilmalar → Audit jurnali.

## Asosiy API (1-bosqich)

| Endpoint | Tavsif |
|---|---|
| `POST /api/v1/auth/register/send-code/` | Ro'yxatdan o'tish uchun SMS kod |
| `POST /api/v1/auth/register/` (`verify-sms/`) | Kod + kompaniya, filial, ega, shablon yaratish |
| `POST /api/v1/auth/login/` | Telefon + parol |
| `POST /api/v1/auth/pin-login/` | PIN (X-Device-Token shart) |
| `GET  /api/v1/auth/pin-users/` | Qurilmadagi PIN ekrani uchun xodimlar |
| `POST /api/v1/auth/manager-pin/` | Menejer PIN tasdig'i |
| `POST /api/v1/auth/refresh/`, `logout/`, `GET me/` | Token yangilash (rotatsiya), chiqish, profil |
| `POST /api/v1/auth/devices/register/` | Qurilmani ro'yxatdan o'tkazish → device token + litsenziya |
| `/api/v1/auth/{roles,permissions,employees,audit-logs}/` | Rollar, huquqlar, xodimlar, audit |
| `/api/v1/tenancy/{branches,devices,settings,plans}/` | Filiallar, qurilmalar, sozlamalar, tariflar |
| `GET /api/v1/tenancy/{company,subscription,license}/`, `POST heartbeat/` | Kompaniya, obuna, offline litsenziya, qurilma holati |
| `ws://…/ws/v1/events/?token=…&branch=…` | Realtime hodisalar |

## Xavfsizlik

- JWT: access 15 daqiqa, refresh 30 kun, rotatsiya + qora ro'yxat.
- Parol va PIN — Argon2. PIN qidiruvi HMAC orqali (kompaniya ichida noyob).
- PIN: 5 marta xato → 5 daqiqa blok; qurilma bo'yicha throttling.
- Qurilma tokeni bazada faqat SHA-256 ko'rinishida saqlanadi; "Bloklash" darhol bekor qiladi.
- Obuna tugasa (+3 kun imtiyoz) — faqat ko'rish rejimi, ma'lumot o'chmaydi.
- Offline litsenziya — Ed25519 bilan imzolangan, 7 kun amal qiladi.
- Kunlik `pg_dump` (14 kun) + WAL arxivi (PITR): `infra/backup/`.
