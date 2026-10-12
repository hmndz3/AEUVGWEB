import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizarCarnet,
  textoDeBusquedaRegistroHora,
} from "../src/lib/horas-beca/busqueda-horas";
import type {
  DatosRegistroHoraPersistidos,
  EstudianteDeCarnet,
  RepositorioHorasBeca,
} from "../src/lib/horas-beca/repositorio-horas-beca";
import {
  MAXIMO_HORAS_POR_REGISTRO,
  ServicioHorasBeca,
  type DatosRegistroHora,
} from "../src/lib/horas-beca/servicio-horas-beca";

class RepositorioFalso implements RepositorioHorasBeca {
  creados: { datos: DatosRegistroHoraPersistidos; creadoPor: number }[] = [];
  actualizados: { id: number; datos: DatosRegistroHoraPersistidos }[] = [];
  eliminados: number[] = [];
  carnetsConsultados: string[] = [];

  constructor(
    private readonly opciones: {
      cuenta?: EstudianteDeCarnet | null;
      actualizado?: boolean;
      eliminado?: boolean;
    } = {}
  ) {}

  async estudianteDeCarnet(carnet: string): Promise<EstudianteDeCarnet | null> {
    this.carnetsConsultados.push(carnet);
    return this.opciones.cuenta ?? null;
  }

  async crear(datos: DatosRegistroHoraPersistidos, creadoPor: number): Promise<number> {
    this.creados.push({ datos, creadoPor });
    return 501;
  }

  async actualizar(id: number, datos: DatosRegistroHoraPersistidos): Promise<boolean> {
    this.actualizados.push({ id, datos });
    return this.opciones.actualizado ?? true;
  }

  async eliminar(id: number): Promise<boolean> {
    this.eliminados.push(id);
    return this.opciones.eliminado ?? true;
  }
}

function datosValidos(cambios: Partial<DatosRegistroHora> = {}): DatosRegistroHora {
  return {
    carnet: "24089",
    nombreEstudiante: "Estudiante de Prueba",
    fechaActividad: new Date("2026-10-09T00:00:00.000Z"),
    horarioApoyo: "14:00-16:00",
    descripcionActividad: "Apoyo en la Feria de Voluntariado",
    cantidadHoras: 2,
    observaciones: null,
    ...cambios,
  };
}

const CUENTA: EstudianteDeCarnet = { idEstudiante: 40, nombreCompleto: "Ana Estudiante Prueba" };

test("el carnet se normaliza quitando espacios y pasando a mayúsculas", () => {
  assert.equal(normalizarCarnet(" 24089 "), "24089");
  assert.equal(normalizarCarnet("test-0002"), "TEST-0002");
  assert.equal(normalizarCarnet("24 089"), "24089");
});

test("el texto de búsqueda reúne carnet, nombre y actividad sin acentos", () => {
  const texto = textoDeBusquedaRegistroHora({
    carnet: "24089",
    nombreEstudiante: "María Pérez",
    descripcionActividad: "Apoyo en la Semana de la Música",
  });

  assert.equal(texto, "24089 maria perez apoyo en la semana de la musica");
});

test("el texto de búsqueda colapsa los espacios repetidos", () => {
  const texto = textoDeBusquedaRegistroHora({
    carnet: "24089",
    nombreEstudiante: "  Ana   Prueba ",
    descripcionActividad: "Apoyo",
  });

  assert.equal(texto, "24089 ana prueba apoyo");
});

test("un registro de un carnet con cuenta queda vinculado a ella", async () => {
  const repositorio = new RepositorioFalso({ cuenta: CUENTA });
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.crear(datosValidos(), 7);

  assert.deepEqual(resultado, { tipo: "guardado", id: 501, vinculado: true });
  assert.equal(repositorio.creados[0].datos.idEstudiante, 40);
  assert.equal(repositorio.creados[0].creadoPor, 7);
});

test("un registro de un carnet sin cuenta se guarda sin vínculo", async () => {
  const repositorio = new RepositorioFalso({ cuenta: null });
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.crear(datosValidos(), 7);

  assert.deepEqual(resultado, { tipo: "guardado", id: 501, vinculado: false });
  assert.equal(repositorio.creados[0].datos.idEstudiante, null);
});

test("con cuenta vinculada se guarda el nombre de la cuenta y no el escrito", async () => {
  const repositorio = new RepositorioFalso({ cuenta: CUENTA });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(datosValidos({ nombreEstudiante: "Nombre mal escrito" }), 7);

  assert.equal(repositorio.creados[0].datos.nombreEstudiante, "Ana Estudiante Prueba");
});

test("sin cuenta se conserva el nombre con el que AEUVG cargó el registro", async () => {
  const repositorio = new RepositorioFalso({ cuenta: null });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(datosValidos({ nombreEstudiante: "  Lucía Estudiante  " }), 7);

  assert.equal(repositorio.creados[0].datos.nombreEstudiante, "Lucía Estudiante");
});

