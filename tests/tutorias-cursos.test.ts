import assert from "node:assert/strict";
import test from "node:test";

import type { RepositorioCursos, UsosCurso } from "../src/lib/tutorias/repositorio-cursos";
import { ServicioCursos } from "../src/lib/tutorias/servicio-cursos";
import { esquemaCursoAdmin, type DatosCursoAdmin } from "../src/validators/tutoria";

/** Repositorio de mentira con un catálogo en memoria. */
class RepositorioFalso implements RepositorioCursos {
  cursos = new Map<number, DatosCursoAdmin & { usos: UsosCurso }>([
    [
      1,
      {
        codigo: "MM2015",
        nombre: "Cálculo 1",
        activo: true,
        usos: { postulaciones: 2, tutores: 1, tutorias: 0 },
      },
    ],
    [
      2,
      {
        codigo: "OTRO-ABC123",
        nombre: "Física Moderna",
        activo: false,
        usos: { postulaciones: 0, tutores: 0, tutorias: 0 },
      },
    ],
  ]);

  async codigoEnUso(codigo: string, excepto?: number): Promise<boolean> {
    return [...this.cursos].some(
      ([id, curso]) => id !== excepto && curso.codigo.toUpperCase() === codigo.toUpperCase()
    );
  }

  async crear(datos: DatosCursoAdmin): Promise<number> {
    const id = this.cursos.size + 1;
    this.cursos.set(id, { ...datos, usos: { postulaciones: 0, tutores: 0, tutorias: 0 } });
    return id;
  }

  async actualizar(idCurso: number, datos: DatosCursoAdmin): Promise<boolean> {
    const curso = this.cursos.get(idCurso);
    if (!curso) return false;
    this.cursos.set(idCurso, { ...curso, ...datos });
    return true;
  }

  async usos(idCurso: number): Promise<UsosCurso | null> {
    return this.cursos.get(idCurso)?.usos ?? null;
  }

  async eliminar(idCurso: number): Promise<boolean> {
    return this.cursos.delete(idCurso);
  }
}

test("el curso del panel guarda el código en mayúsculas y exige nombre", () => {
  const datos = esquemaCursoAdmin.parse({ codigo: " qq 1001 ", nombre: " Química   General " });

  assert.deepEqual(datos, { codigo: "QQ1001", nombre: "Química General", activo: true });
  assert.equal(esquemaCursoAdmin.safeParse({ codigo: "QQ1001", nombre: "" }).success, false);
  assert.equal(esquemaCursoAdmin.safeParse({ codigo: "QQ#1", nombre: "Química" }).success, false);
});

test("AEUVG agrega un curso al catálogo", async () => {
  const repositorio = new RepositorioFalso();
  const resultado = await new ServicioCursos(repositorio).crear(
    esquemaCursoAdmin.parse({ codigo: "QQ1001", nombre: "Química General" })
  );

  assert.equal(resultado.tipo, "guardado");
  assert.equal(repositorio.cursos.size, 3);
});

test("no se admiten dos cursos con el mismo código", async () => {
  const servicio = new ServicioCursos(new RepositorioFalso());
  const datos = esquemaCursoAdmin.parse({ codigo: "mm2015", nombre: "Otro cálculo" });

  const creado = await servicio.crear(datos);
  assert.ok(creado.tipo === "invalido" && creado.errores.codigo);

  // Editar el mismo curso sin cambiar su código no choca consigo mismo.
  const editado = await servicio.actualizar(1, datos);
  assert.equal(editado.tipo, "guardado");
});

test("editar un curso que no existe responde que no se encontró", async () => {
  const resultado = await new ServicioCursos(new RepositorioFalso()).actualizar(
    99,
    esquemaCursoAdmin.parse({ codigo: "XX1", nombre: "Inexistente" })
  );

  assert.deepEqual(resultado, { tipo: "no_encontrado" });
});

test("un curso con historial no se borra, se desactiva", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioCursos(repositorio);

  assert.equal((await servicio.eliminar(1)).tipo, "en_uso");
  assert.ok(repositorio.cursos.has(1));

  assert.deepEqual(await servicio.eliminar(2), { tipo: "eliminado" });
  assert.equal(repositorio.cursos.has(2), false);

  assert.deepEqual(await servicio.eliminar(99), { tipo: "no_encontrado" });
});
