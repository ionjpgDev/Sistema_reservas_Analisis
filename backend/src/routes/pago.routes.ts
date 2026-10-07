import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PagoController } from '../controllers/pagoController';
import { verificarToken, esAdminOEmpleado } from '../middlewares/authMiddleware';

const router = Router();

const comprobantesDir = path.join(__dirname, '../../uploads/comprobantes');
if (!fs.existsSync(comprobantesDir)) {
    fs.mkdirSync(comprobantesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, comprobantesDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF'));
        }
    }
});

// Endpoint unificado: crear pago + comprobante en un solo paso
router.post('/procesar-con-comprobante', verificarToken, upload.single('comprobante'), PagoController.procesarPagoConComprobante);

// Endpoint legacy para compatibilidad
router.post('/procesar', verificarToken, PagoController.procesarPago);

// Subir comprobante para pago existente
router.post('/comprobante/:id_pago', verificarToken, upload.single('comprobante'), PagoController.subirComprobante);

// Verificar pago (Admin/Empleado)
router.patch('/verificar/:id_pago', verificarToken, esAdminOEmpleado, PagoController.verificarPago);

// Obtener pagos pendientes de verificación (Admin/Empleado)
router.get('/pendientes', verificarToken, esAdminOEmpleado, PagoController.pagosPendientes);

// Historial de pagos del cliente
router.get('/historial', verificarToken, PagoController.historialPagos);

// Revisión de pago por reserva (Admin/Empleado)
router.get('/reserva/:id_reserva/revision', verificarToken, esAdminOEmpleado, PagoController.revisionPagoReserva);

// Pagos por reserva
router.get('/reserva/:id_reserva', verificarToken, PagoController.obtenerPagosPorReserva);

// Reintentar pago después de rechazo
router.post('/reintentar/:id_reserva', verificarToken, PagoController.reintentarPago);

export default router;
