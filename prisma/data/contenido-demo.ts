/**
 * Contenido de demostración: asociaciones y eventos ficticios, con logotipos e
 * ilustraciones propias (public/demo, generadas por
 * scripts/demo/generar-imagenes.js), para mostrar la plataforma funcionando
 * mientras AEUVG carga su información real.
 *
 * Lo carga y lo retira prisma/seed-demo.ts. Todo lo que crea usa imágenes de
 * /demo/, que es la marca con la que el retiro distingue este contenido del
 * real: nunca toca un registro con el mismo nombre que no la tenga.
 */

export const PREFIJO_IMAGEN_DEMO = "/demo/";

export type AsociacionDemo = {
  clave: string;
  nombre: string;
  siglas: string;
  descripcion: string;
  mision: string;
  vision: string;
  informacionContacto: string;
  imagenUrl: string;
};

export const ASOCIACIONES_DEMO: readonly AsociacionDemo[] = [
  {
    clave: "adem",
    nombre: "Asociación de Estudiantes de Diseño y Medios",
    siglas: "ADEM",
    descripcion:
      "Reúne a quienes estudian diseño, comunicación y producción audiovisual. Organiza talleres de portafolio, revisiones con profesionales y la muestra anual de proyectos.",
    mision:
      "Impulsar la creatividad del estudiantado con espacios para crear, mostrar su trabajo y conectar con la industria.",
    vision:
      "Ser la comunidad de referencia para el diseño y los medios en la universidad, con proyectos que trasciendan el aula.",
    informacionContacto:
      "Sala de proyectos, edificio de Ciencias Sociales. Lunes a jueves de 14:00 a 17:00.",
    imagenUrl: "/demo/asociaciones/adem.svg",
  },
  {
    clave: "aebio",
    nombre: "Asociación de Estudiantes de Biotecnología",
    siglas: "AEBIO",
    descripcion:
      "Acompaña al estudiantado de biotecnología y ciencias de la vida con jornadas de voluntariado ambiental, charlas de investigación y visitas a laboratorios.",
    mision:
      "Acercar la ciencia a la comunidad y promover proyectos con impacto ambiental y social.",
    vision:
      "Una generación de científicos comprometidos con Guatemala y con el cuidado de sus recursos naturales.",
    informacionContacto:
      "Laboratorio de usos múltiples, edificio de Ciencias. Martes y jueves por la tarde.",
    imagenUrl: "/demo/asociaciones/aebio.svg",
  },
  {
    clave: "aeind",
    nombre: "Asociación de Estudiantes de Ingeniería Industrial",
    siglas: "AEIND",
    descripcion:
      "Representa al estudiantado de Ingeniería Industrial. Organiza la hackatón anual, ferias de emprendimiento y visitas técnicas a plantas de producción.",
    mision:
      "Formar ingenieros que mejoren procesos, emprendan y lideren equipos con responsabilidad.",
    vision:
      "Ser la asociación que conecta a la carrera con la industria y el emprendimiento del país.",
    informacionContacto: "Cubículo de asociaciones, edificio CIT, segundo nivel.",
    imagenUrl: "/demo/asociaciones/aeind.svg",
  },
  {
    clave: "aepsi",
    nombre: "Asociación de Estudiantes de Psicología",
    siglas: "AEPSI",
    descripcion:
      "Promueve el bienestar emocional en el campus con conversatorios, grupos de apoyo y campañas de salud mental abiertas a toda la comunidad universitaria.",
    mision:
      "Crear espacios seguros para hablar de salud mental y acompañar al estudiantado en su vida universitaria.",
    vision:
      "Un campus donde pedir ayuda sea algo natural y el bienestar sea parte de la formación.",
    informacionContacto: "Edificio de Ciencias Sociales, sala de reuniones del tercer nivel.",
    imagenUrl: "/demo/asociaciones/aepsi.svg",
  },
  {
    clave: "aemat",
    nombre: "Asociación de Estudiantes de Matemática Aplicada",
    siglas: "AEMAT",
    descripcion:
      "Reúne a quienes disfrutan los números: olimpiadas internas, grupos de estudio antes de parciales y actividades para recaudar fondos para competencias.",
    mision:
      "Hacer de la matemática una experiencia colaborativa, retadora y divertida para todo el campus.",
    vision:
      "Ser semillero de estudiantes que representen a la universidad en competencias nacionales e internacionales.",
    informacionContacto: "Biblioteca, sala de estudio grupal B. Miércoles de 15:00 a 17:00.",
    imagenUrl: "/demo/asociaciones/aemat.svg",
  },
];

