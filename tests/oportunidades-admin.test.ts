import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import { aHoraDeBase, aHoraDeReloj, PATRON_HORA } from "../src/lib/horas-beca/horario-oportunidad";
import type {
  DatosOportunidadPersistidos,
  EstadoActualOportunidad,
  RepositorioOportunidades,
} from "../src/lib/horas-beca/repositorio-oportunidades";
import { ServicioOportunidades } from "../src/lib/horas-beca/servicio-oportunidades";
import {
  esquemaOportunidadAdmin,
  interpretarAccionOportunidad,
  interpretarEstadoOportunidad,
  MAXIMO_PERSONAS_OPORTUNIDAD,
  type EstadoOportunidadFiltro,
} from "../src/validators/oportunidad-admin";

const FORMULARIO = {
  nombre: "Apoyo en la Feria de Voluntariado",
  descripcion: "Apoyo en los puestos de registro y en la entrega de material informativo.",
  fecha: "2027-02-20",
  horaInicio: "08:00",
  horaFin: "12:00",
  lugar: "Plaza central del campus",
  cantidadPersonas: "6",
  informacionAdicional: "",
};

const formulario = (cambios: Partial<typeof FORMULARIO> = {}) => ({ ...FORMULARIO, ...cambios });

/** Repositorio de mentira: deja ver qué se escribió sin tocar la base. */
class RepositorioFalso implements RepositorioOportunidades {
  creadas: { datos: DatosOportunidadPersistidos; creadoPor: number }[] = [];
  actualizadas: { id: number; datos: DatosOportunidadPersistidos }[] = [];
  estados: { id: number; estado: EstadoOportunidadFiltro }[] = [];
  eliminadas: number[] = [];

  constructor(private readonly actual: EstadoActualOportunidad | null = null) {}

  async estadoActual(): Promise<EstadoActualOportunidad | null> {
    return this.actual;
  }

  async crear(datos: DatosOportunidadPersistidos, creadoPor: number): Promise<number> {
    this.creadas.push({ datos, creadoPor });
    return 7;
  }

  async actualizar(id: number, datos: DatosOportunidadPersistidos): Promise<boolean> {
    this.actualizadas.push({ id, datos });
    return true;
  }

  async cambiarEstado(id: number, estado: EstadoOportunidadFiltro): Promise<boolean> {
    this.estados.push({ id, estado });
    return true;
  }

  async eliminar(id: number): Promise<boolean> {
    this.eliminadas.push(id);
    return true;
  }
}

// ---------- Horas de reloj ----------

test("las horas de reloj van y vienen de la base sin correrse", () => {
  assert.equal(aHoraDeBase("14:00").toISOString(), "1970-01-01T14:00:00.000Z");
  assert.equal(aHoraDeReloj(aHoraDeBase("08:30")), "08:30");
  assert.equal(aHoraDeReloj(new Date("1970-01-01T23:59:00.000Z")), "23:59");
});

test("el patrón de hora acepta las horas del reloj y rechaza lo demás", () => {
  for (const hora of ["00:00", "09:05", "14:00", "23:59"]) {
    assert.ok(PATRON_HORA.test(hora), `debería aceptar ${hora}`);
  }
  for (const hora of ["24:00", "9:00", "14:60", "14h00", ""]) {
    assert.equal(PATRON_HORA.test(hora), false, `debería rechazar ${hora}`);
  }
});

// ---------- Validación ----------

test("una convocatoria completa pasa la validación", () => {
  const resultado = esquemaOportunidadAdmin.safeParse(formulario());

  assert.equal(resultado.success, true);
  if (!resultado.success) return;
  assert.equal(resultado.data.cantidadPersonas, 6);
  assert.equal(resultado.data.informacionAdicional, null);
});

test("la hora de fin tiene que ser posterior a la de inicio", () => {
  for (const [inicio, fin] of [
    ["12:00", "08:00"],
    ["08:00", "08:00"],
  ]) {
    const resultado = esquemaOportunidadAdmin.safeParse(
      formulario({ horaInicio: inicio, horaFin: fin })
    );

    assert.equal(resultado.success, false, `${inicio}-${fin} no debería pasar`);
    if (resultado.success) continue;
    assert.deepEqual(resultado.error.issues[0].path, ["horaFin"]);
  }
});

