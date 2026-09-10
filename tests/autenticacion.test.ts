import assert from "node:assert/strict";
import test from "node:test";

import { crearHashContrasena } from "../src/lib/auth/contrasenas";
import { LimitadorIniciosSesion } from "../src/lib/auth/limitador-inicios-sesion";
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

class RepositorioMemoria implements RepositorioAutenticacion {
  ultimoAcceso: Date | null = null;

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
}

async function crearUsuario(
  cambios: Partial<Omit<UsuarioAutenticacion, "contrasenaHash">> = {}
): Promise<UsuarioAutenticacion> {
  return {
    idUsuario: 1,
    correo: "estudiante.prueba@uvg.edu.gt",
    contrasenaHash: await crearHashContrasena("PruebaSegura1!"),
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

test("limita intentos repetidos y libera el límite después de la ventana configurada", () => {
  const limitador = new LimitadorIniciosSesion(2, 1_000);
  const clave = "127.0.0.1:estudiante.prueba@uvg.edu.gt";

  limitador.registrarFallo(clave, fechaBase);
  limitador.registrarFallo(clave, fechaBase);
  assert.equal(limitador.permitir(clave, fechaBase), false);
  assert.equal(limitador.permitir(clave, new Date(fechaBase.getTime() + 1_001)), true);
});
