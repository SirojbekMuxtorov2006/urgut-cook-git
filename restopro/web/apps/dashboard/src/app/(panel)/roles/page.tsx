"use client";

import type { Permission, Role } from "@restopro/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Huquqlar matritsasi: qatorlar — huquqlar (guruhlangan), ustunlar — rollar. */
export default function RolesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/auth/roles/") });
  const perms = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Permission[]>("/auth/permissions/") });
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState({ code: "", name: "", login_type: "pin" });
  const [error, setError] = useState<string | null>(null);
  const manage = can("role.manage");

  useEffect(() => {
    if (roles.data) {
      setMatrix(Object.fromEntries(roles.data.map((r) => [r.id, new Set(r.permissions ?? [])])));
      setDirty(new Set());
    }
  }, [roles.data]);

  const groups = useMemo(() => {
    const m = new Map<string, Permission[]>();
    for (const p of perms.data ?? []) m.set(p.group, [...(m.get(p.group) ?? []), p]);
    return [...m.entries()];
  }, [perms.data]);

  const toggle = (roleId: string, code: string) => {
    setMatrix((prev) => {
      const next = new Set(prev[roleId]);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, [roleId]: next };
    });
    setDirty((d) => new Set(d).add(roleId));
  };

  const saveAll = useMutation({
    mutationFn: async () => {
      for (const id of dirty) await api.patch(`/auth/roles/${id}/`, { permissions: [...matrix[id]] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
    onError: (e: Error) => alert(e.message),
  });
  const create = useMutation({
    mutationFn: () => api.post("/auth/roles/", { ...newRole, permissions: [] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setCreating(false);
    },
    onError: (e: Error) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/auth/roles/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
    onError: (e: Error) => alert(e.message),
  });

  const list = roles.data ?? [];
  return (
    <div>
      <PageHeader
        title="Rollar va huquqlar"
        description="Ega yangi rol yaratib, istalgan huquqlarni bera oladi. Ega roli barcha huquqlarga ega."
        actions={
          manage && (
            <>
              <Button variant="outline" onClick={() => { setError(null); setNewRole({ code: "", name: "", login_type: "pin" }); setCreating(true); }}>
                <Plus className="h-4 w-4" /> Yangi rol
              </Button>
              <Button disabled={!dirty.size || saveAll.isPending} onClick={() => saveAll.mutate()}>
                <Save className="h-4 w-4" /> Saqlash {dirty.size ? `(${dirty.size})` : ""}
              </Button>
            </>
          )
        }
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/60">
            <tr>
              <th className="min-w-64 px-4 py-3 text-left font-medium">Huquq</th>
              {list.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>{r.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{r.users_count ?? 0} xodim</span>
                    {!r.is_system && manage && (
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => confirm(`"${r.name}" o'chirilsinmi?`) && remove.mutate(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, items]) => (
              <Fragment key={group}>
                <tr className="bg-accent/40"><td colSpan={list.length + 1} className="px-4 py-2 font-semibold">{group}</td></tr>
                {items.map((p) => (
                  <tr key={p.code} className="border-t">
                    <td className="px-4 py-2">
                      {p.name_uz} <span className="text-xs text-muted-foreground">{p.code}</span>
                    </td>
                    {list.map((r) => (
                      <td key={r.id} className="px-3 py-2 text-center">
                        {r.all_permissions ? (
                          <Badge tone="success">✓</Badge>
                        ) : (
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-orange-500"
                            disabled={!manage}
                            checked={matrix[r.id]?.has(p.code) ?? false}
                            onChange={() => toggle(r.id, p.code)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
      <Dialog open={creating} onClose={() => setCreating(false)} title="Yangi rol">
        <div className="space-y-3">
          <Field label="Nomi"><Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="Masalan: Katta ofitsiant" /></Field>
          <Field label="Kod (lotin, bo'sh joysiz)"><Input value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} placeholder="senior_waiter" /></Field>
          <Field label="Kirish usuli">
            <Select value={newRole.login_type} onChange={(e) => setNewRole({ ...newRole, login_type: e.target.value })}>
              <option value="pin">PIN (kassa, ofitsiant)</option>
              <option value="password">Telefon + parol</option>
            </Select>
          </Field>
          <FormError message={error} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Bekor qilish</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Yaratish</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
