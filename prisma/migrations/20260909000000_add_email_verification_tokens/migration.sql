-- CreateTable
CREATE TABLE "token_verificacion_correo" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "fecha_expiracion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_uso" TIMESTAMPTZ(3),
    "fecha_invalidacion" TIMESTAMPTZ(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_verificacion_correo_pkey" PRIMARY KEY ("id_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_verificacion_correo_token_hash_key" ON "token_verificacion_correo"("token_hash");

-- CreateIndex
CREATE INDEX "token_verificacion_correo_usuario_fecha_idx" ON "token_verificacion_correo"("id_usuario", "fecha_creacion");

-- CreateIndex
CREATE INDEX "token_verificacion_correo_expiracion_idx" ON "token_verificacion_correo"("fecha_expiracion");

-- AddForeignKey
ALTER TABLE "token_verificacion_correo" ADD CONSTRAINT "token_verificacion_correo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
