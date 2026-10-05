import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import type {
  DatosAsociacionPersistidos,
  DatosClubPersistidos,
  IntegranteAdministrado,
  OrganizacionAdministrada,
  RedSocialAdministrada,
  RepositorioOrganizaciones,
} from "../src/lib/organizaciones/repositorio-organizaciones";
import { ServicioOrganizaciones } from "../src/lib/organizaciones/servicio-organizaciones";
import {
  esquemaAsociacionAdmin,
  esquemaClubAdmin,
  esquemaIntegranteAdmin,
  esquemaRedSocialAdmin,
  interpretarOrganizacion,
  interpretarTipoOrganizacion,
  type DatosAsociacionAdmin,
  type DatosClubAdmin,
  type DatosIntegranteAdmin,
  type DatosRedSocialAdmin,
  type TipoOrganizacion,
} from "../src/validators/organizacion-admin";

const FORMULARIO_ASOCIACION = {
  nombre: "Asociación de Estudiantes de Ingeniería",
  descripcion: "Representa al estudiantado de la Facultad de Ingeniería.",
  mision: "Acompañar al estudiantado en su vida académica.",
  vision: "Una facultad con participación activa.",
  correo: "aei@uvg.edu.gt",
  informacionContacto: "Oficina CIT-204",
  imagenUrl: "",
};

const FORMULARIO_CLUB = {
  nombre: "Club de Robótica",
  descripcion: "Construcción de robots para competencias nacionales.",
  actividades: "Reuniones los miércoles y competencias por ciclo.",
  correo: "",
  informacionContacto: "",
  imagenUrl: "",
};

function asociacionValida(cambios: Record<string, unknown> = {}): DatosAsociacionAdmin {
  return esquemaAsociacionAdmin.parse({ ...FORMULARIO_ASOCIACION, ...cambios });
}

function clubValido(cambios: Record<string, unknown> = {}): DatosClubAdmin {
  return esquemaClubAdmin.parse({ ...FORMULARIO_CLUB, ...cambios });
}

function organizacionGuardada(
  cambios: Partial<OrganizacionAdministrada> = {}
): OrganizacionAdministrada {
  return {
    id: 3,
    nombre: "Asociación de Estudiantes de Ingeniería",
    descripcion: null,
    mision: null,
    vision: null,
    actividades: null,
    correo: null,
    informacionContacto: null,
    imagenUrl: null,
    activo: true,
    ...cambios,
  };
}

class RepositorioFalso implements RepositorioOrganizaciones {
  asociacionesCreadas: DatosAsociacionPersistidos[] = [];
  clubesCreados: DatosClubPersistidos[] = [];
  estadosEscritos: boolean[] = [];
  eliminados: { tipo: TipoOrganizacion; id: number }[] = [];
  integrantesCreados: DatosIntegranteAdmin[] = [];
  redesCreadas: DatosRedSocialAdmin[] = [];
  nombresConsultados: { nombre: string; excepto: number | null }[] = [];

  constructor(
    private readonly opciones: {
      nombreLibre?: boolean;
      organizacion?: OrganizacionAdministrada | null;
      organizaEventos?: boolean;
      actualizado?: boolean;
      redRegistrada?: boolean;
    } = {}
  ) {}

  async nombreDisponible(
    _tipo: TipoOrganizacion,
    nombre: string,
    excepto: number | null
  ): Promise<boolean> {
    this.nombresConsultados.push({ nombre, excepto });
    return this.opciones.nombreLibre ?? true;
  }

  async crearAsociacion(datos: DatosAsociacionPersistidos): Promise<number> {
    this.asociacionesCreadas.push(datos);
    return 11;
  }

  async crearClub(datos: DatosClubPersistidos): Promise<number> {
    this.clubesCreados.push(datos);
    return 22;
  }

