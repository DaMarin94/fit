import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { NavBar } from "@/components/nav/NavBar";
import { ToastProvider } from "@/components/toast/ToastProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fit",
  description: "Rutinas de entrenamiento con timer en vivo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full">
        <NavBar />
        <main className="mx-auto w-full px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] wide:max-w-[960px] wide:px-6 wide:pt-[80px] wide:pb-24">
          {children}
        </main>
        <ToastProvider />
      </body>
    </html>
  );
}
