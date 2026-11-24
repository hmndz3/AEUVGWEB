import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import type {
  DatosNuevaPostulacion,
  EstudianteDeSesion,
  PostulacionResumida,
  RepositorioTutorias,
} from "../src/lib/tutorias/repositorio-tutorias";
import { ServicioPostulaciones, ServicioTutores } from "../src/lib/tutorias/servicio-postulaciones";
import {
  esquemaPostulacionTutor,
  esquemaRevisionPostulacion,
  MAXIMO_CURSOS_POSTULACION,
  NOTA_MINIMA_TUTOR,
} from "../src/validators/tutoria";

const COMPROBANTE = "/api/imagenes/0123456789abcdef0123456789abcdef.jpg";

const curso = (idCurso: number, notaObtenida = 95) => ({
  idCurso,
  notaObtenida,
  comprobanteUrl: COMPROBANTE,
});

/** Repositorio de mentira: deja ver qué se escribió sin tocar la base. */
class RepositorioFalso implements RepositorioTutorias {
  creadas: DatosNuevaPostulacion[] = [];
  aprobadas: { idPostulacion: number; idEstudiante: number; cursos: number[] }[] = [];
  rechazadas: number[] = [];
  estados: { idTutor: number; estado: string }[] = [];

  constructor(
    private readonly opciones: {
      estudiante?: EstudianteDeSesion | null;
      pendiente?: boolean;
      tutor?: boolean;
      cursosActivos?: number[];
      postulacion?: PostulacionResumida | null;
    } = {}
  ) {}

  async estudianteDeUsuario(): Promise<EstudianteDeSesion | null> {
    return this.opciones.estudiante === undefined
      ? { idEstudiante: 5, nombreCompleto: "Ana Lucía Morales" }
      : this.opciones.estudiante;
  }

  async tienePostulacionPendiente(): Promise<boolean> {
    return this.opciones.pendiente ?? false;
  }

  async esTutor(): Promise<boolean> {
    return this.opciones.tutor ?? false;
  }

  async cursosActivos(ids: readonly number[]): Promise<number[]> {
    const activos = this.opciones.cursosActivos;
    return activos === undefined ? [...ids] : ids.filter((id) => activos.includes(id));
  }

  async crearPostulacion(datos: DatosNuevaPostulacion): Promise<number> {
    this.creadas.push(datos);
    return 11;
  }

  async postulacionPorId(): Promise<PostulacionResumida | null> {
    return this.opciones.postulacion === undefined
      ? { idPostulacion: 11, idEstudiante: 5, estado: "PENDIENTE", cursos: [1, 2] }
      : this.opciones.postulacion;
  }

  async aprobarPostulacion(
    idPostulacion: number,
    idEstudiante: number,
    cursos: readonly number[]
  ): Promise<number> {
    this.aprobadas.push({ idPostulacion, idEstudiante, cursos: [...cursos] });
    return 7;
  }

  async rechazarPostulacion(idPostulacion: number): Promise<boolean> {
    this.rechazadas.push(idPostulacion);
    return true;
  }

  async cambiarEstadoTutor(idTutor: number, estado: string): Promise<boolean> {
    this.estados.push({ idTutor, estado });
    return idTutor === 7;
  }
}

// ---------- Validación ----------

test("una postulación completa pasa la validación", () => {
  const resultado = esquemaPostulacionTutor.safeParse({
    comentarioSolicitante: "  Ya di tutorías el ciclo pasado.  ",
    cursos: [{ idCurso: "3", notaObtenida: "92.5", comprobanteUrl: COMPROBANTE }],
  });

  assert.equal(resultado.success, true);
  if (!resultado.success) return;
  assert.equal(resultado.data.cursos[0].idCurso, 3);
  assert.equal(resultado.data.cursos[0].notaObtenida, 92.5);
  assert.equal(resultado.data.comentarioSolicitante, "Ya di tutorías el ciclo pasado.");
});

test("la postulación exige al menos un curso y no admite repetidos", () => {
  assert.equal(esquemaPostulacionTutor.safeParse({ cursos: [] }).success, false);
  assert.equal(esquemaPostulacionTutor.safeParse({ cursos: [curso(1), curso(1)] }).success, false);
});

test("la postulación no admite más cursos que el máximo", () => {
  const demasiados = Array.from({ length: MAXIMO_CURSOS_POSTULACION + 1 }, (_, i) => curso(i + 1));

  assert.equal(esquemaPostulacionTutor.safeParse({ cursos: demasiados }).success, false);
});

test("el comprobante tiene que ser una imagen del propio sitio", () => {
  for (const comprobante of ["", "https://otrositio.com/nota.jpg", "no-es-una-ruta"]) {
    const resultado = esquemaPostulacionTutor.safeParse({
      cursos: [{ idCurso: 1, notaObtenida: 95, comprobanteUrl: comprobante }],
    });

    assert.equal(resultado.success, false, `${comprobante} no debería pasar`);
  }
});

test("la nota se exige entre 0 y 100", () => {
  for (const nota of ["-1", "101", "abc"]) {
    assert.equal(
      esquemaPostulacionTutor.safeParse({ cursos: [curso(1, Number(nota))] }).success,
      false,
      `${nota} no debería pasar`
    );
  }
});

