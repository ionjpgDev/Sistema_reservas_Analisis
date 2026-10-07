import { pool } from '../config/database';

const serviciosAdicionales = {
    'Balón deportivo': { tipo: 'utilidad', precio: 20 },
    'Arbitraje profesional': { tipo: 'servicio', precio: 50 },
    'Iluminación de cancha': { tipo: 'servicio', precio: 30 }
} as const;

export interface DetalleAdicional {
    nombre: string;
    tipo: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export class PagoValidacionError extends Error {}

const redondear = (monto: number) => Math.round((monto + Number.EPSILON) * 100) / 100;

const normalizarDetalles = (entrada: unknown): DetalleAdicional[] => {
    let detalles = entrada;
    if (typeof entrada === 'string') {
        try {
            detalles = JSON.parse(entrada);
        } catch {
            throw new PagoValidacionError('Los servicios adicionales tienen un formato inválido.');
        }
    }

    if (detalles === undefined || detalles === null || detalles === '') return [];
    if (!Array.isArray(detalles)) {
        throw new PagoValidacionError('La lista de servicios adicionales no es válida.');
    }

    return detalles.map((detalle: any) => {
        const servicio = serviciosAdicionales[detalle?.nombre as keyof typeof serviciosAdicionales];
        const cantidad = Number(detalle?.cantidad);
        if (!servicio || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
            throw new PagoValidacionError('Hay un servicio adicional o una cantidad no válida.');
        }

        return {
            nombre: detalle.nombre,
            tipo: servicio.tipo,
            cantidad,
            precio_unitario: servicio.precio,
            subtotal: redondear(cantidad * servicio.precio)
        };
    });
};

export const calcularMontoReserva = async (reserva: any, entradaAdicionales?: unknown) => {
    const cancha = await pool.query(
        'SELECT precio_hora FROM cancha WHERE id_cancha = $1',
        [reserva.id_cancha]
    );
    if (cancha.rows.length === 0) {
        throw new PagoValidacionError('No se encontró la cancha de esta reserva.');
    }

    const parsearMinutos = (hora: string) => {
        const [horas, minutos] = String(hora).slice(0, 5).split(':').map(Number);
        return horas * 60 + minutos;
    };
    const minutos = parsearMinutos(reserva.hora_fin) - parsearMinutos(reserva.hora_inicio);
    const precioHora = Number(cancha.rows[0].precio_hora);
    if (!Number.isFinite(precioHora) || precioHora <= 0 || minutos <= 0) {
        throw new PagoValidacionError('No se pudo calcular un importe válido para esta reserva.');
    }

    const detalles = normalizarDetalles(entradaAdicionales);
    const subtotalReserva = redondear(precioHora * minutos / 60);
    const subtotalAdicionales = detalles.reduce((total, detalle) => total + detalle.subtotal, 0);

    return {
        monto: redondear(subtotalReserva + subtotalAdicionales),
        detalles
    };
};

export const validarMontoInformado = (montoInformado: unknown, montoCalculado: number) => {
    if (montoInformado === undefined || montoInformado === null || montoInformado === '') return;
    const monto = Number(montoInformado);
    if (!Number.isFinite(monto) || Math.abs(redondear(monto) - montoCalculado) > 0.01) {
        throw new PagoValidacionError(
            `El total de la reserva es Bs. ${montoCalculado.toFixed(2)}. Actualiza el pago e inténtalo de nuevo.`
        );
    }
};