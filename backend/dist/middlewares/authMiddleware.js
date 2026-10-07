"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esCliente = exports.esAdminOEmpleado = exports.esAdmin = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
    }
    try {
        const decodificado = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Sesión expirada por inactividad. Por favor, inicia sesión de nuevo.'
            });
        }
        return res.status(401).json({
            error: 'Token inválido o corrupto.'
        });
    }
};
exports.verificarToken = verificarToken;
const esAdmin = (req, res, next) => {
    const usuario = req.usuario;
    const rol = usuario?.rol?.toLowerCase();
    if (!usuario || (rol !== 'admin' && rol !== 'administrador')) {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};
exports.esAdmin = esAdmin;
const esAdminOEmpleado = (req, res, next) => {
    const usuario = req.usuario;
    const rol = usuario?.rol?.toLowerCase();
    if (!usuario || (rol !== 'admin' && rol !== 'administrador' && rol !== 'empleado')) {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador o empleado.'
        });
    }
    next();
};
exports.esAdminOEmpleado = esAdminOEmpleado;
const esCliente = (req, res, next) => {
    const usuario = req.usuario;
    const rol = usuario?.rol?.toLowerCase();
    if (!usuario || rol !== 'cliente') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de cliente.'
        });
    }
    next();
};
exports.esCliente = esCliente;
