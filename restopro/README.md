# RestoPro — restoran, oshxona va kafe boshqaruv tizimi (SaaS)

Milliy oshxonalar (osh markazi, choyxona, somsaxona), restoranlar va to'yxonalar, kafe va fast-food,
yetkazib berish oshxonalari uchun. Buyurtma, oshxona, ombor (retsept bilan), kassa va foyda — bitta tizimda.
Kassa internetsiz ishlaydi. Ega restoranni telefondan istalgan joydan boshqaradi.

## Arxitektura

```
                         ☁️ BULUT
  ┌───────────────────────────────────────────────────┐
  │ Django API (multi-tenant) · Channels · Celery     │
  │ PostgreSQL · Redis · S3 (MinIO)                   │
  │ Next.js: web panel · QR menyu · superadmin        │
  └──────────────────────▲────────────────────────────┘
                         │ sync (internet bo'lsa)        📱 Ega mobil ilovasi
  ┌──────────────────────┴────────────────────────────┐
  │ 🖥️ ASOSIY KASSA = LOKAL HUB (Flutter Windows)      │
  │ Drift (SQLite WAL) + shelf HTTP/WS :8787 + mDNS    │
  └──────┬────────────┬─────────────┬────────────┬────┘
     Kassa #2    Ofitsiant      Oshxona KDS    Printerlar
```

| Qatlam | Texnologiya |
|---|---|
| Backend | Python 3.12, Django 5.1, DRF, simplejwt, drf-spectacular, Channels, Celery |
| Baza | PostgreSQL 16 (har modelda `company` FK, `TenantManager` avtomatik filtrlaydi) |
| Ilova | Flutter (bitta kod: Windows / Android / iOS), Riverpod, go_router, Drift, dio |
| Web | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui uslubi, TanStack Query/Table, next-intl |
| Infra | Docker Compose, Nginx, Gunicorn + Uvicorn, MinIO, kunlik backup + WAL arxivi |

### Multi-tenancy (tenant izolyatsiyasi)

1. `TenantJWTAuthentication` / `DeviceTokenAuthentication` so'rov kontekstiga (`contextvars`) `company_id`, `branch_id`, `user_id`, `device_id` ni yozadi.
2. `TenantBaseModel.objects` (TenantManager) joriy kompaniya bo'yicha avtomatik filtrlaydi va o'chirilganlarni yashiradi.
3. `TenantViewSetMixin` qo'shimcha ravishda `company_id` bo'yicha aniq filtr qo'yadi va yangi yozuvga kompaniyani majburan o'rnatadi.
4. `TenantPrimaryKeyRelatedField` — boshqa kompaniya obyektining ID'si serializer'dan o'tmaydi.
5. `tests/test_tenant_isolation.py` — barcha endpointlar bo'yicha izolyatsiya testlari.

### Bajarilgan bosqichlar

- [x] **1-bosqich — Asos**: Django + Docker + multi-tenancy, ro'yxatdan o'tish (SMS, Eskiz adapteri), 8 ta tizim roli + moslashuvchan huquqlar matritsasi, filiallar, qurilmalar (tarif limiti bilan), PIN login (5 xato → 5 daqiqa blok), menejer PIN tasdig'i, audit log, offline litsenziya tokeni (Ed25519, 7 kun), onboarding shablonlari (biznes turi bo'yicha), realtime WebSocket kanali. Flutter: qurilma rejimi tanlash, server sozlash, PIN ekran, Drift (outbox), dio + token refresh. Next.js panel: kirish/ro'yxatdan o'tish, filiallar, xodimlar, rollar matritsasi, qurilmalar, audit, sozlamalar, Ctrl+K.
- [ ] 2. Menyu, zal va stollar
- [ ] 3. Kassa va buyurtmalar
- [ ] 4. Lokal hub va offline
- [ ] 5. Ofitsiant ilovasi va KDS
- [ ] 6. Ombor va retseptlar
- [ ] 7–13. Kengaytirish

## Tuzilma

```
restopro/
├── backend/            Django (apps: core, tenancy, accounts, menu, floor, inventory, realtime, health)
│   ├── integrations/sms/   Eskiz.uz + console adapterlari
│   └── tests/              pytest
├── flutter_app/restopro/   Flutter ilova
├── web/                    Turborepo: apps/dashboard, packages/{ui,api-client,config}
├── infra/                  docker-compose.yml, nginx/, backup/
├── docs/                   o'rnatish va foydalanish qo'llanmasi
└── openapi.yaml            API sxemasi (Flutter va Next.js tiplari shundan)
```

O'rnatish va ishga tushirish: [docs/ornatish.md](docs/ornatish.md)
