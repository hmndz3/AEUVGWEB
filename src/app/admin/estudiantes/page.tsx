import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TablaCuentas } from "@/components/admin/tabla-cuentas";
import { Paginacion } from "@/components/eventos/paginacion";
import { Boton } from "@/components/ui/boton";
import { listarCuentas, obtenerResumenCuentas } from "@/lib/admin/consultas-cuentas";
import { verificarAcceso } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { listarFacultades } from "@/lib/horas-beca/consultas-facultades";
import {
  ESTADOS_CUENTA,
  ETIQUETAS_ESTADO_CUENTA,
  ETIQUETAS_VERIFICACION,
  VERIFICACIONES,
  interpretarFiltrosCuentas,
  parametrosDeCuentas,
} from "@/validators/cuentas-admin";

export const dynamic = "force-dynamic";

const RUTA = "/admin/estudiantes";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

function Indicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
    </div>
  );
}

export default async function PaginaAdminEstudiantes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // La cuenta de la sesión hace falta aquí y no solo en el guardia: es la que
  // no puede bloquearse a sí misma, y la tabla lo señala en su fila.
  const acceso = await verificarAcceso([ROLES.administrador]);
  if (acceso.tipo === "sin_sesion") redirect("/iniciar-sesion?continuar=/admin/estudiantes");
  if (acceso.tipo === "sin_permiso") notFound();

  const filtros = interpretarFiltrosCuentas(await searchParams);

  const [pagina, resumen, facultades] = await Promise.all([
    listarCuentas(filtros),
    obtenerResumenCuentas(),
    listarFacultades(),
  ]);

  const activos = Object.entries(filtros).filter(([clave]) => clave !== "pagina").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Estudiantes</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Cuentas registradas en la plataforma, con su carrera, sus roles y su estado de
          verificación. Los datos personales los corrige cada estudiante desde su perfil; desde aquí
          solo se activa o se bloquea el acceso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador titulo="Cuentas" valor={resumen.total} />
        <Indicador titulo="Activas" valor={resumen.activas} />
        <Indicador titulo="Pendientes" valor={resumen.pendientes} />
        <Indicador titulo="Bloqueadas" valor={resumen.bloqueadas} />
        <Indicador titulo="Sin verificar" valor={resumen.sinVerificar} />
      </div>

      <form
        method="get"
        action={RUTA}
        className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-texto text-sm font-semibold">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            placeholder="Carnet, nombre o correo"
            className={claseCampo}
          />
        </div>

        <div className="flex min-w-44 flex-col gap-1.5">
          <label htmlFor="estado" className="text-texto text-sm font-semibold">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={filtros.estado ?? ""}
            className={claseCampo}
          >
            <option value="">Todos</option>
            {ESTADOS_CUENTA.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO_CUENTA[estado]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-56 flex-col gap-1.5">
          <label htmlFor="facultad" className="text-texto text-sm font-semibold">
            Facultad
          </label>
          <select
            id="facultad"
            name="facultad"
            defaultValue={filtros.facultad ? String(filtros.facultad) : ""}
            className={claseCampo}
          >
            <option value="">Todas</option>
            {facultades.map((facultad) => (
              <option key={facultad.idFacultad} value={facultad.idFacultad}>
                {facultad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-52 flex-col gap-1.5">
          <label htmlFor="verificacion" className="text-texto text-sm font-semibold">
            Correo
          </label>
          <select
            id="verificacion"
            name="verificacion"
            defaultValue={filtros.verificacion ?? ""}
            className={claseCampo}
          >
            <option value="">Todos</option>
            {VERIFICACIONES.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_VERIFICACION[valor]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Boton type="submit" variante="contorno">
            Filtrar
          </Boton>
          {activos > 0 && (
            <Link
              href={RUTA}
              className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <p className="text-texto-suave text-sm">
        {pagina.total === 0
          ? "Sin cuentas"
          : `${pagina.total} ${pagina.total === 1 ? "cuenta" : "cuentas"}`}
      </p>

      {pagina.cuentas.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-14 text-center text-sm">
          {activos > 0
            ? "Ninguna cuenta coincide con la búsqueda o los filtros aplicados."
            : "Todavía no hay cuentas registradas en la plataforma."}
        </div>
      ) : (
        <TablaCuentas cuentas={pagina.cuentas} idAdministrador={acceso.usuario.idUsuario} />
      )}

      <Paginacion
        pagina={pagina.pagina}
        paginas={pagina.paginas}
        ruta={RUTA}
        parametros={parametrosDeCuentas(filtros)}
        etiqueta="Páginas de cuentas"
      />
    </div>
  );
}
