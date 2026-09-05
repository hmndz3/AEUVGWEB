# Catálogos iniciales

La tarea T-02.5 carga los catálogos necesarios para comenzar el desarrollo de los módulos de usuarios, eventos y horas beca. El proceso está implementado en `prisma/seed.ts` y los valores editables se mantienen separados en `prisma/data/catalogos-iniciales.ts`.

## Ejecución

Configura `DATABASE_URL`, aplica primero las migraciones y ejecuta:

```bash
npx prisma db seed
```

Para verificar los conteos, relaciones, duplicados, registros activos y valores del enum directamente en PostgreSQL:

```bash
npm run db:verify-catalogs
```

El seed es idempotente: crea los registros ausentes, actualiza únicamente los que difieren de la definición versionada y deja intactos los registros que ya coinciden. No elimina datos, no reinicia secuencias y no carga información personal ni datos funcionales de prueba.

## Contenido

- Unidades académicas y programas de pregrado publicados por UVG.
- Categorías de eventos específicas para las actividades descritas en el documento de definición de AEUVG.
- Roles `ESTUDIANTE`, `TUTOR` y `ADMINISTRADOR`.
- Los estados de horas beca `PENDIENTE` y `ACREDITADA` ya forman parte del enum `EstadoHoraBeca`; no se insertan como filas.

`TipoActividad` continúa siendo la clasificación general y cerrada de los eventos. `CategoriaEvento` contiene clasificaciones administrables más específicas, por lo que el seed evita repetir las opciones generales académica, recreativa, voluntariado y otro.

## Fuente académica y alcance

La lista se obtuvo del [catálogo público de carreras de UVG](https://www.uvg.edu.gt/academico/carreras/), consultado el 4 de septiembre de 2026. Se limita a los programas de pregrado y unidades académicas publicados en el sitio principal de UVG; no mezcla la oferta propia de Campus Sur ni Campus Altiplano.

UVG no publica códigos académicos en esa página. Los códigos con prefijo `CC` son identificadores técnicos internos del seed, no códigos oficiales de la universidad. Deben validarse con Dirección de Estudios antes de intercambiar información con sistemas institucionales.

La página pública presenta algunas carreras en más de una unidad académica; por ejemplo, Ingeniería en Ciencia de la Administración aparece vinculada tanto con Ingeniería como con Bridge Business School. El modelo actual permite una sola facultad por carrera, por lo que se asignó a Facultad de Ingeniería siguiendo la página específica de esa facultad. Esta asociación y la vigencia del catálogo completo deben confirmarse con UVG antes de producción.

Las denominaciones "Bridge Business School", "Design Innovation & Arts School", "Escuela de Arquitectura" y "Colegio Universitario" se almacenan en `Facultad` porque el esquema actual usa ese modelo para toda unidad académica. No se creó una migración ni se amplió el alcance del modelo para distinguir tipos de unidad, campus o modalidades.

Los colores de categorías usan el formato hexadecimal `#RRGGBB` y son valores operativos provisionales; no sustituyen las decisiones del sistema de diseño de HU-03.
