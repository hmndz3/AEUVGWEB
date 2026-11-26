import assert from "node:assert/strict";
import test from "node:test";

import {
  franjaDelRango,
  franjaQueCubre,
  franjasDelDia,
  instanteEnGuatemala,
  modalidadCompatible,
  numeroDeDiaDeIso,
  seTraslapan,
  type FranjaDisponible,
} from "../src/lib/tutorias/agenda-tutorias";
import { diaSemanaDe } from "../src/lib/tutorias/formato-tutorias";
import type { RepositorioFichaTutor } from "../src/lib/tutorias/repositorio-ficha-tutor";
import { ServicioFichaTutor, MAXIMO_FRANJAS } from "../src/lib/tutorias/servicio-ficha-tutor";
import {
  ServicioAgenda,
  type DatosNuevaTutoria,
  type RepositorioAgenda,
  type TutoriaOcupada,
  type TutoriaParaResolver,
  type TutorParaAgenda,
} from "../src/lib/tutorias/servicio-agenda";
import { esquemaDisponibilidad, esquemaSolicitudTutoria } from "../src/validators/tutoria";

/** Un jueves cualquiera, para que las franjas de prueba coincidan. */
const JUEVES = "2026-11-19";

const franja = (cambios: Partial<FranjaDisponible> = {}): FranjaDisponible => ({
  diaSemana: "JUEVES",
  horaInicio: "14:00",
  horaFin: "18:00",
  modalidad: "AMBAS",
  ubicacionEnlace: "Biblioteca, segundo nivel",
  ...cambios,
});

const SOLICITUD = {
  idTutor: 7,
  idCurso: 3,
  fecha: JUEVES,
  horaInicio: "15:00",
  horaFin: "16:00",
  modalidad: "PRESENCIAL" as const,
  observaciones: null,
};

class RepositorioAgendaFalso implements RepositorioAgenda {
  creadas: DatosNuevaTutoria[] = [];
  estados: { idTutoria: number; estado: string }[] = [];

  constructor(
    private readonly opciones: {
      idEstudiante?: number | null;
      idTutorDeUsuario?: number | null;
      tutor?: TutorParaAgenda | null;
      ocupadas?: TutoriaOcupada[];
      tutoria?: TutoriaParaResolver | null;
      estadoTutoria?: string;
    } = {}
  ) {}

  async estudianteDeUsuario(): Promise<number | null> {
    return this.opciones.idEstudiante === undefined ? 5 : this.opciones.idEstudiante;
  }

  async tutorDeUsuario(): Promise<number | null> {
    return this.opciones.idTutorDeUsuario ?? null;
  }

  async tutorParaAgenda(): Promise<TutorParaAgenda | null> {
    if (this.opciones.tutor !== undefined) return this.opciones.tutor;

    return {
      idTutor: 7,
      idEstudiante: 9,
      estado: "ACTIVO",
      cursos: [3, 4],
      franjas: [franja()],
    };
  }

  async tutoriasProgramadasDe(): Promise<TutoriaOcupada[]> {
    return this.opciones.ocupadas ?? [];
  }

  async crearTutoria(datos: DatosNuevaTutoria): Promise<number> {
    this.creadas.push(datos);
    return 21;
  }

  async tutoriaPorId(): Promise<TutoriaParaResolver | null> {
    return this.opciones.tutoria === undefined
      ? {
          idTutoria: 21,
          idTutor: 7,
          idEstudiante: 5,
          estado: this.opciones.estadoTutoria ?? "PROGRAMADA",
        }
      : this.opciones.tutoria;
  }

  async cancelarTutoria(idTutoria: number): Promise<boolean> {
    this.estados.push({ idTutoria, estado: "CANCELADA" });
    return true;
  }
}

/** El reloj se fija para que "ya pasó" no dependa del día en que se corran las pruebas. */
const antes = () => new Date("2026-11-10T12:00:00.000Z");

// ---------- Horas y días ----------

