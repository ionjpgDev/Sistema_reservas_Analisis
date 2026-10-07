import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import UsuarioModel from '../models/usuarioModel';

import {
    validarDatosUsuario,
    validarDatosCliente,
    esContraseñaSegura
} from '../utils/validaciones';

// INTERFAZ PERSONALIZADA PARA REQUEST (Para reconocer req.usuario)
interface AuthRequest extends Request {
    usuario?: {
        id_usuario: number;
        nombre: string;
        correo: string;
        rol: string;
    };
}

// LISTAR USUARIOS
const listarUsuarios = async (req: Request, res: Response) => {
    try {
        const usuarios = await UsuarioModel.obtenerTodos();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error en listarUsuarios:', error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
};

// CAMBIAR ESTADO (Activo / Inactivo)
const cambiarEstadoUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        if (!estado || !['activo', 'inactivo', 'Activo', 'Inactivo'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido. Debe ser "Activo" o "Inactivo".' });
        }

        const actualizado = await UsuarioModel.actualizarEstado(id, estado);

        if (!actualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({
            mensaje: 'Estado actualizado',
            usuario: actualizado
        });

    } catch (error) {
        console.error('Error en cambiarEstadoUsuario:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
};

// OBTENER PERFIL DEL USUARIO LOGUEADO
const obtenerPerfil = async (req: AuthRequest, res: Response) => {
    const id_usuario = req.usuario?.id_usuario;

    try {
        if (!id_usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const perfil = await UsuarioModel.obtenerPorId(id_usuario);

        if (!perfil) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        res.status(200).json(perfil);

    } catch (error) {
        console.error('Error en obtenerPerfil:', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
};

// ACTUALIZAR PERFIL (datos + contraseña)
const actualizarPerfil = async (req: AuthRequest, res: Response) => {
    const id_usuario = req.usuario?.id_usuario;

    const {
        nombre,
        paterno,
        materno,
        correo,
        telefono,
        passwordActual,
        passwordNueva,
        ci_nit,
        fecha_nacimiento,
        calle,
        zona,
        ciudad
    } = req.body;

    try {
        if (!id_usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const usuarioActual = await UsuarioModel.obtenerPorId(id_usuario);

        if (!usuarioActual) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        //  FLAG DE ROL (normalizado)
        const rolUsuario = (usuarioActual.rol || '').toLowerCase().trim();
        const esCliente = rolUsuario === 'cliente';

        // VALIDACIONES COMUNES (aplican a todos los roles)
        const validacionUsuario = validarDatosUsuario({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido) {
            return res.status(400).json({ error: validacionUsuario.error });
        }

        //  Validar campos de cliente SOLO si el usuario es Cliente
        if (esCliente) {
            const validacionCliente = validarDatosCliente({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido) {
                return res.status(400).json({ error: validacionCliente.error });
            }
        }

        let hashNuevaContra = undefined;

        if (passwordNueva) {
            if (!passwordActual) {
                return res.status(400).json({ error: 'Debés ingresar tu contraseña actual para cambiarla.' });
            }

            const validacionPwd = esContraseñaSegura(passwordNueva);
            if (!validacionPwd.valido) {
                return res.status(400).json({ error: validacionPwd.error });
            }

            // Verificar contraseña actual buscando el hash en BD
            const userConHash = await UsuarioModel.obtenerPorCorreo(usuarioActual.correo);

            if (!userConHash || !userConHash.contraseña) {
                return res.status(401).json({ error: 'No se pudo verificar la contraseña actual' });
            }

            const contraseñaValida = await bcrypt.compare(passwordActual, userConHash.contraseña);

            if (!contraseñaValida) {
                return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
            }

            hashNuevaContra = await bcrypt.hash(passwordNueva, 10);
        }

        //  Construir datos a actualizar (base común)
        const datosUpdate: any = {
            nombre: nombre.trim(),
            paterno: paterno.trim(),
            materno: materno?.trim() || null,
            correo: correo.toLowerCase().trim(),
            telefono: String(telefono).trim(),
            contraseña: hashNuevaContra
        };

        //  Solo incluir campos de cliente si ES cliente
        if (esCliente) {
            datosUpdate.ci_nit = ci_nit ? String(ci_nit).trim() : null;
            datosUpdate.fecha_nacimiento = fecha_nacimiento || null;
            datosUpdate.calle = calle?.trim() || null;
            datosUpdate.zona = zona?.trim() || null;
            datosUpdate.ciudad = ciudad?.trim() || null;
        }

        const usuarioActualizado = await UsuarioModel.actualizarPerfil(id_usuario, datosUpdate);

        if (!usuarioActualizado) {
            return res.status(500).json({ error: 'Error al actualizar datos' });
        }

        const nuevoToken = jwt.sign(
            {
                id_usuario: id_usuario,
                nombre: usuarioActualizado.nombre,
                correo: usuarioActualizado.correo,
                rol: usuarioActual.rol
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '60m' }
        );

        res.status(200).json({
            mensaje: 'Perfil actualizado con éxito',
            token: nuevoToken,
            perfil: usuarioActualizado
        });

    } catch (error: any) {
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

// CREAR USUARIO (desde Panel Admin)
const crearUsuario = async (req: Request, res: Response) => {
    try {
        const {
            nombre, paterno, materno, correo, telefono, contraseña, rol, estado,
            ci_nit, fecha_nacimiento, calle, zona, ciudad,
            fecha_contratacion, cargo, turno, nivel_acceso
        } = req.body;

        // VALIDAR ROL
        if (!rol || !['Cliente', 'Empleado', 'Admin', 'Administrador'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }

        //  FLAG DE ROL
        const rolNorm = rol.toLowerCase().trim();
        const esCliente = rolNorm === 'cliente';
        const esEmpleado = rolNorm === 'empleado';
        const esAdmin = rolNorm === 'admin' || rolNorm === 'administrador';

        // VALIDACIONES COMUNES
        const validacionUsuario = validarDatosUsuario({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido) {
            return res.status(400).json({ error: validacionUsuario.error });
        }

        const validacionPwd = esContraseñaSegura(contraseña);
        if (!validacionPwd.valido) {
            return res.status(400).json({ error: validacionPwd.error });
        }

        const correoNormalizado = correo.toLowerCase().trim();
        const existente = await UsuarioModel.obtenerPorCorreo(correoNormalizado);

        if (existente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        //  Validar campos de cliente SOLO si el rol es Cliente
        if (esCliente) {
            const validacionCliente = validarDatosCliente({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido) {
                return res.status(400).json({ error: validacionCliente.error });
            }

            if (ci_nit) {
                const ciExistente = await UsuarioModel.obtenerPorCiNit(ci_nit);
                if (ciExistente) {
                    return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
                }
            }
        }

        //  Validar campos de empleado SOLO si el rol es Empleado
        if (esEmpleado) {
            if (!fecha_contratacion) return res.status(400).json({ error: 'La fecha de contratación es obligatoria.' });
            if (!cargo || !cargo.trim()) return res.status(400).json({ error: 'El cargo es obligatorio.' });
            if (cargo.trim().length < 3 || cargo.trim().length > 100) {
                return res.status(400).json({ error: 'El cargo debe tener entre 3 y 100 caracteres.' });
            }
            if (turno && !['Mañana', 'Tarde', 'Noche'].includes(turno)) {
                return res.status(400).json({ error: 'Turno inválido.' });
            }
        }

        //  Validar campos de admin SOLO si el rol es Admin
        if (esAdmin) {
            if (nivel_acceso && !['Total', 'Medio', 'Bajo'].includes(nivel_acceso)) {
                return res.status(400).json({ error: 'Nivel de acceso inválido.' });
            }
        }

        // CREAR USUARIO
        const hash = await bcrypt.hash(contraseña, 10);

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

        const nuevo = await UsuarioModel.crearUsuario(usuarioData, rolData);

        res.status(201).json({
            mensaje: 'Usuario creado con éxito',
            id_usuario: nuevo.id_usuario
        });

    } catch (error: any) {
        console.error('Error en crearUsuario:', error);

        if (error.code === '23505') {
            if (error.constraint?.includes('correo')) return res.status(400).json({ error: 'El correo ya está registrado' });
            if (error.constraint?.includes('ci_nit')) return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
            return res.status(400).json({ error: 'Datos duplicados' });
        }
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

// ACTUALIZAR USUARIO (desde Panel Admin)
const actualizarUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        const {
            nombre, paterno, materno, correo, telefono, contraseña, rol, estado,
            ci_nit, fecha_nacimiento, calle, zona, ciudad,
            fecha_contratacion, cargo, turno, nivel_acceso
        } = req.body;

        // VALIDACIONES
        if (!rol || !['Cliente', 'Empleado', 'Admin', 'Administrador'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }

        //  FLAG DE ROL
        const rolNorm = rol.toLowerCase().trim();
        const esCliente = rolNorm === 'cliente';
        const esEmpleado = rolNorm === 'empleado';
        const esAdmin = rolNorm === 'admin' || rolNorm === 'administrador';

        const validacionUsuario = validarDatosUsuario({ nombre, paterno, materno, correo, telefono });
        if (!validacionUsuario.valido) return res.status(400).json({ error: validacionUsuario.error });

        let hashNueva = undefined;

        if (contraseña && contraseña.trim()) {
            const validacionPwd = esContraseñaSegura(contraseña);
            if (!validacionPwd.valido) return res.status(400).json({ error: validacionPwd.error });
            hashNueva = await bcrypt.hash(contraseña, 10);
        }

        if (estado && !['activo', 'inactivo', 'Activo', 'Inactivo'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        //  Validar campos de cliente SOLO si el rol es Cliente
        if (esCliente) {
            const validacionCliente = validarDatosCliente({ ci_nit, fecha_nacimiento, calle, zona, ciudad });
            if (!validacionCliente.valido) return res.status(400).json({ error: validacionCliente.error });
        }

        //  Validar campos de empleado SOLO si el rol es Empleado
        if (esEmpleado) {
            if (!fecha_contratacion) return res.status(400).json({ error: 'La fecha de contratación es obligatoria.' });
            if (!cargo || !cargo.trim()) return res.status(400).json({ error: 'El cargo es obligatorio.' });
            if (cargo.trim().length < 3 || cargo.trim().length > 100) return res.status(400).json({ error: 'El cargo debe tener entre 3 y 100 caracteres.' });
            if (turno && !['Mañana', 'Tarde', 'Noche'].includes(turno)) return res.status(400).json({ error: 'Turno inválido.' });
        }

        //  Validar campos de admin SOLO si el rol es Admin
        if (esAdmin) {
            if (nivel_acceso && !['Total', 'Medio', 'Bajo'].includes(nivel_acceso)) {
                return res.status(400).json({ error: 'Nivel de acceso inválido.' });
            }
        }

        // ACTUALIZAR
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

        await UsuarioModel.actualizarUsuario(id, usuarioData, rolData);

        res.status(200).json({ mensaje: 'Usuario actualizado con éxito' });

    } catch (error: any) {
        console.error('Error en actualizarUsuario:', error);

        if (error.code === '23505') {
            if (error.constraint?.includes('correo')) return res.status(400).json({ error: 'El correo ya está registrado por otro usuario' });
            if (error.constraint?.includes('ci_nit')) return res.status(400).json({ error: 'El CI/NIT ya está registrado por otro usuario' });
            return res.status(400).json({ error: 'Datos duplicados' });
        }

        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

// ELIMINAR USUARIO
const eliminarUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        const eliminado = await UsuarioModel.eliminarUsuario(id);

        if (!eliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({ mensaje: 'Usuario eliminado' });

    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

// OBTENER USUARIO COMPLETO POR ID
const obtenerUsuarioCompletoPorId = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        const usuario = await UsuarioModel.obtenerUsuarioCompletoPorId(id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);

    } catch (error) {
        console.error('Error en obtenerUsuarioCompletoPorId:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};

// EXPORTS
export {
    listarUsuarios,
    cambiarEstadoUsuario,
    obtenerPerfil,
    actualizarPerfil,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    obtenerUsuarioCompletoPorId
};