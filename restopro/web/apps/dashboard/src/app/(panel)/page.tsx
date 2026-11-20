"use client";

import type { Branch, Device, Employee, Subscription } from "@restopro/api-client";
import { formatDate, formatSum } from "@restopro/ui";
import { useQuery } from "@tanstack/react-query";
import { Building2, CreditCard, MonitorSmartphone, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function Stat({ title, value, icon: Icon, hint }: { title: string; value: React.ReactNode; icon: typeof Users; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <div className="rounded-xl bg-accent p-3 text-accent-foreground"><Icon className="h-6 w-6" /></div>
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { me, can } = useAuth();
  const sub = useQuery({ queryKey: ["subscription"], queryFn: () => api.get<Subscription | null>("/tenancy/subscription/") });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api.get<Branch[]>("/tenancy/branches/") });
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/auth/employees/"),
    enabled: can("staff.view"),
  });
  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/tenancy/devices/"),
    enabled: can("device.manage"),
  });
  const s = sub.data;
  const statusTone = s?.status === "EXPIRED" ? "danger" : s?.status === "GRACE" ? "warning" : "success";

  return (
    <div className="space-y-6">
      <PageHeader title={`Xush kelibsiz, ${me?.full_name ?? ""}!`} description={(me?.company as { name?: string })?.name} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Filiallar" value={branches.data?.length ?? "—"} icon={Building2} />
        <Stat title="Xodimlar" value={employees.data?.length ?? "—"} icon={Users} />
        <Stat
          title="Qurilmalar"
          value={devices.data?.length ?? "—"}
          icon={MonitorSmartphone}
          hint={devices.data ? `${devices.data.filter((d) => d.online).length} ta onlayn` : undefined}
        />
        <Stat
          title="Tarif"
          value={s?.plan?.name ?? "—"}
          icon={CreditCard}
          hint={s ? `${formatSum(s.plan.price_monthly ?? 0)} / oy` : undefined}
        />
      </div>
      {s && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Obuna <Badge tone={statusTone}>{s.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Amal qilish muddati: <b className="text-foreground">{formatDate(s.ends_at)}</b> ({s.days_left} kun qoldi).
            Muddat tugagach 3 kunlik imtiyozli davr beriladi, keyin tizim faqat ko&apos;rish rejimiga o&apos;tadi — ma&apos;lumotlar
            o&apos;chirilmaydi.
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Bugungi ko&apos;rsatkichlar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tushum, cheklar soni, o&apos;rtacha chek, ochiq stollar va food cost % kassa ishga tushgach (3-bosqich) shu yerda
          real vaqtda ko&apos;rinadi.
        </CardContent>
      </Card>
    </div>
  );
}
