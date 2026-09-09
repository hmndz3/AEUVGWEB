import assert from "node:assert/strict";
import test from "node:test";

import { puedeAutenticarse } from "../src/lib/auth/politica-autenticacion";
import type {
  CuentaParaReenvio,
  DatosCuentaNueva,
  RepositorioRegistro,
  ResultadoCrearCuenta,
} from "../src/lib/auth/repositorio-registro";
import { ServicioRegistro } from "../src/lib/auth/servicio-registro";
import { crearHashToken } from "../src/lib/auth/tokens-verificacion";
import { ProveedorCorreoMemoria } from "../src/lib/correo/proveedor-correo";
import { crearEsquemaRegistro } from "../src/validators/registro";

type CuentaMemoria = CuentaParaReenvio & {
  carnet: string;
  contrasenaHash: string;
  correoVerificado: boolean;
  estado: "ACTIVO" | "PENDIENTE";
};

type TokenMemoria = {
  correo: string;
  hash: string;
  vence: Date;
  creado: Date;
  usado: boolean;
  invalidado: boolean;
};

class RepositorioMemoria implements RepositorioRegistro {
  cuentas: CuentaMemoria[] = [];
  tokens: TokenMemoria[] = [];
  ahora = new Date("2026-09-09T15:00:00.000Z");

  async crearCuenta(datos: DatosCuentaNueva): Promise<ResultadoCrearCuenta> {
    if (
      this.cuentas.some(
        (cuenta) => cuenta.correo === datos.correo || cuenta.carnet === datos.carnet
      )
    ) {
      return { tipo: "duplicada" };
    }
    if (datos.idFacultad !== 1 || datos.idCarrera !== 10) return { tipo: "catalogo_invalido" };

    const cuenta: CuentaMemoria = {
      idUsuario: this.cuentas.length + 1,
      correo: datos.correo,
      carnet: datos.carnet,
      nombreCompleto: datos.nombreCompleto,
      contrasenaHash: datos.contrasenaHash,
      correoVerificado: false,
      estado: "PENDIENTE",
    };
    this.cuentas.push(cuenta);
    this.tokens.push({
      correo: cuenta.correo,
      hash: datos.tokenHash,
      vence: datos.fechaExpiracion,
      creado: new Date(this.ahora),
      usado: false,
      invalidado: false,
    });
    return { tipo: "creada", cuenta };
  }

  async consumirToken(hash: string, fecha: Date): Promise<boolean> {
    const token = this.tokens.find((item) => item.hash === hash);
    const cuenta = token && this.cuentas.find((item) => item.correo === token.correo);

    if (
      !token ||
      !cuenta ||
      token.usado ||
      token.invalidado ||
      token.vence <= fecha ||
      cuenta.correoVerificado
    ) {
      return false;
    }

    token.usado = true;
    cuenta.correoVerificado = true;
    cuenta.estado = "ACTIVO";
    return true;
  }

  async prepararReenvio({
    correo,
    tokenHash,
    fechaExpiracion,
    fecha,
    segundosEspera,
    maximosPorHora,
  }: Parameters<RepositorioRegistro["prepararReenvio"]>[0]): Promise<CuentaParaReenvio | null> {
    const cuenta = this.cuentas.find((item) => item.correo === correo);
    if (!cuenta || cuenta.correoVerificado) return null;

    const tokensCuenta = this.tokens.filter((item) => item.correo === correo);
    const ultimo = tokensCuenta.at(-1);
    const enLaHora = tokensCuenta.filter(
      (item) => fecha.getTime() - item.creado.getTime() <= 60 * 60_000
    ).length;
    if (
      (ultimo && fecha.getTime() - ultimo.creado.getTime() < segundosEspera * 1000) ||
      enLaHora >= maximosPorHora
    ) {
      return null;
    }

    for (const token of tokensCuenta) {
      if (!token.usado) token.invalidado = true;
    }
    this.tokens.push({
      correo,
      hash: tokenHash,
      vence: fechaExpiracion,
      creado: new Date(fecha),
      usado: false,
      invalidado: false,
    });
    return cuenta;
  }
}

const datosBase = {
  nombreCompleto: "Estudiante de Prueba",
  carnet: "24852",
  correo: "gua24852@uvg.edu.gt",
  idFacultad: 1,
  idCarrera: 10,
  contrasena: "ClaveSegura1!",
  confirmarContrasena: "ClaveSegura1!",
  aceptaTerminos: true as const,
};

function preparar() {
  const repositorio = new RepositorioMemoria();
  const correo = new ProveedorCorreoMemoria();
  let fecha = new Date(repositorio.ahora);
  const servicio = new ServicioRegistro(
    repositorio,
    correo,
    {
      urlAplicacion: "http://localhost:3000",
      minutosVigenciaToken: 30,
      segundosEsperaReenvio: 60,
      maximosReenviosPorHora: 5,
    },
    () => new Date(fecha)
  );

  return {
    repositorio,
    correo,
    servicio,
    avanzar: (milisegundos: number) => {
      fecha = new Date(fecha.getTime() + milisegundos);
      repositorio.ahora = new Date(fecha);
    },
  };
}

