import assert from "node:assert/strict";
import test from "node:test";

import { verificarContrasena } from "../src/lib/auth/contrasenas";
import type {
  CuentaRecuperacion,
  RepositorioRecuperacion,
} from "../src/lib/auth/repositorio-recuperacion";
import { ServicioRecuperacion } from "../src/lib/auth/servicio-recuperacion";
import { crearHashToken } from "../src/lib/auth/tokens-verificacion";
import { ProveedorCorreoMemoria } from "../src/lib/correo/proveedor-correo";
import { esquemaRestablecerContrasena } from "../src/validators/recuperacion";

const CORREO = "estudiante.prueba@uvg.edu.gt";
const CONTRASENA_NUEVA = "ClaveNuevaSegura1!";

type TokenGuardado = {
  tokenHash: string;
  fechaExpiracion: Date;
  fechaUso: Date | null;
  fechaInvalidacion: Date | null;
  fechaCreacion: Date;
};

/** Reproduce en memoria las reglas que el repositorio real aplica en la base. */
class RepositorioMemoria implements RepositorioRecuperacion {
  readonly tokens: TokenGuardado[] = [];
  contrasenaHash: string | null = null;

  constructor(private readonly cuenta: CuentaRecuperacion | null) {}

  async prepararRecuperacion({
    correo,
    tokenHash,
    fechaExpiracion,
    fecha,
    segundosEspera,
    maximosPorHora,
  }: Parameters<RepositorioRecuperacion["prepararRecuperacion"]>[0]) {
    if (!this.cuenta || this.cuenta.correo !== correo) return null;

    const ultimo = this.tokens.at(-1);
    const esperaCumplida =
      !ultimo || fecha.getTime() - ultimo.fechaCreacion.getTime() >= segundosEspera * 1000;
    const inicioHora = fecha.getTime() - 60 * 60_000;
    const enLaHora = this.tokens.filter(
      (token) => token.fechaCreacion.getTime() >= inicioHora
    ).length;

    if (!esperaCumplida || enLaHora >= maximosPorHora) return null;

    for (const token of this.tokens) {
      if (!token.fechaUso && !token.fechaInvalidacion) token.fechaInvalidacion = fecha;
    }

    this.tokens.push({
      tokenHash,
      fechaExpiracion,
      fechaUso: null,
      fechaInvalidacion: null,
      fechaCreacion: fecha,
    });

    return this.cuenta;
  }

  async restablecerContrasena({
    tokenHash,
    contrasenaHash,
    fecha,
  }: Parameters<RepositorioRecuperacion["restablecerContrasena"]>[0]) {
    const token = this.tokens.find((guardado) => guardado.tokenHash === tokenHash);

    if (!token || token.fechaUso || token.fechaInvalidacion || token.fechaExpiracion <= fecha) {
      return false;
    }

    token.fechaUso = fecha;
    this.contrasenaHash = contrasenaHash;
    return true;
  }
}

function preparar(
  cuenta: CuentaRecuperacion | null = {
    idUsuario: 1,
    correo: CORREO,
    nombreCompleto: "Estudiante Prueba",
  }
) {
  let instante = new Date("2026-09-09T15:00:00.000Z");
  const repositorio = new RepositorioMemoria(cuenta);
  const correo = new ProveedorCorreoMemoria();
  const servicio = new ServicioRecuperacion(
    repositorio,
    correo,
    {
      urlAplicacion: "https://aeuvg.example",
      minutosVigenciaToken: 30,
      segundosEsperaReenvio: 60,
      maximosEnviosPorHora: 3,
    },
    () => instante
  );

  return {
    repositorio,
    correo,
    servicio,
    avanzar(milisegundos: number) {
      instante = new Date(instante.getTime() + milisegundos);
    },
    get ahora() {
      return instante;
    },
  };
}

function tokenDelUltimoCorreo(correo: ProveedorCorreoMemoria): string {
  const mensaje = correo.mensajes.at(-1);
  assert.ok(mensaje, "se esperaba un correo enviado");
  const enlace = mensaje.texto.match(/https:\/\/\S+/)?.[0];
  assert.ok(enlace, "el correo debe incluir el enlace");
  return new URL(enlace).searchParams.get("token") ?? "";
}

