import type { Metadata } from "next";
import "./globals.css";
import "./experience.css";
import "./legendary.css";

export const metadata: Metadata = {
  title: "Les 34 Chevaux du Jacuzzi — Le QG",
  description: "11 potes, une maison, plein de bonnes idées. Films, votes et programme du 20 au 27 septembre 2026.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
