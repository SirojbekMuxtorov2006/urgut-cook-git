"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";

import { NAV } from "./nav";

/** Ctrl+K — bo'limlar bo'yicha tezkor qidiruv. */
export function CommandPalette() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIdx(0);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo(
    () =>
      NAV.filter((n) => !n.stage && (!n.perm || can(n.perm))).filter((n) =>
        t(n.key).toLowerCase().includes(q.toLowerCase()),
      ),
    [q, can, t],
  );

  if (!open) return null;
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]" onMouseDown={() => setOpen(false)}>
      <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setIdx((i) => Math.min(i + 1, items.length - 1));
              if (e.key === "ArrowUp") setIdx((i) => Math.max(i - 1, 0));
              if (e.key === "Enter" && items[idx]) go(items[idx].href);
            }}
            placeholder="Bo'lim qidirish..."
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border px-1.5 text-xs text-muted-foreground">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.map((n, i) => (
            <li key={n.href}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(n.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === idx ? "bg-accent text-accent-foreground" : ""}`}
              >
                <n.icon className="h-4 w-4" /> {t(n.key)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
