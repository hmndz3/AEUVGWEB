// Genera Documentos/AEUVG - Desarrollo Sprint 1.docx
// Uso: node scripts/docs/desarrollo-sprint1.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");

const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 1",
    date: "Guatemala, 29 de agosto del 2026",
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
    "El proyecto se versiona en GitHub, en el repositorio hmndz3/AEUVGWEB, con dos ramas permanentes: main, conectada al ambiente de producción, y develop, rama de integración conectada al ambiente de pruebas. El trabajo de cada tarea se realiza en ramas propias que se integran a develop mediante pull requests, lo que permite revisar el código entre ambos integrantes y probar cada cambio en el ambiente de pruebas antes de publicarlo; al cierre del sprint, develop se integra a main para desplegar a producción. El archivo README documenta el stack, los requisitos, las instrucciones para ejecutar el proyecto localmente, los scripts disponibles y este flujo de trabajo, de manera que cualquier integrante pueda montar el entorno desde cero."
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
    "El despliegue se realiza en Railway construyendo la imagen de producción desde el Dockerfile del repositorio, con despliegue automático: cada actualización de la rama main publica una nueva versión en producción, y cada actualización de develop publica al ambiente de pruebas, cada uno con su propia base de datos. El procedimiento completo de configuración del proyecto en Railway, de sus ambientes y del dominio institucional quedó documentado en el repositorio, en el archivo docs/despliegue-railway.md."
  ),
  p(
    "Las variables de entorno se definen por ambiente (desarrollo local, pruebas y producción) y nunca se almacenan en el repositorio: los archivos .env están excluidos del control de versiones y en Railway las variables se configuran desde el panel de cada ambiente. El repositorio incluye el archivo de ejemplo .env.example, que documenta con comentarios cada variable requerida:"
  ),
  bullet(
    "DATABASE_URL: cadena de conexión a PostgreSQL; en Railway se referencia la base de datos del ambiente correspondiente."
  ),
  bullet("NEXT_PUBLIC_APP_URL: URL pública de la aplicación según el ambiente."),
  bullet("AUTH_SECRET: secreto de firma de sesiones, distinto en cada ambiente."),
  bullet("RESEND_API_KEY y EMAIL_FROM: credenciales del servicio de correos transaccionales."),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 1.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
