import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import type { RepositorioPerfil } from "../src/lib/perfil/repositorio-perfil";
import { ServicioPerfil } from "../src/lib/perfil/servicio-perfil";
import { esquemaPerfil, type DatosPerfil } from "../src/validators/perfil";

class RepositorioFalso implements RepositorioPerfil {
  escrituras: { idEstudiante: number; datos: DatosPerfil }[] = [];

  constructor(
    private readonly opciones: {
      carreraValida?: boolean;
      idEstudiante?: number | null;
      guardado?: boolean;
    } = {}
  ) {}

  async carreraActiva(): Promise<boolean> {
    return this.opciones.carreraValida ?? true;
  }

  async estudianteDeUsuario(): Promise<number | null> {
    return this.opciones.idEstudiante === undefined ? 40 : this.opciones.idEstudiante;
  }

  async actualizar(idEstudiante: number, datos: DatosPerfil): Promise<boolean> {
    this.escrituras.push({ idEstudiante, datos });
    return this.opciones.guardado ?? true;
  }
}

function datosValidos(cambios: Record<string, unknown> = {}): DatosPerfil {
  return esquemaPerfil.parse({ telefono: "5555 4444", idCarrera: "3", ...cambios });
}

test("el formulario válido se interpreta con sus tipos", () => {
  const datos = datosValidos();

  assert.equal(datos.idCarrera, 3);
  assert.equal(datos.telefono, "5555 4444");
});

test("un teléfono vacío se guarda como nulo", () => {
  assert.equal(datosValidos({ telefono: "" }).telefono, null);
  assert.equal(datosValidos({ telefono: "   " }).telefono, null);
});

test("se aceptan los formatos de teléfono de uso corriente en Guatemala", () => {
  for (const telefono of [
    "55554444",
    "5555 4444",
    "5555-4444",
    "+502 5555 4444",
    "502 5555-4444",
  ]) {
    assert.equal(esquemaPerfil.safeParse({ telefono, idCarrera: "3" }).success, true, telefono);
  }
});

test("un teléfono con una cantidad de dígitos distinta se rechaza", () => {
  for (const telefono of ["555", "5555 444", "5555 44445", "no es un teléfono"]) {
    assert.equal(esquemaPerfil.safeParse({ telefono, idCarrera: "3" }).success, false, telefono);
  }
});

test("sin carrera seleccionada el formulario no es válido", () => {
  for (const idCarrera of ["", "0", "-2", "abc"]) {
    assert.equal(esquemaPerfil.safeParse({ telefono: "", idCarrera }).success, false, idCarrera);
  }
});

test("el perfil se escribe sobre el estudiante que resuelve la sesión", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioPerfil(repositorio);

  const resultado = await servicio.actualizar(7, datosValidos());

  assert.deepEqual(resultado, { tipo: "guardado" });
  assert.equal(repositorio.escrituras[0].idEstudiante, 40);
  assert.equal(repositorio.escrituras[0].datos.idCarrera, 3);
});

test("una carrera inexistente o cerrada no se guarda", async () => {
  const repositorio = new RepositorioFalso({ carreraValida: false });
  const servicio = new ServicioPerfil(repositorio);

  const resultado = await servicio.actualizar(7, datosValidos());

  assert.equal(resultado.tipo, "invalido");
  assert.ok(resultado.tipo === "invalido" && resultado.errores.idCarrera);
  assert.equal(repositorio.escrituras.length, 0);
});

test("una cuenta sin estudiante asociado responde no encontrado", async () => {
  const repositorio = new RepositorioFalso({ idEstudiante: null });
  const servicio = new ServicioPerfil(repositorio);

  const resultado = await servicio.actualizar(7, datosValidos());

  assert.equal(resultado.tipo, "no_encontrado");
  assert.equal(repositorio.escrituras.length, 0);
});

test("si la escritura no alcanza ninguna fila se responde no encontrado", async () => {
  const servicio = new ServicioPerfil(new RepositorioFalso({ guardado: false }));

  assert.equal((await servicio.actualizar(7, datosValidos())).tipo, "no_encontrado");
});

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 7,
    correo: "estudiante.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("el perfil exige sesión pero ningún rol en particular", async () => {
  const sinSesion = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [], async () =>
    Response.json({ ok: true })
  );
  const estudiante = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.estudiante]) }),
    [],
    async () => Response.json({ ok: true })
  );
  const sinRoles = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([]) }),
    [],
    async () => Response.json({ ok: true })
  );

  assert.equal((await sinSesion()).status, 401);
  assert.equal((await estudiante()).status, 200);
  assert.equal((await sinRoles()).status, 200);
});

test("el manejador del perfil recibe el usuario de la sesión, no un parámetro", async () => {
  let recibido = 0;
  const manejador = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.estudiante]) }),
    [],
    async (sesion) => {
      recibido = sesion.idUsuario;
      return Response.json({ ok: true });
    }
  );

  await manejador();

  assert.equal(recibido, 7);
});
