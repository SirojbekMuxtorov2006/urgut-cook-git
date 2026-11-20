import {
  Building2, ChefHat, ClipboardList, LayoutDashboard, type LucideIcon, MonitorSmartphone, Package, PieChart,
  Settings, ShieldCheck, Table2, Users, UtensilsCrossed,
} from "lucide-react";

export interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  perm?: string;
  stage?: number; // hali tayyor bo'lmagan bo'limlar uchun bosqich raqami
}

export const NAV: NavItem[] = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/menu", key: "menu", icon: UtensilsCrossed, perm: "menu.view", stage: 2 },
  { href: "/tables", key: "tables", icon: Table2, perm: "floor.manage", stage: 2 },
  { href: "/orders", key: "orders", icon: ChefHat, perm: "order.view_all", stage: 3 },
  { href: "/inventory", key: "inventory", icon: Package, perm: "inventory.view", stage: 6 },
  { href: "/reports", key: "reports", icon: PieChart, perm: "reports.view", stage: 7 },
  { href: "/branches", key: "branches", icon: Building2 },
  { href: "/employees", key: "employees", icon: Users, perm: "staff.view" },
  { href: "/roles", key: "roles", icon: ShieldCheck, perm: "staff.view" },
  { href: "/devices", key: "devices", icon: MonitorSmartphone, perm: "device.manage" },
  { href: "/audit", key: "audit", icon: ClipboardList, perm: "audit.view" },
  { href: "/settings", key: "settings", icon: Settings },
];
