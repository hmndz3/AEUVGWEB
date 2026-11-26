import Link from "next/link";

import { ImportarDesdeExcel } from "@/components/admin/importar-desde-excel";
import { columnasDe } from "@/lib/organizaciones/columnas-importacion";
import { ETIQUETA_TIPO, type TipoOrganizacion } from "@/validators/organizacion-admin";

/**
 * Pantalla de carga por archivo de asociaciones y de clubes.
 *
 * Es una sola para las dos secciones, igual que el listado: lo único que cambia
 * son los textos y la dirección a la que se envía el archivo.
 */
export function PantallaImportarOrganizaciones({ tipo }: { tipo: TipoOrganizacion }) {
  const { singular, plural } = ETIQUETA_TIPO[tipo];
  const esAsociacion = tipo === "asociaciones";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/${tipo}`} className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          Importar {plural}
        </h1>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Carga una hoja de Excel con varios registros de una vez, en lugar de crearlos uno por uno.
          El archivo debe traer estas columnas, en cualquier orden: {columnasDe(tipo).join(", ")}.
        </p>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          El logotipo va como enlace: súbelo a Drive, OneDrive o Dropbox, compártelo como
          «cualquiera con el enlace» y pega la dirección. La plataforma lo descarga al cargar el
          archivo y lo guarda.{" "}
          {esAsociacion
            ? "La junta directiva no va en el archivo: los integrantes se agregan desde la ficha de cada asociación."
            : "Las redes sociales sí van en el archivo, una columna por plataforma."}
        </p>
        {/* Enlace normal y no <Link>: es una descarga que resuelve el servidor,
            no una navegación de la aplicación. */}
        <a
          href={`/api/admin/organizaciones/${tipo}/plantilla`}
          className="text-primario mt-3 inline-flex text-sm font-bold hover:underline"
        >
          Descargar la plantilla de Excel
        </a>
      </div>

      <ImportarDesdeExcel
        endpoint={`/api/admin/organizaciones/${tipo}/importar`}
        textos={{
          singular,
          plural,
          referencia: esAsociacion ? "Asociación" : "Club",
          nota: esAsociacion
            ? "quedan activas y visibles en el sitio"
            : "quedan activos y visibles en el sitio",
        }}
      />
    </div>
  );
}
