import type { Metadata } from "next";
// 1. Removemos o Geist_Mono e o Geist para simplificar e evitar erros
import { Geist } from "next/font/google"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// A fonte Geist Mono foi removida, pois não era necessária no projeto original.
// Se você quiser mantê-la, é só descomentar a importação e a declaração.

export const metadata: Metadata = {
  // 2. Título do projeto atualizado
  title: "Detalhes Completos do Seu Acesso", 
  // 3. Descrição atualizada
  description: "Exibe informações detalhadas de geolocalização e cliente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 4. Idioma atualizado para Português do Brasil
    <html lang="pt-BR"> 
      <body
        // Manteve-se apenas o geistSans, pois removemos o geistMono
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}