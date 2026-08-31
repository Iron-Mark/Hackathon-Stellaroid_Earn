import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar PH Bootcamp Archive",
  description: "Static archive showcase for the April Stellar PH Bootcamp branch.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
