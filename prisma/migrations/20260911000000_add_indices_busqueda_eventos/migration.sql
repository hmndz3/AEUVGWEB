-- CreateIndex
CREATE INDEX "evento_estado_fecha_fin_idx" ON "evento"("estado", "fecha_fin");

-- CreateIndex
CREATE INDEX "evento_estado_destacado_fecha_idx" ON "evento"("estado", "destacado", "fecha_inicio");

-- CreateIndex
CREATE INDEX "evento_tipo_actividad_idx" ON "evento"("tipo_actividad");
