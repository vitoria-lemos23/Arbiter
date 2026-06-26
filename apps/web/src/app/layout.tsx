import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { Providers } from "@/shared/web3/components/Providers";
import { config } from "@/shared/web3/config/wagmi";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  variable: "--font-sans",
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
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        outfit.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers initialState={initialState}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