  async actualizarAsociacion(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async actualizarClub(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async obtener(): Promise<OrganizacionAdministrada | null> {
    return this.opciones.organizacion === undefined
      ? organizacionGuardada()
      : this.opciones.organizacion;
  }

  async cambiarEstado(_tipo: TipoOrganizacion, _id: number, activo: boolean): Promise<boolean> {
    this.estadosEscritos.push(activo);
    return this.opciones.organizacion !== null;
  }

  async organizaEventos(): Promise<boolean> {
    return this.opciones.organizaEventos ?? false;
  }

  async eliminar(tipo: TipoOrganizacion, id: number): Promise<boolean> {
    this.eliminados.push({ tipo, id });
    return true;
  }

  async crearIntegrante(_idAsociacion: number, datos: DatosIntegranteAdmin): Promise<number> {
    this.integrantesCreados.push(datos);
    return 5;
  }

  async actualizarIntegrante(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async eliminarIntegrante(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async listarIntegrantes(): Promise<IntegranteAdministrado[]> {
    return [];
  }

  async redSocialRegistrada(): Promise<boolean> {
    return this.opciones.redRegistrada ?? false;
  }

  async crearRedSocial(
    _tipo: TipoOrganizacion,
    _id: number,
    datos: DatosRedSocialAdmin
  ): Promise<number> {
    this.redesCreadas.push(datos);
    return 9;
  }

  async eliminarRedSocial(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async listarRedesSociales(): Promise<RedSocialAdministrada[]> {
    return [];
  }
}

// ---------- Esquemas ----------

test("el formulario de asociación válido se interpreta con sus tipos", () => {
  const datos = asociacionValida();

  assert.equal(datos.nombre, "Asociación de Estudiantes de Ingeniería");
  assert.equal(datos.imagenUrl, null);
  assert.equal(datos.correo, "aei@uvg.edu.gt");
});

test("un nombre de menos de tres caracteres no se acepta", () => {
  assert.equal(
    esquemaAsociacionAdmin.safeParse({ ...FORMULARIO_ASOCIACION, nombre: "AB" }).success,
    false
  );
});

test("los campos opcionales vacíos se guardan como nulos", () => {
  const datos = asociacionValida({ mision: "", vision: "", correo: "", informacionContacto: "" });

  assert.equal(datos.mision, null);
  assert.equal(datos.vision, null);
  assert.equal(datos.correo, null);
  assert.equal(datos.informacionContacto, null);
});

test("un correo mal escrito se rechaza y uno vacío no", () => {
  assert.equal(
    esquemaAsociacionAdmin.safeParse({ ...FORMULARIO_ASOCIACION, correo: "sin-arroba" }).success,
    false
  );
  assert.equal(
    esquemaAsociacionAdmin.safeParse({ ...FORMULARIO_ASOCIACION, correo: "" }).success,
    true
  );
});

test("un enlace de imagen sin esquema se completa con https", () => {
  const datos = asociacionValida({ imagenUrl: "ejemplo.com/logo.png" });

  assert.equal(datos.imagenUrl, "https://ejemplo.com/logo.png");
});

test("un enlace de imagen con un esquema peligroso se rechaza", () => {
  for (const imagenUrl of ["javascript:alert(1)", "data:image/png;base64,AAA"]) {
    assert.equal(
      esquemaAsociacionAdmin.safeParse({ ...FORMULARIO_ASOCIACION, imagenUrl }).success,
      false,
      imagenUrl
    );
  }
});

test("el formulario de club acepta sus actividades y no exige misión", () => {
  const datos = clubValido();

  assert.equal(datos.actividades, "Reuniones los miércoles y competencias por ciclo.");
  assert.equal(datos.correo, null);
});

test("el tipo de la dirección solo admite asociaciones y clubes", () => {
  assert.equal(interpretarTipoOrganizacion("asociaciones"), "asociaciones");
  assert.equal(interpretarTipoOrganizacion("clubes"), "clubes");
  assert.equal(interpretarTipoOrganizacion("tutores"), null);
  assert.equal(interpretarTipoOrganizacion(""), null);
});

test("la lectura del cuerpo usa el esquema que corresponde al tipo", () => {
  const asociacion = interpretarOrganizacion("asociaciones", FORMULARIO_ASOCIACION);
  const club = interpretarOrganizacion("clubes", FORMULARIO_CLUB);

  assert.equal(asociacion.valida && asociacion.entrada.tipo, "asociaciones");
  assert.equal(club.valida && club.entrada.tipo, "clubes");
});

test("una lectura inválida devuelve los errores por campo", () => {
  const lectura = interpretarOrganizacion("clubes", { nombre: "" });

  assert.equal(lectura.valida, false);
  assert.ok(!lectura.valida && lectura.errores.nombre);
});

test("una red social solo admite enlaces http y https", () => {
  assert.equal(
    esquemaRedSocialAdmin.safeParse({ plataforma: "Instagram", url: "https://instagram.com/x" })
      .success,
    true
  );
  assert.equal(
    esquemaRedSocialAdmin.safeParse({ plataforma: "Instagram", url: "javascript:alert(1)" })
      .success,
    false
  );
  assert.equal(
    esquemaRedSocialAdmin.safeParse({ plataforma: "Instagram", url: "instagram.com/x" }).success,
    false
  );
});

test("un integrante sin orden indicado se guarda al inicio", () => {
  const datos = esquemaIntegranteAdmin.parse({
    nombre: "Marcos Montoya",
    cargo: "Presidente",
    periodo: "2026",
    fotoUrl: "",
    ordenVisualizacion: "",
  });

  assert.equal(datos.ordenVisualizacion, 0);
  assert.equal(datos.fotoUrl, null);
});

// ---------- Servicio ----------

test("crear guarda el texto de búsqueda de la asociación", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.crear({ tipo: "asociaciones", datos: asociacionValida() });

  assert.deepEqual(resultado, { tipo: "guardada", id: 11 });
  assert.ok(repositorio.asociacionesCreadas[0].textoBusqueda.includes("ingenieria"));
  assert.ok(repositorio.asociacionesCreadas[0].textoBusqueda.includes("academica"));
});

test("crear un club guarda sus actividades en el texto de búsqueda", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.crear({ tipo: "clubes", datos: clubValido() });

  assert.deepEqual(resultado, { tipo: "guardada", id: 22 });
  assert.ok(repositorio.clubesCreados[0].textoBusqueda.includes("miercoles"));
});

test("un nombre ya registrado no se guarda y el error apunta al campo", async () => {
  const repositorio = new RepositorioFalso({ nombreLibre: false });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.crear({ tipo: "clubes", datos: clubValido() });

  assert.equal(resultado.tipo, "invalida");
  assert.ok(resultado.tipo === "invalida" && resultado.errores.nombre);
  assert.equal(repositorio.clubesCreados.length, 0);
});

test("al editar, el nombre propio no cuenta como repetido", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  await servicio.editar(7, { tipo: "asociaciones", datos: asociacionValida() });

  assert.deepEqual(repositorio.nombresConsultados[0], {
    nombre: "Asociación de Estudiantes de Ingeniería",
    excepto: 7,
  });
});

test("editar un registro inexistente responde no encontrada", async () => {
  const repositorio = new RepositorioFalso({ actualizado: false });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.editar(7, { tipo: "clubes", datos: clubValido() });

  assert.equal(resultado.tipo, "no_encontrada");
});

test("dar de baja y reactivar escriben el estado pedido", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  await servicio.cambiarEstado("asociaciones", 3, false);
  await servicio.cambiarEstado("asociaciones", 3, true);

  assert.deepEqual(repositorio.estadosEscritos, [false, true]);
});

test("una organización que organiza eventos no se elimina", async () => {
  const repositorio = new RepositorioFalso({ organizaEventos: true });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.eliminar("asociaciones", 3);

  assert.equal(resultado.tipo, "no_permitida");
  assert.ok(resultado.tipo === "no_permitida" && resultado.mensaje.includes("dala de baja"));
  assert.equal(repositorio.eliminados.length, 0);
});

test("una organización sin eventos sí se elimina", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.eliminar("clubes", 8);

  assert.deepEqual(resultado, { tipo: "eliminada" });
  assert.deepEqual(repositorio.eliminados, [{ tipo: "clubes", id: 8 }]);
});

