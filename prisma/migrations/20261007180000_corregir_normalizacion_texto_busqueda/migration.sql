-- Corrige la carga inicial del texto de búsqueda.
--
-- Las migraciones que crearon las columnas usaban un translate() con 24
-- caracteres de entrada y solo 22 de salida. PostgreSQL alinea los dos juegos
-- por posición, así que a partir de la "ü" el reemplazo quedaba desplazado:
-- "ñ" terminaba como "a" y "ü" como "n". Un evento o una asociación cargados
-- antes de la migración y nunca vueltos a guardar quedaban fuera del buscador
-- para cualquier palabra con "ñ": buscar "diseno" no encontraba "Diseño".
--
-- Las migraciones ya aplicadas no se modifican, porque Prisma guarda su suma de
-- verificación; esta vuelve a calcular la columna con el juego correcto.
--
-- Se normalizan además los espacios repetidos, como hace la aplicación. La
-- fuente de verdad sigue siendo src/lib/busqueda-texto.ts, que el servicio
-- ejecuta en cada creación y edición: esta carga solo alcanza a las filas que
-- ya existían.

UPDATE "evento"
SET "texto_busqueda" = btrim(
  regexp_replace(
    lower(
      translate(
        coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("ubicacion", ''),
        'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
        'aeiouunAEIOUUNaeiouAEIOU'
      )
    ),
    '\s+', ' ', 'g'
  )
);

UPDATE "asociacion"
SET "texto_busqueda" = btrim(
  regexp_replace(
    lower(
      translate(
        coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("mision", ''),
        'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
        'aeiouunAEIOUUNaeiouAEIOU'
      )
    ),
    '\s+', ' ', 'g'
  )
);

UPDATE "club"
SET "texto_busqueda" = btrim(
  regexp_replace(
    lower(
      translate(
        coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("actividades", ''),
        'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
        'aeiouunAEIOUUNaeiouAEIOU'
      )
    ),
    '\s+', ' ', 'g'
  )
);