test("la cantidad de personas tiene que ser un entero mayor que cero", () => {
  for (const cantidad of [
    "0",
    "-3",
    "2.5",
    "",
    "muchas",
    String(MAXIMO_PERSONAS_OPORTUNIDAD + 1),
  ]) {
    const resultado = esquemaOportunidadAdmin.safeParse(formulario({ cantidadPersonas: cantidad }));

    assert.equal(resultado.success, false, `${cantidad} no debería pasar`);
  }
});

test("la fecha se exige como día de calendario", () => {
  for (const fecha of ["20/02/2027", "2027-2-20", "mañana", ""]) {
    assert.equal(
      esquemaOportunidadAdmin.safeParse(formulario({ fecha })).success,
      false,
      `${fecha} no debería pasar`
    );
  }
});

test("la información adicional es el único campo opcional", () => {
  const conTexto = esquemaOportunidadAdmin.safeParse(
    formulario({ informacionAdicional: "  Buscar a la encargada en la entrada.  " })
  );

  assert.equal(conTexto.success, true);
  if (conTexto.success) {
    assert.equal(conTexto.data.informacionAdicional, "Buscar a la encargada en la entrada.");
  }

  for (const campo of ["nombre", "descripcion", "lugar"] as const) {
    assert.equal(
      esquemaOportunidadAdmin.safeParse(formulario({ [campo]: "" })).success,
      false,
      `${campo} debería ser obligatorio`
    );
  }
});

test("el estado no se puede colar en el cuerpo del formulario", () => {
  const resultado = esquemaOportunidadAdmin.safeParse({ ...formulario(), estado: "PUBLICADA" });

  assert.equal(resultado.success, true);
  if (!resultado.success) return;
  assert.equal("estado" in resultado.data, false);
});

test("las acciones y los estados de la dirección se interpretan o se descartan", () => {
  assert.equal(interpretarAccionOportunidad("publicar"), "publicar");
  assert.equal(interpretarAccionOportunidad("borrar"), null);
  assert.equal(interpretarAccionOportunidad(undefined), null);
  assert.equal(interpretarEstadoOportunidad("publicada"), "PUBLICADA");
  assert.equal(interpretarEstadoOportunidad(["borrador"]), "BORRADOR");
  assert.equal(interpretarEstadoOportunidad("inventado"), undefined);
  assert.equal(interpretarEstadoOportunidad(undefined), undefined);
});

// ---------- Reglas del servicio ----------

test("la convocatoria nace como borrador y a nombre de quien la creó", async () => {
  const repositorio = new RepositorioFalso();
  const datos = esquemaOportunidadAdmin.parse(formulario());

  const resultado = await new ServicioOportunidades(repositorio).crear(datos, 3);

  assert.deepEqual(resultado, { tipo: "guardada", id: 7 });
  assert.equal(repositorio.creadas.length, 1);
  assert.equal(repositorio.creadas[0].creadoPor, 3);
  // El estado no viaja: la columna nace como BORRADOR por omisión.
  assert.equal("estado" in repositorio.creadas[0].datos, false);
  assert.equal(repositorio.creadas[0].datos.fecha.toISOString(), "2027-02-20T00:00:00.000Z");
  assert.equal(repositorio.creadas[0].datos.horaInicio.toISOString(), "1970-01-01T08:00:00.000Z");
});

test("editar una convocatoria no toca su estado", async () => {
  const repositorio = new RepositorioFalso({ estado: "PUBLICADA", registros: 0 });
  const datos = esquemaOportunidadAdmin.parse(formulario({ lugar: "Biblioteca" }));

  const resultado = await new ServicioOportunidades(repositorio).editar(4, datos);

  assert.deepEqual(resultado, { tipo: "guardada", id: 4 });
  assert.equal(repositorio.actualizadas[0].datos.lugar, "Biblioteca");
  assert.equal(repositorio.estados.length, 0);
});

