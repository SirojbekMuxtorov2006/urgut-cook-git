import { PrismaClient, UserRole, Unit, TableStatus, DeviceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// UUID v7 generatori (seed ichida mustaqil ishlashi uchun)
function createUUIDv7(): string {
  const msecs = Date.now();
  const hex = [
    Math.floor(msecs / 0x100000000).toString(16).padStart(8, '0'),
    (msecs & 0xffff).toString(16).padStart(4, '0'),
    ((0x7000 | (Math.floor(Math.random() * 0x0fff)))).toString(16).padStart(4, '0'),
    ((0x8000 | (Math.floor(Math.random() * 0x3fff)))).toString(16).padStart(4, '0'),
    Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
  ];
  return hex.join('-');
}

async function main() {
  console.log('🌱 OshxonaPOS: Baza tozalash va boshlang\'ich ma\'lumotlarni yuklash (Seed) boshlandi...');

  // 1. Filial (Branch)
  const branchId = '019349c2-5500-7000-8000-000000000001';
  const branch = await prisma.branch.upsert({
    where: { id: branchId },
    update: {},
    create: {
      id: branchId,
      name: 'OshxonaPOS Chorsu Filiali',
      address: 'Toshkent sh., Navoiy ko\'chasi 42-uy',
      phone: '+998 71 200 00 00',
      isActive: true,
      version: 1,
    },
  });
  console.log(`✅ Filial yaratildi: ${branch.name}`);

  // 2. Qurilma (Device)
  const deviceId = 'DEV-MAIN-POS-01';
  await prisma.device.upsert({
    where: { id: deviceId },
    update: {},
    create: {
      id: deviceId,
      branchId: branch.id,
      name: 'Kassa #1 Sensorli POS Monoblok',
      type: DeviceType.POS,
      deviceToken: 'TOKEN-DEV-MAIN-POS-01',
      lastActiveAt: new Date(),
      isActive: true,
      version: 1,
    },
  });

  // 3. Foydalanuvchilar (Admin + 2 Kassir)
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminPinHash = await bcrypt.hash('1111', 10);

  const cashier1PasswordHash = await bcrypt.hash('kassir123', 10);
  const cashier1PinHash = await bcrypt.hash('1234', 10);

  const cashier2PasswordHash = await bcrypt.hash('kassir123', 10);
  const cashier2PinHash = await bcrypt.hash('5678', 10);

  // Admin
  const adminId = '019349c2-5500-7000-8000-000000000010';
  await prisma.user.upsert({
    where: { id: adminId },
    update: {},
    create: {
      id: adminId,
      branchId: branch.id,
      fullName: 'Sardor Rahimov (Bosh Menejer)',
      username: 'admin',
      passwordHash: adminPasswordHash,
      pinHash: adminPinHash,
      role: UserRole.ADMIN,
      discountLimit: 100, // istalgancha chegirma
      isActive: true,
      deviceId,
      version: 1,
    },
  });

  // Kassir 1
  const cashier1Id = '019349c2-5500-7000-8000-000000000011';
  await prisma.user.upsert({
    where: { id: cashier1Id },
    update: {},
    create: {
      id: cashier1Id,
      branchId: branch.id,
      fullName: 'Dilshod Aliyev',
      username: 'kassir1',
      passwordHash: cashier1PasswordHash,
      pinHash: cashier1PinHash,
      role: UserRole.CASHIER,
      discountLimit: 10, // 10% gacha limit
      isActive: true,
      deviceId,
      version: 1,
    },
  });

  // Kassir 2
  const cashier2Id = '019349c2-5500-7000-8000-000000000012';
  await prisma.user.upsert({
    where: { id: cashier2Id },
    update: {},
    create: {
      id: cashier2Id,
      branchId: branch.id,
      fullName: 'Madina Karimova',
      username: 'kassir2',
      passwordHash: cashier2PasswordHash,
      pinHash: cashier2PinHash,
      role: UserRole.CASHIER,
      discountLimit: 10,
      isActive: true,
      deviceId,
      version: 1,
    },
  });
  console.log('✅ Foydalanuvchilar yaratildi: Admin (admin / admin123 / PIN: 1111), Kassir 1 (kassir1 / PIN: 1234), Kassir 2 (kassir2 / PIN: 5678)');

  // 4. Sozlamalar (Settings)
  const settings = [
    { key: 'RESTAURANT_NAME', value: 'Rayhon Milliy Taomlari' },
    { key: 'ADDRESS', value: 'Toshkent sh., Navoiy ko\'chasi 42-uy' },
    { key: 'PHONE', value: '+998 71 200 00 00' },
    { key: 'SERVICE_FEE_PERCENT', value: '10' },
    { key: 'RECEIPT_HEADER_NOTE', value: 'Xush kelibsiz!' },
    { key: 'RECEIPT_FOOTER_NOTE', value: 'Xaridingiz uchun rahmat! Yana kutib qolamiz!' },
    { key: 'CURRENCY', value: 'so\'m' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { branchId_key: { branchId: branch.id, key: s.key } },
      update: { value: s.value },
      create: {
        id: createUUIDv7(),
        branchId: branch.id,
        key: s.key,
        value: s.value,
        version: 1,
      },
    });
  }

  // 5. Zallar va Stollar
  const hallsData = [
    { name: 'Asosiy Zal', sortOrder: 1, tableCount: 12 },
    { name: 'Ayvon / Terrasa', sortOrder: 2, tableCount: 8 },
    { name: 'VIP Xonalar', sortOrder: 3, tableCount: 4 },
  ];

  for (const h of hallsData) {
    const hallId = createUUIDv7();
    const hall = await prisma.hall.create({
      data: {
        id: hallId,
        branchId: branch.id,
        name: h.name,
        sortOrder: h.sortOrder,
        version: 1,
      },
    });

    for (let i = 1; i <= h.tableCount; i++) {
      await prisma.table.create({
        data: {
          id: createUUIDv7(),
          hallId: hall.id,
          number: h.sortOrder * 100 + i,
          name: `${h.name} - Stol #${i}`,
          seats: h.name.includes('VIP') ? 10 : 4,
          status: TableStatus.VACANT,
          posX: (i % 4) * 120,
          posY: Math.floor(i / 4) * 120,
          version: 1,
        },
      });
    }
  }
  console.log('✅ Zallar va stollar yaratildi (Asosiy zal, Ayvon, VIP)');

  // 6. Kategoriyalar (6 ta)
  const categoriesData = [
    { id: '019349c2-5500-7000-8000-000000000101', nameUz: 'Birinchi taomlar', nameRu: 'Первые блюда', icon: 'soup', color: '#f97316', sortOrder: 1 },
    { id: '019349c2-5500-7000-8000-000000000102', nameUz: 'Ikkinchi taomlar', nameRu: 'Вторые блюда', icon: 'utensils', color: '#eab308', sortOrder: 2 },
    { id: '019349c2-5500-7000-8000-000000000103', nameUz: 'Shashlik va kaboblar', nameRu: 'Шашлыки и кебабы', icon: 'flame', color: '#ef4444', sortOrder: 3 },
    { id: '019349c2-5500-7000-8000-000000000104', nameUz: 'Salatlar va gazaklar', nameRu: 'Салаты и закуски', icon: 'salad', color: '#22c55e', sortOrder: 4 },
    { id: '019349c2-5500-7000-8000-000000000105', nameUz: 'Non va somsa', nameRu: 'Хлеб и самса', icon: 'cookie', color: '#d97706', sortOrder: 5 },
    { id: '019349c2-5500-7000-8000-000000000106', nameUz: 'Ichimliklar va choylar', nameRu: 'Напитки и чай', icon: 'cup-soda', color: '#06b6d4', sortOrder: 6 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        branchId: branch.id,
        nameUz: cat.nameUz,
        nameRu: cat.nameRu,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        version: 1,
      },
    });
  }
  console.log('✅ 6 ta kategoriya yaratildi');

  // 7. Xomashyo (Ingredient)
  const ingredientsData = [
    { id: '019349c2-5500-7000-8000-000000000201', name: 'Lazer guruch', unit: Unit.KG, minQty: 20, currentQty: 100, avgCost: 24000 },
    { id: '019349c2-5500-7000-8000-000000000202', name: 'Qo\'y go\'shti (mol go\'shti)', unit: Unit.KG, minQty: 15, currentQty: 80, avgCost: 95000 },
    { id: '019349c2-5500-7000-8000-000000000203', name: 'Sariq sabzi', unit: Unit.KG, minQty: 25, currentQty: 120, avgCost: 4000 },
    { id: '019349c2-5500-7000-8000-000000000204', name: 'Paxta yog\'i / zig\'ir yog\'i', unit: Unit.LITER, minQty: 10, currentQty: 50, avgCost: 22000 },
    { id: '019349c2-5500-7000-8000-000000000205', name: 'Piyoz', unit: Unit.KG, minQty: 20, currentQty: 90, avgCost: 3000 },
    { id: '019349c2-5500-7000-8000-000000000206', name: 'No\'xat', unit: Unit.KG, minQty: 5, currentQty: 30, avgCost: 18000 },
    { id: '019349c2-5500-7000-8000-000000000207', name: 'Qora mayiz', unit: Unit.KG, minQty: 3, currentQty: 15, avgCost: 45000 },
  ];

  for (const ing of ingredientsData) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {},
      create: {
        id: ing.id,
        branchId: branch.id,
        name: ing.name,
        unit: ing.unit,
        minQty: ing.minQty,
        currentQty: ing.currentQty,
        avgCost: ing.avgCost,
        version: 1,
      },
    });
  }

  // 8. 35 ta Milliy taom (Menyu)
  const menuItemsData = [
    // 1. Birinchi taomlar (101)
    { nameUz: 'Qo\'y go\'shtli Sho\'rva', nameRu: 'Шурпа из баранины', price: 35000, costPrice: 21000, unit: Unit.PORTION, catId: categoriesData[0].id },
    { nameUz: 'No\'xat Sho\'rva', nameRu: 'Гороховый суп', price: 32000, costPrice: 19000, unit: Unit.PORTION, catId: categoriesData[0].id },
    { nameUz: 'Mastava', nameRu: 'Мастава', price: 30000, costPrice: 18000, unit: Unit.PORTION, catId: categoriesData[0].id },
    { nameUz: 'Sho\'rvali Chuchvara', nameRu: 'Чучвара в бульоне', price: 34000, costPrice: 20000, unit: Unit.PORTION, catId: categoriesData[0].id },
    { nameUz: 'Manpar', nameRu: 'Манпар', price: 32000, costPrice: 19000, unit: Unit.PORTION, catId: categoriesData[0].id },

    // 2. Ikkinchi taomlar (102)
    { id: '019349c2-5500-7000-8000-000000000301', nameUz: 'Choyxona Oshi', nameRu: 'Чайханский плов', price: 38000, costPrice: 23000, unit: Unit.PORTION, catId: categoriesData[1].id, hasVariants: true },
    { nameUz: 'To\'y Oshi (maxsus mayizli)', nameRu: 'Праздничный плов', price: 42000, costPrice: 25000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Qovurma Lag\'mon', nameRu: 'Жареный лагман', price: 38000, costPrice: 22000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Cho\'zma Lag\'mon (say bilan)', nameRu: 'Тянутый лагман с подливой', price: 38000, costPrice: 22000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Go\'shtli Manti (4 dona)', nameRu: 'Манты с мясом (4 шт)', price: 36000, costPrice: 21000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Qovoqli Manti (4 dona)', nameRu: 'Манты с тыквой (4 шт)', price: 28000, costPrice: 14000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Qozon Kabob (qo\'y go\'shti)', nameRu: 'Казан-кебаб из баранины', price: 65000, costPrice: 42000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Dimlama', nameRu: 'Дымляма', price: 45000, costPrice: 28000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Toshkentcha Norin', nameRu: 'Нарын по-ташкентски', price: 48000, costPrice: 30000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Bifshteks (tuxumli garnir)', nameRu: 'Бифштекс с яйцом', price: 38000, costPrice: 22000, unit: Unit.PORTION, catId: categoriesData[1].id },
    { nameUz: 'Jiz-biz (tovada go\'sht)', nameRu: 'Джиз-быз на сковороде', price: 55000, costPrice: 35000, unit: Unit.PORTION, catId: categoriesData[1].id },

    // 3. Shashlik va kaboblar (103)
    { nameUz: 'Qiyma Shashlik', nameRu: 'Шашлык молотый (люля)', price: 16000, costPrice: 9500, unit: Unit.PIECE, catId: categoriesData[2].id },
    { nameUz: 'Kuskovoy Shashlik (qo\'y go\'shti)', nameRu: 'Шашлык кусковой из баранины', price: 22000, costPrice: 14000, unit: Unit.PIECE, catId: categoriesData[2].id },
    { nameUz: 'Jigar Shashlik (dumba bilan)', nameRu: 'Шашлык из печени с курдюком', price: 18000, costPrice: 10500, unit: Unit.PIECE, catId: categoriesData[2].id },
    { nameUz: 'Tovuq Shashlik (file)', nameRu: 'Шашлык из куриного филе', price: 18000, costPrice: 10000, unit: Unit.PIECE, catId: categoriesData[2].id },
    { nameUz: 'Qovurg\'a Shashlik (Napoleon)', nameRu: 'Шашлык из ребрышек', price: 26000, costPrice: 16000, unit: Unit.PIECE, catId: categoriesData[2].id },
    { nameUz: 'Rulet Shashlik', nameRu: 'Шашлык рулет', price: 24000, costPrice: 15000, unit: Unit.PIECE, catId: categoriesData[2].id },

    // 4. Salatlar va gazaklar (104)
    { nameUz: 'Achchiq-chuchuk salati', nameRu: 'Ачик-чучук', price: 12000, costPrice: 5000, unit: Unit.PORTION, catId: categoriesData[3].id },
    { nameUz: 'Bahor salati', nameRu: 'Весенний салат', price: 14000, costPrice: 6000, unit: Unit.PORTION, catId: categoriesData[3].id },
    { nameUz: 'Suzma (qalampir va ko\'kat)', nameRu: 'Сузьма с зеленью', price: 10000, costPrice: 4000, unit: Unit.PORTION, catId: categoriesData[3].id },
    { nameUz: 'Olivye salati', nameRu: 'Салат Оливье', price: 18000, costPrice: 9000, unit: Unit.PORTION, catId: categoriesData[3].id },
    { nameUz: 'Fransuzcha salat', nameRu: 'Французский салат', price: 20000, costPrice: 10000, unit: Unit.PORTION, catId: categoriesData[3].id },

    // 5. Non va somsa (105)
    { nameUz: 'Tandir Somsa (mol go\'shtli)', nameRu: 'Тандырная самса с мясом', price: 12000, costPrice: 6500, unit: Unit.PIECE, catId: categoriesData[4].id },
    { nameUz: 'Qatlama Somsa', nameRu: 'Слоеная самса', price: 10000, costPrice: 5000, unit: Unit.PIECE, catId: categoriesData[4].id },
    { nameUz: 'Ko\'k Somsa (mavsumiy)', nameRu: 'Самса с зеленью', price: 8000, costPrice: 3500, unit: Unit.PIECE, catId: categoriesData[4].id },
    { nameUz: 'Tandir Non (Issiq non)', nameRu: 'Тандырная лепешка', price: 5000, costPrice: 2500, unit: Unit.PIECE, catId: categoriesData[4].id },
    { nameUz: 'Samarqandcha Patir Non', nameRu: 'Самаркандский патыр', price: 12000, costPrice: 6000, unit: Unit.PIECE, catId: categoriesData[4].id },

    // 6. Ichimliklar va choylar (106)
    { nameUz: 'Ko\'k Choy (choynak 1L)', nameRu: 'Зеленый чай (чайник 1л)', price: 6000, costPrice: 1500, unit: Unit.PORTION, catId: categoriesData[5].id },
    { nameUz: 'Qora Choy (choynak 1L)', nameRu: 'Черный чай (чайник 1л)', price: 6000, costPrice: 1500, unit: Unit.PORTION, catId: categoriesData[5].id },
    { nameUz: 'Limonli Asalli Choy', nameRu: 'Чай с лимоном и медом', price: 14000, costPrice: 5000, unit: Unit.PORTION, catId: categoriesData[5].id },
    { nameUz: 'Mevali Uy Kompoti (grafin 1L)', nameRu: 'Домашний компот (1л)', price: 18000, costPrice: 7000, unit: Unit.PORTION, catId: categoriesData[5].id },
    { nameUz: 'Coca-Cola 1.5L', nameRu: 'Кока-Кола 1.5л', price: 16000, costPrice: 12000, unit: Unit.BOTTLE, catId: categoriesData[5].id },
  ];

  for (const item of menuItemsData) {
    const itemId = item.id || createUUIDv7();
    const createdItem = await prisma.menuItem.upsert({
      where: { id: itemId },
      update: {},
      create: {
        id: itemId,
        branchId: branch.id,
        categoryId: item.catId,
        nameUz: item.nameUz,
        nameRu: item.nameRu,
        price: item.price,
        costPrice: item.costPrice,
        unit: item.unit,
        isAvailable: true,
        isActive: true,
        version: 1,
      },
    });

    // Osh uchun variantlar va modifierlar
    if (item.hasVariants) {
      // Variantlar: 0.5 porsiya / 1 porsiya / 1 kg
      await prisma.menuItemVariant.createMany({
        data: [
          { id: createUUIDv7(), menuItemId: createdItem.id, nameUz: '0.5 porsiya', nameRu: '0.5 порции', price: 22000, version: 1 },
          { id: createUUIDv7(), menuItemId: createdItem.id, nameUz: '1 porsiya', nameRu: '1 порция', price: 38000, version: 1 },
          { id: createUUIDv7(), menuItemId: createdItem.id, nameUz: '1 kg (lagan)', nameRu: '1 кг (блюдо)', price: 150000, version: 1 },
        ],
      });

      // Modifier guruhi (+ Qazi, + Tuxum)
      const modGroupId = createUUIDv7();
      await prisma.modifierGroup.create({
        data: {
          id: modGroupId,
          menuItemId: createdItem.id,
          nameUz: 'Qo\'shimchalar',
          nameRu: 'Добавки',
          minSelect: 0,
          maxSelect: 5,
          version: 1,
        },
      });

      await prisma.modifier.createMany({
        data: [
          { id: createUUIDv7(), modifierGroupId: modGroupId, nameUz: '+ Qazi (ot go\'shti)', nameRu: '+ Казы', price: 12000, version: 1 },
          { id: createUUIDv7(), modifierGroupId: modGroupId, nameUz: '+ Bedana tuxumi (2 dona)', nameRu: '+ Перепелиное яйцо', price: 3000, version: 1 },
          { id: createUUIDv7(), modifierGroupId: modGroupId, nameUz: '+ Achchiq qalampir', nameRu: '+ Острый перец', price: 2000, version: 1 },
        ],
      });

      // Texnologik karta (Recipe / Retsept) Choyxona oshi uchun
      const recipeId = createUUIDv7();
      await prisma.recipe.create({
        data: {
          id: recipeId,
          menuItemId: createdItem.id,
          description: '1 porsiya Choyxona oshi texnologik kalkulyatsiyasi',
          isActive: true,
          version: 1,
          items: {
            create: [
              { id: createUUIDv7(), ingredientId: ingredientsData[0].id, quantity: 0.15, version: 1 }, // 150g guruch
              { id: createUUIDv7(), ingredientId: ingredientsData[1].id, quantity: 0.12, version: 1 }, // 120g go'sht
              { id: createUUIDv7(), ingredientId: ingredientsData[2].id, quantity: 0.15, version: 1 }, // 150g sabzi
              { id: createUUIDv7(), ingredientId: ingredientsData[3].id, quantity: 0.04, version: 1 }, // 40ml yog'
              { id: createUUIDv7(), ingredientId: ingredientsData[4].id, quantity: 0.05, version: 1 }, // 50g piyoz
            ],
          },
        },
      });
    }
  }
  console.log(`✅ ${menuItemsData.length} ta milliy taom, variantlar, modifierlar va kalkulyatsiya retsepti muvaffaqiyatli yuklandi!`);

  // 9. Printer sozlamalari
  await prisma.printer.createMany({
    data: [
      { id: createUUIDv7(), branchId: branch.id, name: 'Kassa Chek Printeri (58/80mm)', type: 'NETWORK', address: '192.168.1.200', paperWidth: 80, station: 'MAIN', version: 1 },
      { id: createUUIDv7(), branchId: branch.id, name: 'Oshxona Issiq Sex Printeri', type: 'NETWORK', address: '192.168.1.201', paperWidth: 80, station: 'KITCHEN_HOT', version: 1 },
    ],
  });
  console.log('✅ Printerlar sozlamalari kiritildi');

  console.log('🎉 Seed to\'liq va xatosiz yakunlandi!');
}

main()
  .catch((e) => {
    console.error('❌ Seed jarayonida xato:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
