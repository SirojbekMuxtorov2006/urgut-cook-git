"use client";

import type { Device } from "@restopro/api-client";
import { formatDate } from "@restopro/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { DEVICE_MODES } from "@/lib/constants";

export default function DevicesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/tenancy/devices/"),
    refetchInterval: 30_000,
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api.post(`/tenancy/devices/${id}/revoke/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });

  const columns: ColumnDef<Device, unknown>[] = [
    { accessorKey: "code", header: "Kod" },
    { accessorKey: "name", header: "Nomi" },
    { accessorKey: "mode", header: "Rejim", cell: (c) => DEVICE_MODES[c.getValue() as string] ?? c.getValue() },
    { accessorKey: "branch_name", header: "Filial" },
    {
      accessorKey: "online",
      header: "Holat",
      cell: ({ row }) =>
        !row.original.is_active ? <Badge tone="danger">Bloklangan</Badge> : row.original.online ? <Badge tone="success">Onlayn</Badge> : <Badge tone="muted">Oflayn</Badge>,
    },
    { accessorKey: "is_backup_hub", header: "Zaxira hub", cell: (c) => (c.getValue() ? "Ha" : "") },
    { accessorKey: "platform", header: "Platforma" },
    { accessorKey: "app_version", header: "Versiya" },
    { accessorKey: "local_ip", header: "Lokal IP" },
    { accessorKey: "last_seen_at", header: "Oxirgi faollik", cell: (c) => (c.getValue() ? formatDate(c.getValue() as string, true) : "—") },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) =>
        row.original.is_active && (
          <Button size="sm" variant="ghost" onClick={() => confirm(`${row.original.name} bloklansinmi? Token bekor qilinadi.`) && revoke.mutate(row.original.id)}>
            <Ban className="h-4 w-4" /> Bloklash
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Qurilmalar"
        description="Kassa, ofitsiant telefoni, oshxona ekrani va boshqalar. Yangi qurilma ilovaning o'zida ega/menejer paroli bilan ulanadi."
      />
      <DataTable data={data} columns={columns} loading={isLoading} exportName="qurilmalar" />
    </div>
  );
}
