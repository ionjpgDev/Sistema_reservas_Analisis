"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerUsuarioCompletoPorId = exports.eliminarUsuario = exports.actualizarUsuario = exports.crearUsuario = exports.actualizarPerfil = exports.obtenerPerfil = exports.cambiarEstadoUsuario = exports.listarUsuarios = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usuarioModel_1 = __importDefault(require("../models/usuarioModel"));
const validaciones_1 = require("../utils/validaciones");
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioModel_1.default.obtenerTodos();
        res.status(200).json(usuarios);
    }
    catch (error) {
        console.error('Error en listarUsuarios:', error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
};
exports.listarUsuarios = listarUsuarios;
const cambiarEstadoUsuario = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        if (!estado || !['activo', 'inactivo', 'Activo', 'Inactivo'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido. Debe ser "Activo" o "Inactivo".' });
        }
        const actualizado = await usuarioModel_1.default.actualizarEstado(id, estado);
        if (!actualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({
            mensaje: 'Estado actualizado',
            usuario: actualizado
        });
    }
    catch (error) {
        console.error('Error en cambiarEstadoUsuario:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
};
exports.cambiarEstadoUsuario = cambiarEstadoUsuario;
const obtenerPerfil = async (req, res) => {
    const id_usuario = req.usuario?.id_usuario;
    try {
        if (!id_usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const perfil = await usuarioModel_1.default.obtenerPorId(id_usuario);
        if (!perfil) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        res.status(200).json(perfil);
    }
    catch (error) {
        console.error('Error en obtenerPerfil:', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
};
exports.obtenerPerfil = obtenerPerfil;
const actualizarPerfil = async (req, res) => {
    const id_usuario = req.usuario?.id_usuario;
    const { nombre, paterno, materno, correo, telefono, passwordActual, passwordNueva, ci_nit, fecha_nacimiento, calle, zona, ciudad } = req.body;
    try {
        if (!id_usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const usuarioActual = await usuarioModel_1.default.obtenerPorId(id_usuario);
        if (!usuarioActual) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const rolUsuario = (usuarioActual.rol || '').toLowerCase().trim();
        const esCliente = rolUsuario === 'cliente';
        const validacionUsuario = (0, validaciones_1.validarDatosUsuario)({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido) {
            return res.status(400).json({ error: validacionUsuario.error });
        }
        if (esCliente) {
            const validacionCliente = (0, validaciones_1.validarDatosCliente)({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido) {
                return res.status(400).json({ error: validacionCliente.error });
            }
        }
        let hashNuevaContra = undefined;
        if (passwordNueva) {
            if (!passwordActual) {
                return res.status(400).json({ error: 'Debés ingresar tu contraseña actual para cambiarla.' });
            }
            const validacionPwd = (0, validaciones_1.esContraseñaSegura)(passwordNueva);
            if (!validacionPwd.valido) {
                return res.status(400).json({ error: validacionPwd.error });
            }
            const userConHash = await usuarioModel_1.default.obtenerPorCorreo(usuarioActual.correo);
            if (!userConHash || !userConHash.contraseña) {
                return res.status(401).json({ error: 'No se pudo verificar la contraseña actual' });
            }
            const contraseñaValida = await bcrypt_1.default.compare(passwordActual, userConHash.contraseña);
            if (!contraseñaValida) {
                return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
            }
            hashNuevaContra = await bcrypt_1.default.hash(passwordNueva, 10);
        }
        const datosUpdate = {
            nombre: nombre.trim(),
            paterno: paterno.trim(),
            materno: materno?.trim() || null,
            correo: correo.toLowerCase().trim(),
            telefono: String(telefono).trim(),
            contraseña: hashNuevaContra
        };
        if (esCliente) {
            datosUpdate.ci_nit = ci_nit ? String(ci_nit).trim() : null;
            datosUpdate.fecha_nacimiento = fecha_nacimiento || null;
            datosUpdate.calle = calle?.trim() || null;
            datosUpdate.zona = zona?.trim() || null;
            datosUpdate.ciudad = ciudad?.trim() || null;
        }
        const usuarioActualizado = await usuarioModel_1.default.actualizarPerfil(id_usuario, datosUpdate);
        if (!usuarioActualizado) {
            return res.status(500).json({ error: 'Error al actualizar datos' });
        }
        const nuevoToken = jsonwebtoken_1.default.sign({
            id_usuario: id_usuario,
            nombre: usuarioActualizado.nombre,
            correo: usuarioActualizado.correo,
            rol: usuarioActual.rol
        }, process.env.JWT_SECRET, { expiresIn: '60m' });
        res.status(200).json({
            mensaje: 'Perfil actualizado con éxito',
            token: nuevoToken,
            perfil: usuarioActualizado
        });
    }
    catch (error) {
        console.error('Error en actualizarPerfil:', error);
        if (error.code === '23505') {
            if (error.constraint?.includes('correo')) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }
            if (error.constraint?.includes('ci_nit')) {
                return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
            }
        }
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};
exports.actualizarPerfil = actualizarPerfil;
const crearUsuario = async (req, res) => {
    try {
        const { nombre, paterno, materno, correo, telefono, contraseña, rol, estado, ci_nit, fecha_nacimiento, calle, zona, ciudad, fecha_contratacion, cargo, turno, nivel_acceso } = req.body;
        if (!rol || !['Cliente', 'Empleado', 'Admin', 'Administrador'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }
        const rolNorm = rol.toLowerCase().trim();
        const esCliente = rolNorm === 'cliente';
        const esEmpleado = rolNorm === 'empleado';
        const esAdmin = rolNorm === 'admin' || rolNorm === 'administrador';
        const validacionUsuario = (0, validaciones_1.validarDatosUsuario)({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido) {
            return res.status(400).json({ error: validacionUsuario.error });
        }
        const validacionPwd = (0, validaciones_1.esContraseñaSegura)(contraseña);
        if (!validacionPwd.valido) {
            return res.status(400).json({ error: validacionPwd.error });
        }
        const correoNormalizado = correo.toLowerCase().trim();
        const existente = await usuarioModel_1.default.obtenerPorCorreo(correoNormalizado);
        if (existente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        if (esCliente) {
            const validacionCliente = (0, validaciones_1.validarDatosCliente)({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido) {
                return res.status(400).json({ error: validacionCliente.error });
            }
            if (ci_nit) {
                const ciExistente = await usuarioModel_1.default.obtenerPorCiNit(ci_nit);
                if (ciExistente) {
                    return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
                }
            }
        }
        if (esEmpleado) {
            if (!fecha_contratacion)
                return res.status(400).json({ error: 'La fecha de contratación es obligatoria.' });
            if (!cargo || !cargo.trim())
                return res.status(400).json({ error: 'El cargo es obligatorio.' });
            if (cargo.trim().length < 3 || cargo.trim().length > 100) {
                return res.status(400).json({ error: 'El cargo debe tener entre 3 y 100 caracteres.' });
            }
            if (turno && !['Mañana', 'Tarde', 'Noche'].includes(turno)) {
                return res.status(400).json({ error: 'Turno inválido.' });
            }
        }
        if (esAdmin) {
            if (nivel_acceso && !['Total', 'Medio', 'Bajo'].includes(nivel_acceso)) {
                return res.status(400).json({ error: 'Nivel de acceso inválido.' });
            }
        }
        const hash = await bcrypt_1.default.hash(contraseña, 10);
        const usuarioData = {
            nombre: nombre.trim(),
            paterno: paterno.trim(),
            materno: materno?.trim() || null,
            correo: correoNormalizado,
            telefono: String(telefono).trim(),
            contraseña: hash,
            rol,
            estado_cuenta: estado || 'Activo'
        };
        const rolData = {
            ci_nit: ci_nit ? String(ci_nit).trim() : null,
            fecha_nacimiento: fecha_nacimiento || null,
            calle: calle?.trim() || null,
            zona: zona?.trim() || null,
            ciudad: ciudad?.trim() || null,
            fecha_contratacion: fecha_contratacion || null,
            cargo: cargo?.trim() || null,
            turno: turno || null,
            nivel_acceso: nivel_acceso || 'Total'
        };
        const nuevo = await usuarioModel_1.default.crearUsuario(usuarioData, rolData);
        res.status(201).json({
            mensaje: 'Usuario creado con éxito',
            id_usuario: nuevo.id_usuario
        });
    }
    catch (error) {
        console.error('Error en crearUsuario:', error);
        if (error.code === '23505') {
            if (error.constraint?.includes('correo'))
                return res.status(400).json({ error: 'El correo ya está registrado' });
            if (error.constraint?.includes('ci_nit'))
                return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
            return res.status(400).json({ error: 'Datos duplicados' });
        }
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};
exports.crearUsuario = crearUsuario;
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        const { nombre, paterno, materno, correo, telefono, contraseña, rol, estado, ci_nit, fecha_nacimiento, calle, zona, ciudad, fecha_contratacion, cargo, turno, nivel_acceso } = req.body;
        if (!rol || !['Cliente', 'Empleado', 'Admin', 'Administrador'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }
        const rolNorm = rol.toLowerCase().trim();
        const esCliente = rolNorm === 'cliente';
        const esEmpleado = rolNorm === 'empleado';
        const esAdmin = rolNorm === 'admin' || rolNorm === 'administrador';
        const validacionUsuario = (0, validaciones_1.validarDatosUsuario)({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido)
            return res.status(400).json({ error: validacionUsuario.error });
        let hashNueva = undefined;
        if (contraseña && contraseña.trim()) {
            const validacionPwd = (0, validaciones_1.esContraseñaSegura)(contraseña);
            if (!validacionPwd.valido)
                return res.status(400).json({ error: validacionPwd.error });
            hashNueva = await bcrypt_1.default.hash(contraseña, 10);
        }
        if (estado && !['activo', 'inactivo', 'Activo', 'Inactivo'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }
        if (esCliente) {
            const validacionCliente = (0, validaciones_1.validarDatosCliente)({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido)
                return res.status(400).json({ error: validacionCliente.error });
        }
        if (esEmpleado) {
            if (!fecha_contratacion)
                return res.status(400).json({ error: 'La fecha de contratación es obligatoria.' });
            if (!cargo || !cargo.trim())
                return res.status(400).json({ error: 'El cargo es obligatorio.' });
            if (cargo.trim().length < 3 || cargo.trim().length > 100)
                return res.status(400).json({ error: 'El cargo debe tener entre 3 y 100 caracteres.' });
            if (turno && !['Mañana', 'Tarde', 'Noche'].includes(turno))
                return res.status(400).json({ error: 'Turno inválido.' });
        }
        if (esAdmin) {
            if (nivel_acceso && !['Total', 'Medio', 'Bajo'].includes(nivel_acceso)) {
                return res.status(400).json({ error: 'Nivel de acceso inválido.' });
            }
        }
        const usuarioData = {
            nombre: nombre.trim(),
            paterno: paterno.trim(),
            materno: materno?.trim() || null,
            correo: correo.toLowerCase().trim(),
            telefono: String(telefono).trim(),
            contraseña: hashNueva,
            rol,
            estado_cuenta: estado || 'Activo'
        };
        const rolData = {
            ci_nit: esCliente && ci_nit ? String(ci_nit).trim() : null,
            fecha_nacimiento: esCliente ? (fecha_nacimiento || null) : null,
            calle: esCliente ? (calle?.trim() || null) : null,
            zona: esCliente ? (zona?.trim() || null) : null,
            ciudad: esCliente ? (ciudad?.trim() || null) : null,
            fecha_contratacion: esEmpleado ? (fecha_contratacion || null) : null,
            cargo: esEmpleado ? (cargo?.trim() || null) : null,
            turno: esEmpleado ? (turno || null) : null,
            nivel_acceso: esAdmin ? (nivel_acceso || 'Total') : null
        };
        await usuarioModel_1.default.actualizarUsuario(id, usuarioData, rolData);
        res.status(200).json({ mensaje: 'Usuario actualizado con éxito' });
    }
    catch (error) {
        console.error('Error en actualizarUsuario:', error);
        if (error.code === '23505') {
            if (error.constraint?.includes('correo'))
                return res.status(400).json({ error: 'El correo ya está registrado por otro usuario' });
            if (error.constraint?.includes('ci_nit'))
                return res.status(400).json({ error: 'El CI/NIT ya está registrado por otro usuario' });
            return res.status(400).json({ error: 'Datos duplicados' });
        }
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};
exports.actualizarUsuario = actualizarUsuario;
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        const eliminado = await usuarioModel_1.default.eliminarUsuario(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({ mensaje: 'Usuario eliminado' });
    }
    catch (error) {
        console.error('Error en eliminarUsuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
exports.eliminarUsuario = eliminarUsuario;
const obtenerUsuarioCompletoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        const usuario = await usuarioModel_1.default.obtenerUsuarioCompletoPorId(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    }
    catch (error) {
        console.error('Error en obtenerUsuarioCompletoPorId:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};
exports.obtenerUsuarioCompletoPorId = obtenerUsuarioCompletoPorId;