function tokenDelCorreo(texto: string): string {
  const coincidencia = texto.match(/https?:\/\/\S+/);
  assert.ok(coincidencia);
  return new URL(coincidencia[0]).searchParams.get("token") ?? "";
}

test("rechaza un dominio parecido y acepta únicamente el dominio configurado", () => {
  const esquema = crearEsquemaRegistro("uvg.edu.gt");

  assert.equal(esquema.safeParse({ ...datosBase, correo: "gua24852@uvg.edugt" }).success, false);
  assert.equal(esquema.safeParse(datosBase).success, true);
});

test("crea la cuenta pendiente, cifra la contraseña y envía un token cuyo hash es lo único persistido", async () => {
  const contexto = preparar();
  const resultado = await contexto.servicio.registrar(datosBase);

  assert.equal(resultado.tipo, "creada");
  assert.equal(contexto.correo.mensajes.length, 1);
  assert.notEqual(contexto.repositorio.cuentas[0].contrasenaHash, datosBase.contrasena);
  assert.match(contexto.repositorio.cuentas[0].contrasenaHash, /^scrypt\$/);
  const token = tokenDelCorreo(contexto.correo.mensajes[0].texto);
  assert.equal(contexto.repositorio.tokens[0].hash, crearHashToken(token));
  assert.equal(JSON.stringify(contexto.repositorio.tokens).includes(token), false);
  assert.equal(puedeAutenticarse(contexto.repositorio.cuentas[0]), false);
});

test("rechaza correo o carnet duplicados con el mismo resultado", async () => {
  const contexto = preparar();
  assert.equal((await contexto.servicio.registrar(datosBase)).tipo, "creada");
  assert.equal(
    (await contexto.servicio.registrar({ ...datosBase, carnet: "24853" })).tipo,
    "duplicada"
  );
  assert.equal(
    (
      await contexto.servicio.registrar({
        ...datosBase,
        carnet: datosBase.carnet,
        correo: "otro@uvg.edu.gt",
      })
    ).tipo,
    "duplicada"
  );
});

test("rechaza una carrera que no pertenece a la facultad seleccionada", async () => {
  const contexto = preparar();
  const resultado = await contexto.servicio.registrar({ ...datosBase, idFacultad: 2 });

  assert.equal(resultado.tipo, "catalogo_invalido");
  assert.equal(contexto.repositorio.cuentas.length, 0);
});

test("rechaza tokens inválidos, vencidos y reutilizados", async () => {
  const invalido = preparar();
  assert.equal(await invalido.servicio.verificar("token-inexistente-de-prueba-123456"), false);

  const vencido = preparar();
  await vencido.servicio.registrar(datosBase);
  const tokenVencido = tokenDelCorreo(vencido.correo.mensajes[0].texto);
  vencido.avanzar(31 * 60_000);
  assert.equal(await vencido.servicio.verificar(tokenVencido), false);

  const usado = preparar();
  await usado.servicio.registrar(datosBase);
  const tokenUsado = tokenDelCorreo(usado.correo.mensajes[0].texto);
  assert.equal(await usado.servicio.verificar(tokenUsado), true);
  assert.equal(await usado.servicio.verificar(tokenUsado), false);
  assert.equal(puedeAutenticarse(usado.repositorio.cuentas[0]), true);
});

test("el reenvío respeta el enfriamiento e invalida el token anterior", async () => {
  const contexto = preparar();
  await contexto.servicio.registrar(datosBase);
  const tokenAnterior = tokenDelCorreo(contexto.correo.mensajes[0].texto);

  await contexto.servicio.reenviar(datosBase.correo);
  assert.equal(contexto.correo.mensajes.length, 1);

  contexto.avanzar(61_000);
  await contexto.servicio.reenviar(datosBase.correo);
  assert.equal(contexto.correo.mensajes.length, 2);
  assert.equal(await contexto.servicio.verificar(tokenAnterior), false);
  const tokenNuevo = tokenDelCorreo(contexto.correo.mensajes[1].texto);
  assert.equal(await contexto.servicio.verificar(tokenNuevo), true);
});

test("el reenvío limita la cantidad de tokens creados por hora", async () => {
  const contexto = preparar();
  await contexto.servicio.registrar(datosBase);

  for (let intento = 0; intento < 5; intento += 1) {
    contexto.avanzar(61_000);
    await contexto.servicio.reenviar(datosBase.correo);
  }

  // El máximo configurado incluye el token creado durante el registro.
  assert.equal(contexto.correo.mensajes.length, 5);
  assert.equal(contexto.repositorio.tokens.length, 5);
});
