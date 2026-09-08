// Genera Documentos/AEUVG - Desarrollo Sprint 1.docx
// Uso: node scripts/docs/desarrollo-sprint1.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");

const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 1",
    date: "Guatemala, 8 de septiembre del 2026",
  }),

  // ---------- 1. Introducción ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 1 - Fundamentos del sistema (26 de agosto al 8 de septiembre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa la planificación del Sprint 1, documentando por cada historia de usuario el trabajo realizado y las decisiones tomadas durante su implementación."
  ),

  // ---------- 2. HU-01 ----------
  h1("2. HU-01 - Configuración del proyecto, repositorio y despliegue en Railway"),
  p(
    "Esta historia estableció la base técnica del proyecto: la selección del stack tecnológico, la creación del repositorio con su flujo de trabajo, la inicialización del proyecto con sus herramientas de calidad de código, y la preparación del despliegue en Railway con sus ambientes y variables de entorno. Con esto, el equipo cuenta con un entorno de trabajo común y AEUVG podrá revisar el avance de la plataforma desde internet al finalizar cada sprint."
  ),

  h2("2.1. Stack tecnológico y arquitectura"),
  p(
    "El stack se seleccionó considerando las restricciones del proyecto: un equipo de dos desarrolladores, seis sprints de desarrollo, un presupuesto de operación inicial de US$5 mensuales en Railway, una escala esperada de aproximadamente 3,000 estudiantes registrados con 500 visitas diarias, y la necesidad de que el sistema se mantenga en producción durante varios años."
  ),
  p(
    "Se adoptó una arquitectura monolítica full-stack: un solo proyecto que contiene el frontend y el backend, desplegado como un único servicio conectado a una base de datos PostgreSQL. A la escala esperada, separar frontend y backend en servicios independientes duplicaría el consumo de recursos sin beneficio técnico; el monolito permite además compartir el lenguaje (TypeScript), los tipos y las validaciones en todo el proyecto, y simplifica el despliegue continuo. La separación entre frontend y backend se mantiene en la estructura interna: los componentes de interfaz nunca acceden directamente a la base de datos, sino a través de los endpoints y la lógica que corren en el servidor."
  ),
  spacer(),
  makeTable(
    [2200, 3200, 3960],
    ["Capa", "Tecnología", "Justificación"],
    [
      [
        "Frontend",
        "Next.js 16 (App Router), React 19, TypeScript 5",
        "Framework React de mayor adopción; renderizado en servidor para SEO y rendimiento móvil.",
      ],
      [
        "Estilos / UI",
        "Tailwind CSS 4 + shadcn/ui",
        "Interfaz consistente, responsive y personalizable a la identidad de AEUVG.",
      ],
      [
        "Backend",
        "API Routes / Server Actions de Next.js",
        "Endpoints y lógica de negocio en el mismo proyecto y despliegue.",
      ],
      [
        "ORM",
        "Prisma",
        "Migraciones versionadas en git y esquema declarativo del modelo de datos.",
      ],
      [
        "Base de datos",
        "PostgreSQL 17 (Railway)",
        "Definida en el documento del proyecto; modelo relacional con respaldos administrados.",
      ],
      [
        "Autenticación",
        "Auth.js (NextAuth v5)",
        "Registro, sesiones, recuperación de contraseña y roles; registro restringido a correos UVG.",
      ],
      ["Validación", "Zod", "Mismos esquemas de validación en cliente y servidor."],
      [
        "Excel / PDF",
        "exceljs y pdfmake",
        "Importación y exportación de horas beca y reportes (sprints 4 y 5).",
      ],
      ["Correos", "Resend", "Correos transaccionales; plan gratuito de ~3,000 correos mensuales."],
      [
        "Imágenes",
        "Cloudinary",
        "Almacenamiento de imágenes y comprobantes; el sistema de archivos de Railway es efímero.",
      ],
      [
        "Contenedores",
        "Docker + Docker Compose",
        "Entorno idéntico para todo el equipo y build reproducible para producción.",
      ],
      [
        "Hosting",
        "Railway",
        "Aplicación y base de datos con despliegue automático desde GitHub, desde US$5/mes.",
      ],
    ]
  ),
  spacer(),
  p(
    "Entre las alternativas evaluadas se descartó la separación en servicios independientes de frontend (React/Vite) y backend (Express/NestJS), por duplicar costo y configuración sin beneficio a esta escala, así como los frameworks Laravel y Django, por introducir un segundo lenguaje al proyecto. La justificación extendida se encuentra versionada en el repositorio, en el archivo docs/stack-tecnologico.md."
  ),

  h2("2.2. Repositorio y flujo de trabajo"),
  p(
    "El proyecto se versiona en GitHub, en el repositorio hmndz3/AEUVGWEB, con dos ramas permanentes: main, que corresponde a la versión publicada, y develop, donde se integra el trabajo del sprint. El trabajo de cada tarea se realiza en ramas propias que se integran a develop mediante pull requests, lo que permite revisar el código entre ambos integrantes antes de publicarlo; al cierre del sprint, develop se integra a main y la nueva versión queda en línea. El archivo README documenta el stack, los requisitos, las instrucciones para ejecutar el proyecto localmente, los scripts disponibles y este flujo de trabajo, de manera que cualquier integrante pueda montar el entorno desde cero."
  ),

  h2("2.3. Entorno de desarrollo y calidad de código"),
  p(
    "El proyecto se inicializó con Next.js, TypeScript y Tailwind CSS, con una estructura de carpetas que separa las responsabilidades del sistema: las rutas y páginas junto con los endpoints del backend, los componentes de interfaz reutilizables, la lógica de negocio del servidor y los esquemas de validación compartidos. Esta organización busca que el crecimiento del proyecto durante los siguientes sprints mantenga el código ordenado y fácil de ubicar."
  ),
  p(
    "Debido a que el proyecto se desarrolla entre dos personas, se configuró Docker para garantizar un entorno idéntico para todo el equipo: un archivo docker-compose levanta la base de datos PostgreSQL local con un solo comando, y un Dockerfile construye la imagen de producción que utiliza Railway, de modo que lo probado localmente sea lo mismo que se despliega. Como herramientas de calidad se configuraron ESLint para el análisis estático del código, Prettier para el formato automático y EditorConfig para unificar la configuración de los editores, evitando diferencias de estilo entre integrantes."
  ),

  h2("2.4. Despliegue y variables de entorno"),
  p(
    "El despliegue se realiza en Railway construyendo la imagen de producción desde el Dockerfile del repositorio, con publicación automática: cada actualización de la rama main genera una nueva versión en línea. La aplicación se encuentra desplegada y accesible en https://aeuvgweb-production.up.railway.app, junto con el servicio de base de datos PostgreSQL del mismo proyecto. El procedimiento completo de configuración quedó documentado en el repositorio, en el archivo docs/despliegue-railway.md, incluyendo el trámite pendiente del dominio institucional."
  ),
  p(
    "Las variables de entorno se definen por ambiente y nunca se almacenan en el repositorio: los archivos .env están excluidos del control de versiones y en Railway se configuran desde el panel del servicio. El repositorio incluye el archivo de ejemplo .env.example, que documenta con comentarios cada variable requerida:"
  ),
  bullet(
    "DATABASE_URL: cadena de conexión a PostgreSQL, referenciada desde el servicio de Railway."
  ),
  bullet("NEXT_PUBLIC_APP_URL: dirección pública de la aplicación."),
  bullet("AUTH_SECRET: secreto aleatorio para la firma de sesiones."),
  bullet("PORT: puerto en el que la aplicación atiende las peticiones."),
  bullet("RESEND_API_KEY y EMAIL_FROM: credenciales del servicio de correos transaccionales."),

  // ---------- 3. HU-02 ----------
  h1("3. HU-02 - Diseño e implementación de la base de datos"),
  p(
    "Esta historia definió y construyó la base de datos sobre la cual se apoyarán todos los módulos del sistema. A partir del documento de definición del proyecto se identificaron las entidades, sus atributos y las reglas de negocio; con ello se elaboró el modelo entidad-relación, se implementó el esquema en PostgreSQL mediante migraciones versionadas y se cargaron los catálogos necesarios para comenzar a trabajar. Al cierre de la historia, la base de datos se encuentra creada y poblada en el servicio de Railway, y la aplicación desplegada se conecta a ella."
  ),

  h2("3.1. Modelo de datos"),
  p(
    "El modelo comprende 28 entidades organizadas por módulo, acompañadas de 12 enumeraciones que representan los estados y clasificaciones cerradas del sistema:"
  ),
  bullet(
    "Usuarios y estudiantes: facultades, carreras, estudiantes, usuarios, roles y su asignación."
  ),
  bullet(
    "Asociaciones y clubes: asociaciones, integrantes de junta directiva, clubes y redes sociales."
  ),
  bullet("Eventos: categorías, eventos, organizadores y eventos guardados por los usuarios."),
  bullet(
    "Horas beca: oportunidades, inscripciones, registros de horas e importaciones desde archivos externos."
  ),
  bullet("Tutorías: cursos, postulaciones, tutores, disponibilidad horaria y tutorías impartidas."),
  bullet("Personalización: intereses, interacciones de los usuarios y notificaciones."),
  p(
    "Una decisión central del modelo es la separación entre estudiante y usuario. El carnet identifica al estudiante y permite que AEUVG registre horas beca aunque la persona todavía no tenga cuenta en la plataforma; cuando el estudiante se registra con ese mismo carnet, el sistema asocia automáticamente los registros existentes a su perfil. Los estados de las horas se representan mediante una enumeración, de modo que las horas acreditadas se conserven como parte del historial y no vuelvan a contabilizarse como pendientes. El detalle completo del modelo, sus convenciones, restricciones y decisiones pendientes quedó documentado en el archivo docs/modelo-datos.md del repositorio."
  ),

  h2("3.2. Diagrama entidad-relación"),
  p(
    "Se elaboró el diagrama entidad-relación que define las relaciones entre las entidades y su cardinalidad, cubriendo los módulos de usuarios, eventos, asociaciones, clubes, horas beca, tutorías y notificaciones. El diagrama está versionado junto con la documentación del modelo, de manera que se actualiza con el mismo control de cambios que el resto del proyecto y ambos integrantes trabajan siempre sobre la misma versión."
  ),

  h2("3.3. Implementación del esquema"),
  p(
    "El esquema se implementó con Prisma sobre PostgreSQL, mediante una migración inicial versionada en el repositorio. La migración crea las 28 tablas del modelo con sus llaves primarias, 38 llaves foráneas que garantizan la integridad referencial, restricciones de unicidad y de validación, y 72 índices sobre los campos de búsqueda frecuente, como el carnet del estudiante y las fechas de los eventos."
  ),
  p(
    "El uso de migraciones versionadas permite que cualquier cambio futuro del esquema quede registrado en el historial del proyecto y pueda aplicarse de forma controlada, tanto en los entornos locales de desarrollo como en la base de datos publicada."
  ),

  h2("3.4. Catálogos iniciales"),
  p(
    "Se cargaron los catálogos necesarios para que los módulos de los siguientes sprints cuenten con información de referencia desde el inicio: 8 unidades académicas, 48 carreras de pregrado, 8 categorías de eventos y los 3 roles del sistema, correspondientes a estudiante, tutor y administrador. La información académica se tomó del catálogo público de carreras de la Universidad del Valle de Guatemala."
  ),
  p(
    "La carga es idempotente: crea los registros que faltan, actualiza los que difieren de la definición versionada y deja intactos los que ya coinciden, sin eliminar información. Los valores se mantienen en archivos separados dentro del repositorio, de modo que actualizar un catálogo no implica modificar la lógica de carga. Adicionalmente se elaboró un conjunto de información ficticia, independiente de los catálogos, destinado exclusivamente a pruebas en entornos locales."
  ),

  h2("3.5. Conexión de la aplicación con la base de datos"),
  p(
    "La aplicación se conecta a PostgreSQL a través de un cliente único y reutilizado, que se crea la primera vez que se solicita. Para verificar la conexión de forma directa se implementó el punto de acceso /api/health, que consulta la base de datos y responde si la comunicación es correcta. Esta verificación permite confirmar el estado del sistema desde el navegador, sin necesidad de revisar los registros del servidor."
  ),

  // ---------- 4. Estado ----------
  h1("4. Estado del sprint"),
  p(
    "Al momento de esta actualización, las historias de usuario HU-01 y HU-02 se encuentran completadas. El sistema cuenta con:"
  ),
  bullet("El stack tecnológico definido y documentado."),
  bullet("El repositorio configurado, con las ramas de trabajo y el archivo README."),
  bullet(
    "El proyecto inicializado, con su estructura de carpetas y herramientas de calidad de código."
  ),
  bullet("La aplicación desplegada en Railway y accesible desde internet."),
  bullet("La base de datos PostgreSQL creada, con su esquema completo y sus catálogos cargados."),
  bullet("La conexión entre la aplicación y la base de datos verificada."),
  p(
    "El trámite del dominio institucional continúa en gestión ante la universidad. Las historias restantes del sprint corresponden al sistema de diseño y prototipos, la autenticación de usuarios, los roles y permisos, y las páginas informativas de AEUVG."
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 1.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
