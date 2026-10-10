import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GATSA Asesoría Patrimonial & Previsión Social",
  description: "Firma especializada en trámites de AFORE, retiros parciales por desempleo, créditos Mejoravit, cotizaciones de Seguros y soluciones B2B.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-800 antialiased font-sans selection:bg-sky-500 selection:text-white flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
