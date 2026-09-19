import type { Metadata, Viewport } from "next";
import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { SwRegister } from "@/components/SwRegister";

const sans = Old_Standard_TT({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Wave — ride your deadlines", description: "Plan tasks, focus with Pomodoro, and never miss a deadline.", manifest: "/manifest.webmanifest", icons: { icon: "/icon.svg" } };
export const viewport: Viewport = { themeColor: "#E8E4DC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body><StoreProvider>{children}<SwRegister /></StoreProvider></body>
    </html>
  );
}
