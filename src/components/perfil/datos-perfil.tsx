import { Avatar } from "@/components/ui/avatar";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { DatosCuenta } from "@/components/perfil/datos-cuenta";
import type { FacultadDisponible, PerfilEstudiante } from "@/lib/perfil/consultas-perfil";

const ETIQUETAS_ESTADO: Record<PerfilEstudiante["estado"], string> = {
  ACTIVO: "Cuenta activa",
  PENDIENTE: "Cuenta pendiente de verificación",
  BLOQUEADO: "Cuenta bloqueada",
};

/**
 * Encabezado y datos de la cuenta del perfil.
 *
 * El carnet, el nombre y el correo institucional se presentan sin posibilidad de
 * editarlos, con una nota de a quién corresponde corregirlos: identifican la
 * cuenta y con el carnet se asocian los registros de horas beca, así que
 * cambiarlos desde aquí rompería ese vínculo. El teléfono, la facultad y la
 * carrera se editan en la misma tarjeta.
 */
export function DatosPerfil({
  perfil,
  facultades,
}: {
  perfil: PerfilEstudiante;
  facultades: FacultadDisponible[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar nombre={perfil.nombreCompleto} fotoUrl={perfil.fotoUrl} tamano="size-16 text-xl" />

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

      <DatosCuenta perfil={perfil} facultades={facultades} />
    </div>
  );
}
