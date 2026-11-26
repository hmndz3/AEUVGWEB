import assert from "node:assert/strict";
import test from "node:test";

import type {
  ArticuloParaPrestamo,
  DatosListaNegraPersistido,
  DatosPrestamoPersistido,
  RepositorioOperacion,
} from "../src/lib/prestamo-batas/repositorio-operacion";
import { ServicioOperacion } from "../src/lib/prestamo-batas/servicio-operacion";
import { esquemaPrestamo } from "../src/validators/prestamo-batas";

const articuloStock = (
  sobrescribir: Partial<ArticuloParaPrestamo> = {}
): ArticuloParaPrestamo => ({
  idArticulo: 1,
  tipo: "BATA_AZUL",
  talla: "M",
  activo: true,
  cantidadTotal: 5,
  cantidadPrestada: 0,
  ...sobrescribir,
});

class RepositorioOperacionFalso implements RepositorioOperacion {
  prestamos: DatosPrestamoPersistido[] = [];
  listaNegra: DatosListaNegraPersistido[] = [];

  constructor(
    private readonly opciones: { articulos?: ArticuloParaPrestamo[]; devuelto?: boolean } = {}
  ) {}

  async articulosParaPrestamo(ids: readonly number[]): Promise<ArticuloParaPrestamo[]> {
    return (this.opciones.articulos ?? [articuloStock()]).filter((a) => ids.includes(a.idArticulo));
  }
  async crearPrestamo(datos: DatosPrestamoPersistido): Promise<number> {
    this.prestamos.push(datos);
    return 1;
  }
  async marcarDevuelto(): Promise<boolean> {
    return this.opciones.devuelto ?? true;
  }
  async crearListaNegra(datos: DatosListaNegraPersistido): Promise<number> {
    this.listaNegra.push(datos);
    return 1;
  }
}

const datosPrestamo = (cantidad: number) =>
  esquemaPrestamo.parse({
    nombre: "José",
    apellido: "Pérez",
    carnet: "25357",
    fechaPrestamo: "2026-11-20",
    horaSalida: "06:55",
    articulos: [{ idArticulo: 1, cantidad }],
  });

test("no se presta más de lo disponible", async () => {
  const repositorio = new RepositorioOperacionFalso({
    articulos: [articuloStock({ cantidadTotal: 5, cantidadPrestada: 4 })],
  });
  const servicio = new ServicioOperacion(repositorio);

  const resultado = await servicio.registrarPrestamo(datosPrestamo(3), 1);

  assert.equal(resultado.tipo, "invalido");
});

test("no se presta un artículo inactivo", async () => {
  const repositorio = new RepositorioOperacionFalso({
    articulos: [articuloStock({ activo: false })],
  });
  const servicio = new ServicioOperacion(repositorio);

  const resultado = await servicio.registrarPrestamo(datosPrestamo(1), 1);

  assert.equal(resultado.tipo, "invalido");
});

test("un préstamo válido se guarda y normaliza fecha y hora", async () => {
  const repositorio = new RepositorioOperacionFalso();
  const servicio = new ServicioOperacion(repositorio);

  const resultado = await servicio.registrarPrestamo(datosPrestamo(2), 7);

  assert.equal(resultado.tipo, "guardado");
  const guardado = repositorio.prestamos[0];
  assert.equal(guardado?.carnet, "25357");
  assert.equal(guardado?.fechaPrestamo.getUTCFullYear(), 2026);
  assert.equal(guardado?.horaSalida.getUTCHours(), 6);
  assert.equal(guardado?.horaSalida.getUTCMinutes(), 55);
});

test("devolver un préstamo inexistente no encuentra nada", async () => {
  const servicio = new ServicioOperacion(new RepositorioOperacionFalso({ devuelto: false }));

  const resultado = await servicio.devolver(99, { comentarios: null });

  assert.equal(resultado.tipo, "no_encontrado");
});

test("la lista negra guarda solo el nombre y la justificación obligatorios", async () => {
  const repositorio = new RepositorioOperacionFalso();
  const servicio = new ServicioOperacion(repositorio);

  const resultado = await servicio.agregarListaNegra(
    {
      fecha: null,
      nombre: "Jokin",
      apellido: null,
      correo: null,
      carnet: null,
      telefono: null,
      justificacion: "No devolvió la bata.",
    },
    4
  );

  assert.equal(resultado.tipo, "guardado");
  assert.equal(repositorio.listaNegra[0]?.nombre, "Jokin");
  assert.equal(repositorio.listaNegra[0]?.fecha, null);
});
