import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/shared/web3/config/wagmi";
import { Providers } from "@/shared/web3/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arbiter",
  description: "Decentralized tournament platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hydrate wagmi with any wallet state persisted in the request cookie so the
  // server and client render the same connection status.
  const initialState = cookieToInitialState(
    config,
    (await headers()).get("cookie"),
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
