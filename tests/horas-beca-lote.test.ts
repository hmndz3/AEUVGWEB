import assert from "node:assert/strict";
import test from "node:test";

import { MAXIMO_CARNETS_LOTE, separarCarnets } from "../src/lib/horas-beca/carnets-lote";
import type { EstudianteDeCarnet } from "../src/lib/horas-beca/repositorio-horas-beca";
import type {
  RegistroImportado,
  RepositorioImportacion,
} from "../src/lib/horas-beca/repositorio-importacion";
import { ServicioLoteHoras } from "../src/lib/horas-beca/servicio-lote-horas";
import { esquemaLoteHoraAdmin } from "../src/validators/hora-beca-admin";

const ACTIVIDAD = {
  fechaActividad: new Date("2026-10-09T00:00:00.000Z"),
  horarioApoyo: "14:00-16:00",
  descripcionActividad: "Apoyo en la Feria de Voluntariado",
  cantidadHoras: 2.5,
  observaciones: null,
};

/** Repositorio de mentira: deja ver qué se guardó sin tocar la base. */
class RepositorioFalso implements RepositorioImportacion {
  guardados: RegistroImportado[] = [];
  importaciones: (number | null)[] = [];

  constructor(private readonly cuentas: Map<string, EstudianteDeCarnet> = new Map()) {}

  async estudiantesPorCarnet(carnets: string[]): Promise<Map<string, EstudianteDeCarnet>> {
    return new Map(
      carnets
        .map((carnet) => [carnet, this.cuentas.get(carnet)] as const)
        .filter((par): par is readonly [string, EstudianteDeCarnet] => par[1] !== undefined)
    );
  }

  async registrarImportacion(): Promise<number> {
    throw new Error("El registro en lote no debe dejar constancia de importación.");
  }

  async crearRegistrosImportados(
    registros: RegistroImportado[],
    idImportacion: number | null
  ): Promise<number> {
    this.guardados.push(...registros);
    this.importaciones.push(idImportacion);
    return registros.length;
  }
}

const conCuentas = (...carnets: string[]) =>
  new RepositorioFalso(
    new Map(
      carnets.map((carnet, indice) => [
        carnet,
        { idEstudiante: indice + 1, nombreCompleto: `Estudiante ${carnet}` },
      ])
    )
  );

// ---------- Separación de la lista ----------

test("la lista admite comas, espacios y saltos de línea mezclados", () => {
  const { carnets } = separarCarnets("24117, 24263;24518\n 24890\t24901");

  assert.deepEqual(carnets, ["24117", "24263", "24518", "24890", "24901"]);
});

test("los carnets se normalizan a mayúsculas y sin espacios", () => {
  const { carnets } = separarCarnets("a24117 , b-24263");

  assert.deepEqual(carnets, ["A24117", "B-24263"]);
});

test("un carnet repetido se conserva una sola vez y se reporta", () => {
  const { carnets, repetidos } = separarCarnets("24117, 24263, 24117");

  assert.deepEqual(carnets, ["24117", "24263"]);
  assert.deepEqual(repetidos, ["24117"]);
});

test("lo que no puede ser un carnet se separa en lugar de colarse", () => {
  const { carnets, invalidos } = separarCarnets("24117, ana@uvg.edu.gt, 12, 24263");

  assert.deepEqual(carnets, ["24117", "24263"]);
  assert.deepEqual(invalidos, ["ana@uvg.edu.gt", "12"]);
});

test("una lista vacía no produce carnets ni errores", () => {
  assert.deepEqual(separarCarnets("   \n  "), { carnets: [], invalidos: [], repetidos: [] });
});

// ---------- Revisión ----------

test("la revisión separa los carnets con cuenta de los que no la tienen", async () => {
  const servicio = new ServicioLoteHoras(conCuentas("24117", "24263"));

  const revision = await servicio.revisar("24117, 24263, 24999, ???");

  assert.deepEqual(
    revision.encontrados.map(({ carnet }) => carnet),
    ["24117", "24263"]
  );
  assert.equal(revision.encontrados[0].nombreEstudiante, "Estudiante 24117");
  assert.deepEqual(revision.sinCuenta, ["24999"]);
  assert.deepEqual(revision.invalidos, ["???"]);
});

// ---------- Registro ----------

