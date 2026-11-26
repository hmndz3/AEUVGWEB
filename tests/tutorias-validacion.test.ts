import assert from "node:assert/strict";
import test from "node:test";

import {
  horasDeTutoria,
  ServicioValidacionTutorias,
  type PruebasDelTutor,
  type RepositorioValidacionTutorias,
  type TutoriaParaValidar,
} from "@/lib/tutorias/servicio-validacion-tutorias";

/**
 * Doble validación de una tutoría.
 *
 * Lo que se prueba es quién puede hacer qué y cuándo: una tutoría da horas
 * beca al tutor, así que las reglas son las que impiden que alguien se
 * acredite horas de una sesión que no dio, que no le corresponde o que
 * todavía no ha ocurrido.
 */

const PRUEBAS: PruebasDelTutor = {
  pruebaInicioUrl: "/api/imagenes/inicio.jpg",
  pruebaFinUrl: "/api/imagenes/fin.jpg",
};

/** El reloj se fija para que "ya pasó" no dependa del día en que se corran. */
const AHORA = () => new Date("2026-11-26T18:00:00.000Z");

function tutoria(parcial: Partial<TutoriaParaValidar> = {}): TutoriaParaValidar {
  return {
    idTutoria: 21,
    idTutor: 7,
    idEstudiante: 5,
    estado: "PROGRAMADA",
    estadoHoras: "SIN_ENVIAR",
    fechaInicio: new Date("2026-11-26T15:00:00.000Z"),
    fechaFin: new Date("2026-11-26T16:30:00.000Z"),
    pruebaEstudianteUrl: null,
    ...parcial,
  };
}

class RepositorioFalso implements RepositorioValidacionTutorias {
  respuestas: { estado: string; comentario: string | null }[] = [];
  marcasTutor: PruebasDelTutor[] = [];
  marcasEstudiante: string[] = [];
  aceptadas: number[] = [];
  rechazadas: number[] = [];

  constructor(
    private readonly opciones: {
      tutoria?: TutoriaParaValidar | null;
      idTutorDeUsuario?: number | null;
      idEstudianteDeUsuario?: number | null;
    } = {}
  ) {}

  async tutoriaPorId(): Promise<TutoriaParaValidar | null> {
    return this.opciones.tutoria === undefined ? tutoria() : this.opciones.tutoria;
  }

  async estudianteDeUsuario(): Promise<number | null> {
    return this.opciones.idEstudianteDeUsuario === undefined
      ? 5
      : this.opciones.idEstudianteDeUsuario;
  }

  async tutorDeUsuario(): Promise<number | null> {
    return this.opciones.idTutorDeUsuario === undefined ? 7 : this.opciones.idTutorDeUsuario;
  }

  async responder(
    _id: number,
    estado: "ACEPTADA" | "RECHAZADA",
    comentario: string | null
  ): Promise<boolean> {
    this.respuestas.push({ estado, comentario });
    return true;
  }

  async marcarPorTutor(_id: number, pruebas: PruebasDelTutor): Promise<boolean> {
    this.marcasTutor.push(pruebas);
    return true;
  }

  async marcarPorEstudiante(_id: number, pruebaUrl: string): Promise<boolean> {
    this.marcasEstudiante.push(pruebaUrl);
    return true;
  }

  async aceptarHoras(id: number): Promise<boolean> {
    this.aceptadas.push(id);
    return true;
  }

  async rechazarHoras(id: number): Promise<boolean> {
    this.rechazadas.push(id);
    return true;
  }
}

function servicio(repositorio: RepositorioFalso) {
  return new ServicioValidacionTutorias(repositorio, AHORA);
}

// ---------------------------------------------------------------------------
// Horas que se acreditan
// ---------------------------------------------------------------------------

test("se acredita exactamente lo que dura la tutoría", () => {
  assert.equal(
    horasDeTutoria(new Date("2026-11-26T15:00:00.000Z"), new Date("2026-11-26T16:30:00.000Z")),
    1.5
  );
  assert.equal(
    horasDeTutoria(new Date("2026-11-26T15:00:00.000Z"), new Date("2026-11-26T17:00:00.000Z")),
    2
  );
});

test("una tutoría con fechas al revés no acredita horas negativas", () => {
  assert.equal(
    horasDeTutoria(new Date("2026-11-26T17:00:00.000Z"), new Date("2026-11-26T15:00:00.000Z")),
    0
  );
});

// ---------------------------------------------------------------------------
// El tutor responde
// ---------------------------------------------------------------------------

test("el tutor acepta la tutoría que le agendaron", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await servicio(repositorio).responder(1, 21, "aceptar", null);

  assert.deepEqual(resultado, { tipo: "aplicada" });
  assert.deepEqual(repositorio.respuestas, [{ estado: "ACEPTADA", comentario: null }]);
});

test("el tutor rechaza con un motivo que el estudiante verá", async () => {
  const repositorio = new RepositorioFalso();

  await servicio(repositorio).responder(1, 21, "rechazar", "Se me cruzó un parcial.");

  assert.deepEqual(repositorio.respuestas, [
    { estado: "RECHAZADA", comentario: "Se me cruzó un parcial." },
  ]);
});

test("quien no es el tutor no puede responder, y no se le revela que existe", async () => {
  const repositorio = new RepositorioFalso({ idTutorDeUsuario: 99 });

  const resultado = await servicio(repositorio).responder(1, 21, "aceptar", null);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
  assert.equal(repositorio.respuestas.length, 0);
});

test("una tutoría ya respondida no se vuelve a responder", async () => {
  const repositorio = new RepositorioFalso({ tutoria: tutoria({ estado: "ACEPTADA" }) });

  const resultado = await servicio(repositorio).responder(1, 21, "rechazar", null);

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.respuestas.length, 0);
});

