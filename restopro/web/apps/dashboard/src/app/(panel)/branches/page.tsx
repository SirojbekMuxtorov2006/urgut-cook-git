"use client";

import type { Branch } from "@restopro/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Form = Pick<Branch, "name" | "code" | "address" | "phone" | "service_charge_percent" | "receipt_header" | "receipt_footer">;

export default function BranchesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["branches"], queryFn: () => api.get<Branch[]>("/tenancy/branches/") });
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>();

  const open = (b: Branch | "new") => {
    setError(null);
    form.reset(
      b === "new"
        ? { name: "", code: `B${data.length + 1}`, address: "", phone: "", service_charge_percent: "10", receipt_header: "", receipt_footer: "Xaridingiz uchun rahmat!" }
        : b,
    );
    setEditing(b);
  };

  const save = useMutation({
    mutationFn: (v: Form) =>
      editing === "new" ? api.post("/tenancy/branches/", v) : api.patch(`/tenancy/branches/${(editing as Branch).id}/`, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditing(null);
    },
    onError: (e: Error) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/tenancy/branches/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
    onError: (e: Error) => alert(e.message),
  });

  const manage = can("branch.manage");
  return (
    <div>
      <PageHeader
        title="Filiallar"
        description="Har bir filialning o'z zallari, kassalari va ombori bor. Menyu kompaniya bo'yicha umumiy."
        actions={manage && <Button onClick={() => open("new")}><Plus className="h-4 w-4" /> Filial qo&apos;shish</Button>}
      />
      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((b) => (
            <Card key={b.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold">{b.name}</div>
                    <div className="text-sm text-muted-foreground">{b.address || "Manzil kiritilmagan"}</div>
                  </div>
                  <Badge>{b.code}</Badge>
                </div>
                <div className="text-sm">Xizmat haqi: <b>{Number(b.service_charge_percent)}%</b></div>
                <div className="text-sm">Telefon: {b.phone || "—"}</div>
                {manage && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => open(b)}><Pencil className="h-3 w-3" /> Tahrirlash</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirm(`"${b.name}" o'chirilsinmi?`) && remove.mutate(b.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Yangi filial" : "Filialni tahrirlash"}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Nomi"><Input {...form.register("name", { required: true })} /></Field></div>
            <Field label="Kod"><Input {...form.register("code", { required: true })} /></Field>
          </div>
          <Field label="Manzil"><Input {...form.register("address")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon"><Input {...form.register("phone")} /></Field>
            <Field label="Xizmat haqi (%)"><Input type="number" step="0.01" {...form.register("service_charge_percent")} /></Field>
          </div>
          <Field label="Chek sarlavhasi"><textarea className="min-h-20 w-full rounded-lg border bg-background p-2 text-sm" {...form.register("receipt_header")} /></Field>
          <Field label="Chek pastki yozuvi"><Input {...form.register("receipt_footer")} /></Field>
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