test("registra un renglón por carnet con la misma actividad", async () => {
  const repositorio = conCuentas("24117", "24263");
  const servicio = new ServicioLoteHoras(repositorio);

  const resultado = await servicio.registrar("24117\n24263", ACTIVIDAD, 3);

  assert.equal(resultado.tipo, "registrado");
  if (resultado.tipo !== "registrado") return;

  assert.equal(resultado.creados, 2);
  assert.equal(repositorio.guardados.length, 2);
  assert.deepEqual(
    repositorio.guardados.map(({ carnet }) => carnet),
    ["24117", "24263"]
  );
  // El nombre lo pone la cuenta, no quien captura.
  assert.equal(repositorio.guardados[0].nombreEstudiante, "Estudiante 24117");
  assert.equal(repositorio.guardados[0].idEstudiante, 1);
  // Todos comparten la actividad.
  for (const registro of repositorio.guardados) {
    assert.equal(registro.descripcionActividad, ACTIVIDAD.descripcionActividad);
    assert.equal(registro.horarioApoyo, "14:00-16:00");
    assert.equal(registro.cantidadHoras, 2.5);
  }
  // No viene de un archivo, así que no hay importación a la que apuntar.
  assert.deepEqual(repositorio.importaciones, [null]);
});

test("un carnet sin cuenta detiene el lote y lo nombra", async () => {
  const repositorio = conCuentas("24117");
  const servicio = new ServicioLoteHoras(repositorio);

  const resultado = await servicio.registrar("24117, 24999", ACTIVIDAD, 3);

  assert.equal(resultado.tipo, "invalido");
  if (resultado.tipo !== "invalido") return;
  assert.match(resultado.mensaje, /24999/);
  assert.equal(repositorio.guardados.length, 0);
});

test("un valor que no puede ser carnet detiene el lote", async () => {
  const repositorio = conCuentas("24117");

  const resultado = await new ServicioLoteHoras(repositorio).registrar("24117, @@", ACTIVIDAD, 3);

  assert.equal(resultado.tipo, "invalido");
  assert.equal(repositorio.guardados.length, 0);
});

test("una lista vacía no registra nada", async () => {
  const repositorio = conCuentas();

  const resultado = await new ServicioLoteHoras(repositorio).registrar("   ", ACTIVIDAD, 3);

  assert.equal(resultado.tipo, "invalido");
  assert.equal(repositorio.guardados.length, 0);
});

test("el lote no admite más carnets que el máximo", async () => {
  const carnets = Array.from({ length: MAXIMO_CARNETS_LOTE + 1 }, (_, i) => `2${4000 + i}`);
  const repositorio = conCuentas(...carnets);

  const resultado = await new ServicioLoteHoras(repositorio).registrar(
    carnets.join(", "),
    ACTIVIDAD,
    3
  );

  assert.equal(resultado.tipo, "invalido");
  if (resultado.tipo !== "invalido") return;
  assert.match(resultado.mensaje, new RegExp(String(MAXIMO_CARNETS_LOTE)));
  assert.equal(repositorio.guardados.length, 0);
});

// ---------- Validación del cuerpo ----------

test("el esquema del lote pide los carnets y no el nombre del estudiante", () => {
  const resultado = esquemaLoteHoraAdmin.safeParse({
    carnets: "24117, 24263",
    fechaActividad: "2026-10-09",
    horarioApoyo: "14:00-16:00",
    descripcionActividad: "Apoyo en la Feria de Voluntariado",
    cantidadHoras: "2.5",
    observaciones: "",
  });

  assert.equal(resultado.success, true);
  if (!resultado.success) return;
  assert.equal(resultado.data.carnets, "24117, 24263");
  assert.equal("nombreEstudiante" in resultado.data, false);
  assert.equal("carnet" in resultado.data, false);
  assert.equal(resultado.data.observaciones, null);
});

test("el esquema del lote conserva las reglas de la actividad", () => {
  for (const cambio of [
    { cantidadHoras: "0" },
    { horarioApoyo: "de 2 a 4" },
    { fechaActividad: "09/10/2026" },
    { descripcionActividad: "" },
    { carnets: "" },
  ]) {
    const resultado = esquemaLoteHoraAdmin.safeParse({
      carnets: "24117",
      fechaActividad: "2026-10-09",
      horarioApoyo: "14:00-16:00",
      descripcionActividad: "Apoyo en la Feria de Voluntariado",
      cantidadHoras: "2.5",
      observaciones: "",
      ...cambio,
    });

    assert.equal(resultado.success, false, `${JSON.stringify(cambio)} no debería pasar`);
  }
});
