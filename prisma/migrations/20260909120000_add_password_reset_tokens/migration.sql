-- CreateTable
CREATE TABLE "token_recuperacion_contrasena" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "fecha_expiracion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_uso" TIMESTAMPTZ(3),
    "fecha_invalidacion" TIMESTAMPTZ(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_recuperacion_contrasena_pkey" PRIMARY KEY ("id_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacion_contrasena_token_hash_key" ON "token_recuperacion_contrasena"("token_hash");

-- CreateIndex
CREATE INDEX "token_recuperacion_contrasena_usuario_fecha_idx" ON "token_recuperacion_contrasena"("id_usuario", "fecha_creacion");

-- CreateIndex
CREATE INDEX "token_recuperacion_contrasena_expiracion_idx" ON "token_recuperacion_contrasena"("fecha_expiracion");

-- AddForeignKey
ALTER TABLE "token_recuperacion_contrasena" ADD CONSTRAINT "token_recuperacion_contrasena_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
