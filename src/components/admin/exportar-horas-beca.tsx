import { FORMATOS_EXPORTACION, ETIQUETAS_FORMATO } from "@/validators/horas-beca";

/**
 * Controles de descarga del listado de horas beca.
 *
 * Son enlaces y no botones con JavaScript: la descarga la resuelve el navegador
 * con la respuesta del servidor, igual que cualquier otro archivo, y así
 * funciona aunque el guion de la página no haya cargado.
 *
 * Cada enlace arrastra los filtros que trae la dirección actual, de modo que se
 * descargue exactamente lo que está en pantalla y no la base completa.
 */
export function ExportarHorasBeca({ parametros }: { parametros: Record<string, string> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-texto-suave text-sm font-semibold">Descargar:</span>
      {FORMATOS_EXPORTACION.map((formato) => {
        const consulta = new URLSearchParams({ ...parametros, formato });

        return (
          <a
            key={formato}
            href={`/api/admin/horas-beca/exportar?${consulta.toString()}`}
            className="border-borde bg-superficie text-texto hover:bg-superficie-suave inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors"
          >
            {ETIQUETAS_FORMATO[formato]}
          </a>
        );
      })}
    </div>
  );
}
