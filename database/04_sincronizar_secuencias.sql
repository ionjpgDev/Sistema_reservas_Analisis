DO $$
DECLARE
    secuencia RECORD;
    maximo_id BIGINT;
BEGIN
    FOR secuencia IN
        SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            pg_get_serial_sequence(
                format('%I.%I', c.table_schema, c.table_name),
                c.column_name
            ) AS nombre_secuencia
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_default LIKE 'nextval(%'
          AND pg_get_serial_sequence(
                format('%I.%I', c.table_schema, c.table_name),
                c.column_name
          ) IS NOT NULL
    LOOP
        EXECUTE format(
            'SELECT MAX(%I)::BIGINT FROM %I.%I',
            secuencia.column_name,
            secuencia.table_schema,
            secuencia.table_name
        ) INTO maximo_id;

        PERFORM setval(
            secuencia.nombre_secuencia::regclass,
            COALESCE(maximo_id, 1),
            maximo_id IS NOT NULL
        );
    END LOOP;
END $$;