test("un día y una hora del país se convierten en el instante correcto", () => {
  // Las 14:00 de Guatemala son las 20:00 UTC: sin el desplazamiento, la tutoría
  // se guardaría seis horas antes de lo que nadie acordó.
  assert.equal(
    instanteEnGuatemala("2026-11-19", "14:00").toISOString(),
    "2026-11-19T20:00:00.000Z"
  );
  assert.equal(
    instanteEnGuatemala("2026-11-19", "00:00").toISOString(),
    "2026-11-19T06:00:00.000Z"
  );
});

test("el día de la semana se calcula en la zona del país", () => {
  assert.equal(diaSemanaDe(instanteEnGuatemala("2026-11-19", "14:00")), "JUEVES");
  // Las 23:00 del jueves en Guatemala son las 05:00 del viernes en UTC.
  assert.equal(diaSemanaDe(instanteEnGuatemala("2026-11-19", "23:00")), "JUEVES");
});

test("la franja tiene que contener el rango completo, no solo tocarlo", () => {
  const fecha = instanteEnGuatemala(JUEVES, "15:00");
  const franjas = [franja()];

  assert.ok(franjaQueCubre(franjas, fecha, "15:00", "16:00"));
  assert.ok(franjaQueCubre(franjas, fecha, "14:00", "18:00"));
  assert.equal(franjaQueCubre(franjas, fecha, "13:00", "15:00"), null);
  assert.equal(franjaQueCubre(franjas, fecha, "17:00", "19:00"), null);
});

test("una franja de otro día no cubre la fecha pedida", () => {
  const fecha = instanteEnGuatemala(JUEVES, "15:00");

  assert.equal(franjaQueCubre([franja({ diaSemana: "LUNES" })], fecha, "15:00", "16:00"), null);
});

test("la modalidad pedida tiene que caber en la que ofrece la franja", () => {
  assert.equal(modalidadCompatible("AMBAS", "PRESENCIAL"), true);
  assert.equal(modalidadCompatible("AMBAS", "VIRTUAL"), true);
  assert.equal(modalidadCompatible("PRESENCIAL", "PRESENCIAL"), true);
  assert.equal(modalidadCompatible("PRESENCIAL", "VIRTUAL"), false);
  // Pedir "ambas" no significa nada: hay que presentarse de una forma o de otra.
  assert.equal(modalidadCompatible("AMBAS", "AMBAS"), false);
});

test("dos tutorías chocan si una empieza antes de que la otra termine", () => {
  const rango = (desde: string, hasta: string) => ({
    inicio: instanteEnGuatemala(JUEVES, desde),
    fin: instanteEnGuatemala(JUEVES, hasta),
  });

  assert.equal(seTraslapan(rango("14:00", "15:00"), rango("14:30", "15:30")), true);
  // Pegadas no es lo mismo que encimadas: una acaba justo cuando la otra empieza.
  assert.equal(seTraslapan(rango("14:00", "15:00"), rango("15:00", "16:00")), false);
  assert.equal(seTraslapan(rango("14:00", "15:00"), rango("16:00", "17:00")), false);
});

// ---------- Solicitud ----------

test("una solicitud dentro de la franja queda agendada con el lugar del tutor", async () => {
  const repositorio = new RepositorioAgendaFalso();
  const datos = esquemaSolicitudTutoria.parse(SOLICITUD);

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(1, datos);

  assert.deepEqual(resultado, { tipo: "solicitada", idTutoria: 21 });
  assert.equal(repositorio.creadas.length, 1);
  assert.equal(repositorio.creadas[0].idEstudiante, 5);
  // El lugar sale de la franja, no del cuerpo de la petición.
  assert.equal(repositorio.creadas[0].ubicacionEnlace, "Biblioteca, segundo nivel");
  assert.equal(repositorio.creadas[0].fechaInicio.toISOString(), "2026-11-19T21:00:00.000Z");
});

