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
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(9, "Telefon raqamni kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
});

export default function LoginPage() {
  const t = useTranslations("auth");
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { phone: "+998", password: "" } });

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      signIn(await api.post<AuthResponse>("/auth/login/", v));
    } catch (e) {
      setError((e as Error).message);
    }
  });

  return (
    <AuthShell title={t("login")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("phone")} error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} autoComplete="tel" />
        </Field>
        <Field label={t("password")} error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} autoComplete="current-password" />
        </Field>
        <FormError message={error} />
        <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {t("login")}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link className="font-medium text-primary hover:underline" href="/register">
          {t("register")}
        </Link>
      </p>
    </AuthShell>
  );
}