// ---------------------------------------------------------------------------
// El tutor marca como dada
// ---------------------------------------------------------------------------

test("el tutor marca como dada con sus dos pruebas", async () => {
  const repositorio = new RepositorioFalso({ tutoria: tutoria({ estado: "ACEPTADA" }) });

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.deepEqual(resultado, { tipo: "aplicada" });
  assert.deepEqual(repositorio.marcasTutor, [PRUEBAS]);
});

test("no se puede marcar una tutoría que el tutor todavía no aceptó", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.equal(resultado.tipo, "no_permitida");
  assert.match(
    resultado.tipo === "no_permitida" ? resultado.mensaje : "",
    /Acepta la tutoría antes/
  );
  assert.equal(repositorio.marcasTutor.length, 0);
});

test("una prueba del inicio no vale antes de que la tutoría empiece", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({
      estado: "ACEPTADA",
      fechaInicio: new Date("2026-11-27T15:00:00.000Z"),
      fechaFin: new Date("2026-11-27T16:30:00.000Z"),
    }),
  });

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.marcasTutor.length, 0);
});

test("las pruebas no se mandan dos veces mientras AEUVG no revise", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "PENDIENTE" }),
  });

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.marcasTutor.length, 0);
});

test("tras un rechazo el tutor puede volver a subir sus pruebas", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "RECHAZADAS" }),
  });

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.deepEqual(resultado, { tipo: "aplicada" });
});

test("el estudiante no puede marcar la tutoría como dada por el tutor", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA" }),
    idTutorDeUsuario: null,
  });

  const resultado = await servicio(repositorio).marcarComoDada(1, 21, PRUEBAS);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

// ---------------------------------------------------------------------------
// El estudiante confirma
// ---------------------------------------------------------------------------

test("el estudiante confirma con su foto", async () => {
  const repositorio = new RepositorioFalso({ tutoria: tutoria({ estado: "ACEPTADA" }) });

  const resultado = await servicio(repositorio).confirmarComoEstudiante(
    1,
    21,
    "/api/imagenes/foto.jpg"
  );

  assert.deepEqual(resultado, { tipo: "aplicada" });
  assert.deepEqual(repositorio.marcasEstudiante, ["/api/imagenes/foto.jpg"]);
});

test("el estudiante puede confirmar aunque el tutor no haya subido sus pruebas", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "SIN_ENVIAR" }),
  });

  const resultado = await servicio(repositorio).confirmarComoEstudiante(
    1,
    21,
    "/api/imagenes/f.jpg"
  );

  assert.deepEqual(resultado, { tipo: "aplicada" });
});

test("el estudiante no confirma dos veces", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", pruebaEstudianteUrl: "/api/imagenes/ya.jpg" }),
  });

  const resultado = await servicio(repositorio).confirmarComoEstudiante(
    1,
    21,
    "/api/imagenes/f.jpg"
  );

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.marcasEstudiante.length, 0);
});

test("otro estudiante no puede confirmar una tutoría ajena", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA" }),
    idEstudianteDeUsuario: 88,
  });

  const resultado = await servicio(repositorio).confirmarComoEstudiante(
    1,
    21,
    "/api/imagenes/f.jpg"
  );

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

// ---------------------------------------------------------------------------
// AEUVG revisa las horas
// ---------------------------------------------------------------------------

test("AEUVG acepta las horas de una tutoría con sus pruebas enviadas", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "PENDIENTE" }),
  });

  const resultado = await servicio(repositorio).revisarHoras(3, 21, "aceptar", null);

  assert.deepEqual(resultado, { tipo: "aplicada" });
  assert.deepEqual(repositorio.aceptadas, [21]);
});

test("se pueden aceptar aunque falte la confirmación del estudiante", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "PENDIENTE", pruebaEstudianteUrl: null }),
  });

  const resultado = await servicio(repositorio).revisarHoras(3, 21, "aceptar", null);

  assert.deepEqual(resultado, { tipo: "aplicada" });
});

test("no se revisan horas que el tutor nunca envió", async () => {
  const repositorio = new RepositorioFalso({ tutoria: tutoria({ estado: "ACEPTADA" }) });

  const resultado = await servicio(repositorio).revisarHoras(3, 21, "aceptar", null);

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.aceptadas.length, 0);
});

test("unas horas ya aceptadas no se aceptan otra vez", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "COMPLETADA", estadoHoras: "ACEPTADAS" }),
  });

  const resultado = await servicio(repositorio).revisarHoras(3, 21, "aceptar", null);

  assert.equal(resultado.tipo, "no_permitida");
  assert.equal(repositorio.aceptadas.length, 0);
});

test("rechazar las horas no crea ningún registro", async () => {
  const repositorio = new RepositorioFalso({
    tutoria: tutoria({ estado: "ACEPTADA", estadoHoras: "PENDIENTE" }),
  });

  await servicio(repositorio).revisarHoras(3, 21, "rechazar", "Las fotos no se ven.");

  assert.deepEqual(repositorio.rechazadas, [21]);
  assert.equal(repositorio.aceptadas.length, 0);
});

test("una tutoría que no existe responde como no encontrada", async () => {
  const repositorio = new RepositorioFalso({ tutoria: null });

  assert.deepEqual(await servicio(repositorio).responder(1, 21, "aceptar", null), {
    tipo: "no_encontrada",
  });
  assert.deepEqual(await servicio(repositorio).revisarHoras(3, 21, "aceptar", null), {
    tipo: "no_encontrada",
  });
});
