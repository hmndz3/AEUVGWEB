import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { GUION_TEMA } from "@/lib/ui/tema";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AEUVG - Asociación General de Estudiantes UVG",
  description:
    "Plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala: eventos, asociaciones, clubes, tutorías y horas beca.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // El número de un solo uso que puso el proxy: sin él la política de
  // contenidos no deja correr el guion del tema.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* El tema se aplica antes de pintar para que no haya un destello
            claro al cargar con el modo oscuro puesto. Ver src/lib/ui/tema.ts. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
