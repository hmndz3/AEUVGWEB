-- Fotografía de perfil del estudiante.
--
-- La columna es opcional porque la plataforma funcionaba sin ella y la mayoría
-- de las cuentas no tendrá foto: en todas las pantallas hay iniciales como
-- respaldo, que es lo que se ha venido mostrando desde el Sprint 1.
--
-- Guarda la ruta de la imagen servida por la propia plataforma, con el mismo
-- formato que el resto de las imágenes del sitio (/api/imagenes/<32 hex>.<ext>).
-- No se guarda el archivo en la base: eso lo resuelve el proveedor de imágenes.

-- AlterTable
ALTER TABLE "estudiante" ADD COLUMN "foto_url" VARCHAR(500);
