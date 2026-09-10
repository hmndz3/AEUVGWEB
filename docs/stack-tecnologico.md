# Stack tecnológico — Página Web AEUVG

**Tarea:** T-01.1 — Seleccionar y documentar el stack tecnológico del frontend, el backend y la base de datos.
**Sprint:** 1 — Fundamentos del sistema
**Fecha:** 29 de agosto de 2026

## 1. Contexto de la decisión

El stack se seleccionó considerando las restricciones reales del proyecto:

- Equipo de 2 desarrolladores y 6 sprints (≈3 meses) para entregar la plataforma completa.
- Presupuesto de operación inicial de US$5/mes en Railway (aplicación + base de datos).
- Escala esperada: ~3,000 estudiantes registrados y ~500 visitas diarias.
- El sistema debe mantenerse en producción por varios años, con relevos de junta directiva.
- Requisitos funcionales que condicionan la tecnología: autenticación con roles, panel administrativo, calendario interactivo, importación/exportación de Excel, generación de PDF, notificaciones y correos.

## 2. Arquitectura general

Se adopta una **arquitectura monolítica full-stack**: un solo proyecto y un solo servicio desplegado, que contiene tanto el frontend (páginas y componentes) como el backend (endpoints API y lógica de negocio), conectado a una base de datos PostgreSQL independiente.

**Justificación:**

- Con la carga esperada (~2 requests/segundo en horas pico), un solo servicio es más que suficiente; separar frontend y backend en servicios independientes duplicaría el consumo de recursos en Railway sin beneficio técnico.
- Un solo lenguaje (TypeScript) en todo el proyecto reduce fricción para un equipo de 2 personas.
- Tipos y validaciones compartidos entre frontend y backend eliminan una clase completa de errores de integración.
- Un solo deploy simplifica el despliegue continuo exigido por los criterios de aceptación de HU-01.

La separación frontend/backend se mantiene a nivel de estructura interna: los componentes de UI nunca acceden a la base de datos directamente; toda operación pasa por los endpoints API o server actions que corren en el servidor.

## 3. Tecnologías seleccionadas

### 3.1. Frontend

| Tecnología           | Versión | Rol                                                                          |
| -------------------- | ------- | ---------------------------------------------------------------------------- |
| Next.js (App Router) | 16      | Framework de aplicación: enrutamiento, renderizado en servidor, optimización |
| React                | 19      | Librería de interfaces                                                       |
| TypeScript           | 5       | Tipado estático en todo el proyecto                                          |
| Tailwind CSS         | 4       | Sistema de estilos utilitario                                                |
| Componentes propios  | —       | Biblioteca base construida sobre la paleta de AEUVG (HU-03)                  |
| FullCalendar         | —       | Calendario interactivo de eventos (Sprint 2)                                 |

**Justificación:** Next.js es el framework React con mayor adopción y documentación; su renderizado en servidor beneficia el SEO de las páginas públicas (landing, eventos, asociaciones) y el rendimiento en móviles. Tailwind permite construir una interfaz consistente y responsive rápidamente, criterio de la definición de terminado del proyecto. Los componentes base se implementaron dentro del proyecto en lugar de adoptar un kit externo, porque la paleta derivada del logo de AEUVG exigía un control directo sobre los tokens; se incorporarán primitivas accesibles de terceros cuando se necesiten componentes interactivos complejos como selectores, diálogos y pestañas.

### 3.2. Backend

| Tecnología                          | Rol                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| Next.js API Routes / Server Actions | Endpoints HTTP y lógica de servidor                                          |
| Prisma                              | ORM: acceso a datos y migraciones versionadas (desde HU-02)                  |
| scrypt (Node) y jose                | Cifrado de contraseñas y sesiones firmadas, con roles propios                |
| Zod                                 | Validación de datos en cliente y servidor con un mismo esquema               |
| exceljs                             | Importación y exportación de archivos Excel para horas beca (Sprints 4-5)    |
| pdfmake                             | Generación de reportes PDF (Sprint 5)                                        |
| Resend                              | Envío de correos transaccionales: recuperación de contraseña, notificaciones |

**Justificación:** Prisma proporciona migraciones versionadas en git (criterio de HU-02) y un esquema declarativo que documenta el modelo de datos. La autenticación se implementó dentro del proyecto: las contraseñas se derivan con scrypt y las sesiones se firman con jose, lo que evita depender de un marco externo para un flujo que el proyecto ya define por completo y restringe el registro a correos institucionales `@uvg.edu.gt`. Las contraseñas se almacenarán hasheadas (bcrypt/argon2) y los permisos por rol se verifican siempre en el servidor.

### 3.3. Base de datos

| Tecnología    | Rol                                                    |
| ------------- | ------------------------------------------------------ |
| PostgreSQL 17 | Base de datos relacional principal, alojada en Railway |

**Justificación:** definida en el documento del proyecto. PostgreSQL es apropiada para el modelo relacional del sistema (usuarios, roles, eventos, asociaciones, horas beca, tutorías) y escala sin problema a millones de filas. Railway provee la instancia administrada con respaldos.

### 3.4. Servicios externos

| Servicio   | Rol                                                                                        | Costo                              |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| Railway    | Hosting de la aplicación y PostgreSQL, despliegue automático desde GitHub                  | Desde US$5/mes                     |
| Cloudinary | Almacenamiento de imágenes de eventos y comprobantes (el filesystem de Railway es efímero) | Plan gratuito                      |
| Resend     | Correos transaccionales                                                                    | Plan gratuito (~3,000 correos/mes) |
| GitHub     | Control de versiones y colaboración                                                        | Gratuito                           |

### 3.5. Herramientas de desarrollo

| Herramienta             | Rol                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Docker + Docker Compose | Entorno de desarrollo idéntico para todo el equipo (PostgreSQL local) y build de producción |
| ESLint 9                | Análisis estático de código (reglas de Next.js + TypeScript)                                |
| Prettier                | Formato de código consistente y automático                                                  |
| EditorConfig            | Configuración base de editores para todo el equipo                                          |

## 4. Estrategia de escalamiento

La escala esperada no exige más que la configuración inicial, pero el camino de crecimiento queda definido sin necesidad de rediseño:

1. **Vertical:** aumentar CPU/RAM del servicio en Railway.
2. **Horizontal:** ejecutar múltiples réplicas del contenedor; es posible porque la aplicación no guarda estado local (sesiones en base de datos, archivos en Cloudinary).
3. **Base de datos:** índices sobre los campos de búsqueda frecuente (carnet, fechas de eventos); PostgreSQL soporta el volumen de datos previsto durante años.

## 5. Alternativas consideradas y descartadas

| Alternativa                                                | Motivo del descarte                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend (React/Vite) + backend (Express/NestJS) separados | Duplica servicios y costo en Railway, agrega configuración de CORS y dos pipelines de deploy, sin beneficio a esta escala |
| Laravel (PHP) / Django (Python)                            | Válidos, pero implican dos lenguajes (backend + JS del frontend); TypeScript unificado reduce fricción para el equipo     |
| Microservicios                                             | Sobre-ingeniería para la carga esperada; mayor complejidad operativa para un equipo de 2 personas                         |
