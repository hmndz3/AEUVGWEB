import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import type {
  DatosEventoPersistidos,
  EventoAdministrado,
  OrganizadorNuevo,
  RepositorioEventos,
} from "../src/lib/eventos/repositorio-eventos";
import { construirOrganizadores, ServicioEventos } from "../src/lib/eventos/servicio-eventos";
import {
  erroresPorCampo,
  esquemaEventoAdmin,
  ETIQUETAS_CAMPO_EVENTO,
  type DatosEventoAdmin,
} from "../src/validators/evento-admin";

const FORMULARIO = {
  nombre: "Feria de voluntariado estudiantil",
  descripcion: "Actividad para conocer las oportunidades de voluntariado del ciclo.",
  idCategoriaEvento: "4",
  tipoActividad: "VOLUNTARIADO",
  fechaInicio: "2026-10-01T09:00:00-06:00",
  fechaFin: "2026-10-01T13:00:00-06:00",
  ubicacion: "Plaza central",
  cupo: "",
  informacionAdicional: "",
  imagenUrl: "",
  destacado: false,
  idAsociacion: "2",
  idClub: "",
  unidadUvg: "",
};

function datosValidos(cambios: Record<string, unknown> = {}): DatosEventoAdmin {
  return esquemaEventoAdmin.parse({ ...FORMULARIO, ...cambios });
}

class RepositorioFalso implements RepositorioEventos {
  creados: { datos: DatosEventoPersistidos; organizadores: OrganizadorNuevo[] }[] = [];
  estadosEscritos: string[] = [];
  eliminados: number[] = [];

  constructor(
    private readonly opciones: {
      categoriaValida?: boolean;
      organizadoresValidos?: boolean;
      evento?: EventoAdministrado | null;
      actualizado?: boolean;
    } = {}
  ) {}

  async categoriaActiva(): Promise<boolean> {
    return this.opciones.categoriaValida ?? true;
  }

  async organizadoresExisten(): Promise<boolean> {
    return this.opciones.organizadoresValidos ?? true;
  }

  async crear(datos: DatosEventoPersistidos, organizadores: OrganizadorNuevo[]): Promise<number> {
    this.creados.push({ datos, organizadores });
    return 10;
  }

  async actualizar(): Promise<boolean> {
    return this.opciones.actualizado ?? true;
  }

  async cambiarEstado(_idEvento: number, estado: string): Promise<boolean> {
    this.estadosEscritos.push(estado);
    return true;
  }

  async eliminar(idEvento: number): Promise<boolean> {
    this.eliminados.push(idEvento);
    return true;
  }

  async obtener(): Promise<EventoAdministrado | null> {
    return this.opciones.evento ?? null;
  }
}

function eventoGuardado(cambios: Partial<EventoAdministrado> = {}): EventoAdministrado {
  return {
    idEvento: 10,
    nombre: "Feria",
    descripcion: "Descripción larga del evento de prueba.",
    idCategoriaEvento: 4,
    tipoActividad: "VOLUNTARIADO",
    fechaInicio: new Date("2026-10-01T15:00:00.000Z"),
    fechaFin: new Date("2026-10-01T19:00:00.000Z"),
    ubicacion: "Plaza central",
    cupo: null,
    informacionAdicional: null,
    imagenUrl: null,
    destacado: false,
    estado: "BORRADOR",
    categoria: { nombre: "Festival", color: "#5A35E8" },
    organizadores: [],
    ...cambios,
  };
}

test("el formulario válido se interpreta con sus tipos", () => {
  const datos = datosValidos();

  assert.equal(datos.idCategoriaEvento, 4);
  assert.equal(datos.cupo, null);
  assert.equal(datos.imagenUrl, null);
  assert.equal(datos.fechaInicio.toISOString(), "2026-10-01T15:00:00.000Z");
});

test("no se acepta una fecha de fin anterior a la de inicio", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    fechaFin: "2026-09-30T13:00:00-06:00",
  });

  assert.equal(resultado.success, false);
  assert.equal(
    resultado.error?.issues.some((problema) => problema.path[0] === "fechaFin"),
    true
  );
});

test("un evento que empieza y termina a la misma hora sí es válido", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    fechaFin: FORMULARIO.fechaInicio,
  });

  assert.equal(resultado.success, true);
});

test("un evento sin organizador es válido: AEUVG publica actividades propias", () => {
  const resultado = esquemaEventoAdmin.safeParse({ ...FORMULARIO, idAsociacion: "" });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data?.idAsociacion, null);
});

test("una unidad de UVG también sirve como organizador", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    idAsociacion: "",
    unidadUvg: "Vida Estudiantil",
  });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data?.unidadUvg, "Vida Estudiantil");
});

test("sin organizadores no se crea ninguna fila de organizador", () => {
  const organizadores = construirOrganizadores(datosValidos({ idAsociacion: "" }));

  assert.deepEqual(organizadores, []);
});

