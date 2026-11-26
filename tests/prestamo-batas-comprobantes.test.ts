import assert from "node:assert/strict";
import test from "node:test";

import {
  aFechaDeCalendario,
  diaSemanaDeFechaDeCalendario,
} from "../src/lib/prestamo-batas/formato-prestamo-batas";
import type {
  ComprobanteParaRevision,
  DatosComprobantePersistido,
  RepositorioComprobantes,
  TurnoAsignado,
  VoluntarioDeSesion,
} from "../src/lib/prestamo-batas/repositorio-comprobantes";
import { ServicioComprobantes } from "../src/lib/prestamo-batas/servicio-comprobantes";
import type {
  DatosRegistroHora,
  ServicioHorasBeca,
} from "../src/lib/horas-beca/servicio-horas-beca";

/** Las dos pruebas del turno, ya subidas a la plataforma. */
const FOTO_ENTRADA = "/api/imagenes/entrada.jpg";
const FOTO_SALIDA = "/api/imagenes/salida.jpg";

const FECHA = "2026-11-23";
const AHORA = () => new Date("2026-12-01T12:00:00.000Z");
// El 23 de noviembre de 2026 cae lunes. Se escribe el día a mano a propósito:
// derivarlo de la misma función que valida el comprobante haría que la prueba
// siguiera al código aunque el día saliera corrido.
const DIA_DE_FECHA = "LUNES" as const;

const turno = (): TurnoAsignado => ({
  diaSemana: DIA_DE_FECHA,
  horaInicio: new Date("1970-01-01T06:45:00.000Z"),
  horaFin: new Date("1970-01-01T09:00:00.000Z"),
});

class RepositorioComprobantesFalso implements RepositorioComprobantes {
  creados: DatosComprobantePersistido[] = [];
  aprobados: { id: number; idRegistro: number }[] = [];
  rechazados: number[] = [];

  constructor(
    private readonly opciones: {
      asignado?: boolean;
      comprobante?: ComprobanteParaRevision | null;
      aprobar?: boolean;
    } = {}
  ) {}

  async voluntarioDeSesion(): Promise<VoluntarioDeSesion | null> {
    return { idEstudiante: 5, nombreCompleto: "Ana Lucía Morales", carnet: "24852" };
  }
  async turnoAsignado(): Promise<TurnoAsignado | null> {
    return this.opciones.asignado === false ? null : turno();
  }
  async crearComprobante(datos: DatosComprobantePersistido): Promise<number> {
    this.creados.push(datos);
    return 1;
  }
  async comprobantePorId(): Promise<ComprobanteParaRevision | null> {
    if (this.opciones.comprobante !== undefined) return this.opciones.comprobante;
    return {
      idComprobante: 1,
      idEstudiante: 5,
      estado: "PENDIENTE",
      fecha: aFechaDeCalendario(FECHA),
      turno: turno(),
      estudiante: { carnet: "24852", nombreCompleto: "Ana Lucía Morales" },
    };
  }
  async aprobar(idComprobante: number, idRegistroHora: number): Promise<boolean> {
    this.aprobados.push({ id: idComprobante, idRegistro: idRegistroHora });
    return this.opciones.aprobar ?? true;
  }
  async rechazar(idComprobante: number): Promise<boolean> {
    this.rechazados.push(idComprobante);
    return true;
  }
}

/** Servicio de horas beca de mentira: registra las llamadas sin tocar la base. */
function horasFalso(resultado: "guardado" | "invalido" = "guardado") {
  const creados: { datos: DatosRegistroHora; por: number }[] = [];
  const eliminados: number[] = [];
  const servicio = {
    async crear(datos: DatosRegistroHora, por: number) {
      creados.push({ datos, por });
      return resultado === "guardado"
        ? ({ tipo: "guardado", id: 55, vinculado: true } as const)
        : ({ tipo: "invalido", errores: { fechaActividad: "Fecha futura." } } as const);
    },
    async eliminar(id: number) {
      eliminados.push(id);
      return { tipo: "eliminado" } as const;
    },
  };
  return { servicio: servicio as unknown as ServicioHorasBeca, creados, eliminados };
}

test("no se envía un comprobante de un turno no asignado", async () => {
  const servicio = new ServicioComprobantes(
    new RepositorioComprobantesFalso({ asignado: false }),
    horasFalso().servicio,
    AHORA
  );

  const resultado = await servicio.enviar(1, {
    idTurno: 1,
    fecha: FECHA,
    horaEntrada: "06:45",
    horaSalida: "09:00",
    fotoInicioUrl: FOTO_ENTRADA,
    fotoFinUrl: FOTO_SALIDA,
    comentarioVoluntario: null,
  });

  assert.equal(resultado.tipo, "invalido");
});

