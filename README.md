# Página Web AEUVG

Plataforma web centralizada de la **Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG)**. Permite consultar eventos, asociaciones, clubes y tutorías, y gestionar las horas beca realizadas con AEUVG.

**Equipo:**

- Harry Daniel Méndez Mendoza — 24089 (desarrollo, base de datos e infraestructura)
- Juan Gabriel Gualim Molina — 24852 (desarrollo, diseño de interfaces y UX)

## Stack tecnológico

| Capa          | Tecnología                                   |
| ------------- | -------------------------------------------- |
| Framework     | Next.js 16 (App Router) + TypeScript         |
| Estilos / UI  | Tailwind CSS 4 + componentes propios         |
| Base de datos | PostgreSQL 17 (Railway)                      |
| ORM           | Prisma (a partir de HU-02)                   |
| Autenticación | Auth.js — NextAuth v5 (a partir de HU-05)    |
| Contenedores  | Docker + Docker Compose                      |
| Hosting       | Railway (despliegue automático desde `main`) |

La justificación completa de cada decisión está en [docs/stack-tecnologico.md](docs/stack-tecnologico.md).

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para la base de datos local)
- Git

## Ejecutar el proyecto localmente

1. **Clonar el repositorio y entrar a la carpeta:**

   ```bash
   git clone https://github.com/hmndz3/AEUVGWEB.git
   cd AEUVGWEB
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Los valores por defecto del ejemplo funcionan para desarrollo local.

4. **Levantar la base de datos (Docker):**

   ```bash
   docker compose up -d
   ```

5. **Iniciar la aplicación en modo desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

### Probar la imagen de producción localmente

```bash
docker compose --profile app up --build
```

## Scripts disponibles

| Comando                | Descripción                                 |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con recarga en vivo  |
| `npm run build`        | Build de producción                         |
| `npm run start`        | Servir el build de producción               |
| `npm run lint`         | Análisis de código con ESLint               |
| `npm test`             | Pruebas automatizadas del servicio          |
| `npm run format`       | Formatear todo el código con Prettier       |
| `npm run format:check` | Verificar el formato sin modificar archivos |

El registro y la verificación de correo se documentan en
[docs/registro-estudiantes.md](docs/registro-estudiantes.md). El proveedor local predeterminado no
envía correos reales; consulta ese documento antes de habilitar Resend.

## Flujo de trabajo con Git

- **`main`** — rama principal. Cada push genera un despliegue automático en Railway (producción).
- **`develop`** — rama de integración. Aquí se une el trabajo del equipo durante el sprint.
- El trabajo diario se hace en ramas por tarea (`feature/T-01.3-estructura`), que se integran a `develop` mediante pull requests.
- Al cerrar el sprint, `develop` se integra a `main`.

## Estructura del proyecto

```
├── Documentos/          # Documentación formal del proyecto y de los sprints
├── docs/                # Documentación técnica (stack, despliegue)
├── prisma/              # Esquema y migraciones de la base de datos (desde HU-02)
├── public/              # Archivos estáticos
├── src/
│   ├── app/             # Rutas y páginas (frontend) y endpoints /api (backend)
│   ├── components/      # Componentes de UI reutilizables
│   ├── lib/             # Lógica de negocio, acceso a datos, utilidades
│   └── validators/      # Esquemas de validación Zod compartidos
├── docker-compose.yml   # Entorno de desarrollo local (PostgreSQL)
├── Dockerfile           # Imagen de producción (usada por Railway)
└── railway.json         # Configuración de build y deploy en Railway
```

## Despliegue

El despliegue se realiza en Railway con builds del `Dockerfile` y despliegue automático desde GitHub. El procedimiento completo (creación del proyecto, ambientes de pruebas/producción y variables de entorno) está en [docs/despliegue-railway.md](docs/despliegue-railway.md).
