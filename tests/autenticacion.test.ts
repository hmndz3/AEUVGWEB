import assert from "node:assert/strict";
import test from "node:test";

import {
  crearHashContrasena,
  necesitaRehacerse,
  verificarContrasena,
} from "../src/lib/auth/contrasenas";
import { MENSAJE_CREDENCIALES_INVALIDAS } from "../src/lib/auth/mensajes-autenticacion";
import type {
  RepositorioAutenticacion,
  UsuarioAutenticacion,
  UsuarioSesion,
} from "../src/lib/auth/repositorio-autenticacion";
import { ServicioAutenticacion } from "../src/lib/auth/servicio-autenticacion";
import { crearTokenSesion, opcionesCookieSesion, validarTokenSesion } from "../src/lib/auth/sesion";
import type { ConfiguracionSesion } from "../src/lib/configuracion-sesion";
import { crearEsquemaInicioSesion } from "../src/validators/inicio-sesion";

const configuracion: ConfiguracionSesion = {
  secreto: "clave-de-prueba-larga-y-unica-para-sesiones-aeuvg",
  duracionSegundos: 60 * 60,
};
const fechaBase = new Date("2026-09-09T15:00:00.000Z");

const CONTRASENA = "PruebaSegura1!";

/**
 * Deriva con parámetros a elección, para poder fabricar un hash como los que
 * quedaron guardados antes de subir el costo.
 */
async function crearHashConParametros(
  contrasena: string,
  parametros: { N: number; r: number; p: number }
): Promise<string> {
  const { randomBytes, scryptSync } = await import("node:crypto");
  const sal = randomBytes(16);
  const derivada = scryptSync(contrasena, sal, 64, {
    ...parametros,
    maxmem: 160 * 1024 * 1024,
  });

  return [
    "scrypt",
    parametros.N,
    parametros.r,
    parametros.p,
    sal.toString("base64url"),
    derivada.toString("base64url"),
  ].join("$");
}

class RepositorioMemoria implements RepositorioAutenticacion {
  ultimoAcceso: Date | null = null;
  hashesRehechos: string[] = [];

  constructor(readonly usuario: UsuarioAutenticacion | null) {}

  async buscarPorCorreo(correo: string): Promise<UsuarioAutenticacion | null> {
    return this.usuario?.correo === correo ? this.usuario : null;
  }

  async buscarPorId(idUsuario: number): Promise<UsuarioSesion | null> {
    if (!this.usuario || this.usuario.idUsuario !== idUsuario) return null;
    const { contrasenaHash: _, ...usuarioSesion } = this.usuario;
    return usuarioSesion;
  }

  async registrarAcceso(_idUsuario: number, fecha: Date): Promise<void> {
    this.ultimoAcceso = fecha;
  }

  async actualizarHashContrasena(_idUsuario: number, contrasenaHash: string): Promise<void> {
    this.hashesRehechos.push(contrasenaHash);
  }
}

async function crearUsuario(
  cambios: Partial<Omit<UsuarioAutenticacion, "contrasenaHash">> = {}
): Promise<UsuarioAutenticacion> {
  return {
    idUsuario: 1,
    correo: "estudiante.prueba@uvg.edu.gt",
    contrasenaHash: await crearHashContrasena(CONTRASENA),
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    ...cambios,
  } as UsuarioAutenticacion;
}

test("autentica credenciales válidas y registra el último acceso", async () => {
  const repositorio = new RepositorioMemoria(await crearUsuario());
  const servicio = new ServicioAutenticacion(repositorio, configuracion, () => fechaBase);

  const resultado = await servicio.iniciarSesion({
    correo: "estudiante.prueba@uvg.edu.gt",
    contrasena: "PruebaSegura1!",
  });

  assert.equal(resultado.tipo, "autenticado");
  assert.deepEqual(repositorio.ultimoAcceso, fechaBase);
});

test("no permite enumerar usuarios: correo inexistente y contraseña incorrecta comparten resultado", async () => {
  const usuario = await crearUsuario();
  const servicio = new ServicioAutenticacion(new RepositorioMemoria(usuario), configuracion);

  const incorrecta = await servicio.iniciarSesion({
    correo: usuario.correo,
    contrasena: "ClaveIncorrecta1!",
  });
  const inexistente = await servicio.iniciarSesion({
    correo: "ausente@uvg.edu.gt",
    contrasena: "ClaveIncorrecta1!",
  });

  assert.deepEqual(incorrecta, { tipo: "credenciales_invalidas" });
  assert.deepEqual(inexistente, { tipo: "credenciales_invalidas" });
  assert.equal(MENSAJE_CREDENCIALES_INVALIDAS, "Correo o contraseña inválidos.");
});

