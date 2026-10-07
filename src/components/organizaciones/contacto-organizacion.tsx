import { RedesSociales } from "@/components/organizaciones/redes-sociales";
import type { RedSocialOrganizacion } from "@/lib/organizaciones/consultas-organizaciones";

/**
 * Medios de contacto de una asociación o de un club. El bloque desaparece por
 * completo cuando no hay correo, información de contacto ni redes: es el caso
 * de las organizaciones cuya ficha AEUVG apenas está empezando a cargar.
 */
export function ContactoOrganizacion({
  correo,
  informacionContacto,
  redesSociales,
}: {
  correo: string | null;
  informacionContacto: string | null;
  redesSociales: RedSocialOrganizacion[];
}) {
  if (!correo && !informacionContacto && redesSociales.length === 0) return null;

  return (
    <section className="bg-superficie-suave rounded-[1.25rem] p-8">
      <h2 className="text-texto text-2xl font-extrabold tracking-tight">Contacto</h2>

      {correo && (
        <p className="mt-3">
          <a href={`mailto:${correo}`} className="text-primario font-semibold hover:underline">
            {correo}
          </a>
        </p>
      )}

      {informacionContacto && (
        <p className="text-texto-suave mt-2 leading-relaxed whitespace-pre-line">
          {informacionContacto}
        </p>
      )}

      <RedesSociales redes={redesSociales} className="mt-5" />
    </section>
  );
}
