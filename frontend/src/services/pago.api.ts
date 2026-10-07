import api from './api';

export interface PagoDetalle {
    nombre: string;
    tipo: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface CrearPagoInput {
    id_reserva: number;
    monto: number;
    metodo_pago: 'qr' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'presencial';
    comprobante: File;
    nro_comprobante: string;
    numero_tarjeta?: string;
    referencia_pasarela?: string;
    detalles?: PagoDetalle[];
}

export const crearPago = async (data: CrearPagoInput) => {
    const formData = new FormData();
    formData.append('id_reserva', String(data.id_reserva));
    formData.append('monto', String(data.monto));
    formData.append('metodo_pago', data.metodo_pago);
    formData.append('nro_comprobante', data.nro_comprobante);
    formData.append('referencia_pasarela', data.referencia_pasarela || `RES-${data.id_reserva}`);
    formData.append('comprobante', data.comprobante);

    const response = await api.post('/pagos/procesar-con-comprobante', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const obtenerPagosReserva = async (idReserva: number) => {
    const response = await api.get(`/pagos/reserva/${idReserva}`);
    return response.data.data || [];
};
