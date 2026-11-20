"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthResponse } from "@restopro/api-client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BUSINESS_TYPES } from "@/lib/constants";


const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "6 xonali kod"),
  company_name: z.string().min(2, "Nomini kiriting"),
  business_type: z.enum(["NATIONAL", "RESTAURANT", "CAFE", "FAST_FOOD", "DARK_KITCHEN"]),
  full_name: z.string().min(2, "Ismingizni kiriting"),
  password: z.string().min(6, "Kamida 6 belgi"),
});

export default function RegisterPage() {
  const t = useTranslations("auth");
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("+998");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { business_type: "NATIONAL", code: "", company_name: "", full_name: "", password: "" },
  });

  const sendCode = async () => {
    setError(null);
    setSending(true);
    try {
      await api.post("/auth/register/send-code/", { phone });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      signIn(await api.post<AuthResponse>("/auth/register/", { ...v, phone }));
    } catch (e) {
      setError((e as Error).message);
    }
  });

  const err = form.formState.errors;
  return (
    <AuthShell title={t("register")}>
      <div className="space-y-4">
        <Field label={t("phone")}>
          <div className="flex gap-2">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} />
            <Button type="button" variant="outline" onClick={sendCode} disabled={sending || sent}>
              {t("sendCode")}
            </Button>
          </div>
        </Field>
        {sent && <p className="text-sm text-success">{t("codeSent", { phone })}</p>}
        {sent && (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label={t("code")} error={err.code?.message}>
              <Input inputMode="numeric" maxLength={6} {...form.register("code")} />
            </Field>
            <Field label={t("companyName")} error={err.company_name?.message}>
              <Input {...form.register("company_name")} placeholder="Masalan: Choyxona Navro'z" />
            </Field>
            <Field label={t("businessType")}>
              <Select {...form.register("business_type")}>
                {BUSINESS_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("fullName")} error={err.full_name?.message}>
              <Input {...form.register("full_name")} />
            </Field>
            <Field label={t("password")} error={err.password?.message}>
              <Input type="password" {...form.register("password")} autoComplete="new-password" />
            </Field>
            <FormError message={error} />
            <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {t("create")}
            </Button>
          </form>
        )}
        {!sent && <FormError message={error} />}
        <p className="text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            {t("login")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
