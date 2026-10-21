import assert from "node:assert/strict";
import test from "node:test";

import type {
  EstudianteDeCarnet,
  RepositorioHorasBeca,
} from "../src/lib/horas-beca/repositorio-horas-beca";
import {
  MAXIMO_REGISTROS_EN_LOTE,
  ServicioHorasBeca,
} from "../src/lib/horas-beca/servicio-horas-beca";
import { esquemaAcreditacionLote } from "../src/validators/hora-beca-admin";

class RepositorioFalso implements RepositorioHorasBeca {
  acreditaciones: { ids: number[]; acreditadoPor: number; fecha: Date }[] = [];
  reversiones: number[][] = [];

  constructor(private readonly afectados?: number) {}

  async estudianteDeCarnet(): Promise<EstudianteDeCarnet | null> {
    return null;
  }

  async crear(): Promise<number> {
    return 1;
  }

  async actualizar(): Promise<boolean> {
    return true;
  }

  async eliminar(): Promise<boolean> {
    return true;
  }

  async acreditar(ids: readonly number[], acreditadoPor: number, fecha: Date): Promise<number> {
    this.acreditaciones.push({ ids: [...ids], acreditadoPor, fecha });
    return this.afectados ?? ids.length;
  }

  async revertirAcreditacion(ids: readonly number[]): Promise<number> {
    this.reversiones.push([...ids]);
    return this.afectados ?? ids.length;
  }
}

const FECHA = new Date("2026-10-18T22:00:00.000Z");

test("la acreditación guarda la fecha y el administrador que la aplicó", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.acreditar([11, 12], 7, FECHA);

  assert.deepEqual(resultado, { tipo: "aplicada", solicitados: 2, afectados: 2 });
  assert.deepEqual(repositorio.acreditaciones, [{ ids: [11, 12], acreditadoPor: 7, fecha: FECHA }]);
});

test("una selección con repetidos se acredita una sola vez por registro", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.acreditar([11, 11, 12, 11], 7, FECHA);

  assert.deepEqual(repositorio.acreditaciones[0].ids, [11, 12]);
  assert.equal(resultado.tipo === "aplicada" && resultado.solicitados, 2);
});

test("los identificadores que no pueden ser un registro se descartan", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  await servicio.acreditar([11, 0, -3, 1.5, Number.NaN, 12], 7, FECHA);

  assert.deepEqual(repositorio.acreditaciones[0].ids, [11, 12]);
});

test("una selección vacía no llega a la base", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.acreditar([], 7, FECHA);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.acreditaciones.length, 0);
});

test("una selección que solo trae identificadores inválidos se rechaza", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await new ServicioHorasBeca(repositorio).acreditar([0, -1], 7, FECHA);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.acreditaciones.length, 0);
});

test("una selección mayor al límite del lote se rechaza", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);
  const ids = Array.from({ length: MAXIMO_REGISTROS_EN_LOTE + 1 }, (_, indice) => indice + 1);

  const resultado = await servicio.acreditar(ids, 7, FECHA);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.acreditaciones.length, 0);
});

test("una selección del tamaño exacto del límite se acepta", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso());
  const ids = Array.from({ length: MAXIMO_REGISTROS_EN_LOTE }, (_, indice) => indice + 1);

  assert.equal((await servicio.acreditar(ids, 7, FECHA)).tipo, "aplicada");
});

/*
 * El repositorio solo cambia los registros que siguen pendientes, así que una
 * selección mixta afecta menos registros de los que se pidieron. El servicio
 * devuelve las dos cifras para que el panel pueda explicarlo.
 */
test("una selección mixta informa cuántos registros cambiaron", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso(1));

  const resultado = await servicio.acreditar([11, 12, 13], 7, FECHA);

  assert.deepEqual(resultado, { tipo: "aplicada", solicitados: 3, afectados: 1 });
});

test("acreditar lo que ya estaba acreditado no cambia ningún registro", async () => {
  const servicio = new ServicioHorasBeca(new RepositorioFalso(0));

  const resultado = await servicio.acreditar([11, 12], 7, FECHA);

  assert.deepEqual(resultado, { tipo: "aplicada", solicitados: 2, afectados: 0 });
});

test("la reversión aplica sobre los registros indicados", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  const resultado = await servicio.revertir([21, 22]);

  assert.deepEqual(resultado, { tipo: "aplicada", solicitados: 2, afectados: 2 });
  assert.deepEqual(repositorio.reversiones, [[21, 22]]);
});

test("la reversión aplica las mismas reglas de selección que la acreditación", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioHorasBeca(repositorio);

  assert.equal((await servicio.revertir([])).tipo, "invalida");
  assert.equal(
    (
      await servicio.revertir(
        Array.from({ length: MAXIMO_REGISTROS_EN_LOTE + 1 }, (_, indice) => indice + 1)
      )
    ).tipo,
    "invalida"
  );
  assert.equal(repositorio.reversiones.length, 0);

  await servicio.revertir([21, 21, 0, 22]);
  assert.deepEqual(repositorio.reversiones[0], [21, 22]);
});

test("el cuerpo de una operación en lote exige acción e identificadores", () => {
  assert.equal(
    esquemaAcreditacionLote.safeParse({ accion: "acreditar", ids: [1, 2] }).success,
    true
  );
  assert.equal(esquemaAcreditacionLote.safeParse({ accion: "revertir", ids: [1] }).success, true);
  assert.equal(esquemaAcreditacionLote.safeParse({ accion: "borrar", ids: [1] }).success, false);
  assert.equal(esquemaAcreditacionLote.safeParse({ accion: "acreditar", ids: [] }).success, false);
  assert.equal(esquemaAcreditacionLote.safeParse({ accion: "acreditar" }).success, false);
});

test("el cuerpo rechaza identificadores que no son registros", () => {
  for (const ids of [["x"], [0], [-1], [1.5], [{}]]) {
    assert.equal(
      esquemaAcreditacionLote.safeParse({ accion: "acreditar", ids }).success,
      false,
      JSON.stringify(ids)
    );
  }
});

test("el cuerpo rechaza un lote mayor al límite", () => {
  const ids = Array.from({ length: MAXIMO_REGISTROS_EN_LOTE + 1 }, (_, indice) => indice + 1);

  assert.equal(esquemaAcreditacionLote.safeParse({ accion: "acreditar", ids }).success, false);
});

test("el cuerpo no puede indicar la fecha ni el responsable de la acreditación", () => {
  const resultado = esquemaAcreditacionLote.safeParse({
    accion: "acreditar",
    ids: [1],
    fechaAcreditacion: "2020-01-01",
    acreditadoPor: 99,
  });

  assert.ok(resultado.success);
  assert.deepEqual(Object.keys(resultado.data).sort(), ["accion", "ids"]);
});
