# 🍽️ OshxonaPOS — Restoran va Oshxona Boshqaruv Tizimi (Online + Offline)

O'zbekistondagi restoran, kafe va choyxonalar uchun mo'ljallangan, to'liq **offline-first** arxitekturadagi professional savdo nuqtasi (POS) va boshqaruv tizimi.

---

## 📌 Asosiy Xususiyatlar

- 🟢 **Offline-First Ishlash:** Internet to'liq uzilsa ham savdo to'xtamaydi. Ikki kassa restoran ichidagi lokal server orqali barqaror ishlaydi.
- 🔄 **Avtomatik Bulut Sinxronizatsiyasi:** Internet paydo bo'lishi bilan barcha yangi savdolar va to'lovlar 15 soniyalik interval bilan bulutga idempotent tarzda yuklanadi (Outbox Pattern).
- 🧾 **ESC/POS Chek Chiqarish:** Termal printerlar (58mm va 80mm) uchun mijoz cheki, narxlarsiz oshxona chiptasi (Kitchen ticket) va Z-hisobotlar. Qayta chiqarishda majburiy `NUSXA` belgisi.
- 🥘 **Texnologik Karta va Retsept:** Taom sotilishi bilan ombordagi xomashyolardan avtomatik chiqim (`OUT_SALE`). Tannarx va sof foydani avtomatik hisoblash.
- 📱 **Oshxona Ekrani (KDS):** Planshetlar uchun oshxona buyurtmalar ekrani, 15 daqiqadan oshgan kechikkan taomlarni qizil ogohlantirish taymeri.
- 📊 **Admin Web Panel (Next.js 15):** Masofadan turib telefon yoki kompyuter orqali real-time tushum, TOP-10 taomlar va Excel eksport.
- 🤖 **Telegram Bot:** Kunlik Z-hisobot, kritik ombor qoldig'i va to'lov qaytarish (refund) xabarnomalari.
- 🔐 **Xavfsizlik:** Kassirlar uchun 4 xonali tezkor PIN-kod, buyurtmani bekor qilish faqat Admin PIN tasdig'i bilan.

---

## 🏗️ Arxitektura

```
                    ☁️  BULUT (Cloud API: 5000-port)
                          ▲          ▲
      POST /push & GET /pull         │  Admin Web Panel (Next.js: 3000-port)
             (har 15 soniyada)        │  — istalgan joydan nazorat
        ┌─────────────────┴──────────┴──────────┐
        │   🖥️ LOKAL SERVER (Restoran ichida: 4000-port) │
        │   NestJS + PostgreSQL + Socket.IO     │
        │   (Outbox Pattern: sync_queue jadvali) │
        └───────┬──────────────┬───────────┬────┘
           LAN/Wi-Fi       LAN/Wi-Fi    LAN/Wi-Fi
        ┌───────▼───┐   ┌──────▼────┐  ┌───▼──────────────┐
        │ Kassa #1  │   │ Kassa #2  │  │ Oshxona ekrani   │
        │ Electron  │   │ Electron  │  │ (KDS planshet)   │
        │ + printer │   │ + printer │  │ + oshxona printer│
        └───────────┘   └───────────┘  └──────────────────┘
```

---

## 🗂️ Loyiha Tuzilmasi (Monorepo)

```
cook/
├── apps/
│   ├── pos-desktop/        # Electron + Vite + React (Sensorli Kassa ilovasi)
│   ├── local-server/       # NestJS (Restoran ichidagi lokal server)
│   ├── cloud-api/          # NestJS (Bulut serveri)
│   └── admin-web/          # Next.js 15 (Admin boshqaruv veb paneli)
├── packages/
│   ├── db/                 # Prisma schema + migratsiya + seed (PostgreSQL)
│   ├── shared/             # Umumiy tiplar, enumlar, UUIDv7, pul formatlash
│   ├── sync/               # Sinxronizatsiya mantig'i, Outbox, konflikt hal qilish
│   └── printer/            # ESC/POS chek shablonlari (58mm/80mm, Z-hisobot)
├── docker/
│   ├── docker-compose.local.yml   # Lokal PostgreSQL
│   ├── docker-compose.cloud.yml   # Bulut PostgreSQL
│   ├── Dockerfile.local-server
│   └── Dockerfile.cloud-api
├── turbo.json
└── README.md
```

---

## 🚀 Ishga Tushirish Qo'llanmasi

### 1. Talablar
- Node.js v20 yoki v22+
- pnpm v9+ (`npm install -g pnpm`)
- Docker va Docker Compose

### 2. Sozlash va Baza Yaratish
```bash
# 1. Muhit faylini nusxalash
cp .env.example .env

# 2. Lokal PostgreSQL konteynerini ishga tushirish
docker compose -f docker/docker-compose.local.yml up -d

# 3. Paketlarni o'rnatish
pnpm install

# 4. Prisma bazani yaratish va boshlang'ich ma'lumotlarni yuklash (Seed)
pnpm --filter @oshxona/db run db:push
pnpm --filter @oshxona/db run db:seed
```

### 3. Serverlarni Ishga Tushirish

```bash
# Lokal serverni ishga tushirish (Restoran ichida: 4000-port)
pnpm --filter @oshxona/local-server run dev

# Bulut serverini ishga tushirish (5000-port)
pnpm --filter @oshxona/cloud-api run dev

# Admin Web Panelni ishga tushirish (3000-port)
pnpm --filter @oshxona/admin-web run dev

# Kassa Desktop (Electron) ilovasini ishga tushirish
pnpm --filter @oshxona/pos-desktop run dev
```

---

## 👤 Boshlang'ich Foydalanuvchilar (Seed)

| Rol | Ism | Login | Parol | PIN-kod | Huquqlar |
|---|---|---|---|---|---|
| **Admin** | Sardor Rahimov | `admin` | `admin123` | `1111` | Barcha huquqlar, hisobotlar, narx o'zgartirish, bekor qilish |
| **Kassir 1** | Dilshod Aliyev | `kassir1` | `kassir123` | `1234` | Savdo, to'lov, smena, chek chiqarish, 10% gacha chegirma |
| **Kassir 2** | Madina Karimova | `kassir2` | `kassir123` | `5678` | Savdo, to'lov, smena, chek chiqarish, 10% gacha chegirma |

---

## 🧪 Qabul Qilish Mezonlari (Sinov Ssenariylari)

1. **Internet yo'qolganda savdo:**
   - Internetni uzing yoki `cloud-api` ni to'xtating.
   - Kassada buyurtmalar oling va to'lov qiling. Chek uzluksiz chiqadi.
   - Internet ulangach, barcha savdolar 15 soniya ichida bulutga to'liq tushadi.

2. **Narx muzlatish tekshiruvi:**
   - 7-stolga 38 000 so'mlik Osh qo'shing.
   - Admin menyuda narxni 42 000 so'mga ko'tarsin.
   - 7-stoldagi buyurtma narxi 38 000 so'm bo'lib saqlanib qoladi (tarixiy aniqlik).

3. **Kassir chegirma limiti:**
   - Kassir 15% chegirma berishga urinsa — tizim rad etadi (limit: 10%).

4. **Buyurtmani bekor qilish:**
   - Kassir buyurtmani bekor qila olmaydi. Faqat Admin PIN (`1111`) kiritilganda bekor qilinadi va audit logga saqlanadi.

5. **Ombor va retsept:**
   - 2 porsiya Osh sotilishi bilan ombordan 300g guruch, 240g go'sht va 300g sabzi avtomatik kamayadi.
# urgut-cook-git
