import { AccesosSecciones, type DatosSecciones } from "@/components/admin/accesos-secciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { verificarAcceso } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { NOMBRE_ASOCIACION_GENERAL } from "@/lib/inicio/consultas-inicio";
import { obtenerPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Indicador = { etiqueta: string; valor: number; color: string };

async function obtenerIndicadores(): Promise<Indicador[]> {
  const prisma = obtenerPrisma();
  const [estudiantes, eventos, horas, postulaciones] = await Promise.all([
    prisma.estudiante.count({ where: { activo: true } }),
    prisma.evento.count({ where: { estado: "PUBLICADO" } }),
    prisma.registroHoraBeca.count({ where: { estado: "PENDIENTE" } }),
    prisma.postulacionTutor.count({ where: { estado: "PENDIENTE" } }),
  ]);

  return [
    { etiqueta: "Estudiantes registrados", valor: estudiantes, color: "text-primario" },
    { etiqueta: "Eventos publicados", valor: eventos, color: "text-turquesa" },
    { etiqueta: "Horas beca por acreditar", valor: horas, color: "text-ambar" },
    { etiqueta: "Postulaciones sin revisar", valor: postulaciones, color: "text-magenta" },
  ];
}

/** "1 evento" o "3 eventos". */
function cantidad(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

/**
 * Un dato breve por sección, para que el acceso diga además qué hay pendiente
 * o cuánto contenido tiene. Si la consulta falla, las tarjetas se muestran sin
 * él: siguen sirviendo para navegar.
 */
async function obtenerDatosSecciones(): Promise<DatosSecciones> {
  const prisma = obtenerPrisma();
  const sinGeneral = {
    NOT: { nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" as const } },
  };

  try {
    const [
      cuentas,
      proximos,
      borradores,
      integrantes,
      asociaciones,
      clubes,
      pendientes,
      tutores,
      acreditadas,
    ] = await Promise.all([
      prisma.usuario.count({ where: { estado: "ACTIVO" } }),
      prisma.evento.count({ where: { estado: "PUBLICADO", fechaInicio: { gte: new Date() } } }),
      prisma.evento.count({ where: { estado: "BORRADOR" } }),
      prisma.integranteAsociacion.count({
        where: {
          activo: true,
          asociacion: { nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" } },
        },
      }),
      prisma.asociacion.count({ where: { activo: true, ...sinGeneral } }),
      prisma.club.count({ where: { activo: true } }),
      prisma.registroHoraBeca.count({ where: { estado: "PENDIENTE" } }),
      prisma.tutor.count({ where: { estado: "ACTIVO" } }),
      prisma.registroHoraBeca.count({ where: { estado: "ACREDITADA" } }),
    ]);

    return {
      "/admin/estudiantes": cantidad(cuentas, "cuenta activa", "cuentas activas"),
      "/admin/eventos": cantidad(proximos, "evento próximo", "eventos próximos"),
      "/admin/calendario": cantidad(borradores, "borrador sin publicar", "borradores sin publicar"),
      "/admin/sobre-aeuvg": cantidad(
        integrantes,
        "integrante en la junta",
        "integrantes en la junta"
      ),
      "/admin/asociaciones": cantidad(asociaciones, "asociación activa", "asociaciones activas"),
      "/admin/clubes": cantidad(clubes, "club activo", "clubes activos"),
      "/admin/horas-beca": cantidad(
        pendientes,
        "registro por acreditar",
        "registros por acreditar"
      ),
      "/admin/tutorias": cantidad(tutores, "tutor activo", "tutores activos"),
      "/admin/reportes": cantidad(acreditadas, "registro acreditado", "registros acreditados"),
    };
  } catch {
    return {};
  }
}

export default async function PaginaResumenAdmin() {
  const acceso = await verificarAcceso([ROLES.administrador]);
  const [indicadores, datos] =
    acceso.tipo === "autorizado"
      ? await Promise.all([obtenerIndicadores(), obtenerDatosSecciones()])
      : [[], {}];
  const nombre = acceso.tipo === "autorizado" ? acceso.usuario.nombreCompleto : "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Resumen</h1>
        <p className="text-texto-suave mt-2 text-sm">Hola, {nombre}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => (
          <Tarjeta key={indicador.etiqueta}>
            <p className={`text-4xl font-extrabold ${indicador.color}`}>{indicador.valor}</p>
            <p className="text-texto-suave mt-2 text-sm font-medium">{indicador.etiqueta}</p>
          </Tarjeta>
        ))}
      </div>

      <AccesosSecciones datos={datos} />
    </div>
  );
}
