DO $$
DECLARE
    restriccion_unica TEXT;
BEGIN
    SELECT conname
    INTO restriccion_unica
    FROM pg_constraint
    WHERE conrelid = 'pago'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (id_reserva)';

    IF restriccion_unica IS NOT NULL THEN
        EXECUTE format('ALTER TABLE pago DROP CONSTRAINT %I', restriccion_unica);
    END IF;
END $$;

ALTER TABLE pago
    ADD COLUMN IF NOT EXISTS detalle_adicionales JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS pago_un_intento_activo_por_reserva
    ON pago (id_reserva)
    WHERE estado IN ('pendiente', 'pendiente_verificacion', 'pagado');