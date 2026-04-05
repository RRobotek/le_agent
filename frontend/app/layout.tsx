import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppLayout } from "@/components/AppLayout";
import { Providers } from "./providers";
import "./globals.css";

const grMileston = localFont({
  src: "../public/fonts/GR Milesons Two Regular.ttf",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeAgent",
  description: "AI-powered DeFi agents secured by your Ledger hardware wallet",
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
    shortcut: "/favicon/favicon.ico",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${grMileston.variable} h-full antialiased`}>
      <body className="h-full">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
