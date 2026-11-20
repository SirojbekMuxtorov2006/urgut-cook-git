"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, Columns3, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "./button";
import { Input } from "./input";

/** Katta jadval: qidiruv, saralash, ustun tanlash, CSV eksport. */
export function DataTable<T>({
  data,
  columns,
  loading,
  exportName = "export",
  toolbar,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  exportName?: string;
  toolbar?: React.ReactNode;
}) {
  const t = useTranslations("common");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const [showCols, setShowCols] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter, columnVisibility: visibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportCsv = () => {
    const cols = table.getVisibleLeafColumns().filter((c) => c.id !== "actions");
    const header = cols.map((c) => (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id));
    const rows = table.getRowModel().rows.map((r) =>
      cols.map((c) => `"${String(r.getValue(c.id) ?? "").replaceAll('"', '""')}"`).join(";"),
    );
    const blob = new Blob(["﻿" + [header.join(";"), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName}.csv`;
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("search")} className="max-w-xs" />
        <div className="relative">
          <Button variant="outline" onClick={() => setShowCols((v) => !v)}>
            <Columns3 className="h-4 w-4" /> {t("columns")}
          </Button>
          {showCols && (
            <div className="absolute z-10 mt-1 min-w-48 rounded-lg border bg-card p-2 shadow-lg">
              {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                  <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                  {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
                </label>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> {t("export")}
        </Button>
        <div className="ml-auto flex gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="whitespace-nowrap px-4 py-3 font-medium">
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button className="inline-flex items-center gap-1" onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{t("loading")}</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{t("empty")}</td></tr>
            ) : (
              table.getRowModel().rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-4 py-3">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
