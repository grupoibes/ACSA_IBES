import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const heading = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UGC Farmácia — certificação IBES",
  description:
    "Projeto de certificação do IBES: padrões não aplicáveis, rodadas, estados e comitê do IBES.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sans.variable} ${heading.variable} antialiased`}>{children}</body>
    </html>
  );
}
