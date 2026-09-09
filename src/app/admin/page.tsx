import { SECCIONES_ADMIN } from "@/components/admin/secciones";
import { Tarjeta, TarjetaTexto, TarjetaTitulo } from "@/components/ui/tarjeta";
import { verificarAcceso } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
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

export default async function PaginaResumenAdmin() {
  const acceso = await verificarAcceso([ROLES.administrador]);
  const indicadores = acceso.tipo === "autorizado" ? await obtenerIndicadores() : [];
  const nombre = acceso.tipo === "autorizado" ? acceso.usuario.nombreCompleto : "";
  const secciones = SECCIONES_ADMIN.filter((seccion) => seccion.href !== "/admin");

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

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-xl font-bold">Secciones del panel</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {secciones.map((seccion) => (
            <Tarjeta key={seccion.href}>
              <TarjetaTitulo>{seccion.texto}</TarjetaTitulo>
              <TarjetaTexto className="mt-2">{seccion.descripcion}</TarjetaTexto>
            </Tarjeta>
          ))}
        </div>
      </section>
    </div>
  );
}
