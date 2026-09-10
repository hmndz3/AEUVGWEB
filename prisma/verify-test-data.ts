import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  CARRERAS_INICIALES,
  CATEGORIAS_EVENTO_INICIALES,
  FACULTADES_INICIALES,
  ROLES_INICIALES,
} from "./data/catalogos-iniciales";
import {
  CARNETS_PRUEBA,
  CODIGOS_CURSOS_PRUEBA,
  CORREOS_PRUEBA,
  DESCRIPCIONES_HORAS_PRUEBA,
  MARCADOR_PRUEBA,
  NOMBRES_PRUEBA,
  TITULOS_NOTIFICACIONES_PRUEBA,
} from "./data/datos-prueba";

type Conteo = { cantidad: bigint };

function asegurar(condicion: boolean, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function cantidad(resultado: Conteo[]): number {
  return Number(resultado[0]?.cantidad ?? 0);
}

async function verificar(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const correos = Object.values(CORREOS_PRUEBA);
    const carnets = Object.values(CARNETS_PRUEBA);
    const descripcionesHoras = Object.values(DESCRIPCIONES_HORAS_PRUEBA);
    const titulosNotificaciones = Object.values(TITULOS_NOTIFICACIONES_PRUEBA);

    const [estudiantes, usuarios, administrador, tutora, estudianteSinCuenta] = await Promise.all([
      prisma.estudiante.findMany({ where: { carnet: { in: carnets } } }),
      prisma.usuario.findMany({ where: { correo: { in: correos } } }),
      prisma.usuario.findUnique({
        where: { correo: CORREOS_PRUEBA.administrador },
        include: { roles: { include: { rol: true } } },
      }),
      prisma.usuario.findUnique({
        where: { correo: CORREOS_PRUEBA.maria },
        include: { roles: { include: { rol: true } }, estudiante: { include: { tutor: true } } },
      }),
      prisma.estudiante.findUnique({
        where: { carnet: CARNETS_PRUEBA.carlos },
        include: { usuario: true, registrosHoraBeca: true },
      }),
    ]);

    asegurar(
      estudiantes.length === 4,
      "Deben existir exactamente los cuatro estudiantes ficticios."
    );
    asegurar(usuarios.length === 3, "Deben existir exactamente tres usuarios ficticios.");
    asegurar(
      usuarios.every(
        ({ contrasenaHash }) => contrasenaHash.startsWith("scrypt$") && contrasenaHash.length > 90
      ),
      "Los usuarios ficticios no contienen el hash de desarrollo esperado."
    );
    asegurar(administrador !== null, "No existe el usuario administrador ficticio.");
    asegurar(
      administrador.roles.some(({ rol, activo }) => rol.nombre === "ADMINISTRADOR" && activo),
      "El administrador ficticio no tiene el rol ADMINISTRADOR activo."
    );
    asegurar(tutora !== null, "No existe la usuaria tutora ficticia.");
    const rolesTutora = new Set(
      tutora.roles.filter(({ activo }) => activo).map(({ rol }) => rol.nombre)
    );
    asegurar(
      rolesTutora.has("ESTUDIANTE") && rolesTutora.has("TUTOR"),
      "La tutora ficticia debe tener los roles ESTUDIANTE y TUTOR."
    );
    asegurar(tutora.estudiante.tutor !== null, "La tutora ficticia no tiene perfil de Tutor.");
    asegurar(estudianteSinCuenta !== null, "No existe el estudiante ficticio sin cuenta.");
    asegurar(
      estudianteSinCuenta.usuario === null,
      "El estudiante TEST-0003 no debe tener Usuario."
    );
    asegurar(
      estudianteSinCuenta.registrosHoraBeca.length >= 2,
      "El estudiante sin cuenta debe tener registros de horas beca."
    );

    const [asociacion, club, redesXorInvalidas, redesPrueba] = await Promise.all([
      prisma.asociacion.findUnique({
        where: { nombre: NOMBRES_PRUEBA.asociacion },
        include: { integrantes: true, redesSociales: true },
      }),
      prisma.club.findUnique({
        where: { nombre: NOMBRES_PRUEBA.club },
        include: { redesSociales: true },
      }),
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM red_social
        WHERE num_nonnulls(id_asociacion, id_club) <> 1
      `,
      prisma.redSocial.count({
        where: { url: { startsWith: "https://example.test/" } },
      }),
    ]);
    asegurar(asociacion !== null, "No existe la asociación ficticia.");
    asegurar(
      asociacion.integrantes.length === 2,
      "La asociación ficticia debe tener dos integrantes."
    );
    asegurar(
      asociacion.redesSociales.length === 2,
      "La asociación ficticia debe tener dos redes sociales."
    );
    asegurar(club !== null, "No existe el club ficticio.");
    asegurar(club.redesSociales.length === 1, "El club ficticio debe tener una red social.");
    asegurar(redesPrueba === 3, "Deben existir exactamente tres redes sociales ficticias.");
    asegurar(
      cantidad(redesXorInvalidas) === 0,
      "Existen redes sociales que incumplen la relación XOR."
    );

    const [eventos, organizadoresXorInvalidos, guardadosDuplicados] = await Promise.all([
      prisma.evento.findMany({
        where: {
          nombre: {
            in: [
              NOMBRES_PRUEBA.eventoProximo,
              NOMBRES_PRUEBA.eventoDestacado,
              NOMBRES_PRUEBA.eventoFinalizado,
            ],
          },
        },
        include: { organizadores: true },
      }),
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM organizador_evento
        WHERE num_nonnulls(id_asociacion, id_club, unidad_uvg) <> 1
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (
          SELECT id_usuario, id_evento
          FROM evento_guardado
          GROUP BY id_usuario, id_evento
          HAVING COUNT(*) > 1
        ) AS duplicados
      `,
    ]);
    asegurar(eventos.length === 3, "Deben existir exactamente tres eventos ficticios.");
    asegurar(
      eventos.every(({ fechaInicio, fechaFin }) => fechaFin >= fechaInicio),
      "Hay eventos ficticios con fechas inválidas."
    );
    asegurar(
      eventos.some(({ estado, destacado }) => estado === "PUBLICADO" && destacado),
      "Falta un evento publicado y destacado."
    );
    asegurar(
      eventos.some(({ estado }) => estado === "FINALIZADO"),
      "Falta el evento ficticio finalizado."
    );
    asegurar(
      eventos.reduce((total, item) => total + item.organizadores.length, 0) === 4,
      "Los eventos ficticios deben tener cuatro organizadores."
    );
    asegurar(
      eventos.some(({ organizadores }) => organizadores.length > 1),
      "Debe existir un evento ficticio con varios organizadores."
    );
    asegurar(
      cantidad(organizadoresXorInvalidos) === 0,
      "Hay organizadores que incumplen la relación XOR."
    );
    asegurar(cantidad(guardadosDuplicados) === 0, "Existen eventos guardados duplicados.");
    asegurar(
      (await prisma.eventoGuardado.count({
        where: { evento: { nombre: NOMBRES_PRUEBA.eventoDestacado } },
      })) === 1,
      "Debe existir exactamente un evento ficticio guardado."
    );

    const [registrosHoras, importacion, inscripcionesDuplicadas] = await Promise.all([
      prisma.registroHoraBeca.findMany({
        where: { descripcionActividad: { in: descripcionesHoras } },
      }),
      prisma.importacionHoras.findFirst({ where: { nombreArchivo: NOMBRES_PRUEBA.importacion } }),
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (
          SELECT id_oportunidad, id_estudiante
          FROM inscripcion_oportunidad
          GROUP BY id_oportunidad, id_estudiante
          HAVING COUNT(*) > 1
        ) AS duplicados
      `,
    ]);
    asegurar(
      registrosHoras.length === 4,
      "Deben existir exactamente cuatro registros ficticios de horas."
    );
    asegurar(
      registrosHoras
        .filter(({ estado }) => estado === "PENDIENTE")
        .every(
          ({ acreditadoPor, fechaAcreditacion }) =>
            acreditadoPor === null && fechaAcreditacion === null
        ),
      "Las horas pendientes deben conservar acreditador y fecha de acreditación nulos."
    );
    asegurar(
      registrosHoras
        .filter(({ estado }) => estado === "ACREDITADA")
        .every(
          ({ acreditadoPor, fechaAcreditacion }) =>
            acreditadoPor !== null && fechaAcreditacion !== null
        ),
      "Las horas acreditadas deben incluir fecha y administrador acreditador."
    );
    const totalPendiente = registrosHoras
      .filter(({ estado }) => estado === "PENDIENTE")
      .reduce((total, item) => total + item.cantidadHoras.toNumber(), 0);
    const totalAcreditado = registrosHoras
      .filter(({ estado }) => estado === "ACREDITADA")
      .reduce((total, item) => total + item.cantidadHoras.toNumber(), 0);
    asegurar(totalPendiente === 4.5, `El total pendiente esperado es 4.5, no ${totalPendiente}.`);
    asegurar(totalAcreditado === 7, `El total acreditado esperado es 7, no ${totalAcreditado}.`);
    asegurar(importacion !== null, "No existe la importación ficticia.");
    asegurar(
      importacion.totalFilas >= 0 &&
        importacion.filasExitosas >= 0 &&
        importacion.filasFallidas >= 0 &&
        importacion.filasExitosas + importacion.filasFallidas <= importacion.totalFilas,
      "La importación ficticia contiene conteos incoherentes."
    );
    asegurar(
      registrosHoras.some(({ idImportacion }) => idImportacion === importacion.idImportacion),
      "Ningún registro ficticio está relacionado con la importación."
    );
    asegurar(cantidad(inscripcionesDuplicadas) === 0, "Existen inscripciones duplicadas.");
    asegurar(
      (await prisma.inscripcionOportunidad.count({
        where: { oportunidad: { nombre: NOMBRES_PRUEBA.oportunidad } },
      })) === 1,
      "La oportunidad ficticia debe tener exactamente una inscripción."
    );

    const perfilTutor = await prisma.tutor.findUnique({
      where: { idEstudiante: tutora.estudiante.idEstudiante },
      include: { cursos: true, disponibilidades: true, tutorias: true },
    });
    asegurar(perfilTutor !== null, "No existe el perfil de tutor ficticio.");
    asegurar(perfilTutor.cursos.length === 2, "El tutor ficticio debe impartir dos cursos.");
    asegurar(
      perfilTutor.disponibilidades.length === 2,
      "El tutor debe tener dos disponibilidades."
    );
    asegurar(
      perfilTutor.disponibilidades.every(({ horaInicio, horaFin }) => horaFin > horaInicio),
      "Hay disponibilidades ficticias con horas inválidas."
    );
    asegurar(perfilTutor.tutorias.length === 2, "El tutor debe tener dos tutorías ficticias.");
    asegurar(
      perfilTutor.tutorias.every(({ fechaInicio, fechaFin }) => fechaFin > fechaInicio),
      "Hay tutorías ficticias con fechas inválidas."
    );
    asegurar(
      new Set(perfilTutor.tutorias.map(({ estado }) => estado)).has("PROGRAMADA") &&
        new Set(perfilTutor.tutorias.map(({ estado }) => estado)).has("COMPLETADA"),
      "Deben existir tutorías programada y completada."
    );
    asegurar(
      (await prisma.curso.count({ where: { codigo: { in: [...CODIGOS_CURSOS_PRUEBA] } } })) === 2,
      "Deben existir exactamente los dos cursos ficticios."
    );
    const postulacion = await prisma.postulacionTutor.findFirst({
      where: { comentarioSolicitante: NOMBRES_PRUEBA.postulacion },
      include: { cursos: true },
    });
    asegurar(postulacion?.estado === "APROBADA", "La postulación ficticia debe estar aprobada.");
    asegurar(postulacion.cursos.length === 2, "La postulación debe incluir dos cursos.");

    const [notificaciones, lecturasInvalidas, intereses, interacciones] = await Promise.all([
      prisma.notificacion.findMany({ where: { titulo: { in: titulosNotificaciones } } }),
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM notificacion
        WHERE leida AND fecha_lectura IS NULL
      `,
      prisma.interesUsuario.findMany({
        where: { idUsuario: usuarioId(CORREOS_PRUEBA.ana, usuarios) },
      }),
      prisma.interaccionUsuario.findMany({
        where: {
          idUsuario: usuarioId(CORREOS_PRUEBA.ana, usuarios),
          fechaInteraccion: {
            gte: new Date("2026-09-01T14:00:00.000Z"),
            lte: new Date("2026-09-01T14:02:00.000Z"),
          },
        },
      }),
    ]);
    asegurar(
      notificaciones.length === 3,
      "Deben existir exactamente tres notificaciones ficticias."
    );
    asegurar(
      notificaciones.some(({ leida }) => !leida),
      "Falta una notificación no leída."
    );
    asegurar(
      notificaciones
        .filter(({ leida }) => leida)
        .every(({ fechaLectura }) => fechaLectura !== null),
      "Una notificación ficticia leída no tiene fecha de lectura."
    );
    asegurar(
      notificaciones.some(({ tipo }) => tipo === "HORAS_BECA_PRUEBA"),
      "Falta la notificación relacionada con horas beca."
    );
    asegurar(cantidad(lecturasInvalidas) === 0, "Hay notificaciones leídas sin fecha de lectura.");
    asegurar(intereses.length === 2, "Deben existir dos intereses ficticios.");
    asegurar(interacciones.length === 3, "Deben existir tres interacciones ficticias.");

    for (const interes of intereses) {
      const existe =
        interes.tipoInteres === "categoria_evento"
          ? await prisma.categoriaEvento.count({
              where: { idCategoriaEvento: interes.idReferencia },
            })
          : interes.tipoInteres === "club"
            ? await prisma.club.count({ where: { idClub: interes.idReferencia } })
            : 0;
      asegurar(existe === 1, `El interés polimórfico ${interes.idInteresUsuario} está huérfano.`);
    }
    for (const interaccion of interacciones) {
      const existe =
        interaccion.tipoEntidad === "evento"
          ? await prisma.evento.count({ where: { idEvento: interaccion.idEntidad } })
          : interaccion.tipoEntidad === "asociacion"
            ? await prisma.asociacion.count({ where: { idAsociacion: interaccion.idEntidad } })
            : interaccion.tipoEntidad === "club"
              ? await prisma.club.count({ where: { idClub: interaccion.idEntidad } })
              : 0;
      asegurar(
        existe === 1,
        `La interacción polimórfica ${interaccion.idInteraccion} está huérfana.`
      );
    }

    const relacionesHuerfanas = await prisma.$queryRaw<Conteo[]>`
      SELECT COUNT(*) AS cantidad FROM (
        SELECT c.id_carrera FROM carrera c LEFT JOIN facultad f ON f.id_facultad = c.id_facultad WHERE f.id_facultad IS NULL
        UNION ALL SELECT e.id_estudiante FROM estudiante e LEFT JOIN carrera c ON c.id_carrera = e.id_carrera WHERE c.id_carrera IS NULL
        UNION ALL SELECT u.id_usuario FROM usuario u LEFT JOIN estudiante e ON e.id_estudiante = u.id_estudiante WHERE e.id_estudiante IS NULL
        UNION ALL SELECT ur.id_usuario_rol FROM usuario_rol ur LEFT JOIN usuario u ON u.id_usuario = ur.id_usuario LEFT JOIN rol r ON r.id_rol = ur.id_rol WHERE u.id_usuario IS NULL OR r.id_rol IS NULL
        UNION ALL SELECT ia.id_integrante FROM integrante_asociacion ia LEFT JOIN asociacion a ON a.id_asociacion = ia.id_asociacion WHERE a.id_asociacion IS NULL
        UNION ALL SELECT rs.id_red_social FROM red_social rs LEFT JOIN asociacion a ON a.id_asociacion = rs.id_asociacion LEFT JOIN club c ON c.id_club = rs.id_club WHERE (rs.id_asociacion IS NOT NULL AND a.id_asociacion IS NULL) OR (rs.id_club IS NOT NULL AND c.id_club IS NULL)
        UNION ALL SELECT ev.id_evento FROM evento ev LEFT JOIN categoria_evento ce ON ce.id_categoria_evento = ev.id_categoria_evento LEFT JOIN usuario u ON u.id_usuario = ev.creado_por WHERE ce.id_categoria_evento IS NULL OR u.id_usuario IS NULL
        UNION ALL SELECT oe.id_organizador_evento FROM organizador_evento oe LEFT JOIN evento ev ON ev.id_evento = oe.id_evento LEFT JOIN asociacion a ON a.id_asociacion = oe.id_asociacion LEFT JOIN club c ON c.id_club = oe.id_club WHERE ev.id_evento IS NULL OR (oe.id_asociacion IS NOT NULL AND a.id_asociacion IS NULL) OR (oe.id_club IS NOT NULL AND c.id_club IS NULL)
        UNION ALL SELECT eg.id_evento_guardado FROM evento_guardado eg LEFT JOIN usuario u ON u.id_usuario = eg.id_usuario LEFT JOIN evento ev ON ev.id_evento = eg.id_evento WHERE u.id_usuario IS NULL OR ev.id_evento IS NULL
        UNION ALL SELECT o.id_oportunidad FROM oportunidad_hora_beca o LEFT JOIN usuario u ON u.id_usuario = o.creado_por WHERE u.id_usuario IS NULL
        UNION ALL SELECT i.id_inscripcion FROM inscripcion_oportunidad i LEFT JOIN oportunidad_hora_beca o ON o.id_oportunidad = i.id_oportunidad LEFT JOIN estudiante e ON e.id_estudiante = i.id_estudiante WHERE o.id_oportunidad IS NULL OR e.id_estudiante IS NULL
        UNION ALL SELECT ih.id_importacion FROM importacion_horas ih LEFT JOIN usuario u ON u.id_usuario = ih.realizada_por WHERE u.id_usuario IS NULL
        UNION ALL SELECT rh.id_registro_hora FROM registro_hora_beca rh LEFT JOIN estudiante e ON e.id_estudiante = rh.id_estudiante LEFT JOIN usuario uc ON uc.id_usuario = rh.creado_por LEFT JOIN usuario ua ON ua.id_usuario = rh.acreditado_por LEFT JOIN oportunidad_hora_beca o ON o.id_oportunidad = rh.id_oportunidad LEFT JOIN importacion_horas i ON i.id_importacion = rh.id_importacion WHERE e.id_estudiante IS NULL OR uc.id_usuario IS NULL OR (rh.acreditado_por IS NOT NULL AND ua.id_usuario IS NULL) OR (rh.id_oportunidad IS NOT NULL AND o.id_oportunidad IS NULL) OR (rh.id_importacion IS NOT NULL AND i.id_importacion IS NULL)
        UNION ALL SELECT pt.id_postulacion FROM postulacion_tutor pt LEFT JOIN estudiante e ON e.id_estudiante = pt.id_estudiante LEFT JOIN usuario u ON u.id_usuario = pt.revisada_por WHERE e.id_estudiante IS NULL OR (pt.revisada_por IS NOT NULL AND u.id_usuario IS NULL)
        UNION ALL SELECT cp.id_curso_postulacion FROM curso_postulacion cp LEFT JOIN postulacion_tutor pt ON pt.id_postulacion = cp.id_postulacion LEFT JOIN curso c ON c.id_curso = cp.id_curso WHERE pt.id_postulacion IS NULL OR c.id_curso IS NULL
        UNION ALL SELECT t.id_tutor FROM tutor t LEFT JOIN estudiante e ON e.id_estudiante = t.id_estudiante WHERE e.id_estudiante IS NULL
        UNION ALL SELECT tc.id_tutor_curso FROM tutor_curso tc LEFT JOIN tutor t ON t.id_tutor = tc.id_tutor LEFT JOIN curso c ON c.id_curso = tc.id_curso WHERE t.id_tutor IS NULL OR c.id_curso IS NULL
        UNION ALL SELECT dt.id_disponibilidad FROM disponibilidad_tutor dt LEFT JOIN tutor t ON t.id_tutor = dt.id_tutor WHERE t.id_tutor IS NULL
        UNION ALL SELECT tu.id_tutoria FROM tutoria tu LEFT JOIN tutor t ON t.id_tutor = tu.id_tutor LEFT JOIN curso c ON c.id_curso = tu.id_curso LEFT JOIN estudiante e ON e.id_estudiante = tu.id_estudiante WHERE t.id_tutor IS NULL OR c.id_curso IS NULL OR e.id_estudiante IS NULL
        UNION ALL SELECT iu.id_interes_usuario FROM interes_usuario iu LEFT JOIN usuario u ON u.id_usuario = iu.id_usuario WHERE u.id_usuario IS NULL
        UNION ALL SELECT ix.id_interaccion FROM interaccion_usuario ix LEFT JOIN usuario u ON u.id_usuario = ix.id_usuario WHERE u.id_usuario IS NULL
        UNION ALL SELECT n.id_notificacion FROM notificacion n LEFT JOIN usuario u ON u.id_usuario = n.id_usuario WHERE u.id_usuario IS NULL
      ) AS huerfanos
    `;
    asegurar(
      cantidad(relacionesHuerfanas) === 0,
      "Existen relaciones con llaves foráneas huérfanas."
    );

    const [facultades, carreras, categorias, rolesCatalogo] = await Promise.all([
      prisma.facultad.count({
        where: { codigo: { in: FACULTADES_INICIALES.map(({ codigo }) => codigo) }, activo: true },
      }),
      prisma.carrera.count({
        where: { codigo: { in: CARRERAS_INICIALES.map(({ codigo }) => codigo) }, activo: true },
      }),
      prisma.categoriaEvento.count({
        where: {
          nombre: { in: CATEGORIAS_EVENTO_INICIALES.map(({ nombre }) => nombre) },
          activo: true,
        },
      }),
      prisma.rol.count({
        where: { nombre: { in: ROLES_INICIALES.map(({ nombre }) => nombre) }, activo: true },
      }),
    ]);
    asegurar(
      facultades === FACULTADES_INICIALES.length,
      "T-02.5: faltan facultades iniciales activas."
    );
    asegurar(carreras === CARRERAS_INICIALES.length, "T-02.5: faltan carreras iniciales activas.");
    asegurar(
      categorias === CATEGORIAS_EVENTO_INICIALES.length,
      "T-02.5: faltan categorías iniciales activas."
    );
    asegurar(rolesCatalogo === ROLES_INICIALES.length, "T-02.5: faltan roles iniciales activos.");

    const duplicadosPrueba = await prisma.$queryRaw<Conteo[]>`
      SELECT COUNT(*) AS cantidad FROM (
        SELECT carnet FROM estudiante WHERE carnet LIKE 'TEST-%' GROUP BY carnet HAVING COUNT(*) > 1
        UNION ALL SELECT correo FROM usuario WHERE correo LIKE '%@example.test' GROUP BY correo HAVING COUNT(*) > 1
        UNION ALL SELECT nombre FROM evento WHERE nombre LIKE ${`${MARCADOR_PRUEBA}%`} GROUP BY nombre HAVING COUNT(*) > 1
        UNION ALL SELECT descripcion_actividad FROM registro_hora_beca WHERE descripcion_actividad LIKE ${`${MARCADOR_PRUEBA}%`} GROUP BY descripcion_actividad HAVING COUNT(*) > 1
        UNION ALL SELECT titulo FROM notificacion WHERE titulo LIKE ${`${MARCADOR_PRUEBA}%`} GROUP BY titulo HAVING COUNT(*) > 1
      ) AS duplicados
    `;
    asegurar(
      cantidad(duplicadosPrueba) === 0,
      "La segunda carga produjo datos ficticios duplicados."
    );

    console.log("Verificación de información de prueba completada correctamente.");
    console.log("Usuarios y roles: 4 estudiantes, 3 usuarios y 4 asignaciones válidas.");
    console.log("Organizaciones: 1 asociación, 2 integrantes, 1 club y 3 redes sociales.");
    console.log("Eventos: 3 eventos, 4 organizadores y 1 evento guardado.");
    console.log(
      "Horas beca: 1 oportunidad, 1 inscripción, 1 importación y 4 registros (11.5 horas). "
    );
    console.log("Tutorías: 2 cursos, 1 postulación, 1 tutor, 2 disponibilidades y 2 tutorías.");
    console.log("Personalización: 2 intereses, 3 interacciones y 3 notificaciones.");
    console.log("Relaciones huérfanas y duplicados detectados: 0.");
    console.log("Catálogos T-02.5: intactos y activos.");
  } finally {
    await prisma.$disconnect();
  }
}

function usuarioId(correo: string, usuarios: { correo: string; idUsuario: number }[]): number {
  const usuario = usuarios.find((item) => item.correo === correo);
  if (!usuario) throw new Error(`No se encontró el usuario ficticio ${correo}.`);
  return usuario.idUsuario;
}

verificar().catch((error: unknown) => {
  const connectionString = process.env.DATABASE_URL;
  const mensaje = error instanceof Error ? error.message : String(error);
  const seguro = connectionString
    ? mensaje.replaceAll(connectionString, "[DATABASE_URL]")
    : mensaje;
  console.error(`La verificación de información de prueba falló: ${seguro}`);
  process.exitCode = 1;
});
