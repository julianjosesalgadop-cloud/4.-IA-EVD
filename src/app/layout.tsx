import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EVD | Flota Sugamuxi S.A.",
    template: "%s | EVD Flota Sugamuxi",
  },
  description: "Plataforma de Evaluación de Desempeño — Flota Sugamuxi S.A.",
  keywords: ["evaluación de desempeño", "gestión humana", "talento humano", "Flota Sugamuxi"],
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              style: { fontFamily: "Inter, sans-serif" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