test("un horario fuera de la disponibilidad se rechaza", async () => {
  const repositorio = new RepositorioAgendaFalso();
  const datos = esquemaSolicitudTutoria.parse({
    ...SOLICITUD,
    horaInicio: "19:00",
    horaFin: "20:00",
  });

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(1, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("un curso que el tutor no imparte se rechaza", async () => {
  const repositorio = new RepositorioAgendaFalso();
  const datos = esquemaSolicitudTutoria.parse({ ...SOLICITUD, idCurso: 99 });

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(1, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("una fecha que ya pasó se rechaza", async () => {
  const repositorio = new RepositorioAgendaFalso();
  const datos = esquemaSolicitudTutoria.parse(SOLICITUD);

  const despues = () => new Date("2026-11-30T12:00:00.000Z");
  const resultado = await new ServicioAgenda(repositorio, despues).solicitar(1, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("una hora ya ocupada por otra tutoría se rechaza", async () => {
  const repositorio = new RepositorioAgendaFalso({
    ocupadas: [
      {
        inicio: instanteEnGuatemala(JUEVES, "15:30"),
        fin: instanteEnGuatemala(JUEVES, "16:30"),
      },
    ],
  });
  const datos = esquemaSolicitudTutoria.parse(SOLICITUD);

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(1, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("un tutor que ya no está activo no admite solicitudes", async () => {
  const repositorio = new RepositorioAgendaFalso({
    tutor: {
      idTutor: 7,
      idEstudiante: 9,
      estado: "SUSPENDIDO",
      cursos: [3],
      franjas: [franja()],
    },
  });

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(
    1,
    esquemaSolicitudTutoria.parse(SOLICITUD)
  );

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("nadie se agenda una tutoría consigo mismo", async () => {
  const repositorio = new RepositorioAgendaFalso({
    tutor: { idTutor: 7, idEstudiante: 5, estado: "ACTIVO", cursos: [3], franjas: [franja()] },
  });

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(
    1,
    esquemaSolicitudTutoria.parse(SOLICITUD)
  );

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("una modalidad que el tutor no ofrece en esa franja se rechaza", async () => {
  const repositorio = new RepositorioAgendaFalso({
    tutor: {
      idTutor: 7,
      idEstudiante: 9,
      estado: "ACTIVO",
      cursos: [3],
      franjas: [franja({ modalidad: "VIRTUAL" })],
    },
  });

  const resultado = await new ServicioAgenda(repositorio, antes).solicitar(
    1,
    esquemaSolicitudTutoria.parse(SOLICITUD)
  );

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

// ---------- Cancelar ----------

test("el estudiante dueño puede cancelar su tutoría", async () => {
  const repositorio = new RepositorioAgendaFalso();

  const resultado = await new ServicioAgenda(repositorio, antes).resolver(1, 21);

  assert.deepEqual(resultado, { tipo: "aplicada", estado: "CANCELADA" });
  assert.deepEqual(repositorio.estados, [{ idTutoria: 21, estado: "CANCELADA" }]);
});

test("el tutor también puede cancelarla", async () => {
  const delTutor = new RepositorioAgendaFalso({ idEstudiante: 9, idTutorDeUsuario: 7 });

  const resultado = await new ServicioAgenda(delTutor, antes).resolver(1, 21);

  assert.deepEqual(resultado, { tipo: "aplicada", estado: "CANCELADA" });
});

test("una tutoría ya aceptada todavía se puede cancelar", async () => {
  const repositorio = new RepositorioAgendaFalso({ estadoTutoria: "ACEPTADA" });

  const resultado = await new ServicioAgenda(repositorio, antes).resolver(1, 21);

  assert.deepEqual(resultado, { tipo: "aplicada", estado: "CANCELADA" });
});

test("una tutoría ajena responde como no encontrada", async () => {
  const repositorio = new RepositorioAgendaFalso({ idEstudiante: 77, idTutorDeUsuario: null });

  const resultado = await new ServicioAgenda(repositorio, antes).resolver(1, 21);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
  assert.equal(repositorio.estados.length, 0);
});

test("una tutoría ya resuelta no se vuelve a tocar", async () => {
  for (const estado of ["COMPLETADA", "CANCELADA"] as const) {
    const repositorio = new RepositorioAgendaFalso({
      tutoria: { idTutoria: 21, idTutor: 7, idEstudiante: 5, estado },
    });

    const resultado = await new ServicioAgenda(repositorio, antes).resolver(1, 21);

    assert.equal(resultado.tipo, "no_permitida");
    assert.equal(repositorio.estados.length, 0);
  }
});

// ---------- Disponibilidad ----------

class RepositorioFichaFalso implements RepositorioFichaTutor {
  agregadas: unknown[] = [];
  quitadas: number[] = [];

  constructor(
    private readonly opciones: {
      idTutor?: number | null;
      franjas?: {
        idDisponibilidad: number;
        diaSemana: string;
        horaInicio: string;
        horaFin: string;
      }[];
    } = {}
  ) {}

  async tutorDeUsuario(): Promise<number | null> {
    return this.opciones.idTutor === undefined ? 7 : this.opciones.idTutor;
  }

  async actualizarFicha(): Promise<boolean> {
    return true;
  }

  async franjasDe() {
    return this.opciones.franjas ?? [];
  }

  async agregarFranja(_idTutor: number, datos: unknown): Promise<number> {
    this.agregadas.push(datos);
    return 31;
  }

  async quitarFranja(_idTutor: number, idDisponibilidad: number): Promise<boolean> {
    this.quitadas.push(idDisponibilidad);
    return true;
  }
}

test("la franja exige un lugar o un enlace y un horario correcto", () => {
  const base = {
    diaSemana: "JUEVES",
    horaInicio: "14:00",
    horaFin: "16:00",
    modalidad: "PRESENCIAL",
    ubicacionEnlace: "Biblioteca",
  };

  assert.equal(esquemaDisponibilidad.safeParse(base).success, true);
  assert.equal(esquemaDisponibilidad.safeParse({ ...base, ubicacionEnlace: "" }).success, false);
  assert.equal(
    esquemaDisponibilidad.safeParse({ ...base, horaInicio: "16:00", horaFin: "14:00" }).success,
    false
  );
  assert.equal(esquemaDisponibilidad.safeParse({ ...base, diaSemana: "FERIADO" }).success, false);
});

test("una franja que se encima con otra del mismo día se rechaza", async () => {
  const repositorio = new RepositorioFichaFalso({
    franjas: [{ idDisponibilidad: 1, diaSemana: "JUEVES", horaInicio: "14:00", horaFin: "16:00" }],
  });
  const datos = esquemaDisponibilidad.parse({
    diaSemana: "JUEVES",
    horaInicio: "15:00",
    horaFin: "17:00",
    modalidad: "VIRTUAL",
    ubicacionEnlace: "https://ejemplo.test/sala",
  });

  const resultado = await new ServicioFichaTutor(repositorio).agregarFranja(1, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.agregadas.length, 0);
});

test("una franja del mismo día que no se encima se admite", async () => {
  const repositorio = new RepositorioFichaFalso({
    franjas: [{ idDisponibilidad: 1, diaSemana: "JUEVES", horaInicio: "14:00", horaFin: "16:00" }],
  });
  const datos = esquemaDisponibilidad.parse({
    diaSemana: "JUEVES",
    horaInicio: "16:00",
    horaFin: "18:00",
    modalidad: "VIRTUAL",
    ubicacionEnlace: "https://ejemplo.test/sala",
  });

  const resultado = await new ServicioFichaTutor(repositorio).agregarFranja(1, datos);

  assert.equal(resultado.tipo, "agregada");
  assert.equal(repositorio.agregadas.length, 1);
});

test("no se admiten más franjas que el máximo", async () => {
  const franjas = Array.from({ length: MAXIMO_FRANJAS }, (_, i) => ({
    idDisponibilidad: i + 1,
    diaSemana: "LUNES",
    horaInicio: "06:00",
    horaFin: "06:30",
  }));
  const repositorio = new RepositorioFichaFalso({ franjas });

  const resultado = await new ServicioFichaTutor(repositorio).agregarFranja(
    1,
    esquemaDisponibilidad.parse({
      diaSemana: "JUEVES",
      horaInicio: "14:00",
      horaFin: "16:00",
      modalidad: "VIRTUAL",
      ubicacionEnlace: "https://ejemplo.test/sala",
    })
  );

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.agregadas.length, 0);
});

test("quien no es tutor no toca ninguna franja", async () => {
  const repositorio = new RepositorioFichaFalso({ idTutor: null });

  const agregada = await new ServicioFichaTutor(repositorio).agregarFranja(
    1,
    esquemaDisponibilidad.parse({
      diaSemana: "JUEVES",
      horaInicio: "14:00",
      horaFin: "16:00",
      modalidad: "VIRTUAL",
      ubicacionEnlace: "https://ejemplo.test/sala",
    })
  );
  const quitada = await new ServicioFichaTutor(repositorio).quitarFranja(1, 1);

  assert.equal(agregada.tipo, "no_es_tutor");
  assert.equal(quitada.tipo, "no_es_tutor");
  assert.equal(repositorio.agregadas.length, 0);
  assert.equal(repositorio.quitadas.length, 0);
});

/*
 * Lo que usa el formulario de solicitud para acotar el calendario y el reloj.
 * Trabaja sobre el día de calendario que eligió el estudiante, sin pasarlo a
 * instante: es lo que permitió quitar del formulario el selector de franja,
 * que solo repetía el horario que la ficha del tutor ya muestra.
 */

test("el día de la semana sale de la fecha y no de la zona del navegador", () => {
  // JUEVES es "2026-11-19"; 4 es jueves en la convención de JavaScript.
  assert.equal(numeroDeDiaDeIso(JUEVES), 4);
  assert.equal(numeroDeDiaDeIso("2026-11-22"), 0);
});

test("una fecha mal escrita o imposible no devuelve día", () => {
  for (const iso of ["", "19-11-2026", "2026-11", "2026-02-31", "2026-13-01"]) {
    assert.equal(numeroDeDiaDeIso(iso), null, `${iso} no debería tener día`);
  }
});

test("del día elegido solo se toman las franjas de ese día", () => {
  const franjas = [
    franja({ horaInicio: "08:00", horaFin: "10:00" }),
    franja({ diaSemana: "LUNES" }),
    franja({ horaInicio: "14:00", horaFin: "18:00" }),
  ];

  const delJueves = franjasDelDia(franjas, JUEVES);

  assert.equal(delJueves.length, 2);
  assert.deepEqual(
    delJueves.map((opcion) => opcion.horaInicio),
    ["08:00", "14:00"]
  );
});

test("el rango pedido se agenda en la franja que lo contiene entero", () => {
  const franjas = [
    franja({ horaInicio: "08:00", horaFin: "10:00", modalidad: "VIRTUAL" }),
    franja({ horaInicio: "14:00", horaFin: "18:00", modalidad: "PRESENCIAL" }),
  ];

  assert.equal(franjaDelRango(franjas, JUEVES, "15:00", "16:00")?.modalidad, "PRESENCIAL");
  assert.equal(franjaDelRango(franjas, JUEVES, "08:30", "09:00")?.modalidad, "VIRTUAL");
});

test("un rango en el hueco entre dos franjas no se agenda", () => {
  // Es el caso que el formulario marca en rojo: el reloj ofrece de 08:00 a
  // 18:00 porque son los extremos del día, pero de 10:00 a 14:00 no atiende.
  const franjas = [
    franja({ horaInicio: "08:00", horaFin: "10:00" }),
    franja({ horaInicio: "14:00", horaFin: "18:00" }),
  ];

  assert.equal(franjaDelRango(franjas, JUEVES, "11:00", "12:00"), null);
  // Tampoco si se pasa del final de una franja hacia el hueco.
  assert.equal(franjaDelRango(franjas, JUEVES, "09:00", "15:00"), null);
});

test("sin horas, con horas al revés o en otro día no hay franja", () => {
  const franjas = [franja()];

  assert.equal(franjaDelRango(franjas, JUEVES, "", ""), null);
  assert.equal(franjaDelRango(franjas, JUEVES, "16:00", "15:00"), null);
  assert.equal(franjaDelRango(franjas, JUEVES, "15:00", "15:00"), null);
  // 2026-11-20 es viernes y el tutor solo atiende los jueves.
  assert.equal(franjaDelRango(franjas, "2026-11-20", "15:00", "16:00"), null);
});