test("eliminar una organización inexistente responde no encontrada", async () => {
  const repositorio = new RepositorioFalso({ organizacion: null });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.eliminar("clubes", 8);

  assert.equal(resultado.tipo, "no_encontrada");
});

test("no se registran integrantes de una asociación que no existe", async () => {
  const repositorio = new RepositorioFalso({ organizacion: null });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.guardarIntegrante(3, {
    nombre: "Marcos Montoya",
    cargo: "Presidente",
    periodo: "2026",
    fotoUrl: null,
    ordenVisualizacion: 1,
  });

  assert.equal(resultado.tipo, "no_encontrada");
  assert.equal(repositorio.integrantesCreados.length, 0);
});

test("una red social repetida no se duplica", async () => {
  const repositorio = new RepositorioFalso({ redRegistrada: true });
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.agregarRedSocial("clubes", 8, {
    plataforma: "Instagram",
    url: "https://instagram.com/x",
  });

  assert.equal(resultado.tipo, "invalida");
  assert.ok(resultado.tipo === "invalida" && resultado.errores.url);
  assert.equal(repositorio.redesCreadas.length, 0);
});

test("una red social nueva se guarda", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioOrganizaciones(repositorio);

  const resultado = await servicio.agregarRedSocial("asociaciones", 3, {
    plataforma: "Instagram",
    url: "https://instagram.com/x",
  });

  assert.deepEqual(resultado, { tipo: "guardada", id: 9 });
  assert.equal(repositorio.redesCreadas.length, 1);
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

test("sin sesión la administración de organizaciones responde 401", async () => {
  const manejador = protegerConAcceso(
    acceso({ tipo: "sin_sesion" }),
    [ROLES.administrador],
    async () => Response.json({ ok: true })
  );

  assert.equal((await manejador()).status, 401);
});

test("con sesión pero sin el rol responde 404 y no ejecuta el manejador", async () => {
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