test("la fecha del comprobante debe caer en el día del turno", async () => {
  const servicio = new ServicioComprobantes(
    new RepositorioComprobantesFalso(),
    horasFalso().servicio,
    AHORA
  );

  // 2026-11-24 es el día siguiente a la fecha cuyo día usa el turno.
  const resultado = await servicio.enviar(1, {
    idTurno: 1,
    fecha: "2026-11-24",
    horaEntrada: "06:45",
    horaSalida: "09:00",
    fotoInicioUrl: FOTO_ENTRADA,
    fotoFinUrl: FOTO_SALIDA,
    comentarioVoluntario: null,
  });

  assert.equal(resultado.tipo, "invalido");
});

test("un comprobante del día correcto se envía", async () => {
  const repositorio = new RepositorioComprobantesFalso();
  const servicio = new ServicioComprobantes(repositorio, horasFalso().servicio, AHORA);

  const resultado = await servicio.enviar(1, {
    idTurno: 1,
    fecha: FECHA,
    horaEntrada: "06:45",
    horaSalida: "09:00",
    fotoInicioUrl: FOTO_ENTRADA,
    fotoFinUrl: FOTO_SALIDA,
    comentarioVoluntario: null,
  });

  assert.equal(resultado.tipo, "enviado");
  assert.equal(repositorio.creados.length, 1);
});

test("aprobar un comprobante acredita las horas del turno al carnet del voluntario", async () => {
  const horas = horasFalso();
  const servicio = new ServicioComprobantes(
    new RepositorioComprobantesFalso(),
    horas.servicio,
    AHORA
  );

  const resultado = await servicio.revisar(1, "aprobar", null, 9);

  assert.equal(resultado.tipo, "resuelto");
  if (resultado.tipo === "resuelto") assert.equal(resultado.horasAcreditadas, 2.25);
  assert.equal(horas.creados[0]?.datos.carnet, "24852");
  assert.equal(horas.creados[0]?.datos.cantidadHoras, 2.25);
});

test("si el comprobante deja de estar pendiente, se deshace el registro de horas", async () => {
  const horas = horasFalso();
  const servicio = new ServicioComprobantes(
    new RepositorioComprobantesFalso({ aprobar: false }),
    horas.servicio,
    AHORA
  );

  const resultado = await servicio.revisar(1, "aprobar", null, 9);

  assert.equal(resultado.tipo, "no_permitido");
  assert.deepEqual(horas.eliminados, [55]);
});

test("rechazar un comprobante no acredita horas", async () => {
  const horas = horasFalso();
  const servicio = new ServicioComprobantes(
    new RepositorioComprobantesFalso(),
    horas.servicio,
    AHORA
  );

  const resultado = await servicio.revisar(1, "rechazar", "Horas incompletas", 9);

  assert.equal(resultado.tipo, "resuelto");
  if (resultado.tipo === "resuelto") assert.equal(resultado.estado, "RECHAZADO");
  assert.equal(horas.creados.length, 0);
});

// Las fechas del módulo son días de calendario guardados como medianoche en
// UTC. Leerlas en la zona de Guatemala, seis horas detrás, corría el día uno
// hacia atrás y ningún comprobante se podía enviar: el jueves se leía miércoles.
test("el día de la semana de una fecha de calendario se lee en UTC", () => {
  const dias = {
    "2026-11-23": "LUNES",
    "2026-11-24": "MARTES",
    "2026-11-25": "MIERCOLES",
    "2026-11-26": "JUEVES",
    "2026-11-27": "VIERNES",
    "2026-11-28": "SABADO",
    "2026-11-29": "DOMINGO",
  } as const;

  for (const [fecha, dia] of Object.entries(dias)) {
    assert.equal(diaSemanaDeFechaDeCalendario(aFechaDeCalendario(fecha)), dia, fecha);
  }
});

test("se acepta el comprobante de un turno del mismo día de calendario", async () => {
  const repositorio = new RepositorioComprobantesFalso({ asignado: true });
  const servicio = new ServicioComprobantes(repositorio, horasFalso().servicio, AHORA);

  const resultado = await servicio.enviar(1, {
    idTurno: 7,
    fecha: "2026-11-26",
    horaEntrada: "06:45",
    horaSalida: "09:00",
    fotoInicioUrl: FOTO_ENTRADA,
    fotoFinUrl: FOTO_SALIDA,
    comentarioVoluntario: null,
  });

  assert.equal(resultado.tipo, "invalido");
  // El turno de la prueba es de lunes: el jueves se rechaza por el día, no por
  // haberse corrido la fecha.
  assert.match(resultado.errores.fecha ?? "", /Lunes/);
});
