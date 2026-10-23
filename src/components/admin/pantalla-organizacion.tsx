import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorJuntaDirectiva } from "@/components/admin/editor-junta-directiva";
import { EditorRedesSociales } from "@/components/admin/editor-redes-sociales";
import {
  FormularioOrganizacion,
  VALORES_ORGANIZACION_VACIOS,
  type ValoresOrganizacion,
} from "@/components/admin/formulario-organizacion";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { nombreConSiglas } from "@/lib/organizaciones/nombre-organizacion";
import { ETIQUETA_TIPO, type TipoOrganizacion } from "@/validators/organizacion-admin";

function Encabezado({
  tipo,
  titulo,
  descripcion,
}: {
  tipo: TipoOrganizacion;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div>
      <Link href={`/admin/${tipo}`} className="text-primario text-sm font-bold hover:underline">
        ← Volver al listado
      </Link>
      <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">{descripcion}</p>
    </div>
  );
}

/** Pantalla de creación. La junta directiva y las redes se administran al editar. */
export function PantallaNuevaOrganizacion({ tipo }: { tipo: TipoOrganizacion }) {
  const { singular } = ETIQUETA_TIPO[tipo];

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        tipo={tipo}
        titulo={`Crear ${singular}`}
        descripcion={
          tipo === "asociaciones"
            ? "La junta directiva y las redes sociales se registran después de guardar la asociación."
            : "Las redes sociales se registran después de guardar el club."
        }
      />
      <FormularioOrganizacion tipo={tipo} valoresIniciales={VALORES_ORGANIZACION_VACIOS} />
    </div>
  );
}

/**
 * Pantalla de edición. Carga la ficha junto con su junta directiva y sus redes,
 * porque las tres se administran en la misma pantalla aunque cada una se guarde
 * por separado.
 */
export async function PantallaEdicionOrganizacion({
  tipo,
  id,
}: {
  tipo: TipoOrganizacion;
  id: number;
}) {
  const servicio = crearServicioOrganizaciones();
  const organizacion = await servicio.obtener(tipo, id);

  if (!organizacion) notFound();

  const [integrantes, redes] = await Promise.all([
    tipo === "asociaciones" ? servicio.listarIntegrantes(id) : Promise.resolve([]),
    servicio.listarRedesSociales(tipo, id),
  ]);

  const valores: ValoresOrganizacion = {
    nombre: organizacion.nombre,
    siglas: organizacion.siglas ?? "",
    descripcion: organizacion.descripcion ?? "",
    mision: organizacion.mision ?? "",
    vision: organizacion.vision ?? "",
    actividades: organizacion.actividades ?? "",
    correo: organizacion.correo ?? "",
    informacionContacto: organizacion.informacionContacto ?? "",
    imagenUrl: organizacion.imagenUrl ?? "",
  };

  return (
    <div className="flex flex-col gap-8">
      <Encabezado
        tipo={tipo}
        titulo={nombreConSiglas(organizacion)}
        descripcion={
          organizacion.activo
            ? "Los cambios se reflejan de inmediato en el sitio."
            : "Este registro está dado de baja: no aparece en el sitio hasta reactivarlo desde el listado."
        }
      />

      <FormularioOrganizacion tipo={tipo} id={id} valoresIniciales={valores} />

      {tipo === "asociaciones" && (
        <EditorJuntaDirectiva idAsociacion={id} integrantes={integrantes} />
      )}

      <EditorRedesSociales tipo={tipo} id={id} redes={redes} />
    </div>
  );
}
