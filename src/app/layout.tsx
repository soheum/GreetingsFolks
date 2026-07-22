import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GF Trial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/bwu5jct.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Homemade+Apple&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Instrument+Serif:ital@0;1&family=Libre+Baskerville:ital,wght@0,400..700;1,400..700&family=Nothing+You+Could+Do&family=Roboto+Serif:ital,opsz,wght@0,8..144,100..900;1,8..144,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