test("la cuenta se busca siempre con el carnet normalizado", async () => {
  const repositorio = new RepositorioFalso({ cuenta: null });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(datosValidos({ carnet: " test-0002 " }), 7);

  assert.deepEqual(repositorio.carnetsConsultados, ["TEST-0002"]);
  assert.equal(repositorio.creados[0].datos.carnet, "TEST-0002");
});

test("el texto de búsqueda se calcula en cada guardado", async () => {
  const repositorio = new RepositorioFalso({ cuenta: CUENTA });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(datosValidos({ descripcionActividad: "Apoyo en Biblioteca" }), 7);

  assert.equal(
    repositorio.creados[0].datos.textoBusqueda,
    "24089 ana estudiante prueba apoyo en biblioteca"
  );
});

test("un registro nuevo no escribe estado ni acreditación", async () => {
  const repositorio = new RepositorioFalso({ cuenta: CUENTA });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(datosValidos(), 7);

  const campos = Object.keys(repositorio.creados[0].datos);
  assert.equal(campos.includes("estado"), false);
  assert.equal(campos.includes("fechaAcreditacion"), false);
  assert.equal(campos.includes("acreditadoPor"), false);
});

test("un carnet vacío no se guarda", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.crear(datosValidos({ carnet: "   " }), 7);

  assert.equal(resultado.tipo, "invalido");
  assert.ok(resultado.tipo === "invalido" && resultado.errores.carnet);
  assert.equal(repositorio.creados.length, 0);
});

test("un nombre de estudiante vacío no se guarda", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());

  const resultado = await servicio.crear(datosValidos({ nombreEstudiante: "  " }), 7);

  assert.equal(resultado.tipo, "invalido");
  assert.ok(resultado.tipo === "invalido" && resultado.errores.nombreEstudiante);
});

test("una actividad sin descripción no se guarda", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());

  const resultado = await servicio.crear(datosValidos({ descripcionActividad: "" }), 7);

  assert.equal(resultado.tipo, "invalido");
  assert.ok(resultado.tipo === "invalido" && resultado.errores.descripcionActividad);
});

test("una fecha de actividad inválida no se guarda", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());

  const resultado = await servicio.crear(
    datosValidos({ fechaActividad: new Date("no es una fecha") }),
    7
  );

  assert.equal(resultado.tipo, "invalido");
  assert.ok(resultado.tipo === "invalido" && resultado.errores.fechaActividad);
});

test("la cantidad de horas debe ser mayor que cero", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());

  for (const cantidadHoras of [0, -1, Number.NaN]) {
    const resultado = await servicio.crear(datosValidos({ cantidadHoras }), 7);
    assert.equal(resultado.tipo, "invalido", String(cantidadHoras));
  }
});

test("la cantidad de horas de un registro no puede exceder las de un día", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());

  assert.equal((await servicio.crear(datosValidos({ cantidadHoras: 24 }), 7)).tipo, "guardado");
  assert.equal(
    (await servicio.crear(datosValidos({ cantidadHoras: MAXIMO_HORAS_POR_REGISTRO + 1 }), 7)).tipo,
    "invalido"
  );
});

test("al editar se vuelve a resolver el vínculo con la cuenta", async () => {
  const repositorio = new RepositorioFalso({ cuenta: CUENTA });
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.editar(88, datosValidos({ carnet: "24089" }));

  assert.deepEqual(resultado, { tipo: "guardado", id: 88, vinculado: true });
  assert.equal(repositorio.actualizados[0].id, 88);
  assert.equal(repositorio.actualizados[0].datos.idEstudiante, 40);
});

test("editar un registro inexistente responde no encontrado", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso({ actualizado: false }));

  assert.equal((await servicio.editar(88, datosValidos())).tipo, "no_encontrado");
});

test("un registro inválido no llega a la base al editar", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.editar(88, datosValidos({ cantidadHoras: 0 }));

  assert.equal(repositorio.actualizados.length, 0);
});

test("eliminar un registro existente lo borra de forma definitiva", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  assert.deepEqual(await servicio.eliminar(88), { tipo: "eliminado" });
  assert.deepEqual(repositorio.eliminados, [88]);
});

test("eliminar un registro inexistente responde no encontrado", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso({ eliminado: false }));

  assert.deepEqual(await servicio.eliminar(88), { tipo: "no_encontrado" });
});

test("los campos de texto se guardan sin espacios sobrantes", async () => {
  const repositorio = new RepositorioFalso({ cuenta: null });
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.crear(
    datosValidos({
      horarioApoyo: "  08:00-10:00  ",
      descripcionActividad: "  Apoyo en Biblioteca  ",
    }),
    7
  );

  assert.equal(repositorio.creados[0].datos.horarioApoyo, "08:00-10:00");
  assert.equal(repositorio.creados[0].datos.descripcionActividad, "Apoyo en Biblioteca");
});
