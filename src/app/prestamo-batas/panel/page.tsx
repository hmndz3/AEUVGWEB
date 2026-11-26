import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { PanelVoluntario } from "@/components/prestamo-batas/panel-voluntario";
import { verificarAcceso } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import {
  listarArticulosDisponibles,
  listarMisComprobantes,
  listarMisTurnos,
  listarPrestamos,
  obtenerJornadaDeHoy,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de voluntario",
  description: "Registra préstamos, la lista negra y tus comprobantes de horas del salón.",
};

export default async function PaginaPanelVoluntario() {
  const acceso = await verificarAcceso([ROLES.voluntario]);

  if (acceso.tipo === "sin_sesion") redirect("/iniciar-sesion?continuar=/prestamo-batas/panel");
  // Quien no es voluntario no tiene panel: se le lleva a la sección pública,
  // donde puede postularse.
  if (acceso.tipo === "sin_permiso") redirect("/prestamo-batas");

  const [articulos, prestamos, turnos, comprobantes, jornada] = await Promise.all([
    listarArticulosDisponibles(),
    listarPrestamos(60),
    listarMisTurnos(acceso.usuario.idUsuario),
    listarMisComprobantes(acceso.usuario.idUsuario),
    obtenerJornadaDeHoy(acceso.usuario.idUsuario),
  ]);

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link href="/prestamo-batas" className="text-primario text-sm font-bold hover:underline">
            ← Volver al préstamo de batas
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
            Panel de voluntario
          </h1>
          <p className="text-texto-suave mt-2 leading-relaxed">
            Atiendes {turnos.length} {turnos.length === 1 ? "turno" : "turnos"}. Desde aquí
            registras los préstamos, su devolución y la lista negra, y cierras tu turno con las
            fotos de entrada y salida con las que se te acreditan las horas beca.
          </p>
        </div>

        <PanelVoluntario
          articulos={articulos}
          prestamos={prestamos}
          turnos={turnos}
          comprobantes={comprobantes}
          jornada={jornada}
        />
      </div>
    </MarcoSitio>
  );
}
