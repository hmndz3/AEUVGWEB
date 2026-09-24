#!/bin/sh
set -e

# Railway monta el volumen como root, y la aplicación corre sin privilegios.
# Este arranque es lo único que se ejecuta como root: prepara la carpeta de
# imágenes, le cede la propiedad al usuario de la aplicación y de inmediato
# baja de privilegios para lanzar el servidor.
#
# Importante: en railway.json no debe definirse startCommand. Railway ejecuta
# ese comando en lugar del ENTRYPOINT, así que este script nunca correría y la
# subida de imágenes fallaría por permisos.
#
# El valor por defecto coincide con carpetaDeImagenes() en
# src/lib/imagenes/proveedor-imagenes.ts.
CARPETA_IMAGENES="${IMAGE_STORAGE_DIR:-/app/almacen/eventos}"

mkdir -p "$CARPETA_IMAGENES"
chown -R nextjs:nodejs "$CARPETA_IMAGENES"

exec su-exec nextjs "$@"
