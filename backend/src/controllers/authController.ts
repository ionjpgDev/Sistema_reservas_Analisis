import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Request, Response } from 'express';

import UsuarioModel from '../models/usuarioModel';

import {
    validarDatosUsuario,
    validarDatosCliente,
    esContraseñaSegura,
    esCorreoValido
} from '../utils/validaciones';

// CONFIGURACIÓN DE NODEMAILER (Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error) => {
    if (error) {
        console.error('Error al configurar Nodemailer:', error.message);
    } else {
        console.log('Nodemailer listo para enviar correos');
    }
});

// REGISTRAR
const registrar = async (req: Request, res: Response) => {
    const {
        nombre,
        paterno,
        materno,
        correo,
        telefono,
        contraseña,
        ci_nit,
        fecha_nacimiento,
        calle,
        zona,
        ciudad
    } = req.body;

    try {
        const validacionUsuario = validarDatosUsuario({
            nombre,
            paterno,
            materno,
            correo,
            telefono
        });

        if (!validacionUsuario.valido) {
            return res.status(400).json({ error: validacionUsuario.error });
        }

        const validacionPwd = esContraseñaSegura(contraseña);

        if (!validacionPwd.valido) {
            return res.status(400).json({ error: validacionPwd.error });
        }

        const validacionCliente = validarDatosCliente({
            ci_nit,
            fecha_nacimiento,
            calle,
            zona,
            ciudad
        });

        if (!validacionCliente.valido) {
            return res.status(400).json({ error: validacionCliente.error });
        }

        const correoNormalizado = correo.toLowerCase().trim();

        const usuarioExistente = await UsuarioModel.obtenerPorCorreo(correoNormalizado);

        if (usuarioExistente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const ciNormalizado = String(ci_nit).trim();

        const ciExistente = await UsuarioModel.obtenerPorCiNit(ciNormalizado);

        if (ciExistente) {
            return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);

        const nuevoUsuario = {
            nombre: nombre.trim(),
            paterno: paterno.trim(),
            materno: materno?.trim() || null,
            correo: correoNormalizado,
            telefono: String(telefono).trim(),
            contraseña: hashedPassword,

            // Datos personales
            ci_nit: ciNormalizado,
            fecha_nacimiento,
            calle: calle?.trim() || null,
            zona: zona?.trim() || null,
            ciudad: ciudad?.trim() || null
        };

        await UsuarioModel.crearCliente(nuevoUsuario);

        res.status(201).json({
            mensaje: 'Cliente registrado con éxito'
        });

    } catch (error: any) {
        console.error('Error en registrar:', error);

        if (error.code === '23505') {
            if (error.constraint?.includes('correo')) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            if (error.constraint?.includes('ci_nit')) {
                return res.status(400).json({ error: 'El CI/NIT ya está registrado' });
            }

            return res.status(400).json({ error: 'Datos duplicados' });
        }

        res.status(500).json({ error: 'Error interno del servidor al registrar' });
    }
};

// LOGIN
const login = async (req: Request, res: Response) => {
    const { correo, contraseña } = req.body;

    try {
        if (!correo || !contraseña) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
        }

        if (!esCorreoValido(correo)) {
            return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
        }

        if (contraseña.length < 6) {
            return res.status(400).json({ error: 'Contraseña inválida.' });
        }

        const correoNormalizado = correo.toLowerCase().trim();

        const usuario = await UsuarioModel.obtenerPorCorreo(correoNormalizado);

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (usuario.estado_cuenta?.toLowerCase() === 'inactivo') {
            return res.status(403).json({ error: 'Tu cuenta ha sido desactivada' });
        }

        // Validación extra de seguridad para TypeScript
        if (!usuario.contraseña) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '60m' }
        );

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                estado: usuario.estado_cuenta,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
};

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
const solicitarRecuperacion = async (req: Request, res: Response) => {
    const { correo } = req.body;

    try {
        if (!correo) {
            return res.status(400).json({ error: 'El correo es obligatorio.' });
        }

        if (!esCorreoValido(correo)) {
            return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
        }

        const correoNormalizado = correo.toLowerCase().trim();

        const usuario = await UsuarioModel.obtenerPorCorreo(correoNormalizado);

        if (!usuario) {
            return res.status(200).json({
                mensaje: 'Si el correo está registrado, te enviamos las instrucciones.'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');

        const fechaExpiracion = new Date(Date.now() + 60 * 60 * 1000);

        await UsuarioModel.guardarTokenRecuperacion(
            correoNormalizado,
            token,
            fechaExpiracion
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const linkRecuperacion = `${frontendUrl}/reset-password?token=${token}`;

        await transporter.sendMail({
            from: `"Canchas Deportivas" <${process.env.EMAIL_USER}>`,
            to: correo,
            subject: 'Recuperación de contraseña — Canchas Deportivas',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1C3B34, #101010); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: #F6EADA; margin: 0; font-size: 24px;">Canchas Deportivas</h1>
                    </div>
                    <div style="background: #FBF3E8; padding: 30px; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #101010; margin-top: 0;">Recuperación de contraseña</h2>
                        <p style="color: #5A5350; line-height: 1.6;">
                            Hola <strong>${usuario.nombre}</strong>,
                        </p>
                        <p style="color: #5A5350; line-height: 1.6;">
                            Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón de abajo para elegir una nueva:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${linkRecuperacion}"
                               style="display: inline-block; background: #1C3B34; color: #F6EADA; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                                Restablecer contraseña
                            </a>
                        </div>
                        <p style="color: #5A5350; line-height: 1.6; font-size: 14px;">
                            O copiá y pegá este enlace en tu navegador:<br>
                            <span style="color: #1C3B34; word-break: break-all;">${linkRecuperacion}</span>
                        </p>
                        <p style="color: #5A5350; line-height: 1.6; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E0D2BC;">
                            ⏰ Este enlace expira en <strong>1 hora</strong>.<br>
                            Si no solicitaste este cambio, ignorá este correo.
                        </p>
                    </div>
                </div>
            `
        });

        res.status(200).json({
            mensaje: 'Si el correo está registrado, te enviamos las instrucciones.'
        });

    } catch (error) {
        console.error('Error en solicitarRecuperacion:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

// VALIDAR TOKEN
const validarToken = async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
        if (!token) {
            return res.status(400).json({ error: 'Token no proporcionado' });
        }

        const usuario = await UsuarioModel.obtenerPorTokenRecuperacion(token);

        if (!usuario) {
            return res.status(404).json({ error: 'Token inválido' });
        }

        if (!usuario.fecha_expiracion_token || new Date() > new Date(usuario.fecha_expiracion_token)) {
            return res.status(400).json({ error: 'El token ha expirado' });
        }

        res.status(200).json({
            valido: true,
            correo: usuario.correo
        });

    } catch (error) {
        console.error('Error en validarToken:', error);
        res.status(500).json({ error: 'Error al validar token' });
    }
};

// RESETEAR CONTRASEÑA
const resetPassword = async (req: Request, res: Response) => {
    const { token, nuevaContraseña } = req.body;

    try {
        if (!token || !nuevaContraseña) {
            return res.status(400).json({ error: 'Token y contraseña son obligatorios.' });
        }

        const validacionPwd = esContraseñaSegura(nuevaContraseña);

        if (!validacionPwd.valido) {
            return res.status(400).json({ error: validacionPwd.error });
        }

        const usuario = await UsuarioModel.obtenerPorTokenRecuperacion(token);

        if (!usuario) {
            return res.status(404).json({ error: 'Token inválido o ya utilizado' });
        }

        if (!usuario.fecha_expiracion_token || new Date() > new Date(usuario.fecha_expiracion_token)) {
            return res.status(400).json({ error: 'El token ha expirado. Solicitá uno nuevo.' });
        }

        const hash = await bcrypt.hash(nuevaContraseña, 10);

        await UsuarioModel.actualizarContraseñaConToken(
            usuario.id_usuario,
            hash
        );

        res.status(200).json({
            mensaje: 'Contraseña actualizada con éxito'
        });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ error: 'Error al resetear la contraseña' });
    }
};

// EXPORTS
export {
    registrar,
    login,
    solicitarRecuperacion,
    validarToken,
    resetPassword
};