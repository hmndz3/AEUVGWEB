// Genera Documentos/AEUVG - Desarrollo Sprint 1.docx
// Uso: node scripts/docs/desarrollo-sprint1.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const {
  p,
  bullet,
  h1,
  h2,
  makeTable,
  spacer,
  figura,
  cover,
  buildDocument,
} = require("./template");

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

  // ---------- 4. HU-03 ----------
  h1("4. HU-03 - Sistema de diseño y prototipos de las pantallas principales"),
  p(
    "Esta historia define la identidad visual de la plataforma, los prototipos de sus pantallas principales y la biblioteca de componentes con la que se construirán todas las interfaces. Su propósito es que el desarrollo sea consistente durante el resto del proyecto y que no deba rediseñarse en cada sprint."
  ),

  h2("4.1. Identidad visual y paleta"),
  p(
    "La paleta se derivó del logo de AEUVG, que representa figuras humanas de colores distintos formando un círculo, en alusión a la unión de las asociaciones estudiantiles. Dado que ningún color del logo predomina sobre los demás, se tomó el violeta como color de acción, por ser el que mejor se identifica como elemento interactivo, y los tonos restantes se repartieron como acentos a lo largo de la interfaz."
  ),
  spacer(),
  makeTable(
    [2600, 2000, 4760],
    ["Grupo", "Color", "Uso"],
    [
      ["Acción", "Violeta #6D4AFF", "Botones principales, enlaces y navegación."],
      [
        "Acentos",
        "Coral, turquesa, ámbar, magenta, lima, cielo y lavanda",
        "Diferenciación de las categorías de eventos y realces de sección.",
      ],
      [
        "Neutros",
        "Fondo crema #FFF8F3 y texto #1C162B",
        "Fondos y texto. Se eligieron neutros cálidos en lugar de grises para que la interfaz no resulte fría.",
      ],
      [
        "Estados",
        "Éxito, advertencia, error e informativo",
        "Las horas beca acreditadas se muestran en turquesa y las pendientes en ámbar.",
      ],
    ]
  ),
  spacer(),
  p(
    "Cada una de las ocho categorías de eventos cargadas durante la historia anterior tiene asignado uno de los colores de acento, almacenado en la propia base de datos. La paleta completa quedó documentada en el repositorio e implementada como variables de diseño dentro del proyecto, de modo que todas las pantallas la consumen desde un único lugar."
  ),

  h2("4.2. Tipografía y forma"),
  p(
    "Se seleccionó la familia tipográfica Plus Jakarta Sans, de trazo geométrico y aspecto amable, con soporte completo de acentos y ñ. Se definió una escala de siete tamaños que abarca desde el titular principal hasta las etiquetas, con variantes propias para la vista móvil."
  ),
  p(
    "En cuanto a la forma, se establecieron radios amplios para campos y tarjetas, botones y etiquetas de estado con radio completo, y sombras suaves teñidas del color del elemento en lugar de sombras grises neutras. Estas decisiones buscan que la plataforma resulte cercana para el estudiantado y se distinga de la estética de un portal administrativo."
  ),

  h2("4.3. Biblioteca de componentes"),
  p(
    "Se implementó dentro del proyecto la biblioteca de componentes base sobre la que se construirán todas las pantallas: botones en sus cinco variantes con sus estados, campos de formulario con etiqueta, texto de ayuda y estado de error, tarjetas, tablas de datos, etiquetas de estado, mensajes de alerta, encabezado de navegación y pie de página."
  ),
  p(
    "Los componentes consumen directamente las variables de la paleta, por lo que un ajuste de color se refleja en toda la plataforma sin modificar cada pantalla. Se incluyó además una página interna que reúne todos los componentes, la cual sirve como referencia visual para el equipo y permite verificar su comportamiento en distintos tamaños de pantalla."
  ),
  ...figura(
    "docs/diseno/documento/sistema-componentes.png",
    620,
    720,
    "Biblioteca de componentes base implementada en el proyecto."
  ),

  h2("4.4. Prototipos de las pantallas principales"),
  p(
    "Se elaboraron los prototipos de las pantallas principales de la plataforma, en sus versiones para computadora y para dispositivos móviles. Las pantallas cubiertas son la página principal, la página sobre AEUVG, la creación de cuenta, el inicio de sesión con sus flujos de recuperación y restablecimiento de contraseña, la confirmación de correo, el listado y el detalle de eventos, el perfil del estudiante en sus distintas pestañas, y el panel administrativo con su resumen y la gestión de horas beca."
  ),
  p(
    "Los prototipos se revisaron contra el modelo de datos implementado en la historia anterior, de modo que la información mostrada corresponda con la que el sistema efectivamente almacena. A continuación se presentan las pantallas más representativas."
  ),
  ...figura("docs/diseno/documento/landing-escritorio.png", 620, 720, "Página principal."),
  ...figura(
    "docs/diseno/documento/eventos-escritorio.png",
    620,
    720,
    "Listado de eventos con sus filtros."
  ),
  ...figura(
    "docs/diseno/documento/sobre-aeuvg-escritorio.png",
    620,
    720,
    "Página informativa sobre AEUVG."
  ),
  ...figura("docs/diseno/documento/registro-escritorio.png", 620, 720, "Creación de cuenta."),
  ...figura(
    "docs/diseno/documento/perfil-horas-beca-escritorio.png",
    620,
    720,
    "Perfil del estudiante con el resumen de sus horas beca."
  ),
  ...figura(
    "docs/diseno/documento/admin-resumen.png",
    620,
    581,
    "Panel administrativo: resumen general."
  ),
  ...figura(
    "docs/diseno/documento/admin-horas-beca.png",
    620,
    581,
    "Panel administrativo: gestión de horas beca."
  ),

  h2("4.5. Diseño adaptable"),
  p(
    "Se adoptaron los puntos de corte estándar del sistema de estilos del proyecto, correspondientes a teléfono, tableta, escritorio y escritorio amplio, con un ancho máximo de contenido de 1280 píxeles. El diseño prioriza la vista móvil, considerando que la mayoría de los estudiantes accede desde el teléfono."
  ),
  ...figura(
    "docs/diseno/documento/landing-movil.png",
    250,
    620,
    "Página principal en su versión para dispositivos móviles."
  ),
  ...figura(
    "docs/diseno/documento/perfil-horas-beca-movil.png",
    250,
    620,
    "Perfil del estudiante en su versión para dispositivos móviles."
  ),

  h2("4.6. Validación con AEUVG"),
  p(
    "Los prototipos y el sistema de diseño fueron presentados a AEUVG para su revisión. La asociación dio su aprobación sin solicitar cambios, por lo que la identidad visual y la estructura de las pantallas quedan confirmadas como base para el desarrollo de los módulos funcionales en los sprints siguientes."
  ),

  // ---------- 5. Estado ----------
  h1("5. Estado del sprint"),
  p(
    "Al momento de esta actualización, las historias de usuario HU-01, HU-02 y HU-03 se encuentran completadas. El sistema cuenta con:"
  ),
  bullet("El stack tecnológico definido y documentado."),
  bullet("El repositorio configurado, con las ramas de trabajo y el archivo README."),
  bullet(
    "El proyecto inicializado, con su estructura de carpetas y herramientas de calidad de código."
  ),
  bullet("La aplicación desplegada en Railway y accesible desde internet."),
  bullet("La base de datos PostgreSQL creada, con su esquema completo y sus catálogos cargados."),
  bullet("La conexión entre la aplicación y la base de datos verificada."),
  bullet("El sistema de diseño definido y aplicado como variables dentro del proyecto."),
  bullet("La biblioteca de componentes base implementada."),
  bullet(
    "Los prototipos de las pantallas principales elaborados para computadora y móvil, y aprobados por AEUVG."
  ),
  p(
    "El trámite del dominio institucional continúa en gestión ante la universidad. Las historias restantes del sprint corresponden a la autenticación de usuarios, los roles y permisos, y las páginas informativas de AEUVG."
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 1.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
