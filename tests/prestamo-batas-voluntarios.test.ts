import assert from "node:assert/strict";
import test from "node:test";

import type {
  DatosNuevaPostulacion,
  EstudianteDeSesion,
  InfoTurno,
  PostulacionResumida,
  RepositorioVoluntarios,
  ResultadoAsignacion,
} from "../src/lib/prestamo-batas/repositorio-voluntarios";
import { ServicioVoluntarios } from "../src/lib/prestamo-batas/servicio-voluntarios";

type Opciones = {
  estudiante?: EstudianteDeSesion | null;
  pendiente?: boolean;
  turnos?: InfoTurno[];
  asignados?: number[];
  postulacion?: PostulacionResumida | null;
  asignacion?: ResultadoAsignacion;
};

class RepositorioVoluntariosFalso implements RepositorioVoluntarios {
  creadas: DatosNuevaPostulacion[] = [];
  rechazadas: number[] = [];
  aprobadas: { idPostulacion: number; idsTurnos: readonly number[] }[] = [];

  constructor(private readonly opciones: Opciones = {}) {}

  async estudianteDeUsuario(): Promise<EstudianteDeSesion | null> {
    return this.opciones.estudiante === undefined
      ? { idEstudiante: 5, nombreCompleto: "Ana Lucía Morales" }
      : this.opciones.estudiante;
  }
  async tienePostulacionPendiente(): Promise<boolean> {
    return this.opciones.pendiente ?? false;
  }
  async infoTurnos(ids: readonly number[]): Promise<InfoTurno[]> {
    const todos = this.opciones.turnos ?? [
      { idTurno: 1, activo: true, cupo: 2, asignadosActivos: 0 },
      { idTurno: 2, activo: true, cupo: 2, asignadosActivos: 0 },
    ];
    return todos.filter((turno) => ids.includes(turno.idTurno));
  }
  async turnosAsignadosActivosDe(): Promise<number[]> {
    return this.opciones.asignados ?? [];
  }
  async crearPostulacion(datos: DatosNuevaPostulacion): Promise<number> {
    this.creadas.push(datos);
    return 10;
  }
  async postulacionPorId(): Promise<PostulacionResumida | null> {
    return this.opciones.postulacion === undefined
      ? { idPostulacion: 10, idEstudiante: 5, estado: "PENDIENTE", idsTurnos: [1, 2] }
      : this.opciones.postulacion;
  }
  async aprobarPostulacion(
    idPostulacion: number,
    _idEstudiante: number,
    idsTurnos: readonly number[]
  ): Promise<ResultadoAsignacion> {
    this.aprobadas.push({ idPostulacion, idsTurnos });
    return this.opciones.asignacion ?? { asignados: [...idsTurnos], llenos: [] };
  }
  async rechazarPostulacion(idPostulacion: number): Promise<boolean> {
    this.rechazadas.push(idPostulacion);
    return true;
  }
  async desasignar(): Promise<boolean> {
    return true;
  }
}

test("no se postula quien ya tiene una postulación pendiente", async () => {
  const servicio = new ServicioVoluntarios(new RepositorioVoluntariosFalso({ pendiente: true }));

  const resultado = await servicio.postular(1, { idsTurnos: [1], comentarioSolicitante: null });

  assert.equal(resultado.tipo, "invalida");
});

test("no se postula a un turno lleno", async () => {
  const repositorio = new RepositorioVoluntariosFalso({
    turnos: [{ idTurno: 1, activo: true, cupo: 2, asignadosActivos: 2 }],
  });
  const servicio = new ServicioVoluntarios(repositorio);

  const resultado = await servicio.postular(1, { idsTurnos: [1], comentarioSolicitante: null });

  assert.equal(resultado.tipo, "invalida");
  if (resultado.tipo === "invalida") assert.match(resultado.errores.idsTurnos ?? "", /voluntarios/);
});

test("no se postula a un turno al que ya se está asignado", async () => {
  const servicio = new ServicioVoluntarios(new RepositorioVoluntariosFalso({ asignados: [1] }));

  const resultado = await servicio.postular(1, { idsTurnos: [1], comentarioSolicitante: null });

  assert.equal(resultado.tipo, "invalida");
});

test("una postulación válida se guarda con sus turnos", async () => {
  const repositorio = new RepositorioVoluntariosFalso();
  const servicio = new ServicioVoluntarios(repositorio);

  const resultado = await servicio.postular(1, {
    idsTurnos: [1, 2],
    comentarioSolicitante: "Disponible en las mañanas",
  });

  assert.equal(resultado.tipo, "enviada");
  assert.deepEqual(repositorio.creadas[0]?.idsTurnos, [1, 2]);
});

test("solo se asignan turnos que el estudiante pidió", async () => {
  const servicio = new ServicioVoluntarios(new RepositorioVoluntariosFalso());

  const resultado = await servicio.revisar(10, "aprobar", [1, 2, 9], null, 3);

  assert.equal(resultado.tipo, "no_permitida");
});

test("aprobar sin turnos asignables no resuelve la postulación", async () => {
  const servicio = new ServicioVoluntarios(
    new RepositorioVoluntariosFalso({ asignacion: { asignados: [], llenos: [1] } })
  );

  const resultado = await servicio.revisar(10, "aprobar", [1], null, 3);

  assert.equal(resultado.tipo, "no_permitida");
});

test("aprobar con turnos libres asigna al voluntario", async () => {
  const servicio = new ServicioVoluntarios(new RepositorioVoluntariosFalso());

  const resultado = await servicio.revisar(10, "aprobar", [1], null, 3);

  assert.equal(resultado.tipo, "resuelta");
  if (resultado.tipo === "resuelta") assert.equal(resultado.estado, "APROBADA");
});

test("una postulación ya resuelta no se vuelve a tocar", async () => {
  const servicio = new ServicioVoluntarios(
    new RepositorioVoluntariosFalso({
      postulacion: { idPostulacion: 10, idEstudiante: 5, estado: "APROBADA", idsTurnos: [1] },
    })
  );

  const resultado = await servicio.revisar(10, "rechazar", [], null, 3);

  assert.equal(resultado.tipo, "no_permitida");
});
