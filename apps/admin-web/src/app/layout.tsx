import './globals.css';
import { Sidebar } from '../components/sidebar';

export const metadata = {
  title: 'OshxonaPOS — Boshqaruv va Tahlil Paneli',
  description: 'Restoran va Oshxona boshqaruv tizimi (Admin Web Panel)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
