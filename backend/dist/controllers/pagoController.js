"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagoController = void 0;
const reservaModel_1 = require("../models/reservaModel");
const pagoModel_1 = require("../models/pagoModel");
const database_1 = require("../config/database");
exports.PagoController = {
    procesarPagoConComprobante: async (req, res) => {
        try {
            const { id_usuario, rol } = req.usuario;
            const { id_reserva, metodo_pago, nro_comprobante, referencia_pasarela, monto } = req.body;
            if (!id_reserva || !metodo_pago) {
                return res.status(400).json({ error: 'id_reserva y metodo_pago son obligatorios' });
            }
            const metodosValidos = ['presencial', 'tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia'];
            if (!metodosValidos.includes(metodo_pago)) {
                return res.status(400).json({
                    error: `Método de pago inválido. Opciones: ${metodosValidos.join(', ')}`
                });
            }
            const esVirtual = ['tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia'].includes(metodo_pago);
            if (esVirtual && !req.file) {
                return res.status(400).json({
                    error: 'Para pagos virtuales es obligatorio subir el comprobante de pago.'
                });
            }
            if (esVirtual && !String(nro_comprobante || '').trim()) {
                return res.status(400).json({ error: 'El número de operación del comprobante es obligatorio' });
            }
            if (esVirtual && String(nro_comprobante).trim().length > 50) {
                return res.status(400).json({ error: 'El número de operación no puede superar 50 caracteres' });
            }
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(Number(id_reserva));
            if (!reserva) {
                return res.status(404).json({ error: 'La reserva no existe' });
            }
            if (rol?.toLowerCase() === 'cliente' && Number(reserva.id_cliente) !== Number(id_usuario)) {
                return res.status(403).json({ error: 'No puedes registrar pagos para una reserva ajena' });
            }
            const pagoExistente = await pagoModel_1.PagoModel.obtenerPorReserva(Number(id_reserva));
            if (pagoExistente) {
                return res.status(400).json({ error: 'Esta reserva ya tiene un pago registrado' });
            }
            const cancha = await database_1.pool.query('SELECT precio_hora FROM cancha WHERE id_cancha = $1', [reserva.id_cancha]);
            if (cancha.rows.length === 0) {
                return res.status(404).json({ error: 'Cancha no encontrada' });
            }
            const precioHora = parseFloat(cancha.rows[0].precio_hora);
            const horaInicio = new Date(`2000-01-01T${reserva.hora_inicio}`);
            const horaFin = new Date(`2000-01-01T${reserva.hora_fin}`);
            const horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
            const montoCalculado = precioHora * horas;
            const montoFinal = monto === undefined || monto === '' ? montoCalculado : Number(monto);
            if (!Number.isFinite(montoFinal) || montoFinal <= 0) {
                return res.status(400).json({ error: 'El monto del pago debe ser mayor que cero' });
            }
            let comprobanteUrl = null;
            if (req.file) {
                comprobanteUrl = `/uploads/comprobantes/${req.file.filename}`;
            }
            const tipoRegistro = metodo_pago === 'presencial' ? 'presencial' : 'online';
            const estadoPago = metodo_pago === 'presencial' ? 'pagado' : 'pendiente_verificacion';
            const pago = await pagoModel_1.PagoModel.crearPago({
                id_reserva: Number(id_reserva),
                monto: montoFinal,
                metodo_pago,
                tipo_registro: tipoRegistro,
                referencia_pasarela: referencia_pasarela || `RES-${id_reserva}`,
                nro_comprobante: String(nro_comprobante || '').trim() || null,
                comprobante_url: comprobanteUrl,
                estado: estadoPago
            });
            if (metodo_pago === 'presencial') {
                await reservaModel_1.ReservaModel.actualizarEstado(Number(id_reserva), 'confirmada');
            }
            else {
                await reservaModel_1.ReservaModel.actualizarEstado(Number(id_reserva), 'pendiente_pago');
            }
            res.status(201).json({
                success: true,
                message: metodo_pago === 'presencial'
                    ? 'Pago presencial registrado. Reserva confirmada.'
                    : 'Comprobante enviado. Tu reserva está pendiente de verificación por un administrador.',
                data: pago
            });
        }
        catch (error) {
            console.error('Error en procesarPagoConComprobante:', error);
            res.status(500).json({ error: error.message || 'Error al procesar el pago' });
        }
    },
    procesarPago: async (req, res) => {
        try {
            const { id_usuario, rol } = req.usuario;
            const { id_reserva, metodo_pago, nro_comprobante, referencia_pasarela, monto } = req.body;
            if (!id_reserva || !metodo_pago) {
                return res.status(400).json({ error: 'id_reserva y metodo_pago son obligatorios' });
            }
            const metodosValidos = ['presencial', 'tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia'];
            if (!metodosValidos.includes(metodo_pago)) {
                return res.status(400).json({
                    error: `Método de pago inválido. Opciones: ${metodosValidos.join(', ')}`
                });
            }
            if (metodo_pago !== 'presencial') {
                return res.status(400).json({ error: 'Los pagos virtuales deben enviarse junto con su comprobante' });
            }
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(Number(id_reserva));
            if (!reserva) {
                return res.status(404).json({ error: 'La reserva no existe' });
            }
            if (rol?.toLowerCase() === 'cliente' && Number(reserva.id_cliente) !== Number(id_usuario)) {
                return res.status(403).json({ error: 'No puedes registrar pagos para una reserva ajena' });
            }
            const pagoExistente = await pagoModel_1.PagoModel.obtenerPorReserva(Number(id_reserva));
            if (pagoExistente) {
                return res.status(400).json({ error: 'Esta reserva ya tiene un pago registrado' });
            }
            const cancha = await database_1.pool.query('SELECT precio_hora FROM cancha WHERE id_cancha = $1', [reserva.id_cancha]);
            if (cancha.rows.length === 0) {
                return res.status(404).json({ error: 'Cancha no encontrada' });
            }
            const precioHora = parseFloat(cancha.rows[0].precio_hora);
            const horaInicio = new Date(`2000-01-01T${reserva.hora_inicio}`);
            const horaFin = new Date(`2000-01-01T${reserva.hora_fin}`);
            const horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
            const montoBase = precioHora * horas;
            const montoPago = monto === undefined || monto === '' ? montoBase : Number(monto);
            if (!Number.isFinite(montoPago) || montoPago <= 0) {
                return res.status(400).json({ error: 'El monto del pago debe ser mayor que cero' });
            }
            const tipoRegistro = metodo_pago === 'presencial' ? 'presencial' : 'online';
            const estadoPago = metodo_pago === 'presencial' ? 'pagado' : 'pendiente_verificacion';
            const pago = await pagoModel_1.PagoModel.crearPago({
                id_reserva: Number(id_reserva),
                monto: montoPago,
                metodo_pago,
                tipo_registro: tipoRegistro,
                referencia_pasarela: referencia_pasarela || null,
                nro_comprobante: nro_comprobante || null,
                estado: estadoPago
            });
            if (metodo_pago === 'presencial') {
                await reservaModel_1.ReservaModel.actualizarEstado(Number(id_reserva), 'confirmada');
            }
            else {
                await reservaModel_1.ReservaModel.actualizarEstado(Number(id_reserva), 'pendiente_pago');
            }
            res.status(201).json({
                success: true,
                message: metodo_pago === 'presencial'
                    ? 'Pago presencial registrado. Reserva confirmada.'
                    : 'Pago registrado para revisión. Debes completar la transferencia con la referencia indicada por la app bancaria.',
                data: pago
            });
        }
        catch (error) {
            console.error('Error en procesarPago:', error);
            res.status(500).json({ error: error.message || 'Error al procesar el pago' });
        }
    },
    subirComprobante: async (req, res) => {
        try {
            const { id_pago } = req.params;
            const { id_usuario } = req.usuario;
            if (!req.file) {
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            }
            const comprobanteUrl = `/uploads/comprobantes/${req.file.filename}`;
            const pago = await pagoModel_1.PagoModel.obtenerPorId(Number(id_pago));
            if (!pago) {
                return res.status(404).json({ error: 'Pago no encontrado' });
            }
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(pago.id_reserva);
            if (!reserva || reserva.id_cliente !== id_usuario) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            const esVirtual = ['tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia'].includes(pago.metodo_pago);
            if (!esVirtual) {
                return res.status(400).json({ error: 'Los pagos presenciales no requieren comprobante' });
            }
            const pagoActualizado = await pagoModel_1.PagoModel.actualizarComprobante(Number(id_pago), comprobanteUrl);
            if (!pagoActualizado) {
                return res.status(409).json({ error: 'El pago ya fue verificado o no admite cambios' });
            }
            res.json({
                success: true,
                message: 'Comprobante subido correctamente. Tu reserva será verificada pronto.',
                data: pagoActualizado
            });
        }
        catch (error) {
            console.error('Error en subirComprobante:', error);
            res.status(500).json({ error: error.message || 'Error al subir comprobante' });
        }
    },
    verificarPago: async (req, res) => {
        try {
            const { id_pago } = req.params;
            const { estado } = req.body;
            if (!estado || !['pagado', 'rechazado'].includes(estado)) {
                return res.status(400).json({ error: 'Estado inválido. Use "pagado" o "rechazado"' });
            }
            const pago = await pagoModel_1.PagoModel.obtenerPorId(Number(id_pago));
            if (!pago) {
                return res.status(404).json({ error: 'Pago no encontrado' });
            }
            if (!['pendiente', 'pendiente_verificacion'].includes(pago.estado)) {
                return res.status(409).json({ error: 'Este pago ya fue verificado' });
            }
            if (estado === 'pagado' && pago.metodo_pago !== 'presencial' && !pago.comprobante_url) {
                return res.status(400).json({ error: 'No se puede aprobar un pago virtual sin comprobante' });
            }
            const pagoActualizado = await pagoModel_1.PagoModel.verificarPago(Number(id_pago), estado);
            if (!pagoActualizado) {
                return res.status(409).json({ error: 'Este pago ya fue verificado' });
            }
            if (estado === 'pagado') {
                await reservaModel_1.ReservaModel.actualizarEstado(pago.id_reserva, 'confirmada');
            }
            else if (estado === 'rechazado') {
                await reservaModel_1.ReservaModel.actualizarEstado(pago.id_reserva, 'pendiente_pago');
            }
            res.json({
                success: true,
                message: `Pago ${estado === 'pagado' ? 'aprobado y reserva confirmada' : 'rechazado'}`
            });
        }
        catch (error) {
            console.error('Error en verificarPago:', error);
            res.status(500).json({ error: error.message || 'Error al verificar pago' });
        }
    },
    obtenerPagosPorReserva: async (req, res) => {
        try {
            const { id_reserva } = req.params;
            const { id_usuario } = req.usuario;
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(Number(id_reserva));
            if (!reserva) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            if (reserva.id_cliente !== id_usuario) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            const pagos = await pagoModel_1.PagoModel.obtenerPagosPorReserva(Number(id_reserva));
            res.json({ success: true, data: pagos });
        }
        catch (error) {
            console.error('Error en obtenerPagosPorReserva:', error);
            res.status(500).json({ error: 'Error al obtener los pagos de la reserva' });
        }
    },
    revisionPagoReserva: async (req, res) => {
        try {
            const idReserva = Number(req.params.id_reserva);
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(idReserva);
            if (!reserva) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
            const pagos = await pagoModel_1.PagoModel.obtenerPagosPorReserva(idReserva);
            res.json({
                success: true,
                data: {
                    id_reserva: idReserva,
                    estado_reserva: reserva.estado,
                    pago: pagos[0] || null
                }
            });
        }
        catch (error) {
            console.error('Error en revisionPagoReserva:', error);
            res.status(500).json({ error: 'Error al consultar el pago de la reserva' });
        }
    },
    historialPagos: async (req, res) => {
        try {
            const { id_usuario } = req.usuario;
            const pagos = await pagoModel_1.PagoModel.obtenerHistorialPagos(id_usuario);
            res.json({ success: true, data: pagos });
        }
        catch (error) {
            console.error('Error en historialPagos:', error);
            res.status(500).json({ error: 'Error al obtener historial de pagos' });
        }
    },
    pagosPendientes: async (_req, res) => {
        try {
            const pagos = await pagoModel_1.PagoModel.obtenerPagosPendientes();
            res.json({ success: true, data: pagos });
        }
        catch (error) {
            console.error('Error en pagosPendientes:', error);
            res.status(500).json({ error: 'Error al obtener pagos pendientes' });
        }
    },
    reintentarPago: async (req, res) => {
        try {
            const { id_reserva } = req.params;
            const { id_usuario } = req.usuario;
            const reserva = await reservaModel_1.ReservaModel.obtenerPorId(Number(id_reserva));
            if (!reserva || reserva.id_cliente !== id_usuario) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            const pagoExistente = await pagoModel_1.PagoModel.obtenerPorReserva(Number(id_reserva));
            if (pagoExistente && pagoExistente.estado !== 'rechazado') {
                return res.status(400).json({ error: 'Esta reserva no tiene un pago rechazado' });
            }
            if (pagoExistente) {
                await pagoModel_1.PagoModel.eliminarPago(Number(id_reserva));
            }
            await reservaModel_1.ReservaModel.actualizarEstado(Number(id_reserva), 'pendiente');
            res.json({
                success: true,
                message: 'Puedes volver a intentar el pago desde tu reserva.'
            });
        }
        catch (error) {
            console.error('Error en reintentarPago:', error);
            res.status(500).json({ error: 'Error al reintentar el pago' });
        }
    }
};
