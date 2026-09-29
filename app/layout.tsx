import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/AuthGate";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lanila Wedding Planner",
  description: "Kelola seluruh persiapan pernikahanmu dalam satu tempat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body>
        <AuthProvider>
          <AuthGate>
            <StoreProvider>{children}</StoreProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
