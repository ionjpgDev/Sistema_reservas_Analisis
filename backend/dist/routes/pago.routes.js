"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pagoController_1 = require("../controllers/pagoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const comprobantesDir = path_1.default.join(__dirname, '../../uploads/comprobantes');
if (!fs_1.default.existsSync(comprobantesDir)) {
    fs_1.default.mkdirSync(comprobantesDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, comprobantesDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF'));
        }
    }
});
router.post('/procesar-con-comprobante', authMiddleware_1.verificarToken, upload.single('comprobante'), pagoController_1.PagoController.procesarPagoConComprobante);
router.post('/procesar', authMiddleware_1.verificarToken, pagoController_1.PagoController.procesarPago);
router.post('/comprobante/:id_pago', authMiddleware_1.verificarToken, upload.single('comprobante'), pagoController_1.PagoController.subirComprobante);
router.patch('/verificar/:id_pago', authMiddleware_1.verificarToken, authMiddleware_1.esAdminOEmpleado, pagoController_1.PagoController.verificarPago);
router.get('/pendientes', authMiddleware_1.verificarToken, authMiddleware_1.esAdminOEmpleado, pagoController_1.PagoController.pagosPendientes);
router.get('/historial', authMiddleware_1.verificarToken, pagoController_1.PagoController.historialPagos);
router.get('/reserva/:id_reserva/revision', authMiddleware_1.verificarToken, authMiddleware_1.esAdminOEmpleado, pagoController_1.PagoController.revisionPagoReserva);
router.get('/reserva/:id_reserva', authMiddleware_1.verificarToken, pagoController_1.PagoController.obtenerPagosPorReserva);
router.post('/reintentar/:id_reserva', authMiddleware_1.verificarToken, pagoController_1.PagoController.reintentarPago);
exports.default = router;
