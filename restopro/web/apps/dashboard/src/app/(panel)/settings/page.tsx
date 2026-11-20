"use client";

import type { Company, Plan, Subscription } from "@restopro/api-client";
import { formatDate, formatSum } from "@restopro/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BUSINESS_TYPES } from "@/lib/constants";

type Form = Pick<Company, "name" | "legal_name" | "inn" | "phone">;

export default function SettingsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const company = useQuery({ queryKey: ["company"], queryFn: () => api.get<Company>("/tenancy/company/") });
  const sub = useQuery({ queryKey: ["subscription"], queryFn: () => api.get<Subscription | null>("/tenancy/subscription/") });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => api.get<Plan[]>("/tenancy/plans/") });
  const form = useForm<Form>();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company.data) form.reset(company.data);
  }, [company.data, form]);

  const save = useMutation({
    mutationFn: (v: Form) => api.patch<Company>("/tenancy/company/", v),
    onSuccess: () => {
      setMsg("Saqlandi");
      setError(null);
      qc.invalidateQueries({ queryKey: ["company"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const businessLabel = BUSINESS_TYPES.find(([v]) => v === company.data?.business_type)?.[1];
  return (
    <div className="space-y-6">
      <PageHeader title="Sozlamalar" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Kompaniya</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-3">
              <Field label="Restoran nomi"><Input {...form.register("name")} disabled={!can("company.manage")} /></Field>
              <Field label="Yuridik nomi"><Input {...form.register("legal_name")} disabled={!can("company.manage")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="STIR (INN)"><Input {...form.register("inn")} disabled={!can("company.manage")} /></Field>
                <Field label="Telefon"><Input {...form.register("phone")} disabled={!can("company.manage")} /></Field>
              </div>
              <p className="text-sm text-muted-foreground">Biznes turi: {businessLabel}</p>
              <FormError message={error} />
              {msg && <p className="text-sm text-success">{msg}</p>}
              {can("company.manage") && <Button disabled={save.isPending}>Saqlash</Button>}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Obuna va tariflar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sub.data && (
              <div className="rounded-lg bg-accent/50 p-3 text-sm">
                Joriy tarif: <b>{sub.data.plan.name}</b> <Badge>{sub.data.status}</Badge>
                <br />
                Amal qiladi: {formatDate(sub.data.ends_at)} gacha ({sub.data.days_left} kun)
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {plans.data?.map((p) => (
                <div key={p.id} className={`rounded-xl border p-3 ${sub.data?.plan.code === p.code ? "border-primary ring-1 ring-primary" : ""}`}>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-lg font-bold text-primary">{formatSum(p.price_monthly ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">oyiga</div>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    <li>{p.max_branches} filial</li>
                    <li>{p.max_pos} kassa</li>
                    <li>{p.max_waiters} ofitsiant qurilmasi</li>
                    <li>{p.max_kds} oshxona ekrani</li>
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click / Payme orqali onlayn to&apos;lov 12-bosqichda qo&apos;shiladi.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