test("la revisión exige una decisión reconocible", () => {
  assert.equal(esquemaRevisionPostulacion.safeParse({ decision: "aprobar" }).success, true);
  assert.equal(esquemaRevisionPostulacion.safeParse({ decision: "quizas" }).success, false);
  assert.equal(esquemaRevisionPostulacion.safeParse({}).success, false);
});

// ---------- Reglas de la postulación ----------

test("la postulación se guarda a nombre del estudiante de la sesión", async () => {
  const repositorio = new RepositorioFalso();
  const datos = esquemaPostulacionTutor.parse({ cursos: [curso(1), curso(2)] });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.deepEqual(resultado, { tipo: "enviada", idPostulacion: 11 });
  assert.equal(repositorio.creadas[0].idEstudiante, 5);
  assert.equal(repositorio.creadas[0].cursos.length, 2);
});

test("una nota por debajo del mínimo detiene la postulación", async () => {
  const repositorio = new RepositorioFalso();
  const datos = esquemaPostulacionTutor.parse({
    cursos: [curso(1, 95), curso(2, NOTA_MINIMA_TUTOR - 1)],
  });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.equal(resultado.tipo, "invalida");
  if (resultado.tipo !== "invalida") return;
  assert.match(resultado.errores.cursos, new RegExp(String(NOTA_MINIMA_TUTOR)));
  assert.equal(repositorio.creadas.length, 0);
});

test("no se admite una segunda postulación con una sin resolver", async () => {
  const repositorio = new RepositorioFalso({ pendiente: true });
  const datos = esquemaPostulacionTutor.parse({ cursos: [curso(1)] });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("quien ya es tutor no se vuelve a postular", async () => {
  const repositorio = new RepositorioFalso({ tutor: true });
  const datos = esquemaPostulacionTutor.parse({ cursos: [curso(1)] });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("un curso que ya no está activo detiene la postulación", async () => {
  const repositorio = new RepositorioFalso({ cursosActivos: [1] });
  const datos = esquemaPostulacionTutor.parse({ cursos: [curso(1), curso(2)] });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.equal(resultado.tipo, "invalida");
  assert.equal(repositorio.creadas.length, 0);
});

test("una cuenta sin ficha de estudiante no puede postularse", async () => {
  const repositorio = new RepositorioFalso({ estudiante: null });
  const datos = esquemaPostulacionTutor.parse({ cursos: [curso(1)] });

  const resultado = await new ServicioPostulaciones(repositorio).postular(99, datos);

  assert.deepEqual(resultado, { tipo: "sin_estudiante" });
});

// ---------- Revisión ----------

test("aprobar da de alta al tutor con los cursos que respaldó", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await new ServicioPostulaciones(repositorio).revisar(11, "aprobar", null, 3);

  assert.deepEqual(resultado, { tipo: "resuelta", estado: "APROBADA", idTutor: 7 });
  assert.deepEqual(repositorio.aprobadas, [{ idPostulacion: 11, idEstudiante: 5, cursos: [1, 2] }]);
  assert.equal(repositorio.rechazadas.length, 0);
});

test("rechazar no da de alta a nadie", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await new ServicioPostulaciones(repositorio).revisar(
    11,
    "rechazar",
    "Falta el comprobante del segundo curso.",
    3
  );

  assert.deepEqual(resultado, { tipo: "resuelta", estado: "RECHAZADA", idTutor: null });
  assert.deepEqual(repositorio.rechazadas, [11]);
  assert.equal(repositorio.aprobadas.length, 0);
});

test("una postulación ya resuelta no se vuelve a tocar", async () => {
  for (const estado of ["APROBADA", "RECHAZADA"] as const) {
    const repositorio = new RepositorioFalso({
      postulacion: { idPostulacion: 11, idEstudiante: 5, estado, cursos: [1] },
    });

    const resultado = await new ServicioPostulaciones(repositorio).revisar(11, "aprobar", null, 3);

    assert.equal(resultado.tipo, "no_permitida");
    assert.equal(repositorio.aprobadas.length, 0);
  }
});

test("revisar una postulación que no existe responde que no se encontró", async () => {
  const repositorio = new RepositorioFalso({ postulacion: null });

  const resultado = await new ServicioPostulaciones(repositorio).revisar(99, "aprobar", null, 3);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

// ---------- Estado del tutor ----------

test("el estado del tutor se cambia sin borrar su ficha", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await new ServicioTutores(repositorio).cambiarEstado(7, "SUSPENDIDO");

  assert.deepEqual(resultado, { tipo: "aplicado", estado: "SUSPENDIDO" });
  assert.deepEqual(repositorio.estados, [{ idTutor: 7, estado: "SUSPENDIDO" }]);
});

test("cambiar el estado de un tutor que no existe responde que no se encontró", async () => {
  const resultado = await new ServicioTutores(new RepositorioFalso()).cambiarEstado(99, "ACTIVO");

  assert.deepEqual(resultado, { tipo: "no_encontrado" });
});

// ---------- Permisos ----------

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "estudiante.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    fotoUrl: null,
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("postularse exige sesión pero no un rol concreto", async () => {
  const sinSesion = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [], async () =>
    Response.json({ ok: true })
  );
  assert.equal((await sinSesion()).status, 401);

  const conSesion = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.estudiante]) }),
    [],
    async () => Response.json({ ok: true })
  );
  assert.equal((await conSesion()).status, 200);
});

test("revisar postulaciones exige el rol de administrador", async () => {
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
