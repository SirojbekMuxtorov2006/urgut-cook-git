"use client";

import type { AuditLog } from "@restopro/api-client";
import { formatDate } from "@restopro/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Page<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function AuditPage() {
  const [severity, setSeverity] = useState("");
  const q = useInfiniteQuery({
    queryKey: ["audit", severity],
    initialPageParam: `/auth/audit-logs/?page_size=100${severity ? `&severity=${severity}` : ""}`,
    queryFn: ({ pageParam }) => api.get<Page<AuditLog>>(pageParam),
    getNextPageParam: (last) => (last.next ? last.next.slice(last.next.indexOf("/api/v1") + 7) : undefined),
  });
  const rows = q.data?.pages.flatMap((p) => p.results) ?? [];

  const columns: ColumnDef<AuditLog, unknown>[] = [
    { accessorKey: "created_at", header: "Vaqt", cell: (c) => formatDate(c.getValue() as string, true) },
    { accessorKey: "user_name", header: "Kim", cell: (c) => (c.getValue() as string) ?? "—" },
    { accessorKey: "action", header: "Amal" },
    { accessorKey: "entity", header: "Obyekt" },
    {
      accessorKey: "severity",
      header: "Daraja",
      cell: (c) => {
        const v = c.getValue() as string;
        return <Badge tone={v === "CRITICAL" ? "danger" : v === "WARNING" ? "warning" : "muted"}>{v}</Badge>;
      },
    },
    { accessorKey: "device_code", header: "Qurilma", cell: (c) => (c.getValue() as string) ?? "—" },
    { accessorKey: "reason", header: "Sabab" },
    {
      id: "diff",
      header: "O'zgarish",
      cell: ({ row }) => (
        <details className="max-w-md text-xs">
          <summary className="cursor-pointer text-muted-foreground">ko&apos;rish</summary>
          <pre className="whitespace-pre-wrap">{JSON.stringify({ eski: row.original.old_value, yangi: row.original.new_value }, null, 2)}</pre>
        </details>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Audit jurnali" description="Kim, qachon, nima qildi — eski va yangi qiymat, qurilma. Bekor qilish va chegirmalar 'WARNING' darajasida." />
      <DataTable
        data={rows}
        columns={columns}
        loading={q.isLoading}
        exportName="audit"
        toolbar={
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-44">
            <option value="">Barcha darajalar</option>
            <option value="WARNING">Ogohlantirish</option>
            <option value="CRITICAL">Muhim</option>
            <option value="INFO">Ma&apos;lumot</option>
          </Select>
        }
      />
      {q.hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Yana yuklash</Button>
        </div>
      )}
    </div>
  );
}