test("todos los mensajes de error del formulario están en español", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    nombre: "",
    descripcion: "",
    idCategoriaEvento: "",
    tipoActividad: "",
    fechaInicio: "",
    fechaFin: "",
    ubicacion: "",
    cupo: "abc",
    informacionAdicional: "",
    imagenUrl: "no-es-url",
    destacado: false,
    idAsociacion: "x",
    idClub: "",
    unidadUvg: "",
  });

  assert.equal(resultado.success, false);
  const mensajes = Object.values(erroresPorCampo(resultado.error!));

  assert.ok(mensajes.length >= 8);
  for (const mensaje of mensajes) {
    // Los mensajes de Zod en inglés empiezan por "Invalid", "Too small", etc.
    assert.doesNotMatch(mensaje, /invalid|expected|required|too (small|big)/i, mensaje);
    assert.match(mensaje, /\.$/, `sin punto final: ${mensaje}`);
  }
});

test("cada campo del formulario tiene una etiqueta legible para el resumen de errores", () => {
  const campos = [
    "nombre",
    "descripcion",
    "idCategoriaEvento",
    "tipoActividad",
    "fechaInicio",
    "fechaFin",
    "ubicacion",
    "cupo",
    "informacionAdicional",
    "imagenUrl",
    "idAsociacion",
    "idClub",
    "unidadUvg",
  ];

  for (const campo of campos) {
    assert.ok(ETIQUETAS_CAMPO_EVENTO[campo], `falta la etiqueta de ${campo}`);
  }
});

test("el nombre y la descripción tienen un mínimo exigible", () => {
  assert.equal(esquemaEventoAdmin.safeParse({ ...FORMULARIO, nombre: "Hola" }).success, false);
  assert.equal(
    esquemaEventoAdmin.safeParse({ ...FORMULARIO, descripcion: "Corta" }).success,
    false
  );
});

test("un enlace de imagen sin esquema se completa con https", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    imagenUrl: "  ejemplo.com/afiche.jpg ",
  });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data?.imagenUrl, "https://ejemplo.com/afiche.jpg");
});

test("un enlace de imagen con esquema se conserva tal cual", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    imagenUrl: "http://ejemplo.com/afiche.jpg",
  });

  assert.equal(resultado.data?.imagenUrl, "http://ejemplo.com/afiche.jpg");
});

test("la ruta de una imagen subida al volumen se conserva tal cual", () => {
  const ruta = "/api/imagenes/0123456789abcdef0123456789abcdef.jpg";
  const resultado = esquemaEventoAdmin.safeParse({ ...FORMULARIO, imagenUrl: ruta });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data?.imagenUrl, ruta);
});

test("una ruta interna distinta a la de imágenes subidas no se acepta como tal", () => {
  const resultado = esquemaEventoAdmin.safeParse({
    ...FORMULARIO,
    imagenUrl: "/api/imagenes/../../etc/passwd",
  });

  assert.notEqual(resultado.data?.imagenUrl, "/api/imagenes/../../etc/passwd");
});

test("solo se aceptan enlaces http y https para la imagen", () => {
  for (const imagenUrl of [
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "file:///C:/foto.jpg",
    "no es un enlace",
  ]) {
    assert.equal(
      esquemaEventoAdmin.safeParse({ ...FORMULARIO, imagenUrl }).success,
      false,
      imagenUrl
    );
  }
});

test("el primer organizador indicado queda como principal", () => {
  const organizadores = construirOrganizadores(
    datosValidos({ idAsociacion: "2", idClub: "5", unidadUvg: "Vida Estudiantil" })
  );

  assert.equal(organizadores.length, 3);
  assert.equal(organizadores[0].idAsociacion, 2);
  assert.equal(organizadores[0].organizadorPrincipal, true);
  assert.equal(organizadores.filter((item) => item.organizadorPrincipal).length, 1);
});

test("cada organizador guarda una sola referencia", () => {
  const organizadores = construirOrganizadores(
    datosValidos({ idAsociacion: "2", idClub: "5", unidadUvg: "Vida Estudiantil" })
  );

  for (const organizador of organizadores) {
    const referencias = [organizador.idAsociacion, organizador.idClub, organizador.unidadUvg];
    assert.equal(referencias.filter((valor) => valor !== null).length, 1);
  }
});

test("crear un evento calcula su texto de búsqueda normalizado", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioEventos(repositorio);

  const resultado = await servicio.crear(datosValidos({ nombre: "Semana de la Música" }), 1);

  assert.equal(resultado.tipo, "guardado");
  assert.match(repositorio.creados[0].datos.textoBusqueda, /semana de la musica/);
});

test("no se crea un evento con una categoría inexistente", async () => {
  const servicio = new ServicioEventos(new RepositorioFalso({ categoriaValida: false }));

  const resultado = await servicio.crear(datosValidos(), 1);

  assert.equal(resultado.tipo, "invalido");
  assert.equal(resultado.tipo === "invalido" && "idCategoriaEvento" in resultado.errores, true);
});

