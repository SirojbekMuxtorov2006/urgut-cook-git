"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Branch, Employee, Role } from "@restopro/api-client";
import { formatDate } from "@restopro/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  full_name: z.string().min(2, "Ism kiriting"),
  role: z.string().min(1, "Rol tanlang"),
  phone: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().regex(/^(\d{4})?$/, "PIN — 4 ta raqam").optional(),
  branches: z.array(z.string()),
  is_active: z.boolean(),
});
type Form = z.infer<typeof schema>;

export default function EmployeesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const employees = useQuery({ queryKey: ["employees"], queryFn: () => api.get<Employee[]>("/auth/employees/") });
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/auth/roles/") });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api.get<Branch[]>("/tenancy/branches/") });
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(schema) });
  const roleById = useMemo(() => new Map((roles.data ?? []).map((r) => [r.id, r])), [roles.data]);
  const selectedRole = roleById.get(form.watch("role") ?? "");

  const open = (e: Employee | "new") => {
    setError(null);
    form.reset(
      e === "new"
        ? { full_name: "", role: roles.data?.find((r) => r.code === "waiter")?.id ?? "", phone: "", password: "", pin: "", branches: branches.data?.map((b) => b.id) ?? [], is_active: true }
        : { full_name: e.full_name, role: e.role, phone: e.phone ?? "", password: "", pin: "", branches: e.branches ?? [], is_active: e.is_active ?? true },
    );
    setEditing(e);
  };

  const save = useMutation({
    mutationFn: (v: Form) => {
      const body: Record<string, unknown> = { ...v, phone: v.phone || null };
      if (!v.pin) delete body.pin;
      if (!v.password) delete body.password;
      return editing === "new" ? api.post("/auth/employees/", body) : api.patch(`/auth/employees/${(editing as Employee).id}/`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
    onError: (e: Error) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/auth/employees/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
    onError: (e: Error) => alert(e.message),
  });

  const manage = can("staff.manage");
  const columns: ColumnDef<Employee, unknown>[] = [
    { accessorKey: "full_name", header: "F.I.Sh." },
    { accessorKey: "role_name", header: "Rol" },
    { accessorKey: "phone", header: "Telefon", cell: (c) => (c.getValue() as string) || "—" },
    {
      accessorKey: "has_pin",
      header: "PIN",
      cell: (c) => (c.getValue() ? <Badge tone="success"><KeyRound className="mr-1 h-3 w-3" />bor</Badge> : <Badge tone="muted">yo&apos;q</Badge>),
    },
    {
      accessorKey: "is_active",
      header: "Holat",
      cell: (c) => (c.getValue() ? <Badge tone="success">Faol</Badge> : <Badge tone="muted">Nofaol</Badge>),
    },
    { accessorKey: "created_at", header: "Qo'shilgan", cell: (c) => formatDate(c.getValue() as string) },
    ...(manage
      ? [
          {
            id: "actions",
            header: "",
            enableHiding: false,
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => open(row.original)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`${row.original.full_name} o'chirilsinmi?`) && remove.mutate(row.original.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          } as ColumnDef<Employee, unknown>,
        ]
      : []),
  ];

  const err = form.formState.errors;
  const usesPin = selectedRole?.login_type === "pin";
  return (
    <div>
      <PageHeader
        title="Xodimlar"
        description="Kassir, ofitsiant va oshpaz 4 xonali PIN bilan kiradi. Ega, menejer, omborchi va buxgalter — telefon + parol."
      />
      <DataTable
        data={employees.data ?? []}
        columns={columns}
        loading={employees.isLoading}
        exportName="xodimlar"
        toolbar={manage && <Button onClick={() => open("new")}><Plus className="h-4 w-4" /> Xodim qo&apos;shish</Button>}
      />
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Yangi xodim" : "Xodimni tahrirlash"}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-3">
          <Field label="F.I.Sh." error={err.full_name?.message}><Input {...form.register("full_name")} /></Field>
          <Field label="Rol" error={err.role?.message}>
            <Select {...form.register("role")}>
              {roles.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          {usesPin ? (
            <Field label={editing === "new" ? "PIN (4 raqam)" : "Yangi PIN (o'zgartirish uchun)"} error={err.pin?.message}>
              <Input inputMode="numeric" maxLength={4} {...form.register("pin")} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefon"><Input {...form.register("phone")} placeholder="+998..." /></Field>
              <Field label={editing === "new" ? "Parol" : "Yangi parol"}><Input type="password" {...form.register("password")} /></Field>
            </div>
          )}
          {!usesPin && (
            <Field label="Tasdiqlash PIN (ixtiyoriy, 4 raqam)" error={err.pin?.message}>
              <Input inputMode="numeric" maxLength={4} {...form.register("pin")} />
              <p className="text-xs text-muted-foreground">Menejer kassada bekor qilish va qaytarishni shu PIN bilan tasdiqlaydi.</p>
            </Field>
          )}
          <Field label="Filiallar">
            <div className="flex flex-wrap gap-3">
              {branches.data?.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={b.id} {...form.register("branches")} /> {b.name}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_active")} /> Faol</label>
          <FormError message={error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Bekor qilish</Button>
            <Button disabled={save.isPending}>Saqlash</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
