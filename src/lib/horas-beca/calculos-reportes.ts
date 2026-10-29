import type { EstadoHoraBeca } from "@prisma/client";

/**
 * Cálculos del reporte, separados de las consultas.
 *
 * La base suma y cuenta agrupando por día o por carnet; lo que queda es plegar
 * esos grupos en meses y en estudiantes. Vive en su propio módulo para que el
 * cálculo se pueda probar con grupos escritos a mano, sin base de datos: es la
 * parte donde un error pasaría inadvertido, porque un total equivocado se sigue
 * leyendo como un total.
 */

/** Un grupo tal como lo devuelve la base: un estado con sus horas y sus filas. */
export type GrupoHoras = {
  estado: EstadoHoraBeca;
  horas: number;
  registros: number;
};

export type ResumenMes = {
  /** Primer día del mes, para ordenar y formatear. */
  mes: Date;
  registros: number;
  horasTotales: number;
  horasAcreditadas: number;
  horasPendientes: number;
};

export type ResumenEstudiante = {
  carnet: string;
  /** Nombre de la cuenta si el carnet tiene una; si no, el que trae el registro. */
  estudiante: string;
  vinculado: boolean;
  registros: number;
  horasTotales: number;
  horasAcreditadas: number;
  horasPendientes: number;
};

/** Primer día del mes al que pertenece un día de calendario, en UTC. */
export function primeroDelMes(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

/** Suma un grupo sobre un acumulado, repartiendo las horas según su estado. */
function acumular(
  destino: {
    registros: number;
    horasTotales: number;
    horasAcreditadas: number;
    horasPendientes: number;
  },
  grupo: GrupoHoras
): void {
  destino.registros += grupo.registros;
  destino.horasTotales += grupo.horas;
  if (grupo.estado === "ACREDITADA") destino.horasAcreditadas += grupo.horas;
  else destino.horasPendientes += grupo.horas;
}

/**
 * Pliega los grupos por día en meses, del más reciente al más antiguo.
 *
 * El mes se calcula en UTC porque la fecha de la actividad es un día de
 * calendario: convertirla a la zona del país correría el día y mandaría al mes
 * anterior los apoyos del primero de mes.
 */
export function plegarPorMes(grupos: (GrupoHoras & { fechaActividad: Date })[]): ResumenMes[] {
  const meses = new Map<number, ResumenMes>();

  for (const grupo of grupos) {
    const mes = primeroDelMes(grupo.fechaActividad);
    const clave = mes.getTime();

    const acumulado =
      meses.get(clave) ??
      ({
        mes,
        registros: 0,
        horasTotales: 0,
        horasAcreditadas: 0,
        horasPendientes: 0,
      } satisfies ResumenMes);

    acumular(acumulado, grupo);
    meses.set(clave, acumulado);
  }

  return [...meses.values()].sort((uno, otro) => otro.mes.getTime() - uno.mes.getTime());
}

/**
 * Pliega los grupos por carnet en estudiantes, de más horas a menos.
 *
 * Se agrupa por carnet y no por nombre: un mismo carnet puede traer el nombre
 * escrito de dos maneras en hojas de distintos años, y agruparlo por nombre lo
 * partiría en dos filas con la mitad de las horas cada una. El carnet desempata
 * los empates de horas para que el orden no cambie entre dos consultas iguales.
 */
export function plegarPorEstudiante(
  grupos: (GrupoHoras & { carnet: string })[],
  maximo: number
): ResumenEstudiante[] {
  const acumulados = new Map<string, ResumenEstudiante>();

  for (const grupo of grupos) {
    const acumulado =
      acumulados.get(grupo.carnet) ??
      ({
        carnet: grupo.carnet,
        estudiante: grupo.carnet,
        vinculado: false,
        registros: 0,
        horasTotales: 0,
        horasAcreditadas: 0,
        horasPendientes: 0,
      } satisfies ResumenEstudiante);

    acumular(acumulado, grupo);
    acumulados.set(grupo.carnet, acumulado);
  }

  return [...acumulados.values()]
    .sort(
      (uno, otro) => otro.horasTotales - uno.horasTotales || uno.carnet.localeCompare(otro.carnet)
    )
    .slice(0, Math.max(0, maximo));
}

/**
 * Pone nombre a cada fila del detalle.
 *
 * Prefiere el nombre de la cuenta, que es el verificado contra el correo
 * institucional, y recurre al del registro cuando el carnet todavía no tiene
 * cuenta. Los carnets se comparan en mayúsculas porque el registro los guarda
 * normalizados y la ficha del estudiante conserva el que se capturó.
 */
export function nombrarEstudiantes(
  detalle: ResumenEstudiante[],
  cuentas: { carnet: string; nombreCompleto: string }[],
  cargados: { carnet: string; nombreEstudiante: string }[]
): ResumenEstudiante[] {
  const porCuenta = new Map(
    cuentas.map(({ carnet, nombreCompleto }) => [carnet.toUpperCase(), nombreCompleto])
  );
  const porRegistro = new Map(
    cargados.map(({ carnet, nombreEstudiante }) => [carnet.toUpperCase(), nombreEstudiante])
  );

  return detalle.map((fila) => {
    const clave = fila.carnet.toUpperCase();
    const cuenta = porCuenta.get(clave);

    return {
      ...fila,
      estudiante: cuenta ?? porRegistro.get(clave) ?? fila.carnet,
      vinculado: cuenta !== undefined,
    };
  });
}
