export const BUSINESS_TYPES = [
  ["NATIONAL", "Milliy oshxona (osh markazi, choyxona, somsaxona)"],
  ["RESTAURANT", "Restoran / to'yxona"],
  ["CAFE", "Kafe / kofeyniya"],
  ["FAST_FOOD", "Fast-food (lavash, burger)"],
  ["DARK_KITCHEN", "Yetkazib berish oshxonasi"],
] as const;

export const DEVICE_MODES: Record<string, string> = {
  POS: "Kassa",
  HUB: "Asosiy kassa (hub)",
  WAITER: "Ofitsiant",
  KDS: "Oshxona ekrani",
  MANAGER: "Boshqaruv",
  COURIER: "Kuryer",
};
