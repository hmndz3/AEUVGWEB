import assert from "node:assert/strict";
import test from "node:test";

import {
  vincularRegistrosDeCarnet,
  type ClienteVinculacionHoras,
} from "../src/lib/horas-beca/vinculacion-horas";

type Argumentos = Parameters<ClienteVinculacionHoras["registroHoraBeca"]["updateMany"]>[0];

class ClienteFalso implements ClienteVinculacionHoras {
  llamadas: Argumentos[] = [];

  constructor(private readonly afectados = 2) {}

  registroHoraBeca = {
    updateMany: async (argumentos: Argumentos) => {
      this.llamadas.push(argumentos);
      return { count: this.afectados };
    },
  };
}

test("los registros del carnet quedan vinculados a la cuenta nueva", async () => {
  const cliente = new ClienteFalso(3);

  const vinculados = await vincularRegistrosDeCarnet(cliente, "24089", 40);

  assert.equal(vinculados, 3);
  assert.deepEqual(cliente.llamadas, [
    {
      where: { carnet: { equals: "24089", mode: "insensitive" }, idEstudiante: null },
      data: { idEstudiante: 40 },
    },
  ]);
});

test("el carnet se normaliza antes de buscar los registros", async () => {
  const cliente = new ClienteFalso();

  await vincularRegistrosDeCarnet(cliente, " test-0005 ", 41);

  assert.equal(cliente.llamadas[0].where.carnet.equals, "TEST-0005");
});

/*
 * Los dos lados del vínculo se escribieron en momentos distintos: el registro
 * guarda el carnet normalizado y la ficha del estudiante conserva el que se
 * capturó al crear la cuenta. Sin ignorar las mayúsculas, un carnet con letras
 * quedaría sin vincular para siempre.
 */
test("la comparación del carnet ignora las mayúsculas", async () => {
  const cliente = new ClienteFalso();

  await vincularRegistrosDeCarnet(cliente, "test-0005", 41);

  assert.equal(cliente.llamadas[0].where.carnet.mode, "insensitive");
});

test("solo se alcanzan los registros que no tienen cuenta vinculada", async () => {
  const cliente = new ClienteFalso();

  await vincularRegistrosDeCarnet(cliente, "24089", 40);

  assert.equal(cliente.llamadas[0].where.idEstudiante, null);
});

test("un carnet vacío no consulta la base", async () => {
  const cliente = new ClienteFalso();

  assert.equal(await vincularRegistrosDeCarnet(cliente, "   ", 40), 0);
  assert.equal(cliente.llamadas.length, 0);
});

test("un carnet sin registros pendientes devuelve cero sin fallar", async () => {
  const cliente = new ClienteFalso(0);

  assert.equal(await vincularRegistrosDeCarnet(cliente, "24089", 40), 0);
  assert.equal(cliente.llamadas.length, 1);
});

test("la vinculación escribe solo el estudiante y no toca el resto del registro", async () => {
  const cliente = new ClienteFalso();

  await vincularRegistrosDeCarnet(cliente, "24089", 40);

  assert.deepEqual(Object.keys(cliente.llamadas[0].data), ["idEstudiante"]);
});
