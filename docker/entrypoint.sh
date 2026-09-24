#!/bin/sh
set -e

# Railway monta el volumen como root, y la aplicación corre sin privilegios.
# Este arranque es lo único que se ejecuta como root: prepara la carpeta de
# imágenes, le cede la propiedad al usuario de la aplicación y de inmediato
# baja de privilegios para lanzar el servidor.
if [ -n "$IMAGE_STORAGE_DIR" ]; then
  mkdir -p "$IMAGE_STORAGE_DIR"
  chown -R nextjs:nodejs "$IMAGE_STORAGE_DIR"
fi

exec su-exec nextjs "$@"
