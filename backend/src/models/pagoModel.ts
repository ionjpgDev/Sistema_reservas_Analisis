import { pool } from '../config/database';

export const PagoModel = {
    obtenerPorId: async (id_pago: number) => {
        const query = `SELECT * FROM pago WHERE id_pago = $1;`;
        const result = await pool.query(query, [id_pago]);
        return result.rows[0];
    },

    crearPago: async (data: {
        id_reserva: number;
        monto: number;
        metodo_pago: string;
        tipo_registro: string;
        referencia_pasarela?: string | null;
        nro_comprobante?: string | null;
        comprobante_url?: string | null;
        estado?: string;
    }) => {
        const query = `
            INSERT INTO pago 
            (id_reserva, monto, metodo_pago, tipo_registro, referencia_pasarela, nro_comprobante, estado, comprobante_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            data.id_reserva,
            data.monto,
            data.metodo_pago,
            data.tipo_registro || 'online',
            data.referencia_pasarela || null,
            data.nro_comprobante || null,
            data.estado || 'pendiente_verificacion',
            data.comprobante_url || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    obtenerPorReserva: async (id_reserva: number) => {
        const query = `
            SELECT p.*, u.nombre, u.apellido_paterno, u.correo
            FROM pago p
            JOIN reserva r ON p.id_reserva = r.id_reserva
            JOIN cliente cl ON r.id_cliente = cl.id_cliente
            JOIN usuario u ON cl.id_cliente = u.id_usuario
            WHERE p.id_reserva = $1;
        `;
        const result = await pool.query(query, [id_reserva]);
        return result.rows[0];
    },

    obtenerPagosPorReserva: async (id_reserva: number) => {
        const query = `
            SELECT *
            FROM pago
            WHERE id_reserva = $1
            ORDER BY fecha_pago DESC NULLS LAST;
        `;
        const result = await pool.query(query, [id_reserva]);
        return result.rows;
    },

    actualizarComprobante: async (id_pago: number, comprobante_url: string) => {
        const query = `
            UPDATE pago 
            SET comprobante_url = $1, estado = 'pendiente_verificacion'
            WHERE id_pago = $2 AND estado IN ('pendiente', 'pendiente_verificacion')
            RETURNING *;
        `;
        const result = await pool.query(query, [comprobante_url, id_pago]);
        return result.rows[0];
    },

    verificarPago: async (id_pago: number, estado: string) => {
        const query = `
            UPDATE pago 
            SET estado = $1,
                fecha_pago = CASE WHEN $1 = 'pagado' THEN now() ELSE fecha_pago END
            WHERE id_pago = $2 AND estado IN ('pendiente', 'pendiente_verificacion')
            RETURNING *;
        `;
        const result = await pool.query(query, [estado, id_pago]);
        return result.rows[0];
    },

    obtenerHistorialPagos: async (id_cliente: number) => {
        const query = `
            SELECT p.*, r.fecha_reserva, r.hora_inicio, r.hora_fin, c.nombre as cancha_nombre
            FROM pago p
            JOIN reserva r ON p.id_reserva = r.id_reserva
            JOIN cancha c ON r.id_cancha = c.id_cancha
            WHERE r.id_cliente = $1
            ORDER BY p.fecha_pago DESC;
        `;
        const result = await pool.query(query, [id_cliente]);
        return result.rows;
    },

    obtenerPagosPendientes: async () => {
        const query = `
            SELECT p.*, 
                   u.nombre, u.apellido_paterno, u.correo,
                   c.nombre as cancha_nombre,
                   r.fecha_reserva, r.hora_inicio, r.hora_fin
            FROM pago p
            JOIN reserva r ON p.id_reserva = r.id_reserva
            JOIN cliente cl ON r.id_cliente = cl.id_cliente
            JOIN usuario u ON cl.id_cliente = u.id_usuario
            JOIN cancha c ON r.id_cancha = c.id_cancha
            WHERE p.estado IN ('pendiente', 'pendiente_verificacion')
            ORDER BY p.fecha_pago DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    eliminarPago: async (id_reserva: number) => {
        const query = `DELETE FROM pago WHERE id_reserva = $1 RETURNING *;`;
        const result = await pool.query(query, [id_reserva]);
        return result.rows[0];
    }
};
