import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// OGP/Twitter カードの画像や canonical を本番ドメインで解決するための基点。
// 本番は Vercel 環境変数 NEXT_PUBLIC_APP_URL=https://gaohub.jp を使用する。
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://gaohub.jp"),
  title: "GAO HUB — イベント開催から決済までワンストップ",
  description:
    "カンファレンス・セミナーの集客、チケット決済、QR受付までをセルフサーブで。即日開催、透明な料金。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
