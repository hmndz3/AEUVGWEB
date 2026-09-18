import type { EventoResumen } from "@/lib/eventos/consultas-eventos";
import { finDelDiaEnGuatemala, inicioDelDiaEnGuatemala } from "@/lib/eventos/filtros-eventos";
import { claveDiaLocal } from "@/lib/eventos/formato-fechas";

export type VistaCalendario = "mes" | "semana";

export const VISTAS: readonly VistaCalendario[] = ["mes", "semana"];

/** Un día de la grilla. La clave es AAAA-MM-DD en hora de Guatemala. */
export type DiaCalendario = {
  clave: string;
  numero: number;
  /** Falso en los días de relleno que completan la primera y la última semana. */
  delPeriodo: boolean;
  esHoy: boolean;
};

export type Calendario = {
  vista: VistaCalendario;
  /** Día de referencia del periodo, en formato AAAA-MM-DD. */
  ancla: string;
  titulo: string;
  dias: DiaCalendario[];
  /** Instantes que cubren la grilla completa, para consultar la base. */
  desde: Date;
  hasta: Date;
};

/*
 * La aritmética de fechas se hace sobre el día civil, representado como una
 * fecha UTC a medianoche. Usar la fecha local del servidor haría que el
 * calendario cambiara de mes según dónde estuviera corriendo la aplicación.
 */
function aFechaCivil(clave: string): Date {
  return new Date(`${clave}T00:00:00.000Z`);
}

function aClave(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(clave: string, dias: number): string {
  const fecha = aFechaCivil(clave);
  fecha.setUTCDate(fecha.getUTCDate() + dias);

  return aClave(fecha);
}

function sumarMeses(clave: string, meses: number): string {
  const fecha = aFechaCivil(clave);
  // Se fija el día 1 antes de mover el mes: sumarle un mes al 31 de enero
  // saltaría a marzo si no se hiciera así.
  fecha.setUTCDate(1);
  fecha.setUTCMonth(fecha.getUTCMonth() + meses);

  return aClave(fecha);
}

/** Día de la semana, con el domingo en 0, como se usa localmente. */
function diaDeLaSemana(clave: string): number {
  return aFechaCivil(clave).getUTCDay();
}

function diasDelMes(clave: string): number {
  const fecha = aFechaCivil(clave);

  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)).getUTCDate();
}

const mesYAnio = new Intl.DateTimeFormat("es-GT", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const diaYMes = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function conMayusculaInicial(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("es") + texto.slice(1);
}

/**
 * Deja el ancla en una fecha utilizable. Cualquier valor que no sea una fecha
 * del calendario gregoriano se reemplaza por el día de hoy, de modo que una
 * dirección manipulada muestre el periodo actual en vez de fallar.
 */
export function normalizarAncla(valor: string | undefined, hoy = new Date()): string {
  if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    if (!Number.isNaN(fecha.getTime()) && aClave(fecha) === valor) return valor;
  }

  return claveDiaLocal(hoy);
}

export function normalizarVista(valor: string | undefined): VistaCalendario {
  return valor === "semana" ? "semana" : "mes";
}

/** Ancla del periodo anterior, respetando la vista activa. */
export function periodoAnterior(vista: VistaCalendario, ancla: string): string {
  return vista === "mes" ? sumarMeses(ancla, -1) : sumarDias(ancla, -7);
}

export function periodoSiguiente(vista: VistaCalendario, ancla: string): string {
  return vista === "mes" ? sumarMeses(ancla, 1) : sumarDias(ancla, 7);
}

/**
 * Construye la grilla del periodo. La vista mensual completa la primera y la
 * última semana con días de los meses vecinos, para que las columnas siempre
 * correspondan al mismo día de la semana.
 */
export function construirCalendario(
  vista: VistaCalendario,
  ancla: string,
  hoy = new Date()
): Calendario {
  const claveHoy = claveDiaLocal(hoy);
  const primeroDelMes = `${ancla.slice(0, 7)}-01`;

  const inicio =
    vista === "mes"
      ? sumarDias(primeroDelMes, -diaDeLaSemana(primeroDelMes))
      : sumarDias(ancla, -diaDeLaSemana(ancla));

  const total =
    vista === "mes" ? Math.ceil((diaDeLaSemana(primeroDelMes) + diasDelMes(ancla)) / 7) * 7 : 7;

  const dias: DiaCalendario[] = Array.from({ length: total }, (_, indice) => {
    const clave = sumarDias(inicio, indice);

    return {
      clave,
      numero: Number(clave.slice(8, 10)),
      delPeriodo: vista === "semana" || clave.slice(0, 7) === ancla.slice(0, 7),
      esHoy: clave === claveHoy,
    };
  });

  const ultimo = dias[dias.length - 1].clave;
  const titulo =
    vista === "mes"
      ? conMayusculaInicial(mesYAnio.format(aFechaCivil(ancla)))
      : `${diaYMes.format(aFechaCivil(dias[0].clave))} al ${diaYMes.format(aFechaCivil(ultimo))} de ${ancla.slice(0, 4)}`;

  return {
    vista,
    ancla,
    titulo,
    dias,
    desde: inicioDelDiaEnGuatemala(dias[0].clave),
    hasta: finDelDiaEnGuatemala(ultimo),
  };
}

/**
 * Reparte los eventos entre los días de la grilla. Un evento de varios días
 * aparece en cada uno de los que abarca, que es como se lee un calendario.
 */
export function agruparEventosPorDia(
  eventos: EventoResumen[],
  dias: DiaCalendario[]
): Map<string, EventoResumen[]> {
  const claves = new Set(dias.map((dia) => dia.clave));
  const agrupados = new Map<string, EventoResumen[]>();

  for (const evento of eventos) {
    const ultima = claveDiaLocal(evento.fechaFin);
    let clave = claveDiaLocal(evento.fechaInicio);

    // El recorrido se detiene en el último día del evento; el tope adicional
    // evita cualquier posibilidad de ciclo si llegaran fechas inconsistentes.
    for (let paso = 0; clave <= ultima && paso <= dias.length + 1; paso += 1) {
      if (claves.has(clave)) {
        const delDia = agrupados.get(clave);
        if (delDia) delDia.push(evento);
        else agrupados.set(clave, [evento]);
      }

      clave = sumarDias(clave, 1);
    }
  }

  return agrupados;
}
