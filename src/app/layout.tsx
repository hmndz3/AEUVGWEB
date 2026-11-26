import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* El tema se aplica antes de pintar para que no haya un destello
            claro al cargar con el modo oscuro puesto. Ver src/lib/ui/tema.ts. */}
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
