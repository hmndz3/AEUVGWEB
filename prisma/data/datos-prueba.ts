export const MARCADOR_PRUEBA = "[PRUEBA:T02.6]";

export const CARNETS_PRUEBA = {
  administrador: "TEST-0001",
  ana: "TEST-0002",
  carlos: "TEST-0003",
  maria: "TEST-0004",
} as const;

export const CORREOS_PRUEBA = {
  administrador: "admin.aeuvg@example.test",
  ana: "estudiante.ana@example.test",
  carlos: "estudiante.carlos@example.test",
  maria: "tutor.maria@example.test",
} as const;

export const NOMBRES_PRUEBA = {
  asociacion: `${MARCADOR_PRUEBA} Asociación Estudiantil Demo`,
  club: `${MARCADOR_PRUEBA} Club de Tecnología Demo`,
  eventoProximo: `${MARCADOR_PRUEBA} Feria de Voluntariado 2027`,
  eventoDestacado: `${MARCADOR_PRUEBA} Festival Estudiantil 2027`,
  eventoFinalizado: `${MARCADOR_PRUEBA} Jornada Académica Finalizada`,
  oportunidad: `${MARCADOR_PRUEBA} Apoyo en Biblioteca`,
  importacion: "T02.6-horas-prueba-aeuvg.xlsx",
  postulacion: `${MARCADOR_PRUEBA} Postulación de tutoría de María`,
} as const;

export const CODIGOS_CURSOS_PRUEBA = ["TEST-MAT-01", "TEST-PROG-01"] as const;

export const DESCRIPCIONES_HORAS_PRUEBA = {
  pendienteManual: `${MARCADOR_PRUEBA} Preparación manual de material informativo`,
  acreditadaOportunidad: `${MARCADOR_PRUEBA} Apoyo acreditado en biblioteca`,
  acreditadaImportacion: `${MARCADOR_PRUEBA} Registro histórico importado sin cuenta`,
  pendienteSinCuenta: `${MARCADOR_PRUEBA} Apoyo manual pendiente sin cuenta`,
} as const;

export const TITULOS_NOTIFICACIONES_PRUEBA = {
  evento: `${MARCADOR_PRUEBA} Nuevo evento disponible`,
  tutoria: `${MARCADOR_PRUEBA} Tutoría confirmada`,
  horas: `${MARCADOR_PRUEBA} Horas beca acreditadas`,
} as const;

export const FECHAS_PRUEBA = {
  base: new Date("2026-09-01T14:00:00.000Z"),
  eventoProximoInicio: new Date("2027-02-10T15:00:00.000Z"),
  eventoProximoFin: new Date("2027-02-10T18:00:00.000Z"),
  eventoDestacadoInicio: new Date("2027-03-05T16:00:00.000Z"),
  eventoDestacadoFin: new Date("2027-03-05T23:00:00.000Z"),
  eventoFinalizadoInicio: new Date("2026-08-15T14:00:00.000Z"),
  eventoFinalizadoFin: new Date("2026-08-15T17:00:00.000Z"),
  oportunidad: new Date("2027-02-20T00:00:00.000Z"),
  actividadPendiente: new Date("2026-09-10T00:00:00.000Z"),
  actividadAcreditada: new Date("2026-09-12T00:00:00.000Z"),
  actividadImportada: new Date("2026-08-20T00:00:00.000Z"),
  actividadSinCuenta: new Date("2026-09-15T00:00:00.000Z"),
  acreditacion: new Date("2026-09-16T16:00:00.000Z"),
  tutoriaProgramadaInicio: new Date("2027-02-12T16:00:00.000Z"),
  tutoriaProgramadaFin: new Date("2027-02-12T17:00:00.000Z"),
  tutoriaCompletadaInicio: new Date("2026-09-02T16:00:00.000Z"),
  tutoriaCompletadaFin: new Date("2026-09-02T17:30:00.000Z"),
} as const;

export const HASH_DESARROLLO =
  "sha256$7aefc0d4844f51c82fe52dd0c8ce1058e2257f933c1c978f8130ca45f07d6158";
