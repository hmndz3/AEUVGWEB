import { Encabezado } from "@/components/layout/encabezado";
import { PieDePagina } from "@/components/layout/pie-de-pagina";

/** Estructura común de las páginas públicas: encabezado, contenido y pie. */
export function MarcoSitio({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PieDePagina />
    </>
  );
}
