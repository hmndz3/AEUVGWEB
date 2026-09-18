import Link from "next/link";

import type { CategoriaResumen, OrganizadoresDisponibles } from "@/lib/eventos/consultas-eventos";
import { formatearFechaConAnio } from "@/lib/eventos/formato-fechas";
import { inicioDelDiaEnGuatemala } from "@/lib/eventos/filtros-eventos";
import {
  ETIQUETAS_TIPO_ACTIVIDAD,
  parametrosDeFiltros,
  type FiltrosEventos,
} from "@/validators/eventos";

type Aplicado = { clave: keyof FiltrosEventos; texto: string };

function nombrePorId(lista: { id: number; nombre: string }[], id: number): string | undefined {
  return lista.find((elemento) => elemento.id === id)?.nombre;
}

function describir(
  filtros: FiltrosEventos,
  categorias: CategoriaResumen[],
  organizadores: OrganizadoresDisponibles
): Aplicado[] {
  const aplicados: Aplicado[] = [];

  if (filtros.q) aplicados.push({ clave: "q", texto: `“${filtros.q}”` });

  if (filtros.desde) {
    aplicados.push({
      clave: "desde",
      texto: `Desde el ${formatearFechaConAnio(inicioDelDiaEnGuatemala(filtros.desde))}`,
    });
  }

  if (filtros.hasta) {
    aplicados.push({
      clave: "hasta",
      texto: `Hasta el ${formatearFechaConAnio(inicioDelDiaEnGuatemala(filtros.hasta))}`,
    });
  }

  if (filtros.categoria) {
    const nombre = categorias.find(
      (categoria) => categoria.idCategoriaEvento === filtros.categoria
    )?.nombre;
    aplicados.push({ clave: "categoria", texto: nombre ?? "Categoría seleccionada" });
  }

  if (filtros.tipo) {
    aplicados.push({ clave: "tipo", texto: ETIQUETAS_TIPO_ACTIVIDAD[filtros.tipo] });
  }

  if (filtros.asociacion) {
    const nombre = nombrePorId(organizadores.asociaciones, filtros.asociacion);
    aplicados.push({ clave: "asociacion", texto: nombre ?? "Asociación seleccionada" });
  }

  if (filtros.club) {
    const nombre = nombrePorId(organizadores.clubes, filtros.club);
    aplicados.push({ clave: "club", texto: nombre ?? "Club seleccionado" });
  }

  return aplicados;
}

/**
 * Resumen de los filtros activos. Cada uno se puede quitar por separado sin
 * perder los demás, que es lo que se espera al ir afinando una búsqueda.
 */
export function FiltrosAplicados({
  filtros,
  categorias,
  organizadores,
}: {
  filtros: FiltrosEventos;
  categorias: CategoriaResumen[];
  organizadores: OrganizadoresDisponibles;
}) {
  const aplicados = describir(filtros, categorias, organizadores);

  if (aplicados.length === 0) return null;

  const enlaceSin = (clave: keyof FiltrosEventos) => {
    const parametros = new URLSearchParams(parametrosDeFiltros(filtros));
    parametros.delete(clave);
    const texto = parametros.toString();

    return texto ? `/eventos?${texto}` : "/eventos";
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-texto-suave text-xs font-bold tracking-wide uppercase">
        {aplicados.length === 1 ? "1 filtro activo" : `${aplicados.length} filtros activos`}
      </span>

      {aplicados.map((aplicado) => (
        <Link
          key={aplicado.clave}
          href={enlaceSin(aplicado.clave)}
          className="bg-primario-suave text-primario-fuerte hover:bg-primario/20 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
        >
          {aplicado.texto}
          <span aria-hidden>×</span>
          <span className="sr-only">Quitar este filtro</span>
        </Link>
      ))}

      <Link href="/eventos" className="text-texto-suave text-xs font-semibold hover:underline">
        Limpiar todo
      </Link>
    </div>
  );
}
