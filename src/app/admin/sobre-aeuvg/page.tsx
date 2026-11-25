import { EditorJuntaDirectiva } from "@/components/admin/editor-junta-directiva";
import { EditorRedesSociales } from "@/components/admin/editor-redes-sociales";
import { FormularioSobreAeuvg } from "@/components/admin/formulario-sobre-aeuvg";
import { Alerta } from "@/components/ui/alerta";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";

export const dynamic = "force-dynamic";

/**
 * Página Sobre AEUVG desde el panel.
 *
 * AEUVG está registrada como una asociación más, pero no aparece en el listado
 * de asociaciones: su ficha alimenta la página institucional, y se administra
 * aquí con los mismos editores de junta directiva y redes que las demás.
 */
export default async function Pagina() {
  const servicio = crearServicioOrganizaciones();
  const ficha = await servicio.obtenerInformacionGeneral();

  const [integrantes, redes] = ficha
    ? await Promise.all([
        servicio.listarIntegrantes(ficha.id),
        servicio.listarRedesSociales("asociaciones", ficha.id),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">Sobre AEUVG</h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
            Lo que presenta la página institucional: quiénes somos, misión, visión, Junta Directiva
            y contacto. Los cambios se reflejan de inmediato en el sitio.
          </p>
        </div>
        <a
          href="/sobre-aeuvg"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primario text-sm font-bold hover:underline"
        >
          Ver la página ↗
        </a>
      </div>

      <FormularioSobreAeuvg
        valoresIniciales={{
          descripcion: ficha?.descripcion ?? "",
          mision: ficha?.mision ?? "",
          vision: ficha?.vision ?? "",
          correo: ficha?.correo ?? "",
          telefono: ficha?.telefono ?? "",
          informacionContacto: ficha?.informacionContacto ?? "",
        }}
      />

      {ficha ? (
        <>
          <EditorJuntaDirectiva
            idAsociacion={ficha.id}
            integrantes={integrantes}
            descripcion="El orden decide cómo se presentan en la página Sobre AEUVG: 1 aparece primero. Quien no tenga fotografía se muestra con sus iniciales."
          />
          <EditorRedesSociales tipo="asociaciones" id={ficha.id} redes={redes} />
        </>
      ) : (
        <Alerta tipo="informativo">
          Guarda primero la información de la página. Después podrás registrar aquí la Junta
          Directiva y las redes sociales.
        </Alerta>
      )}
    </div>
  );
}
