import { notFound, redirect } from "next/navigation";

import { BarraLateralAdmin } from "@/components/admin/barra-lateral";
import { verificarAcceso } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function DisposicionAdmin({ children }: { children: React.ReactNode }) {
  const acceso = await verificarAcceso([ROLES.administrador]);

  if (acceso.tipo === "sin_sesion") redirect("/iniciar-sesion?continuar=/admin");
  // Con sesión pero sin el rol, el panel no debe siquiera confirmarse que existe.
  if (acceso.tipo === "sin_permiso") notFound();

  return (
    <div className="bg-fondo flex min-h-dvh flex-col md:flex-row">
      <BarraLateralAdmin />
      <main className="flex-1 px-5 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
