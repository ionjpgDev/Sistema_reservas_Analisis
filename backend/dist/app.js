"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cancha_routes_1 = __importDefault(require("./routes/cancha.routes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const reserva_routes_1 = __importDefault(require("./routes/reserva.routes"));
const pago_routes_1 = __importDefault(require("./routes/pago.routes"));
const evento_routes_1 = __importDefault(require("./routes/evento.routes"));
const reportes_routes_1 = __importDefault(require("./routes/reportes.routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
exports.app.use(express_1.default.json());
exports.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
exports.app.use((req, _res, next) => {
    console.log(`📡 [${req.method}] ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
});
exports.app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Backend del Complejo Deportivo funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});
exports.app.use('/api/auth', authRoutes_1.default);
exports.app.use('/api/usuarios', userRoutes_1.default);
exports.app.use('/api/canchas', cancha_routes_1.default);
exports.app.use('/api/reservas', reserva_routes_1.default);
exports.app.use('/api/pagos', pago_routes_1.default);
exports.app.use('/api/eventos', evento_routes_1.default);
exports.app.use('/api/reportes', reportes_routes_1.default);
exports.app.get('/', (_req, res) => {
    res.json({
        message: 'API del sistema de gestión del complejo deportivo funcionando correctamente',
    });
});
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `La ruta [${req.method}] ${req.originalUrl} no existe en este servidor`,
    });
});
exports.app.use((err, _req, res, _next) => {
    console.error('💥 Error no controlado en la aplicación:', err);
    res.status(500).json({
        success: false,
        message: 'Ocurrió un error inesperado en el servidor',
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
    });
});
exports.default = exports.app;