test("no se crea un evento con un organizador inexistente", async () => {
  const servicio = new ServicioEventos(new RepositorioFalso({ organizadoresValidos: false }));

  const resultado = await servicio.crear(datosValidos(), 1);

  assert.equal(resultado.tipo, "invalido");
});

test("editar un evento inexistente responde no encontrado", async () => {
  const servicio = new ServicioEventos(new RepositorioFalso({ actualizado: false }));

  assert.equal((await servicio.editar(99, datosValidos())).tipo, "no_encontrado");
});

test("un borrador se publica", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado() });
  const resultado = await new ServicioEventos(repositorio).publicar(10);

  assert.equal(resultado.tipo, "aplicada");
  assert.deepEqual(repositorio.estadosEscritos, ["PUBLICADO"]);
});

test("publicar un evento ya publicado no vuelve a escribir en la base", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado({ estado: "PUBLICADO" }) });

  const resultado = await new ServicioEventos(repositorio).publicar(10);

  assert.equal(resultado.tipo, "aplicada");
  assert.deepEqual(repositorio.estadosEscritos, []);
});

test("un evento finalizado no vuelve a publicarse", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado({ estado: "FINALIZADO" }) });

  const resultado = await new ServicioEventos(repositorio).publicar(10);

  assert.equal(resultado.tipo, "no_permitida");
  assert.deepEqual(repositorio.estadosEscritos, []);
});

test("cancelar retira el evento de la cartelera", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado({ estado: "PUBLICADO" }) });

  const resultado = await new ServicioEventos(repositorio).cancelar(10);

  assert.equal(resultado.tipo, "aplicada");
  assert.deepEqual(repositorio.estadosEscritos, ["CANCELADO"]);
});

test("publicar o cancelar un evento inexistente responde no encontrado", async () => {
  const servicio = new ServicioEventos(new RepositorioFalso({ evento: null }));

  assert.equal((await servicio.publicar(10)).tipo, "no_encontrado");
  assert.equal((await servicio.cancelar(10)).tipo, "no_encontrado");
});

test("un borrador puede eliminarse", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado() });

  const resultado = await new ServicioEventos(repositorio).eliminar(
    10,
    new Date("2026-10-02T12:00:00.000Z")
  );

  assert.equal(resultado.tipo, "eliminada");
  assert.deepEqual(repositorio.eliminados, [10]);
});

test("un evento publicado que ya inició no se elimina, se cancela", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado({ estado: "PUBLICADO" }) });

  const resultado = await new ServicioEventos(repositorio).eliminar(
    10,
    new Date("2026-10-01T16:00:00.000Z")
  );

  assert.equal(resultado.tipo, "no_permitida");
  assert.deepEqual(repositorio.eliminados, []);
});

test("un evento publicado que todavía no inicia sí se elimina", async () => {
  const repositorio = new RepositorioFalso({ evento: eventoGuardado({ estado: "PUBLICADO" }) });

  const resultado = await new ServicioEventos(repositorio).eliminar(
    10,
    new Date("2026-09-30T12:00:00.000Z")
  );

  assert.equal(resultado.tipo, "eliminada");
});

function usuarioAdministrador(): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "admin@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Administradora AEUVG",
    roles: [ROLES.administrador],
  };
}

function manejadorDePrueba() {
  const llamadas: number[] = [];
  const manejador = protegerConAcceso(
    async (): Promise<ResultadoGuardia> => ({
      tipo: "autorizado",
      usuario: usuarioAdministrador(),
    }),
    [ROLES.administrador],
    async (usuario) => {
      llamadas.push(usuario.idUsuario);
      return Response.json({ ok: true });
    }
  );

  return { manejador, llamadas };
}

test("con el rol de administrador el manejador se ejecuta", async () => {
  const { manejador, llamadas } = manejadorDePrueba();

  const respuesta = await manejador();

  assert.equal(respuesta.status, 200);
  assert.deepEqual(llamadas, [1]);
});

test("sin sesión la operación de administración responde 401", async () => {
  const llamadas: number[] = [];
  const manejador = protegerConAcceso(
    async () => ({ tipo: "sin_sesion" }),
    [ROLES.administrador],
    async (usuario) => {
      llamadas.push(usuario.idUsuario);
      return Response.json({ ok: true });
    }
  );

  const respuesta = await manejador();

  assert.equal(respuesta.status, 401);
  assert.deepEqual(llamadas, []);
});

test("con sesión pero sin el rol la ruta responde 404 y no revela que existe", async () => {
  const llamadas: number[] = [];
  const manejador = protegerConAcceso(
    async () => ({ tipo: "sin_permiso", usuario: usuarioAdministrador() }),
    [ROLES.administrador],
    async (usuario) => {
      llamadas.push(usuario.idUsuario);
      return Response.json({ ok: true });
    }
  );

  const respuesta = await manejador();
  const cuerpo = (await respuesta.json()) as { mensaje: string };

  assert.equal(respuesta.status, 404);
  assert.equal(cuerpo.mensaje, "No encontrado.");
  assert.deepEqual(llamadas, []);
});
