import assert from "node:assert/strict";
import test from "node:test";

import { duracionHorasTurno } from "../src/lib/prestamo-batas/formato-prestamo-batas";
import type {
  ArticuloConDisponibilidad,
  DatosArticuloPersistido,
  RepositorioInventario,
  ResultadoEliminacionArticulo,
} from "../src/lib/prestamo-batas/repositorio-inventario";
import { ServicioInventario } from "../src/lib/prestamo-batas/servicio-inventario";
import type {
  DatosTurnoPersistido,
  RepositorioTurnos,
  ResultadoEliminacionTurno,
  TurnoConAsignados,
} from "../src/lib/prestamo-batas/repositorio-turnos";
import { ServicioTurnos } from "../src/lib/prestamo-batas/servicio-turnos";
import { esquemaArticuloInventario, esquemaTurno } from "../src/validators/prestamo-batas";

const articulo = (
  sobrescribir: Partial<DatosArticuloPersistido> = {}
): DatosArticuloPersistido => ({
  tipo: "BATA_AZUL",
  talla: "M",
  cantidadTotal: 10,
  activo: true,
  ...sobrescribir,
});

class RepositorioInventarioFalso implements RepositorioInventario {
  creados: DatosArticuloPersistido[] = [];
  constructor(
    private readonly opciones: { existe?: boolean; prestada?: number; encontrado?: boolean } = {}
  ) {}

  async listar(): Promise<ArticuloConDisponibilidad[]> {
    return [];
  }
  async articuloPorId(): Promise<DatosArticuloPersistido | null> {
    return this.opciones.encontrado === false ? null : articulo();
  }
  async existeTipoTalla(): Promise<boolean> {
    return this.opciones.existe ?? false;
  }
  async cantidadPrestadaDe(): Promise<number> {
    return this.opciones.prestada ?? 0;
  }
  async crear(datos: DatosArticuloPersistido): Promise<number> {
    this.creados.push(datos);
    return 1;
  }
  async actualizar(): Promise<boolean> {
    return this.opciones.encontrado ?? true;
  }
  async eliminar(): Promise<ResultadoEliminacionArticulo> {
    return { tipo: "eliminado" };
  }
}

test("el inventario rechaza un tipo y talla ya existente", async () => {
  const servicio = new ServicioInventario(new RepositorioInventarioFalso({ existe: true }));
  const datos = esquemaArticuloInventario.parse({
    tipo: "BATA_AZUL",
    talla: "M",
    cantidadTotal: 5,
  });

  const resultado = await servicio.crear(datos);

  assert.equal(resultado.tipo, "invalido");
});

test("los lentes se guardan sin talla aunque llegue una", async () => {
  const repositorio = new RepositorioInventarioFalso();
  const servicio = new ServicioInventario(repositorio);
  // El esquema ya impide enviar talla con lentes, así que se prueba el servicio
  // directamente para cubrir que la normaliza a null de todos modos.
  const resultado = await servicio.crear({
    tipo: "LENTES",
    talla: "M",
    cantidadTotal: 20,
    activo: true,
  });

  assert.equal(resultado.tipo, "guardado");
  assert.equal(repositorio.creados[0]?.talla, null);
});

test("no se puede bajar el total por debajo de lo prestado", async () => {
  const servicio = new ServicioInventario(new RepositorioInventarioFalso({ prestada: 7 }));
  const datos = esquemaArticuloInventario.parse({
    tipo: "BATA_AZUL",
    talla: "L",
    cantidadTotal: 5,
  });

  const resultado = await servicio.editar(3, datos);

  assert.equal(resultado.tipo, "invalido");
  if (resultado.tipo === "invalido") {
    assert.match(resultado.errores.cantidadTotal ?? "", /prestadas/);
  }
});

class RepositorioTurnosFalso implements RepositorioTurnos {
  creados: DatosTurnoPersistido[] = [];
  constructor(private readonly opciones: { existe?: boolean; encontrado?: boolean } = {}) {}

  async listar(): Promise<TurnoConAsignados[]> {
    return [];
  }
  async turnoPorId(): Promise<DatosTurnoPersistido | null> {
    return null;
  }
  async existeTurno(): Promise<boolean> {
    return this.opciones.existe ?? false;
  }
  async crear(datos: DatosTurnoPersistido): Promise<number> {
    this.creados.push(datos);
    return 1;
  }
  async actualizar(): Promise<boolean> {
    return this.opciones.encontrado ?? true;
  }
  async eliminar(): Promise<ResultadoEliminacionTurno> {
    return { tipo: "eliminado" };
  }
}

test("un turno duplicado se rechaza", async () => {
  const servicio = new ServicioTurnos(new RepositorioTurnosFalso({ existe: true }));
  const datos = esquemaTurno.parse({
    diaSemana: "LUNES",
    horaInicio: "06:45",
    horaFin: "09:00",
  });

  const resultado = await servicio.crear(datos);

  assert.equal(resultado.tipo, "invalido");
});

test("un turno nuevo guarda sus horas como hora del día", async () => {
  const repositorio = new RepositorioTurnosFalso();
  const servicio = new ServicioTurnos(repositorio);
  const datos = esquemaTurno.parse({
    diaSemana: "MARTES",
    horaInicio: "09:00",
    horaFin: "12:00",
  });

  const resultado = await servicio.crear(datos);

  assert.equal(resultado.tipo, "guardado");
  assert.equal(repositorio.creados[0]?.horaInicio.getUTCHours(), 9);
  assert.equal(repositorio.creados[0]?.horaFin.getUTCHours(), 12);
});

test("el horario invertido no pasa la validación", () => {
  const resultado = esquemaTurno.safeParse({
    diaSemana: "LUNES",
    horaInicio: "12:00",
    horaFin: "09:00",
  });

  assert.equal(resultado.success, false);
});

test("la duración de un turno se calcula con dos decimales", () => {
  const inicio = new Date("1970-01-01T06:45:00.000Z");
  const fin = new Date("1970-01-01T09:00:00.000Z");

  assert.equal(duracionHorasTurno(inicio, fin), 2.25);
});
