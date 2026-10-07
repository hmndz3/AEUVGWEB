import Link from "next/link";

import { AccionesOrganizacion } from "@/components/admin/acciones-organizacion";
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
import type { PaginaOrganizacionesAdmin } from "@/lib/organizaciones/consultas-organizaciones";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

/**
 * Listado del panel para asociaciones y clubes. Es un solo componente para las
 * dos secciones: comparten columnas y acciones, y tener dos listados solo
 * garantizaba que se separaran con el tiempo.
 */
export function ListadoOrganizaciones({
  tipo,
  titulo,
  descripcion,
  textoCrear,
  pagina: resultado,
  busqueda,
}: {
  tipo: TipoOrganizacion;
  titulo: string;
  descripcion: string;
  textoCrear: string;
  pagina: PaginaOrganizacionesAdmin;
  busqueda: string;
}) {
  const ruta = `/admin/${tipo}`;
  const { organizaciones, total, pagina, paginas } = resultado;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">{titulo}</h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">{descripcion}</p>
        </div>

        <Link href={`${ruta}/nueva`}>
          <Boton>{textoCrear}</Boton>
        </Link>
      </div>

      <form method="get" action={ruta} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-texto text-sm font-semibold">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Nombre o descripción"
            className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <Boton type="submit" variante="contorno">
          Buscar
        </Boton>
      </form>

      <p className="text-texto-suave text-sm">
        {total === 0 ? "Sin registros" : `${total} ${total === 1 ? "registro" : "registros"}`}
      </p>

      {organizaciones.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-14 text-center text-sm">
          No hay registros que coincidan. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <Tabla>
          <TablaEncabezado>
            <tr>
              <TablaCeldaEncabezado>Nombre</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Eventos</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
              <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
            </tr>
          </TablaEncabezado>
          <TablaCuerpo>
            {organizaciones.map((organizacion) => (
              <TablaFila key={organizacion.id}>
                <TablaCelda>
                  <Link
                    href={`${ruta}/${organizacion.id}`}
                    className="text-texto font-semibold hover:underline"
                  >
                    {organizacion.nombre}
                  </Link>
                  {organizacion.descripcion && (
                    <span className="text-texto-suave mt-0.5 block max-w-md truncate text-xs">
                      {organizacion.descripcion}
                    </span>
                  )}
                </TablaCelda>
                <TablaCelda className="text-texto-suave">
                  {organizacion.eventosOrganizados}
                </TablaCelda>
                <TablaCelda>
                  <EtiquetaEstado tono={organizacion.activo ? "acreditada" : "neutro"}>
                    {organizacion.activo ? "Activa" : "De baja"}
                  </EtiquetaEstado>
                </TablaCelda>
                <TablaCelda>
                  <AccionesOrganizacion
                    tipo={tipo}
                    id={organizacion.id}
                    activo={organizacion.activo}
                  />
                </TablaCelda>
              </TablaFila>
            ))}
          </TablaCuerpo>
        </Tabla>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        ruta={ruta}
        parametros={busqueda ? { q: busqueda } : {}}
      />
    </div>
  );
}
