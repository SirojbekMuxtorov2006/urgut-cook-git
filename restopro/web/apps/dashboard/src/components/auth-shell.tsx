import { UtensilsCrossed } from "lucide-react";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-orange-500 to-orange-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-bold">
          <UtensilsCrossed className="h-7 w-7" /> RestoPro
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">Buyurtma, oshxona, ombor va kassa — bitta tizimda.</h2>
          <ul className="space-y-2 text-white/90">
            <li>• Kassa internetsiz ishlaydi</li>
            <li>• Retsept bo&apos;yicha ombor avtomatik kamayadi</li>
            <li>• Restoraningizni telefondan istalgan joydan boshqaring</li>
          </ul>
        </div>
        <p className="text-sm text-white/70">Milliy oshxona · Restoran · Kafe · Fast-food · Yetkazib berish</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
