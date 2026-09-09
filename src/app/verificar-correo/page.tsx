import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";
import { PanelVerificacion } from "@/components/autenticacion/panel-verificacion";
import { ResultadoVerificacion } from "@/components/autenticacion/resultado-verificacion";

export default async function PaginaVerificarCorreo({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <MarcoAcceso panel={<PanelVerificacion />}>
      <ResultadoVerificacion token={token} />
    </MarcoAcceso>
  );
}