test("envía el enlace de recuperación a una cuenta activa", async () => {
  const contexto = preparar();

  await contexto.servicio.solicitar(CORREO);

  assert.equal(contexto.correo.mensajes.length, 1);
  assert.equal(contexto.repositorio.tokens.length, 1);
  assert.match(contexto.correo.mensajes[0].texto, /restablecer-contrasena/);
});

test("no revela si el correo existe: una cuenta ausente no produce error ni correo", async () => {
  const contexto = preparar(null);

  await contexto.servicio.solicitar("desconocido@uvg.edu.gt");

  assert.equal(contexto.correo.mensajes.length, 0);
  assert.equal(contexto.repositorio.tokens.length, 0);
});

test("el enlace guarda solo el hash del token, nunca el token en claro", async () => {
  const contexto = preparar();
  await contexto.servicio.solicitar(CORREO);

  const token = tokenDelUltimoCorreo(contexto.correo);

  assert.equal(contexto.repositorio.tokens[0].tokenHash, crearHashToken(token));
  assert.notEqual(contexto.repositorio.tokens[0].tokenHash, token);
});

test("restablece la contraseña y guarda el hash en el formato del registro", async () => {
  const contexto = preparar();
  await contexto.servicio.solicitar(CORREO);
  const token = tokenDelUltimoCorreo(contexto.correo);

  const resultado = await contexto.servicio.restablecer(token, CONTRASENA_NUEVA);

  assert.equal(resultado.tipo, "restablecida");
  assert.ok(contexto.repositorio.contrasenaHash);
  assert.equal(
    await verificarContrasena(CONTRASENA_NUEVA, contexto.repositorio.contrasenaHash),
    true
  );
});

test("el enlace es de un solo uso: el segundo intento se rechaza", async () => {
  const contexto = preparar();
  await contexto.servicio.solicitar(CORREO);
  const token = tokenDelUltimoCorreo(contexto.correo);

  await contexto.servicio.restablecer(token, CONTRASENA_NUEVA);
  const segundo = await contexto.servicio.restablecer(token, "OtraClaveSegura1!");

  assert.equal(segundo.tipo, "token_invalido");
});

test("solicitar un enlace nuevo invalida el anterior", async () => {
  const contexto = preparar();
  await contexto.servicio.solicitar(CORREO);
  const primero = tokenDelUltimoCorreo(contexto.correo);

  contexto.avanzar(61_000);
  await contexto.servicio.solicitar(CORREO);

  assert.equal(
    (await contexto.servicio.restablecer(primero, CONTRASENA_NUEVA)).tipo,
    "token_invalido"
  );
  const segundo = tokenDelUltimoCorreo(contexto.correo);
  assert.equal(
    (await contexto.servicio.restablecer(segundo, CONTRASENA_NUEVA)).tipo,
    "restablecida"
  );
});

test("el enlace vencido deja de servir", async () => {
  const contexto = preparar();
  await contexto.servicio.solicitar(CORREO);
  const token = tokenDelUltimoCorreo(contexto.correo);

  contexto.avanzar(31 * 60_000);

  assert.equal(
    (await contexto.servicio.restablecer(token, CONTRASENA_NUEVA)).tipo,
    "token_invalido"
  );
});

test("respeta la espera entre solicitudes y el máximo por hora", async () => {
  const contexto = preparar();

  await contexto.servicio.solicitar(CORREO);
  await contexto.servicio.solicitar(CORREO); // sin esperar: se descarta

  assert.equal(contexto.correo.mensajes.length, 1);

  for (let intento = 0; intento < 5; intento += 1) {
    contexto.avanzar(61_000);
    await contexto.servicio.solicitar(CORREO);
  }

  assert.equal(contexto.correo.mensajes.length, 3);
});

test("la contraseña nueva debe cumplir las mismas reglas del registro", () => {
  const debil = esquemaRestablecerContrasena.safeParse({
    token: "abc",
    contrasena: "corta",
    confirmarContrasena: "corta",
  });
  const noCoincide = esquemaRestablecerContrasena.safeParse({
    token: "abc",
    contrasena: CONTRASENA_NUEVA,
    confirmarContrasena: "OtraClaveSegura1!",
  });
  const valida = esquemaRestablecerContrasena.safeParse({
    token: "abc",
    contrasena: CONTRASENA_NUEVA,
    confirmarContrasena: CONTRASENA_NUEVA,
  });

  assert.equal(debil.success, false);
  assert.equal(noCoincide.success, false);
  assert.equal(valida.success, true);
});
