import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import { estadoVisible, etiquetaEstado } from "@/lib/eventos/estado-evento";
import { fechaDeEvento, horaDeEvento } from "@/lib/eventos/exportacion-eventos";
import type { EventoReporte, LineaMetrica, ResumenEventos } from "@/lib/eventos/metricas-eventos";
import { ETIQUETAS_TIPO_ACTIVIDAD } from "@/validators/eventos";

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
      <p className="text-texto-suave mt-1 text-xs">{detalle}</p>
    </div>
  );
}

/**
 * Indicadores del reporte de eventos.
 *
 * La plataforma no pasa asistencia en la puerta, así que el alcance de las
 * actividades se mide con lo que sí queda registrado: cuántos estudiantes las
 * guardaron y cuántas horas beca generaron.
 */
export function ResumenReporteEventos({ resumen }: { resumen: ResumenEventos }) {
  const { porEstado } = resumen;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador
        titulo="Eventos"
        valor={String(resumen.eventos)}
        detalle={`${porEstado.borrador} en borrador`}
      />
      <Indicador
        titulo="Realizados"
        valor={String(porEstado.finalizado + porEstado.en_curso)}
        detalle={`${porEstado.proximo} por venir · ${porEstado.cancelado} cancelados`}
      />
      <Indicador
        titulo="Estudiantes interesados"
        valor={String(resumen.guardados)}
        detalle="Guardaron el evento en su perfil"
      />
      <Indicador
        titulo="Horas beca generadas"
        valor={resumen.horasBeca.toFixed(2)}
        detalle={`${resumen.apoyos} ${resumen.apoyos === 1 ? "persona apoyó" : "personas apoyaron"}`}
      />
    </div>
  );
}

/** Uno de los desgloses del reporte: por mes, por categoría o por organizador. */
export function TablaMetrica({
  encabezado,
  lineas,
  vacio,
}: {
  encabezado: string;
  lineas: LineaMetrica[];
  vacio: string;
}) {
  if (lineas.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        {vacio}
      </div>
    );
  }

  return (
    <Tabla>
      <TablaEncabezado>
        <TablaFila>
          <TablaCeldaEncabezado>{encabezado}</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Eventos</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Guardados</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Horas beca</TablaCeldaEncabezado>
        </TablaFila>
      </TablaEncabezado>
      <TablaCuerpo>
        {lineas.map((linea) => (
          <TablaFila key={linea.clave}>
            <TablaCelda>
              <span className="text-texto font-semibold">{linea.etiqueta}</span>
            </TablaCelda>
            <TablaCelda>{linea.eventos}</TablaCelda>
            <TablaCelda>{linea.guardados}</TablaCelda>
            <TablaCelda>{linea.horasBeca.toFixed(2)}</TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}

/** Detalle de los eventos del reporte, que es lo mismo que lleva la descarga. */
export function TablaEventosReporte({ eventos }: { eventos: EventoReporte[] }) {
  if (eventos.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        Ningún evento coincide con estos filtros.
      </div>
    );
  }

  return (
    <Tabla>
      <TablaEncabezado>
        <TablaFila>
          <TablaCeldaEncabezado>Evento</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Categoría</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Organizadores</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Guardados</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Horas beca</TablaCeldaEncabezado>
        </TablaFila>
      </TablaEncabezado>
      <TablaCuerpo>
        {eventos.map((evento) => (
          <TablaFila key={evento.idEvento}>
            <TablaCelda>
              <span className="text-texto font-semibold">{evento.nombre}</span>
              <span className="text-texto-suave block text-xs">
                {ETIQUETAS_TIPO_ACTIVIDAD[evento.tipoActividad]} · {evento.ubicacion}
              </span>
            </TablaCelda>
            <TablaCelda>
              {fechaDeEvento(evento.fechaInicio)}
              <span className="text-texto-suave block text-xs">
                {horaDeEvento(evento.fechaInicio)} a {horaDeEvento(evento.fechaFin)}
              </span>
            </TablaCelda>
            <TablaCelda>{evento.categoria}</TablaCelda>
            <TablaCelda>
              {evento.organizadores.length > 0 ? evento.organizadores.join(" · ") : "—"}
            </TablaCelda>
            <TablaCelda>{etiquetaEstado(estadoVisible(evento))}</TablaCelda>
            <TablaCelda>{evento.guardados}</TablaCelda>
            <TablaCelda>{evento.horasBeca.toFixed(2)}</TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}

/**
 * Descarga del reporte.
 *
 * Son enlaces y no botones con JavaScript: la descarga la resuelve el navegador
 * con la respuesta del servidor. Cada uno arrastra los filtros de la dirección
 * actual, de modo que el archivo traiga lo que está en pantalla.
 */
export function DescargarReporteEventos({ parametros }: { parametros: Record<string, string> }) {
  const formatos = [
    { formato: "excel", texto: "Excel" },
    { formato: "csv", texto: "CSV" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-texto-suave text-sm font-semibold">Descargar:</span>
      {formatos.map(({ formato, texto }) => {
        const consulta = new URLSearchParams({ ...parametros, formato });

        return (
          <a
            key={formato}
            href={`/api/admin/reportes/eventos?${consulta.toString()}`}
            className="border-borde bg-superficie text-texto hover:bg-superficie-suave inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors"
          >
            {texto}
          </a>
        );
      })}
    </div>
  );
}
