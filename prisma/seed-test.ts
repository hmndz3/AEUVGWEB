import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  CARNETS_PRUEBA,
  CODIGOS_CURSOS_PRUEBA,
  CORREOS_PRUEBA,
  DESCRIPCIONES_HORAS_PRUEBA,
  FECHAS_PRUEBA,
  HASH_DESARROLLO,
  MARCADOR_PRUEBA,
  NOMBRES_PRUEBA,
  TITULOS_NOTIFICACIONES_PRUEBA,
} from "./data/datos-prueba";

type Resultado = { creados: number; actualizados: number; sinCambios: number };
type Resultados = Map<string, Resultado>;

function hora(valor: string): Date {
  return new Date(`1970-01-01T${valor}:00.000Z`);
}

function valorComparable(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString();
  if (Prisma.Decimal.isDecimal(valor)) return valor.toString();
  if (valor !== null && typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function contieneDatos(registro: object, datos: object): boolean {
  const actual = registro as Record<string, unknown>;
  return Object.entries(datos).every(
    ([campo, esperado]) => valorComparable(actual[campo]) === valorComparable(esperado)
  );
}

function registrar(resultados: Resultados, tabla: string, tipo: keyof Resultado): void {
  const resultado = resultados.get(tabla) ?? { creados: 0, actualizados: 0, sinCambios: 0 };
  resultado[tipo] += 1;
  resultados.set(tabla, resultado);
}

async function sincronizar<T extends object>(opciones: {
  tabla: string;
  datos: object;
  buscar: () => Promise<T | null>;
  crear: () => Promise<unknown>;
  actualizar: () => Promise<unknown>;
  resultados: Resultados;
}): Promise<void> {
  const existente = await opciones.buscar();

  if (!existente) {
    await opciones.crear();
    registrar(opciones.resultados, opciones.tabla, "creados");
  } else if (!contieneDatos(existente, opciones.datos)) {
    await opciones.actualizar();
    registrar(opciones.resultados, opciones.tabla, "actualizados");
  } else {
    registrar(opciones.resultados, opciones.tabla, "sinCambios");
  }
}

function describirDestino(connectionString: string): string {
  const url = new URL(connectionString);
  const puerto = url.port || "5432";
  const base = decodeURIComponent(url.pathname.replace(/^\//, "")) || "(sin nombre)";
  return `host=${url.hostname}:${puerto}, base=${base}`;
}

function validarEntorno(): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seed de prueba está bloqueado cuando NODE_ENV=production.");
  }
  if (process.env.ALLOW_TEST_SEED !== "true") {
    throw new Error("El seed de prueba requiere la confirmación explícita ALLOW_TEST_SEED=true.");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  console.log(`Destino autorizado para datos de prueba: ${describirDestino(connectionString)}.`);
  return connectionString;
}

async function cargarDatos(tx: Prisma.TransactionClient): Promise<Resultados> {
  const resultados: Resultados = new Map();
  const carrera = await tx.carrera.findUnique({ where: { codigo: "CC-ING-COMP" } });
  const categorias = await tx.categoriaEvento.findMany({
    where: {
      nombre: {
        in: ["Festival", "Convocatoria de horas beca", "Colaboración estudiantil"],
      },
    },
  });
  const roles = await tx.rol.findMany({
    where: { nombre: { in: ["ESTUDIANTE", "TUTOR", "ADMINISTRADOR"] } },
  });

  if (!carrera)
    throw new Error("Falta la carrera CC-ING-COMP. Ejecuta primero npx prisma db seed.");
  if (categorias.length !== 3 || roles.length !== 3) {
    throw new Error("Faltan categorías o roles iniciales. Ejecuta primero npx prisma db seed.");
  }

  const categoriaPorNombre = new Map(categorias.map((item) => [item.nombre, item]));
  const rolPorNombre = new Map(roles.map((item) => [item.nombre, item]));

  const estudiantesDefinidos = [
    {
      carnet: CARNETS_PRUEBA.administrador,
      nombreCompleto: "Administrador Prueba AEUVG",
      correoUvg: CORREOS_PRUEBA.administrador,
      telefono: "+502 5550-0001",
    },
    {
      carnet: CARNETS_PRUEBA.ana,
      nombreCompleto: "Ana Estudiante Prueba",
      correoUvg: CORREOS_PRUEBA.ana,
      telefono: "+502 5550-0002",
    },
    {
      carnet: CARNETS_PRUEBA.carlos,
      nombreCompleto: "Carlos Estudiante Sin Cuenta Prueba",
      correoUvg: CORREOS_PRUEBA.carlos,
      telefono: null,
    },
    {
      carnet: CARNETS_PRUEBA.maria,
      nombreCompleto: "María Tutora Prueba",
      correoUvg: CORREOS_PRUEBA.maria,
      telefono: "+502 5550-0004",
    },
  ] as const;

  for (const estudiante of estudiantesDefinidos) {
    const datos = { ...estudiante, idCarrera: carrera.idCarrera, activo: true };
    await sincronizar({
      tabla: "Estudiante",
      datos,
      buscar: () => tx.estudiante.findUnique({ where: { carnet: estudiante.carnet } }),
      crear: () =>
        tx.estudiante.upsert({
          where: { carnet: estudiante.carnet },
          create: datos,
          update: datos,
        }),
      actualizar: () => tx.estudiante.update({ where: { carnet: estudiante.carnet }, data: datos }),
      resultados,
    });
  }

  const estudiantes = await tx.estudiante.findMany({
    where: { carnet: { in: Object.values(CARNETS_PRUEBA) } },
  });
  const estudiantePorCarnet = new Map(estudiantes.map((item) => [item.carnet, item]));
  const estudiante = (carnet: string) => {
    const encontrado = estudiantePorCarnet.get(carnet);
    if (!encontrado) throw new Error(`No se encontró el estudiante ficticio ${carnet}.`);
    return encontrado;
  };

  const usuariosDefinidos = [
    { correo: CORREOS_PRUEBA.administrador, carnet: CARNETS_PRUEBA.administrador },
    { correo: CORREOS_PRUEBA.ana, carnet: CARNETS_PRUEBA.ana },
    { correo: CORREOS_PRUEBA.maria, carnet: CARNETS_PRUEBA.maria },
  ] as const;

  for (const usuario of usuariosDefinidos) {
    const datos = {
      idEstudiante: estudiante(usuario.carnet).idEstudiante,
      correo: usuario.correo,
      contrasenaHash: HASH_DESARROLLO,
      estado: "ACTIVO" as const,
      correoVerificado: true,
      ultimoAcceso: null,
    };
    // También se busca por estudiante: así el seed puede migrar sus correos
    // ficticios sin intentar crear una segunda cuenta para el mismo estudiante.
    const existente = await tx.usuario.findFirst({
      where: { OR: [{ correo: usuario.correo }, { idEstudiante: datos.idEstudiante }] },
    });

    if (!existente) {
      await tx.usuario.create({ data: datos });
      registrar(resultados, "Usuario", "creados");
    } else if (!contieneDatos(existente, datos)) {
      await tx.usuario.update({ where: { idUsuario: existente.idUsuario }, data: datos });
      registrar(resultados, "Usuario", "actualizados");
    } else {
      registrar(resultados, "Usuario", "sinCambios");
    }
  }

  const usuarios = await tx.usuario.findMany({
    where: { correo: { in: usuariosDefinidos.map(({ correo }) => correo) } },
  });
  const usuarioPorCorreo = new Map(usuarios.map((item) => [item.correo, item]));
  const usuario = (correo: string) => {
    const encontrado = usuarioPorCorreo.get(correo);
    if (!encontrado) throw new Error(`No se encontró el usuario ficticio ${correo}.`);
    return encontrado;
  };
  const rol = (nombre: string) => {
    const encontrado = rolPorNombre.get(nombre);
    if (!encontrado) throw new Error(`No se encontró el rol ${nombre}.`);
    return encontrado;
  };

  const asignaciones = [
    [CORREOS_PRUEBA.administrador, "ADMINISTRADOR"],
    [CORREOS_PRUEBA.ana, "ESTUDIANTE"],
    [CORREOS_PRUEBA.maria, "ESTUDIANTE"],
    [CORREOS_PRUEBA.maria, "TUTOR"],
  ] as const;

  for (const [correo, nombreRol] of asignaciones) {
    const idUsuario = usuario(correo).idUsuario;
    const idRol = rol(nombreRol).idRol;
    const datos = { idUsuario, idRol, activo: true, fechaAsignacion: FECHAS_PRUEBA.base };
    await sincronizar({
      tabla: "UsuarioRol",
      datos,
      buscar: () => tx.usuarioRol.findUnique({ where: { idUsuario_idRol: { idUsuario, idRol } } }),
      crear: () =>
        tx.usuarioRol.upsert({
          where: { idUsuario_idRol: { idUsuario, idRol } },
          create: datos,
          update: datos,
        }),
      actualizar: () =>
        tx.usuarioRol.update({ where: { idUsuario_idRol: { idUsuario, idRol } }, data: datos }),
      resultados,
    });
  }

  const datosAsociacion = {
    nombre: NOMBRES_PRUEBA.asociacion,
    descripcion: "Asociación completamente ficticia para comprobar relaciones del modelo.",
    mision: "Validar flujos de desarrollo sin representar una organización real.",
    vision: "Mantener datos de prueba reconocibles, aislados y reproducibles.",
    informacionContacto: "Contacto ficticio mediante example.test.",
    correo: "asociacion.demo@example.test",
    imagenUrl: "https://example.test/imagenes/asociacion-demo.png",
    activo: true,
  };
  await sincronizar({
    tabla: "Asociacion",
    datos: datosAsociacion,
    buscar: () => tx.asociacion.findUnique({ where: { nombre: NOMBRES_PRUEBA.asociacion } }),
    crear: () =>
      tx.asociacion.upsert({
        where: { nombre: NOMBRES_PRUEBA.asociacion },
        create: datosAsociacion,
        update: datosAsociacion,
      }),
    actualizar: () =>
      tx.asociacion.update({ where: { nombre: NOMBRES_PRUEBA.asociacion }, data: datosAsociacion }),
    resultados,
  });

  const datosClub = {
    nombre: NOMBRES_PRUEBA.club,
    descripcion: "Club ficticio para pruebas de integración.",
    actividades: "Talleres simulados y eventos de demostración.",
    informacionContacto: "Contacto ficticio mediante example.test.",
    correo: "club.demo@example.test",
    imagenUrl: "https://example.test/imagenes/club-demo.png",
    activo: true,
  };
  await sincronizar({
    tabla: "Club",
    datos: datosClub,
    buscar: () => tx.club.findUnique({ where: { nombre: NOMBRES_PRUEBA.club } }),
    crear: () =>
      tx.club.upsert({
        where: { nombre: NOMBRES_PRUEBA.club },
        create: datosClub,
        update: datosClub,
      }),
    actualizar: () => tx.club.update({ where: { nombre: NOMBRES_PRUEBA.club }, data: datosClub }),
    resultados,
  });

  const asociacion = await tx.asociacion.findUniqueOrThrow({
    where: { nombre: NOMBRES_PRUEBA.asociacion },
  });
  const club = await tx.club.findUniqueOrThrow({ where: { nombre: NOMBRES_PRUEBA.club } });

  const integrantes = [
    { nombre: "Alex Coordinación Prueba", cargo: "Presidencia de prueba", ordenVisualizacion: 1 },
    { nombre: "Sam Apoyo Prueba", cargo: "Vocalía de prueba", ordenVisualizacion: 2 },
  ];
  for (const integrante of integrantes) {
    const datos = {
      ...integrante,
      idAsociacion: asociacion.idAsociacion,
      periodo: "2026-2027 PRUEBA",
      fotoUrl: `https://example.test/imagenes/integrante-${integrante.ordenVisualizacion}.png`,
      activo: true,
    };
    const where = {
      idAsociacion: asociacion.idAsociacion,
      nombre: integrante.nombre,
      periodo: datos.periodo,
    };
    await sincronizar({
      tabla: "IntegranteAsociacion",
      datos,
      buscar: () => tx.integranteAsociacion.findFirst({ where }),
      crear: () => tx.integranteAsociacion.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.integranteAsociacion.findFirstOrThrow({ where });
        return tx.integranteAsociacion.update({
          where: { idIntegrante: existente.idIntegrante },
          data: datos,
        });
      },
      resultados,
    });
  }

  const redes = [
    {
      idAsociacion: asociacion.idAsociacion,
      idClub: null,
      plataforma: "Instagram",
      url: "https://example.test/asociacion-demo/instagram",
    },
    {
      idAsociacion: asociacion.idAsociacion,
      idClub: null,
      plataforma: "LinkedIn",
      url: "https://example.test/asociacion-demo/linkedin",
    },
    {
      idAsociacion: null,
      idClub: club.idClub,
      plataforma: "Instagram",
      url: "https://example.test/club-demo/instagram",
    },
  ];
  for (const red of redes) {
    const datos = { ...red, activo: true };
    const where = { plataforma: red.plataforma, url: red.url };
    await sincronizar({
      tabla: "RedSocial",
      datos,
      buscar: () => tx.redSocial.findFirst({ where }),
      crear: () => tx.redSocial.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.redSocial.findFirstOrThrow({ where });
        return tx.redSocial.update({ where: { idRedSocial: existente.idRedSocial }, data: datos });
      },
      resultados,
    });
  }

  const idAdministrador = usuario(CORREOS_PRUEBA.administrador).idUsuario;
  const eventos = [
    {
      nombre: NOMBRES_PRUEBA.eventoProximo,
      categoria: "Convocatoria de horas beca",
      descripcion: "Evento publicado y futuro con datos completamente ficticios.",
      fechaInicio: FECHAS_PRUEBA.eventoProximoInicio,
      fechaFin: FECHAS_PRUEBA.eventoProximoFin,
      ubicacion: "Campus ficticio, salón TEST-101",
      imagenUrl: "https://example.test/imagenes/evento-voluntariado.png",
      tipoActividad: "VOLUNTARIADO" as const,
      informacionAdicional: "Fecha fija para una prueba determinista.",
      cupo: 40,
      estado: "PUBLICADO" as const,
      destacado: false,
    },
    {
      nombre: NOMBRES_PRUEBA.eventoDestacado,
      categoria: "Festival",
      descripcion: "Evento publicado, futuro y destacado para pruebas.",
      fechaInicio: FECHAS_PRUEBA.eventoDestacadoInicio,
      fechaFin: FECHAS_PRUEBA.eventoDestacadoFin,
      ubicacion: "Plaza ficticia de pruebas",
      imagenUrl: "https://example.test/imagenes/festival-demo.png",
      tipoActividad: "RECREATIVA" as const,
      informacionAdicional: "No corresponde a un evento real.",
      cupo: null,
      estado: "PUBLICADO" as const,
      destacado: true,
    },
    {
      nombre: NOMBRES_PRUEBA.eventoFinalizado,
      categoria: "Colaboración estudiantil",
      descripcion: "Evento histórico ficticio marcado como finalizado.",
      fechaInicio: FECHAS_PRUEBA.eventoFinalizadoInicio,
      fechaFin: FECHAS_PRUEBA.eventoFinalizadoFin,
      ubicacion: "Aula ficticia TEST-202",
      imagenUrl: null,
      tipoActividad: "ACADEMICA" as const,
      informacionAdicional: null,
      cupo: 25,
      estado: "FINALIZADO" as const,
      destacado: false,
    },
  ];

  for (const evento of eventos) {
    const categoria = categoriaPorNombre.get(evento.categoria);
    if (!categoria) throw new Error(`Falta la categoría ${evento.categoria}.`);
    const { categoria: _categoria, ...valoresEvento } = evento;
    void _categoria;
    const datos = {
      ...valoresEvento,
      idCategoriaEvento: categoria.idCategoriaEvento,
      creadoPor: idAdministrador,
    };
    await sincronizar({
      tabla: "Evento",
      datos,
      buscar: () => tx.evento.findFirst({ where: { nombre: evento.nombre } }),
      crear: () => tx.evento.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.evento.findFirstOrThrow({ where: { nombre: evento.nombre } });
        return tx.evento.update({ where: { idEvento: existente.idEvento }, data: datos });
      },
      resultados,
    });
  }

  const eventosCreados = await tx.evento.findMany({
    where: { nombre: { in: eventos.map(({ nombre }) => nombre) } },
  });
  const eventoPorNombre = new Map(eventosCreados.map((item) => [item.nombre, item]));
  const evento = (nombre: string) => {
    const encontrado = eventoPorNombre.get(nombre);
    if (!encontrado) throw new Error(`No se encontró el evento ficticio ${nombre}.`);
    return encontrado;
  };

  const organizadores = [
    {
      idEvento: evento(NOMBRES_PRUEBA.eventoProximo).idEvento,
      idAsociacion: asociacion.idAsociacion,
      idClub: null,
      unidadUvg: null,
      organizadorPrincipal: true,
      clave: "asociacion",
    },
    {
      idEvento: evento(NOMBRES_PRUEBA.eventoProximo).idEvento,
      idAsociacion: null,
      idClub: null,
      unidadUvg: `${MARCADOR_PRUEBA} Unidad de Vida Estudiantil Demo`,
      organizadorPrincipal: false,
      clave: "unidad",
    },
    {
      idEvento: evento(NOMBRES_PRUEBA.eventoDestacado).idEvento,
      idAsociacion: null,
      idClub: club.idClub,
      unidadUvg: null,
      organizadorPrincipal: true,
      clave: "club",
    },
    {
      idEvento: evento(NOMBRES_PRUEBA.eventoFinalizado).idEvento,
      idAsociacion: asociacion.idAsociacion,
      idClub: null,
      unidadUvg: null,
      organizadorPrincipal: true,
      clave: "asociacion",
    },
  ];
  for (const organizador of organizadores) {
    const { clave, ...datos } = organizador;
    const where =
      clave === "asociacion"
        ? { idEvento: datos.idEvento, idAsociacion: datos.idAsociacion }
        : clave === "club"
          ? { idEvento: datos.idEvento, idClub: datos.idClub }
          : { idEvento: datos.idEvento, unidadUvg: datos.unidadUvg };
    await sincronizar({
      tabla: "OrganizadorEvento",
      datos,
      buscar: () => tx.organizadorEvento.findFirst({ where }),
      crear: () => tx.organizadorEvento.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.organizadorEvento.findFirstOrThrow({ where });
        return tx.organizadorEvento.update({
          where: { idOrganizadorEvento: existente.idOrganizadorEvento },
          data: datos,
        });
      },
      resultados,
    });
  }

  const idUsuarioAna = usuario(CORREOS_PRUEBA.ana).idUsuario;
  const idEventoGuardado = evento(NOMBRES_PRUEBA.eventoDestacado).idEvento;
  const datosGuardado = {
    idUsuario: idUsuarioAna,
    idEvento: idEventoGuardado,
    fechaGuardado: FECHAS_PRUEBA.base,
  };
  await sincronizar({
    tabla: "EventoGuardado",
    datos: datosGuardado,
    buscar: () =>
      tx.eventoGuardado.findUnique({
        where: { idUsuario_idEvento: { idUsuario: idUsuarioAna, idEvento: idEventoGuardado } },
      }),
    crear: () =>
      tx.eventoGuardado.upsert({
        where: { idUsuario_idEvento: { idUsuario: idUsuarioAna, idEvento: idEventoGuardado } },
        create: datosGuardado,
        update: datosGuardado,
      }),
    actualizar: () =>
      tx.eventoGuardado.update({
        where: { idUsuario_idEvento: { idUsuario: idUsuarioAna, idEvento: idEventoGuardado } },
        data: datosGuardado,
      }),
    resultados,
  });

  const datosOportunidad = {
    creadoPor: idAdministrador,
    nombre: NOMBRES_PRUEBA.oportunidad,
    descripcion: "Oportunidad ficticia para validar inscripciones y registros de horas.",
    fecha: FECHAS_PRUEBA.oportunidad,
    horaInicio: hora("08:00"),
    horaFin: hora("12:00"),
    lugar: "Biblioteca ficticia de pruebas",
    cantidadPersonas: 10,
    estado: "PUBLICADA" as const,
    informacionAdicional: "No es una convocatoria real.",
  };
  await sincronizar({
    tabla: "OportunidadHoraBeca",
    datos: datosOportunidad,
    buscar: () =>
      tx.oportunidadHoraBeca.findFirst({ where: { nombre: NOMBRES_PRUEBA.oportunidad } }),
    crear: () => tx.oportunidadHoraBeca.create({ data: datosOportunidad }),
    actualizar: async () => {
      const existente = await tx.oportunidadHoraBeca.findFirstOrThrow({
        where: { nombre: NOMBRES_PRUEBA.oportunidad },
      });
      return tx.oportunidadHoraBeca.update({
        where: { idOportunidad: existente.idOportunidad },
        data: datosOportunidad,
      });
    },
    resultados,
  });
  const oportunidad = await tx.oportunidadHoraBeca.findFirstOrThrow({
    where: { nombre: NOMBRES_PRUEBA.oportunidad },
  });

  const datosInscripcion = {
    idOportunidad: oportunidad.idOportunidad,
    idEstudiante: estudiante(CARNETS_PRUEBA.ana).idEstudiante,
    estado: "ACEPTADA" as const,
    fechaInscripcion: FECHAS_PRUEBA.base,
    observaciones: `${MARCADOR_PRUEBA} Inscripción aceptada para desarrollo.`,
  };
  await sincronizar({
    tabla: "InscripcionOportunidad",
    datos: datosInscripcion,
    buscar: () =>
      tx.inscripcionOportunidad.findUnique({
        where: {
          idOportunidad_idEstudiante: {
            idOportunidad: datosInscripcion.idOportunidad,
            idEstudiante: datosInscripcion.idEstudiante,
          },
        },
      }),
    crear: () =>
      tx.inscripcionOportunidad.upsert({
        where: {
          idOportunidad_idEstudiante: {
            idOportunidad: datosInscripcion.idOportunidad,
            idEstudiante: datosInscripcion.idEstudiante,
          },
        },
        create: datosInscripcion,
        update: datosInscripcion,
      }),
    actualizar: () =>
      tx.inscripcionOportunidad.update({
        where: {
          idOportunidad_idEstudiante: {
            idOportunidad: datosInscripcion.idOportunidad,
            idEstudiante: datosInscripcion.idEstudiante,
          },
        },
        data: datosInscripcion,
      }),
    resultados,
  });

  const datosImportacion = {
    realizadaPor: idAdministrador,
    nombreArchivo: NOMBRES_PRUEBA.importacion,
    fechaImportacion: FECHAS_PRUEBA.base,
    totalFilas: 2,
    filasExitosas: 1,
    filasFallidas: 1,
    estado: "PARCIAL" as const,
    detalleErrores: [{ fila: 2, error: "Fila ficticia inválida para probar el resumen." }],
  };
  await sincronizar({
    tabla: "ImportacionHoras",
    datos: datosImportacion,
    buscar: () =>
      tx.importacionHoras.findFirst({ where: { nombreArchivo: NOMBRES_PRUEBA.importacion } }),
    crear: () => tx.importacionHoras.create({ data: datosImportacion }),
    actualizar: async () => {
      const existente = await tx.importacionHoras.findFirstOrThrow({
        where: { nombreArchivo: NOMBRES_PRUEBA.importacion },
      });
      return tx.importacionHoras.update({
        where: { idImportacion: existente.idImportacion },
        data: datosImportacion,
      });
    },
    resultados,
  });
  const importacion = await tx.importacionHoras.findFirstOrThrow({
    where: { nombreArchivo: NOMBRES_PRUEBA.importacion },
  });

  const horas = [
    {
      idEstudiante: estudiante(CARNETS_PRUEBA.ana).idEstudiante,
      idOportunidad: null,
      idImportacion: null,
      fechaActividad: FECHAS_PRUEBA.actividadPendiente,
      horarioApoyo: "14:00-16:00",
      descripcionActividad: DESCRIPCIONES_HORAS_PRUEBA.pendienteManual,
      cantidadHoras: new Prisma.Decimal("2.00"),
      estado: "PENDIENTE" as const,
      acreditadoPor: null,
      fechaAcreditacion: null,
      observaciones: "Registro manual ficticio pendiente.",
    },
    {
      idEstudiante: estudiante(CARNETS_PRUEBA.ana).idEstudiante,
      idOportunidad: oportunidad.idOportunidad,
      idImportacion: null,
      fechaActividad: FECHAS_PRUEBA.actividadAcreditada,
      horarioApoyo: "08:00-11:00",
      descripcionActividad: DESCRIPCIONES_HORAS_PRUEBA.acreditadaOportunidad,
      cantidadHoras: new Prisma.Decimal("3.00"),
      estado: "ACREDITADA" as const,
      acreditadoPor: idAdministrador,
      fechaAcreditacion: FECHAS_PRUEBA.acreditacion,
      observaciones: "Registro ficticio acreditado por administrador.",
    },
    {
      idEstudiante: estudiante(CARNETS_PRUEBA.carlos).idEstudiante,
      idOportunidad: null,
      idImportacion: importacion.idImportacion,
      fechaActividad: FECHAS_PRUEBA.actividadImportada,
      horarioApoyo: "09:00-13:00",
      descripcionActividad: DESCRIPCIONES_HORAS_PRUEBA.acreditadaImportacion,
      cantidadHoras: new Prisma.Decimal("4.00"),
      estado: "ACREDITADA" as const,
      acreditadoPor: idAdministrador,
      fechaAcreditacion: FECHAS_PRUEBA.acreditacion,
      observaciones: "Registro importado para estudiante sin cuenta.",
    },
    {
      idEstudiante: estudiante(CARNETS_PRUEBA.carlos).idEstudiante,
      idOportunidad: null,
      idImportacion: null,
      fechaActividad: FECHAS_PRUEBA.actividadSinCuenta,
      horarioApoyo: "10:00-12:30",
      descripcionActividad: DESCRIPCIONES_HORAS_PRUEBA.pendienteSinCuenta,
      cantidadHoras: new Prisma.Decimal("2.50"),
      estado: "PENDIENTE" as const,
      acreditadoPor: null,
      fechaAcreditacion: null,
      observaciones: "Registro manual ficticio para estudiante sin cuenta.",
    },
  ];
  for (const registro of horas) {
    const datos = { ...registro, creadoPor: idAdministrador };
    const where = { descripcionActividad: registro.descripcionActividad };
    await sincronizar({
      tabla: "RegistroHoraBeca",
      datos,
      buscar: () => tx.registroHoraBeca.findFirst({ where }),
      crear: () => tx.registroHoraBeca.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.registroHoraBeca.findFirstOrThrow({ where });
        return tx.registroHoraBeca.update({
          where: { idRegistroHora: existente.idRegistroHora },
          data: datos,
        });
      },
      resultados,
    });
  }

  const cursos = [
    {
      codigo: CODIGOS_CURSOS_PRUEBA[0],
      nombre: `${MARCADOR_PRUEBA} Matemática básica`,
      activo: true,
    },
    {
      codigo: CODIGOS_CURSOS_PRUEBA[1],
      nombre: `${MARCADOR_PRUEBA} Programación básica`,
      activo: true,
    },
  ];
  for (const curso of cursos) {
    await sincronizar({
      tabla: "Curso",
      datos: curso,
      buscar: () => tx.curso.findUnique({ where: { codigo: curso.codigo } }),
      crear: () =>
        tx.curso.upsert({ where: { codigo: curso.codigo }, create: curso, update: curso }),
      actualizar: () => tx.curso.update({ where: { codigo: curso.codigo }, data: curso }),
      resultados,
    });
  }
  const cursosCreados = await tx.curso.findMany({
    where: { codigo: { in: [...CODIGOS_CURSOS_PRUEBA] } },
  });
  const cursoPorCodigo = new Map(cursosCreados.map((item) => [item.codigo, item]));

  const datosPostulacion = {
    idEstudiante: estudiante(CARNETS_PRUEBA.maria).idEstudiante,
    revisadaPor: idAdministrador,
    estado: "APROBADA" as const,
    comentarioSolicitante: NOMBRES_PRUEBA.postulacion,
    comentarioRevision: `${MARCADOR_PRUEBA} Aprobada para validar el flujo de tutorías.`,
    fechaPostulacion: FECHAS_PRUEBA.base,
    fechaRevision: FECHAS_PRUEBA.acreditacion,
  };
  await sincronizar({
    tabla: "PostulacionTutor",
    datos: datosPostulacion,
    buscar: () =>
      tx.postulacionTutor.findFirst({
        where: { comentarioSolicitante: NOMBRES_PRUEBA.postulacion },
      }),
    crear: () => tx.postulacionTutor.create({ data: datosPostulacion }),
    actualizar: async () => {
      const existente = await tx.postulacionTutor.findFirstOrThrow({
        where: { comentarioSolicitante: NOMBRES_PRUEBA.postulacion },
      });
      return tx.postulacionTutor.update({
        where: { idPostulacion: existente.idPostulacion },
        data: datosPostulacion,
      });
    },
    resultados,
  });
  const postulacion = await tx.postulacionTutor.findFirstOrThrow({
    where: { comentarioSolicitante: NOMBRES_PRUEBA.postulacion },
  });

  for (const codigo of CODIGOS_CURSOS_PRUEBA) {
    const curso = cursoPorCodigo.get(codigo);
    if (!curso) throw new Error(`No se encontró el curso ficticio ${codigo}.`);
    const datos = {
      idPostulacion: postulacion.idPostulacion,
      idCurso: curso.idCurso,
      notaObtenida: new Prisma.Decimal(codigo === CODIGOS_CURSOS_PRUEBA[0] ? "91.50" : "94.00"),
      comprobanteUrl: `https://example.test/comprobantes/${codigo.toLowerCase()}.pdf`,
    };
    await sincronizar({
      tabla: "CursoPostulacion",
      datos,
      buscar: () =>
        tx.cursoPostulacion.findUnique({
          where: {
            idPostulacion_idCurso: { idPostulacion: datos.idPostulacion, idCurso: datos.idCurso },
          },
        }),
      crear: () =>
        tx.cursoPostulacion.upsert({
          where: {
            idPostulacion_idCurso: { idPostulacion: datos.idPostulacion, idCurso: datos.idCurso },
          },
          create: datos,
          update: datos,
        }),
      actualizar: () =>
        tx.cursoPostulacion.update({
          where: {
            idPostulacion_idCurso: { idPostulacion: datos.idPostulacion, idCurso: datos.idCurso },
          },
          data: datos,
        }),
      resultados,
    });
  }

  const datosTutor = {
    idEstudiante: estudiante(CARNETS_PRUEBA.maria).idEstudiante,
    descripcion: "Perfil de tutor completamente ficticio para pruebas.",
    informacionContacto: "tutor.maria@example.test",
    estado: "ACTIVO" as const,
    fechaAprobacion: FECHAS_PRUEBA.acreditacion,
  };
  await sincronizar({
    tabla: "Tutor",
    datos: datosTutor,
    buscar: () => tx.tutor.findUnique({ where: { idEstudiante: datosTutor.idEstudiante } }),
    crear: () =>
      tx.tutor.upsert({
        where: { idEstudiante: datosTutor.idEstudiante },
        create: datosTutor,
        update: datosTutor,
      }),
    actualizar: () =>
      tx.tutor.update({ where: { idEstudiante: datosTutor.idEstudiante }, data: datosTutor }),
    resultados,
  });
  const tutor = await tx.tutor.findUniqueOrThrow({
    where: { idEstudiante: datosTutor.idEstudiante },
  });

  for (const codigo of CODIGOS_CURSOS_PRUEBA) {
    const curso = cursoPorCodigo.get(codigo);
    if (!curso) throw new Error(`No se encontró el curso ficticio ${codigo}.`);
    const datos = { idTutor: tutor.idTutor, idCurso: curso.idCurso, activo: true };
    const clave = { idTutor: tutor.idTutor, idCurso: curso.idCurso };
    await sincronizar({
      tabla: "TutorCurso",
      datos,
      buscar: () => tx.tutorCurso.findUnique({ where: { idTutor_idCurso: clave } }),
      crear: () =>
        tx.tutorCurso.upsert({ where: { idTutor_idCurso: clave }, create: datos, update: datos }),
      actualizar: () => tx.tutorCurso.update({ where: { idTutor_idCurso: clave }, data: datos }),
      resultados,
    });
  }

  const disponibilidades = [
    {
      diaSemana: "MARTES" as const,
      horaInicio: hora("15:00"),
      horaFin: hora("17:00"),
      modalidad: "VIRTUAL" as const,
      ubicacionEnlace: "https://example.test/tutoria/martes",
    },
    {
      diaSemana: "JUEVES" as const,
      horaInicio: hora("10:00"),
      horaFin: hora("12:00"),
      modalidad: "PRESENCIAL" as const,
      ubicacionEnlace: "Salón ficticio TEST-303",
    },
  ];
  for (const disponibilidad of disponibilidades) {
    const datos = { ...disponibilidad, idTutor: tutor.idTutor, activo: true };
    const where = {
      idTutor: tutor.idTutor,
      diaSemana: disponibilidad.diaSemana,
      horaInicio: disponibilidad.horaInicio,
    };
    await sincronizar({
      tabla: "DisponibilidadTutor",
      datos,
      buscar: () => tx.disponibilidadTutor.findFirst({ where }),
      crear: () => tx.disponibilidadTutor.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.disponibilidadTutor.findFirstOrThrow({ where });
        return tx.disponibilidadTutor.update({
          where: { idDisponibilidad: existente.idDisponibilidad },
          data: datos,
        });
      },
      resultados,
    });
  }

  const cursoMatematica = cursoPorCodigo.get(CODIGOS_CURSOS_PRUEBA[0]);
  const cursoProgramacion = cursoPorCodigo.get(CODIGOS_CURSOS_PRUEBA[1]);
  if (!cursoMatematica || !cursoProgramacion) throw new Error("Faltan los cursos ficticios.");
  const tutorias = [
    {
      idCurso: cursoMatematica.idCurso,
      idEstudiante: estudiante(CARNETS_PRUEBA.ana).idEstudiante,
      fechaInicio: FECHAS_PRUEBA.tutoriaProgramadaInicio,
      fechaFin: FECHAS_PRUEBA.tutoriaProgramadaFin,
      modalidad: "VIRTUAL" as const,
      ubicacionEnlace: "https://example.test/tutoria/programada",
      estado: "PROGRAMADA" as const,
      observaciones: `${MARCADOR_PRUEBA} Tutoría futura programada.`,
    },
    {
      idCurso: cursoProgramacion.idCurso,
      idEstudiante: estudiante(CARNETS_PRUEBA.ana).idEstudiante,
      fechaInicio: FECHAS_PRUEBA.tutoriaCompletadaInicio,
      fechaFin: FECHAS_PRUEBA.tutoriaCompletadaFin,
      modalidad: "PRESENCIAL" as const,
      ubicacionEnlace: "Salón ficticio TEST-404",
      estado: "COMPLETADA" as const,
      observaciones: `${MARCADOR_PRUEBA} Tutoría histórica completada.`,
    },
  ];
  for (const tutoria of tutorias) {
    const datos = { ...tutoria, idTutor: tutor.idTutor };
    const where = { idTutor: tutor.idTutor, fechaInicio: tutoria.fechaInicio };
    await sincronizar({
      tabla: "Tutoria",
      datos,
      buscar: () => tx.tutoria.findFirst({ where }),
      crear: () => tx.tutoria.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.tutoria.findFirstOrThrow({ where });
        return tx.tutoria.update({ where: { idTutoria: existente.idTutoria }, data: datos });
      },
      resultados,
    });
  }

  const intereses = [
    {
      tipoInteres: "categoria_evento",
      idReferencia: categoriaPorNombre.get("Festival")!.idCategoriaEvento,
      nivelInteres: 3,
    },
    { tipoInteres: "club", idReferencia: club.idClub, nivelInteres: 2 },
  ];
  for (const interes of intereses) {
    const datos = { ...interes, idUsuario: idUsuarioAna, fechaCreacion: FECHAS_PRUEBA.base };
    const clave = {
      idUsuario: idUsuarioAna,
      tipoInteres: interes.tipoInteres,
      idReferencia: interes.idReferencia,
    };
    await sincronizar({
      tabla: "InteresUsuario",
      datos,
      buscar: () =>
        tx.interesUsuario.findUnique({ where: { idUsuario_tipoInteres_idReferencia: clave } }),
      crear: () =>
        tx.interesUsuario.upsert({
          where: { idUsuario_tipoInteres_idReferencia: clave },
          create: datos,
          update: datos,
        }),
      actualizar: () =>
        tx.interesUsuario.update({
          where: { idUsuario_tipoInteres_idReferencia: clave },
          data: datos,
        }),
      resultados,
    });
  }

  const interacciones = [
    {
      tipoEntidad: "evento",
      idEntidad: evento(NOMBRES_PRUEBA.eventoProximo).idEvento,
      tipoInteraccion: "vista",
    },
    { tipoEntidad: "asociacion", idEntidad: asociacion.idAsociacion, tipoInteraccion: "vista" },
    { tipoEntidad: "club", idEntidad: club.idClub, tipoInteraccion: "vista" },
  ];
  for (const [indice, interaccion] of interacciones.entries()) {
    const fechaInteraccion = new Date(FECHAS_PRUEBA.base.getTime() + indice * 60_000);
    const datos = { ...interaccion, idUsuario: idUsuarioAna, fechaInteraccion };
    const where = { ...interaccion, idUsuario: idUsuarioAna, fechaInteraccion };
    await sincronizar({
      tabla: "InteraccionUsuario",
      datos,
      buscar: () => tx.interaccionUsuario.findFirst({ where }),
      crear: () => tx.interaccionUsuario.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.interaccionUsuario.findFirstOrThrow({ where });
        return tx.interaccionUsuario.update({
          where: { idInteraccion: existente.idInteraccion },
          data: datos,
        });
      },
      resultados,
    });
  }

  const notificaciones = [
    {
      titulo: TITULOS_NOTIFICACIONES_PRUEBA.evento,
      mensaje: "Hay un evento ficticio disponible para comprobar notificaciones no leídas.",
      tipo: "EVENTO_PRUEBA",
      urlDestino: "/eventos/prueba",
      leida: false,
      fechaEnvio: FECHAS_PRUEBA.base,
      fechaLectura: null,
    },
    {
      titulo: TITULOS_NOTIFICACIONES_PRUEBA.tutoria,
      mensaje: "La tutoría ficticia fue confirmada.",
      tipo: "TUTORIA_PRUEBA",
      urlDestino: "/tutorias/prueba",
      leida: true,
      fechaEnvio: FECHAS_PRUEBA.base,
      fechaLectura: FECHAS_PRUEBA.acreditacion,
    },
    {
      titulo: TITULOS_NOTIFICACIONES_PRUEBA.horas,
      mensaje: "Se acreditaron horas beca ficticias para validar el módulo.",
      tipo: "HORAS_BECA_PRUEBA",
      urlDestino: "/perfil/horas-beca",
      leida: true,
      fechaEnvio: FECHAS_PRUEBA.base,
      fechaLectura: FECHAS_PRUEBA.acreditacion,
    },
  ];
  for (const notificacion of notificaciones) {
    const datos = { ...notificacion, idUsuario: idUsuarioAna };
    const where = { idUsuario: idUsuarioAna, titulo: notificacion.titulo };
    await sincronizar({
      tabla: "Notificacion",
      datos,
      buscar: () => tx.notificacion.findFirst({ where }),
      crear: () => tx.notificacion.create({ data: datos }),
      actualizar: async () => {
        const existente = await tx.notificacion.findFirstOrThrow({ where });
        return tx.notificacion.update({
          where: { idNotificacion: existente.idNotificacion },
          data: datos,
        });
      },
      resultados,
    });
  }

  return resultados;
}

function imprimirResultados(resultados: Resultados): void {
  console.log("Información ficticia procesada:");
  for (const [tabla, resultado] of resultados) {
    console.log(
      `- ${tabla}: ${resultado.creados} creados; ${resultado.actualizados} actualizados; ${resultado.sinCambios} sin cambios.`
    );
  }
}

async function ejecutar(): Promise<void> {
  const connectionString = validarEntorno();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const resultados = await prisma.$transaction((tx) => cargarDatos(tx), { timeout: 60_000 });
    imprimirResultados(resultados);
    console.log("Seed de información de prueba completado correctamente.");
  } finally {
    await prisma.$disconnect();
  }
}

ejecutar().catch((error: unknown) => {
  const connectionString = process.env.DATABASE_URL;
  const mensaje = error instanceof Error ? error.message : String(error);
  const seguro = connectionString
    ? mensaje.replaceAll(connectionString, "[DATABASE_URL]")
    : mensaje;
  console.error(`El seed de prueba falló: ${seguro}`);
  process.exitCode = 1;
});
