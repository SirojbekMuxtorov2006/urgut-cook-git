"use client";

import { cn } from "@restopro/ui";
import { Languages, LogOut, Menu, Moon, Search, Sun, UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/command-palette";
import { NAV } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useRequireAuth } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const auth = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  if (auth.loading || !auth.me) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Yuklanmoqda...</div>;
  }
  const me = auth.me;
  const branches = me.branches as { id: string; name: string }[];

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("rp_theme", dark ? "dark" : "light");
    } catch {
      /* e'tiborsiz */
    }
  };
  const toggleLocale = () => {
    document.cookie = `locale=${locale === "uz" ? "ru" : "uz"}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 flex-col border-r bg-card md:sticky md:top-0 md:flex",
          mobileOpen ? "flex" : "hidden",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5 text-lg font-bold">
          <UtensilsCrossed className="h-6 w-6 text-primary" /> RestoPro
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.filter((n) => !n.perm || auth.can(n.perm)).map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            const content = (
              <>
                <n.icon className="h-4 w-4" />
                <span className="flex-1">{t(n.key)}</span>
                {n.stage && <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t("soon")}</span>}
              </>
            );
            const cls = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              n.stage && "cursor-default opacity-60 hover:bg-transparent",
            );
            return n.stage ? (
              <div key={n.href} className={cls} title={`${n.stage}-bosqich`}>{content}</div>
            ) : (
              <Link key={n.href} href={n.href} className={cls}>{content}</Link>
            );
          })}
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">
          {(me.company as { name?: string } | null)?.name}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menyu">
            <Menu className="h-5 w-5" />
          </Button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
            className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground sm:flex"
          >
            <Search className="h-4 w-4" /> Qidirish... <kbd className="ml-auto rounded border px-1.5 text-xs">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {branches.length > 0 && (
              <Select value={auth.branchId ?? ""} onChange={(e) => auth.setBranch(e.target.value)} className="h-9 w-32 sm:w-48">
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            )}
            <Button variant="ghost" size="icon" onClick={toggleLocale} title="Til / Язык">
              <Languages className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Mavzu">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium">{me.full_name}</div>
              <div className="text-xs text-muted-foreground">{(me.role as { name?: string } | null)?.name}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={auth.signOut} title={ta("logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
