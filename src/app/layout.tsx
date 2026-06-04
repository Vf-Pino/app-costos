import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa Bistro | Control de Costos y P&G Analítico",
  description: "Sistema analítico síncrono y desacoplado para la gestión de flujos de caja, control de umbrales financieros por semáforos, mitigación de desfases y persistencia de históricos para Casa Bistro.",
  keywords: ["Casa Bistro", "Control de Costos", "P&G Gastronómico", "Restaurante", "Finanzas"],
  robots: "noindex, nofollow", // Admin tools should not be indexed by default
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060814",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased text-slate-100 bg-[#060814]" suppressHydrationWarning>
        <div id="app-root" className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
