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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.svg" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="FinNest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
        <CurrencyProvider>
          <Header />
          <main className="page">{children}</main>
        </CurrencyProvider>
      </body>
    </html>
  );
}