test("una convocatoria cancelada o finalizada ya no se edita", async () => {
  for (const estado of ["CANCELADA", "FINALIZADA"] as const) {
    const repositorio = new RepositorioFalso({ estado, registros: 2 });
    const datos = esquemaOportunidadAdmin.parse(formulario());

    const resultado = await new ServicioOportunidades(repositorio).editar(4, datos);

    assert.equal(resultado.tipo, "invalida");
    assert.equal(repositorio.actualizadas.length, 0);
  }
});

test("editar una convocatoria que no existe responde que no se encontró", async () => {
  const repositorio = new RepositorioFalso(null);
  const datos = esquemaOportunidadAdmin.parse(formulario());

  const resultado = await new ServicioOportunidades(repositorio).editar(99, datos);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

test("un borrador se publica y una publicada se cierra", async () => {
  const borrador = new RepositorioFalso({ estado: "BORRADOR", registros: 0 });
  assert.deepEqual(await new ServicioOportunidades(borrador).cambiarEstado(1, "publicar"), {
    tipo: "aplicado",
    estado: "PUBLICADA",
  });

  const publicada = new RepositorioFalso({ estado: "PUBLICADA", registros: 3 });
  assert.deepEqual(await new ServicioOportunidades(publicada).cambiarEstado(1, "cerrar"), {
    tipo: "aplicado",
    estado: "CERRADA",
  });
});

test("pedir el estado que ya tiene se rechaza en lugar de escribirlo otra vez", async () => {
  const repositorio = new RepositorioFalso({ estado: "PUBLICADA", registros: 0 });

  const resultado = await new ServicioOportunidades(repositorio).cambiarEstado(1, "publicar");

  assert.equal(resultado.tipo, "no_permitido");
  assert.equal(repositorio.estados.length, 0);
});

test("una convocatoria cancelada o finalizada ya no cambia de estado", async () => {
  for (const estado of ["CANCELADA", "FINALIZADA"] as const) {
    const repositorio = new RepositorioFalso({ estado, registros: 0 });

    const resultado = await new ServicioOportunidades(repositorio).cambiarEstado(1, "publicar");

    assert.equal(resultado.tipo, "no_permitido");
    assert.equal(repositorio.estados.length, 0);
  }
});

test("una convocatoria sin horas registradas se elimina", async () => {
  const repositorio = new RepositorioFalso({ estado: "BORRADOR", registros: 0 });

  const resultado = await new ServicioOportunidades(repositorio).eliminar(5);

  assert.deepEqual(resultado, { tipo: "eliminada" });
  assert.deepEqual(repositorio.eliminadas, [5]);
});

test("una convocatoria con horas registradas no se elimina: se cancela", async () => {
  const repositorio = new RepositorioFalso({ estado: "CERRADA", registros: 4 });

  const resultado = await new ServicioOportunidades(repositorio).eliminar(5);

  assert.equal(resultado.tipo, "no_permitida");
  if (resultado.tipo !== "no_permitida") return;
  assert.match(resultado.mensaje, /Cancélala/);
  assert.deepEqual(repositorio.eliminadas, []);
});

test("eliminar una convocatoria que no existe responde que no se encontró", async () => {
  const resultado = await new ServicioOportunidades(new RepositorioFalso(null)).eliminar(99);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

// ---------- Permisos ----------

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "admin.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Administrador Prueba",
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("sin sesión la administración de convocatorias responde 401", async () => {
  const manejador = protegerConAcceso(
    acceso({ tipo: "sin_sesion" }),
    [ROLES.administrador],
    async () => Response.json({ ok: true })
  );

  assert.equal((await manejador()).status, 401);
});

test("un estudiante no alcanza las convocatorias ni ejecuta el manejador", async () => {
  let ejecutado = false;
  const manejador = protegerConAcceso(
    acceso({ tipo: "sin_permiso", usuario: usuario([ROLES.estudiante]) }),
    [ROLES.administrador],
    async () => {
      ejecutado = true;
      return Response.json({ ok: true });
    }
  );

  assert.equal((await manejador()).status, 404);
  assert.equal(ejecutado, false);
});

test("con el rol de administrador el manejador se ejecuta", async () => {
  const manejador = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.administrador]) }),
    [ROLES.administrador],
    async () => Response.json({ ok: true })
  );

  assert.equal((await manejador()).status, 200);
});