export type EventoDemo = {
  nombre: string;
  descripcion: string;
  categoria: string;
  tipoActividad: "ACADEMICA" | "RECREATIVA" | "VOLUNTARIADO" | "OTRO";
  /** Días desde la fecha de carga; mantiene los eventos siempre en el futuro. */
  enDias: number;
  /** Hora local de Guatemala, "HH:MM". */
  inicio: string;
  /** Duración en horas. */
  horas: number;
  ubicacion: string;
  imagen: string;
  destacado: boolean;
  cupo: number | null;
  informacionAdicional: string | null;
  /** Claves de ASOCIACIONES_DEMO; la primera es la organizadora principal. */
  asociaciones: string[];
  unidadUvg?: string;
};

export const EVENTOS_DEMO: readonly EventoDemo[] = [
  {
    nombre: "Venta de postres solidaria",
    descripcion:
      "Postres caseros preparados por la asociación para recaudar fondos para la delegación que viajará a la olimpiada regional de matemática.",
    categoria: "Recaudación de fondos",
    tipoActividad: "OTRO",
    enDias: 3,
    inicio: "10:00",
    horas: 5,
    ubicacion: "Plaza central",
    imagen: "postres",
    destacado: false,
    cupo: null,
    informacionAdicional: "Se aceptan pagos en efectivo y transferencia.",
    asociaciones: ["aemat"],
  },
  {
    nombre: "Hackatón Verde 2026",
    descripcion:
      "Doce horas para diseñar soluciones tecnológicas a retos ambientales del campus. Equipos de tres a cinco personas, mentores de la industria y premios para los tres primeros lugares.",
    categoria: "Colaboración estudiantil",
    tipoActividad: "ACADEMICA",
    enDias: 6,
    inicio: "08:00",
    horas: 12,
    ubicacion: "Edificio CIT, laboratorios del segundo nivel",
    imagen: "hackaton",
    destacado: true,
    cupo: 120,
    informacionAdicional: "Inscripción previa por equipo. Se proporciona almuerzo y refacciones.",
    asociaciones: ["aeind", "aebio"],
  },
  {
    nombre: "Taller: portafolios que consiguen prácticas",
    descripcion:
      "Revisión práctica de portafolios con diseñadores invitados: qué incluir, cómo presentarlo y los errores más comunes al aplicar a una práctica profesional.",
    categoria: "Conferencia o taller",
    tipoActividad: "ACADEMICA",
    enDias: 8,
    inicio: "15:00",
    horas: 2,
    ubicacion: "Sala de proyectos, edificio de Ciencias Sociales",
    imagen: "diseno",
    destacado: false,
    cupo: 40,
    informacionAdicional: "Trae tu portafolio impreso o en tu computadora.",
    asociaciones: ["adem"],
  },
  {
    nombre: "Feria de Emprendimiento Estudiantil",
    descripcion:
      "Más de treinta emprendimientos del estudiantado presentan sus productos: comida, ropa, arte, tecnología y servicios. Ven a apoyar el talento del campus.",
    categoria: "Venta",
    tipoActividad: "RECREATIVA",
    enDias: 10,
    inicio: "09:00",
    horas: 7,
    ubicacion: "Plaza central y corredor del CIT",
    imagen: "emprendimiento",
    destacado: true,
    cupo: null,
    informacionAdicional: null,
    asociaciones: ["aeind"],
  },
  {
    nombre: "Noche de cine al aire libre",
    descripcion:
      "Proyección de una película elegida por votación en redes, con palomitas para los primeros cien asistentes. Trae una manta o una silla plegable.",
    categoria: "Proyección",
    tipoActividad: "RECREATIVA",
    enDias: 13,
    inicio: "18:30",
    horas: 3,
    ubicacion: "Plaza CIT",
    imagen: "cine",
    destacado: false,
    cupo: null,
    informacionAdicional: null,
    asociaciones: ["adem"],
    unidadUvg: "Vida Estudiantil",
  },
  {
    nombre: "Conversatorio: salud mental en la U",
    descripcion:
      "Un espacio abierto para hablar de estrés académico, ansiedad y hábitos de descanso, con la participación de psicólogas del departamento de orientación.",
    categoria: "Conferencia o taller",
    tipoActividad: "ACADEMICA",
    enDias: 15,
    inicio: "12:30",
    horas: 1.5,
    ubicacion: "Auditorio del edificio de Ciencias Sociales",
    imagen: "bienestar",
    destacado: false,
    cupo: 80,
    informacionAdicional: "Actividad gratuita y abierta a toda la comunidad.",
    asociaciones: ["aepsi"],
  },
  {
    nombre: "Torneo relámpago de fútbol 5",
    descripcion:
      "Torneo de un día entre equipos de carreras. Partidos de quince minutos, eliminación directa y trofeo para el campeón. Inscribe a tu equipo de cinco a ocho personas.",
    categoria: "Torneo deportivo",
    tipoActividad: "RECREATIVA",
    enDias: 17,
    inicio: "08:00",
    horas: 8,
    ubicacion: "Canchas deportivas",
    imagen: "futbol",
    destacado: true,
    cupo: 16,
    informacionAdicional: "El cupo corresponde a equipos. Cada equipo debe traer su uniforme.",
    asociaciones: ["aeind"],
    unidadUvg: "Departamento de Deportes",
  },
  {
    nombre: "Festival Ritmos del Campus",
    descripcion:
      "Bandas y solistas del estudiantado, food trucks y actividades durante toda la tarde para cerrar el ciclo con la mejor energía.",
    categoria: "Festival",
    tipoActividad: "RECREATIVA",
    enDias: 21,
    inicio: "14:00",
    horas: 6,
    ubicacion: "Plaza central",
    imagen: "festival",
    destacado: true,
    cupo: null,
    informacionAdicional: null,
    asociaciones: ["adem", "aepsi"],
  },
  {
    nombre: "Jornada de reforestación",
    descripcion:
      "Siembra de quinientos árboles nativos en una finca aliada. Incluye transporte desde el campus y se acreditan horas beca a quienes completen la jornada.",
    categoria: "Convocatoria de horas beca",
    tipoActividad: "VOLUNTARIADO",
    enDias: 26,
    inicio: "06:30",
    horas: 8,
    ubicacion: "Salida desde el parqueo principal",
    imagen: "reforestacion",
    destacado: true,
    cupo: 60,
    informacionAdicional: "Usa ropa cómoda, bloqueador y lleva agua. Se acreditan 6 horas beca.",
    asociaciones: ["aebio"],
  },
  {
    nombre: "Rally del Espíritu UVG",
    descripcion:
      "Equipos por carrera compiten en retos de ingenio, deporte y creatividad por todo el campus. Gana el equipo con más espíritu universitario.",
    categoria: "Espíritu universitario",
    tipoActividad: "RECREATIVA",
    enDias: 30,
    inicio: "09:00",
    horas: 5,
    ubicacion: "Todo el campus, salida en la plaza central",
    imagen: "espiritu",
    destacado: false,
    cupo: 200,
    informacionAdicional: null,
    asociaciones: ["aemat", "aepsi"],
  },
  {
    nombre: "Olimpiada de matemática recreativa",
    descripcion:
      "Acertijos, lógica y problemas de ingenio en equipos de tres. No necesitas ser de una carrera de ciencias: solo ganas de pensar y pasarla bien.",
    categoria: "Colaboración estudiantil",
    tipoActividad: "ACADEMICA",
    enDias: 35,
    inicio: "16:00",
    horas: 2,
    ubicacion: "Biblioteca, salas de estudio grupal",
    imagen: "matematica",
    destacado: false,
    cupo: 45,
    informacionAdicional: null,
    asociaciones: ["aemat"],
  },
  {
    nombre: "Semana de la Ciencia",
    descripcion:
      "Charlas, demostraciones en vivo y visitas guiadas a los laboratorios de investigación. Una semana para descubrir lo que se investiga en el campus.",
    categoria: "Colaboración institucional",
    tipoActividad: "ACADEMICA",
    enDias: 40,
    inicio: "10:00",
    horas: 6,
    ubicacion: "Edificio de Ciencias, vestíbulo principal",
    imagen: "ciencia",
    destacado: false,
    cupo: null,
    informacionAdicional: "La programación completa se publica en las redes de AEUVG.",
    asociaciones: ["aebio", "aemat"],
    unidadUvg: "Facultad de Ciencias y Humanidades",
  },
];
