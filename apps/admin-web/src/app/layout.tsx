import './globals.css';
import { Sidebar } from '../components/sidebar';

export const metadata = {
  title: 'OshxonaPOS — Restoran Boshqaruv va Kassa Tizimi',
  description: 'Oddiy va qulay restoran POS hamda boshqaruv paneli (Online + Offline)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="flex flex-col lg:flex-row min-h-screen bg-[#F4F6F8] text-slate-900 antialiased">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
