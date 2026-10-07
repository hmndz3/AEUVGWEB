import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { inicialesDe } from "@/lib/auth/usuario-sesion-cliente";
import type { PerfilEstudiante } from "@/lib/perfil/consultas-perfil";

const ETIQUETAS_ESTADO: Record<PerfilEstudiante["estado"], string> = {
  ACTIVO: "Cuenta activa",
  PENDIENTE: "Cuenta pendiente de verificación",
  BLOQUEADO: "Cuenta bloqueada",
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-texto-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</dt>
      <dd className="text-texto mt-1 text-sm leading-relaxed break-words">{valor}</dd>
    </div>
  );
}

/**
 * Encabezado y datos de solo lectura del perfil.
 *
 * El carnet, el nombre y el correo institucional se presentan sin posibilidad de
 * editarlos, con una nota de a quién corresponde corregirlos: identifican la
 * cuenta y con el carnet se asocian los registros de horas beca, así que
 * cambiarlos desde aquí rompería ese vínculo.
 */
export function DatosPerfil({ perfil }: { perfil: PerfilEstudiante }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="bg-primario grid size-16 shrink-0 place-items-center rounded-full text-xl font-bold text-white"
        >
          {inicialesDe(perfil.nombreCompleto)}
        </span>

        <div className="min-w-0">
          <h1 className="text-texto text-2xl leading-tight font-extrabold tracking-tight break-words sm:text-3xl">
            {perfil.nombreCompleto}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EtiquetaEstado tono={perfil.estado === "ACTIVO" ? "acreditada" : "pendiente"}>
              {ETIQUETAS_ESTADO[perfil.estado]}
            </EtiquetaEstado>
            <EtiquetaEstado tono={perfil.correoVerificado ? "acreditada" : "pendiente"}>
              {perfil.correoVerificado ? "Correo verificado" : "Correo sin verificar"}
            </EtiquetaEstado>
          </div>
        </div>
      </div>

      <section className="bg-superficie-suave rounded-[1.25rem] p-6">
        <h2 className="text-texto text-lg font-bold">Datos de la cuenta</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Carnet" valor={perfil.carnet} />
          <Dato etiqueta="Correo institucional" valor={perfil.correoUvg} />
          <Dato etiqueta="Carrera" valor={perfil.carrera} />
          <Dato etiqueta="Facultad" valor={perfil.facultad} />
          {/* El teléfono solo se veía dentro del formulario, así que quien
              entraba a revisar sus datos no sabía si lo tenía registrado. */}
          <Dato etiqueta="Teléfono" valor={perfil.telefono ?? "Sin registrar"} />
        </dl>
        <p className="text-texto-suave mt-5 text-xs leading-relaxed">
          El nombre, el carnet y el correo institucional identifican tu cuenta y con ellos se
          asocian tus registros de horas beca. Si alguno está incorrecto, escribe a AEUVG para que
          lo corrija.
        </p>
      </section>
    </div>
  );
}
