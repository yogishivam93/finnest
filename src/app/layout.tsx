// src/app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";
import { CurrencyProvider } from "@/context/CurrencyProvider";

export const metadata = {
  title: "FinNest",
  description: "Personal finance hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CurrencyProvider>
          <Header />
          <main className="page">{children}</main>
        </CurrencyProvider>
      </body>
    </html>
  );
}
