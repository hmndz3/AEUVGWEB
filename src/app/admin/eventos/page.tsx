import Link from "next/link";

import { AccionesEvento } from "@/components/admin/acciones-evento";
import { Paginacion } from "@/components/eventos/paginacion";
import { Boton } from "@/components/ui/boton";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import { normalizarTexto } from "@/lib/eventos/busqueda";
import { listarEventosAdministracion } from "@/lib/eventos/consultas-eventos";
import { estadoVisible, etiquetaEstado, tonoEstado } from "@/lib/eventos/estado-evento";
import { formatearFechaConAnio, formatearHora } from "@/lib/eventos/formato-fechas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ESTADOS = [
  { valor: "", texto: "Todos" },
  { valor: "BORRADOR", texto: "Borradores" },
  { valor: "PUBLICADO", texto: "Publicados" },
  { valor: "CANCELADO", texto: "Cancelados" },
  { valor: "FINALIZADO", texto: "Finalizados" },
] as const;

type Estado = (typeof ESTADOS)[number]["valor"];

function valor(parametro: string | string[] | undefined): string {
  return (Array.isArray(parametro) ? parametro[0] : parametro) ?? "";
}

export default async function PaginaAdminEventos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const estadoPedido = valor(parametros.estado);
  const estado = (
    ESTADOS.some((opcion) => opcion.valor === estadoPedido) ? estadoPedido : ""
  ) as Estado;
  const busqueda = valor(parametros.q).trim();
  const pagina = Number(valor(parametros.pagina)) || 1;

  const { eventos, total, paginas } = await listarEventosAdministracion({
    pagina,
    condiciones: {
      ...(estado ? { estado } : {}),
      ...(busqueda ? { textoBusqueda: { contains: normalizarTexto(busqueda) } } : {}),
    },
  });

  const parametrosVigentes: Record<string, string> = {};
  if (estado) parametrosVigentes.estado = estado;
  if (busqueda) parametrosVigentes.q = busqueda;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">Eventos</h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
            Creación, edición y publicación de los eventos de AEUVG. Los eventos nuevos se guardan
            como borrador y no se ven en el sitio hasta publicarlos.
          </p>
        </div>

        <Link href="/admin/eventos/nuevo">
          <Boton>Crear evento</Boton>
        </Link>
      </div>

      <form method="get" action="/admin/eventos" className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-texto text-sm font-semibold">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Nombre, descripción o lugar"
            className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <Boton type="submit" variante="contorno">
          Buscar
        </Boton>
      </form>

      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((opcion) => {
          const consulta = new URLSearchParams(busqueda ? { q: busqueda } : {});
          if (opcion.valor) consulta.set("estado", opcion.valor);
          const texto = consulta.toString();

          return (
            <Link
              key={opcion.valor || "todos"}
              href={texto ? `/admin/eventos?${texto}` : "/admin/eventos"}
              aria-current={estado === opcion.valor ? "true" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                estado === opcion.valor
                  ? "bg-primario text-white"
                  : "border-borde bg-superficie text-texto-suave hover:bg-superficie-suave border"
              )}
            >
              {opcion.texto}
            </Link>
          );
        })}
      </div>

      <p className="text-texto-suave text-sm">
        {total === 0 ? "Sin eventos" : `${total} ${total === 1 ? "evento" : "eventos"}`}
      </p>

      {eventos.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-14 text-center text-sm">
          No hay eventos que coincidan. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <Tabla>
          <TablaEncabezado>
            <tr>
              <TablaCeldaEncabezado>Evento</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
              <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
            </tr>
          </TablaEncabezado>
          <TablaCuerpo>
            {eventos.map((evento) => {
              const visible = estadoVisible(evento);

              return (
                <TablaFila key={evento.idEvento}>
                  <TablaCelda>
                    <Link
                      href={`/admin/eventos/${evento.idEvento}`}
                      className="text-texto font-semibold hover:underline"
                    >
                      {evento.nombre}
                    </Link>
                    <span className="text-texto-suave mt-0.5 block text-xs">
                      {evento.categoria.nombre}
                      {evento.organizadores.length > 0 && ` · ${evento.organizadores.join(", ")}`}
                    </span>
                  </TablaCelda>
                  <TablaCelda className="text-texto-suave whitespace-nowrap">
                    {formatearFechaConAnio(evento.fechaInicio)}
                    <span className="block text-xs">{formatearHora(evento.fechaInicio)}</span>
                  </TablaCelda>
                  <TablaCelda>
                    <EtiquetaEstado tono={tonoEstado(visible)}>
                      {etiquetaEstado(visible)}
                    </EtiquetaEstado>
                  </TablaCelda>
                  <TablaCelda>
                    <AccionesEvento idEvento={evento.idEvento} estado={evento.estado} />
                  </TablaCelda>
                </TablaFila>
              );
            })}
          </TablaCuerpo>
        </Tabla>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        ruta="/admin/eventos"
        parametros={parametrosVigentes}
      />
    </div>
  );
}