test("rechaza una cuenta con correo no verificado", async () => {
  const usuario = await crearUsuario({ correoVerificado: false, estado: "PENDIENTE" });
  const servicio = new ServicioAutenticacion(new RepositorioMemoria(usuario), configuracion);

  const resultado = await servicio.iniciarSesion({
    correo: usuario.correo,
    contrasena: "PruebaSegura1!",
  });

  assert.deepEqual(resultado, { tipo: "correo_no_verificado" });
});

test("valida entradas obligatorias y el dominio institucional", () => {
  const esquema = crearEsquemaInicioSesion("uvg.edu.gt");

  assert.equal(esquema.safeParse({ correo: "", contrasena: "" }).success, false);
  assert.equal(
    esquema.safeParse({ correo: "estudiante@example.test", contrasena: "PruebaSegura1!" }).success,
    false
  );
});

test("firma una sesión válida en cookie HttpOnly y rechaza tokens ausentes, manipulados o vencidos", async () => {
  const token = await crearTokenSesion({ idUsuario: 1 }, configuracion, fechaBase);

  assert.deepEqual(await validarTokenSesion(token, configuracion, fechaBase), { idUsuario: 1 });
  assert.equal(await validarTokenSesion(undefined, configuracion, fechaBase), null);
  assert.equal(await validarTokenSesion(`${token}x`, configuracion, fechaBase), null);
  assert.equal(
    await validarTokenSesion(token, configuracion, new Date(fechaBase.getTime() + 61 * 60_000)),
    null
  );
  assert.deepEqual(opcionesCookieSesion(configuracion), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
});

test("la ruta protegida puede obtener un usuario solo con una sesión válida y activa", async () => {
  const usuario = await crearUsuario();
  const repositorio = new RepositorioMemoria(usuario);
  const servicio = new ServicioAutenticacion(repositorio, configuracion, () => fechaBase);
  const token = await crearTokenSesion({ idUsuario: usuario.idUsuario }, configuracion, fechaBase);

  assert.equal((await servicio.obtenerUsuarioSesion(token))?.correo, usuario.correo);
  assert.equal(await servicio.obtenerUsuarioSesion("token-inválido"), null);
  usuario.estado = "BLOQUEADO";
  assert.equal(await servicio.obtenerUsuarioSesion(token), null);
});

// ---------------------------------------------------------------------------
// Costo de la derivación
// ---------------------------------------------------------------------------

test("un hash guardado con parámetros más flojos sigue sirviendo para entrar", async () => {
  // Formato anterior: el mismo scrypt con p=1, que es lo que había guardado.
  const viejo = await crearHashConParametros("Contrasena-1", { N: 16_384, r: 8, p: 1 });

  assert.equal(await verificarContrasena("Contrasena-1", viejo), true);
  assert.equal(await verificarContrasena("otra-cosa", viejo), false);
});

test("un hash con los parámetros flojos se marca para rehacerse", async () => {
  const viejo = await crearHashConParametros("Contrasena-1", { N: 16_384, r: 8, p: 1 });
  const actual = await crearHashContrasena("Contrasena-1");

  assert.equal(necesitaRehacerse(viejo), true);
  assert.equal(necesitaRehacerse(actual), false);
});

test("un hash con parámetros disparatados se rechaza en vez de intentarlo", async () => {
  // Sin tope, una sola verificación con N enorme agotaría la memoria.
  const absurdo = await crearHashConParametros("Contrasena-1", { N: 16_384, r: 8, p: 1 });
  const manipulado = absurdo.replace("$16384$", "$1048576$");

  assert.equal(await verificarContrasena("Contrasena-1", manipulado), false);
});

test("un hash con una N que no es potencia de dos se rechaza", async () => {
  const base = await crearHashConParametros("Contrasena-1", { N: 16_384, r: 8, p: 1 });

  assert.equal(
    await verificarContrasena("Contrasena-1", base.replace("$16384$", "$16383$")),
    false
  );
});

test("al entrar con un hash viejo se guarda uno nuevo con el costo de hoy", async () => {
  const usuario = await crearUsuario();
  usuario.contrasenaHash = await crearHashConParametros(CONTRASENA, { N: 16_384, r: 8, p: 1 });
  const repositorio = new RepositorioMemoria(usuario);

  const resultado = await new ServicioAutenticacion(
    repositorio,
    configuracion,
    () => fechaBase
  ).iniciarSesion({ correo: usuario.correo, contrasena: CONTRASENA });

  assert.equal(resultado.tipo, "autenticado");
  assert.equal(repositorio.hashesRehechos.length, 1);
  assert.equal(necesitaRehacerse(repositorio.hashesRehechos[0]), false);
});

test("al entrar con un hash al día no se reescribe nada", async () => {
  const repositorio = new RepositorioMemoria(await crearUsuario());

  await new ServicioAutenticacion(repositorio, configuracion, () => fechaBase).iniciarSesion({
    correo: repositorio.usuario!.correo,
    contrasena: CONTRASENA,
  });

  assert.equal(repositorio.hashesRehechos.length, 0);
});
