"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const UsuarioModel = {
    obtenerPorCorreo: async (correo) => {
        const query = `
            SELECT 
                u.id_usuario,
                u.nombre,
                u.apellido_paterno AS paterno,
                u.apellido_materno AS materno,
                u.correo,
                u.telefono,
                u.contrasena AS "contraseña",
                u.estado_cuenta,
                u.fecha_registro,
                c.ci_nit,
                c.fecha_nacimiento,
                c.calle,
                c.zona,
                c.ciudad,
                e.fecha_contratacion,
                e.cargo,
                e.turno,
                a.nivel_acceso,
                a.fecha_asignacion_cargo,
                CASE 
                    WHEN a.id_administrador IS NOT NULL THEN 'Administrador'
                    WHEN e.id_empleado IS NOT NULL THEN 'Empleado'
                    WHEN c.id_cliente IS NOT NULL THEN 'Cliente'
                    ELSE 'Usuario'
                END as rol
            FROM usuario u
            LEFT JOIN administrador a ON u.id_usuario = a.id_administrador
            LEFT JOIN empleado e ON u.id_usuario = e.id_empleado
            LEFT JOIN cliente c ON u.id_usuario = c.id_cliente
            WHERE LOWER(u.correo) = LOWER($1)
        `;
        const result = await database_1.pool.query(query, [correo.trim()]);
        return result.rows[0];
    },
    obtenerPorCiNit: async (ci_nit) => {
        const query = `
            SELECT c.id_cliente AS id_usuario, c.ci_nit 
            FROM cliente c 
            WHERE c.ci_nit = $1
        `;
        const result = await database_1.pool.query(query, [ci_nit.trim()]);
        return result.rows[0];
    },
    crearCliente: async (usuarioData) => {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const queryUsuario = `
                INSERT INTO usuario (
                    nombre, apellido_paterno, apellido_materno, correo, telefono, contrasena, estado_cuenta
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id_usuario
            `;
            const valuesUsuario = [
                usuarioData.nombre,
                usuarioData.paterno,
                usuarioData.materno || null,
                usuarioData.correo.toLowerCase().trim(),
                usuarioData.telefono || null,
                usuarioData.contraseña,
                usuarioData.estado_cuenta || 'activo'
            ];
            const resultUsuario = await client.query(queryUsuario, valuesUsuario);
            const id_usuario = resultUsuario.rows[0].id_usuario;
            const queryCliente = `
                INSERT INTO cliente (
                    id_cliente, ci_nit, fecha_nacimiento, calle, zona, ciudad
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            const valuesCliente = [
                id_usuario,
                usuarioData.ci_nit || null,
                usuarioData.fecha_nacimiento || null,
                usuarioData.calle || null,
                usuarioData.zona || null,
                usuarioData.ciudad || null
            ];
            await client.query(queryCliente, valuesCliente);
            await client.query('COMMIT');
            return { id_usuario };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    },
    obtenerTodos: async () => {
        const query = `
            SELECT 
                u.id_usuario AS id, 
                u.nombre, 
                CONCAT(u.apellido_paterno, ' ', COALESCE(u.apellido_materno, '')) AS apellidos,
                u.correo, 
                u.telefono,
                c.ci_nit,
                u.estado_cuenta AS estado, 
                u.fecha_registro,
                CASE 
                    WHEN a.id_administrador IS NOT NULL THEN 'Admin'
                    WHEN e.id_empleado IS NOT NULL THEN 'Empleado'
                    WHEN c.id_cliente IS NOT NULL THEN 'Cliente'
                    ELSE 'Usuario'
                END as rol
            FROM usuario u
            LEFT JOIN administrador a ON u.id_usuario = a.id_administrador
            LEFT JOIN empleado e ON u.id_usuario = e.id_empleado
            LEFT JOIN cliente c ON u.id_usuario = c.id_cliente
            ORDER BY u.id_usuario DESC
        `;
        const result = await database_1.pool.query(query);
        return result.rows;
    },
    actualizarEstado: async (id_usuario, nuevoEstado) => {
        const query = `
            UPDATE usuario 
            SET estado_cuenta = $1 
            WHERE id_usuario = $2 
            RETURNING id_usuario, nombre, correo, estado_cuenta
        `;
        const result = await database_1.pool.query(query, [nuevoEstado, id_usuario]);
        return result.rows[0];
    },
    obtenerPorId: async (id_usuario) => {
        const query = `
            SELECT 
                u.id_usuario, 
                u.nombre, 
                u.apellido_paterno AS paterno, 
                u.apellido_materno AS materno, 
                u.correo, 
                u.telefono, 
                u.estado_cuenta, 
                u.fecha_registro,
                c.ci_nit, 
                c.fecha_nacimiento, 
                c.calle, 
                c.zona, 
                c.ciudad,
                e.fecha_contratacion, 
                e.cargo, 
                e.turno,
                a.nivel_acceso, 
                a.fecha_asignacion_cargo,
                CASE 
                    WHEN a.id_administrador IS NOT NULL THEN 'Administrador'
                    WHEN e.id_empleado IS NOT NULL THEN 'Empleado'
                    WHEN c.id_cliente IS NOT NULL THEN 'Cliente'
                    ELSE 'Usuario'
                END as rol,
                CASE 
                    WHEN c.fecha_nacimiento IS NOT NULL 
                    THEN EXTRACT(YEAR FROM AGE(c.fecha_nacimiento))::int
                    ELSE NULL
                END as edad,
                CASE 
                    WHEN e.fecha_contratacion IS NOT NULL 
                    THEN EXTRACT(YEAR FROM AGE(e.fecha_contratacion))::int
                    ELSE NULL
                END as antiguedad
            FROM usuario u
            LEFT JOIN administrador a ON u.id_usuario = a.id_administrador
            LEFT JOIN empleado e ON u.id_usuario = e.id_empleado
            LEFT JOIN cliente c ON u.id_usuario = c.id_cliente
            WHERE u.id_usuario = $1
        `;
        const result = await database_1.pool.query(query, [id_usuario]);
        return result.rows[0];
    },
    actualizarPerfil: async (id_usuario, datosUpdate) => {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            let queryUsuario = `
                UPDATE usuario 
                SET nombre = $1, apellido_paterno = $2, apellido_materno = $3, correo = $4, telefono = $5
            `;
            let valuesUsuario = [
                datosUpdate.nombre,
                datosUpdate.paterno,
                datosUpdate.materno || null,
                datosUpdate.correo.toLowerCase().trim(),
                datosUpdate.telefono || null
            ];
            let contador = 6;
            if (datosUpdate.contraseña) {
                queryUsuario += `, contrasena = $${contador}`;
                valuesUsuario.push(datosUpdate.contraseña);
                contador++;
            }
            queryUsuario += ` WHERE id_usuario = $${contador}`;
            valuesUsuario.push(id_usuario);
            await client.query(queryUsuario, valuesUsuario);
            const checkCliente = await client.query('SELECT id_cliente FROM cliente WHERE id_cliente = $1', [id_usuario]);
            if (checkCliente.rows.length > 0) {
                await client.query(`
                    UPDATE cliente 
                    SET ci_nit = $1, fecha_nacimiento = $2, calle = $3, zona = $4, ciudad = $5
                    WHERE id_cliente = $6
                `, [
                    datosUpdate.ci_nit || null,
                    datosUpdate.fecha_nacimiento || null,
                    datosUpdate.calle || null,
                    datosUpdate.zona || null,
                    datosUpdate.ciudad || null,
                    id_usuario
                ]);
            }
            await client.query('COMMIT');
            return await UsuarioModel.obtenerPorId(id_usuario);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    },
    crearUsuario: async (usuarioData, rolData) => {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const queryUsuario = `
                INSERT INTO usuario (
                    nombre, apellido_paterno, apellido_materno, correo, telefono, contrasena, estado_cuenta
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id_usuario
            `;
            const valuesUsuario = [
                usuarioData.nombre,
                usuarioData.paterno,
                usuarioData.materno || null,
                usuarioData.correo.toLowerCase().trim(),
                usuarioData.telefono || null,
                usuarioData.contraseña,
                usuarioData.estado_cuenta || 'activo'
            ];
            const resultUsuario = await client.query(queryUsuario, valuesUsuario);
            const id_usuario = resultUsuario.rows[0].id_usuario;
            if (usuarioData.rol === 'Cliente') {
                await client.query(`INSERT INTO cliente (id_cliente, ci_nit, fecha_nacimiento, calle, zona, ciudad) 
                     VALUES ($1, $2, $3, $4, $5, $6)`, [
                    id_usuario,
                    rolData.ci_nit || null,
                    rolData.fecha_nacimiento || null,
                    rolData.calle || null,
                    rolData.zona || null,
                    rolData.ciudad || null
                ]);
            }
            else if (usuarioData.rol === 'Empleado') {
                await client.query(`INSERT INTO empleado (id_empleado, fecha_contratacion, cargo, turno)
                     VALUES ($1, $2, $3, $4)`, [
                    id_usuario,
                    rolData.fecha_contratacion || new Date(),
                    rolData.cargo || 'encargado_cancha',
                    rolData.turno || 'mañana'
                ]);
            }
            else if (usuarioData.rol === 'Admin' || usuarioData.rol === 'Administrador') {
                await client.query(`INSERT INTO administrador (id_administrador, nivel_acceso, fecha_asignacion_cargo)
                     VALUES ($1, $2, $3)`, [
                    id_usuario,
                    rolData.nivel_acceso || 'total',
                    rolData.fecha_asignacion_cargo || new Date()
                ]);
            }
            await client.query('COMMIT');
            return { id_usuario };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    },
    actualizarUsuario: async (id_usuario, usuarioData, rolData) => {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            let query = `
                UPDATE usuario 
                SET nombre = $1, apellido_paterno = $2, apellido_materno = $3, correo = $4, telefono = $5, estado_cuenta = $6
            `;
            let values = [
                usuarioData.nombre,
                usuarioData.paterno,
                usuarioData.materno || null,
                usuarioData.correo.toLowerCase().trim(),
                usuarioData.telefono || null,
                usuarioData.estado_cuenta || 'activo'
            ];
            let contador = 7;
            if (usuarioData.contraseña) {
                query += `, contrasena = $${contador}`;
                values.push(usuarioData.contraseña);
                contador++;
            }
            query += ` WHERE id_usuario = $${contador}`;
            values.push(id_usuario);
            await client.query(query, values);
            if (usuarioData.rol === 'Cliente') {
                const existe = await client.query('SELECT id_cliente FROM cliente WHERE id_cliente = $1', [id_usuario]);
                if (existe.rows.length === 0) {
                    await client.query(`
                        INSERT INTO cliente (id_cliente, ci_nit, fecha_nacimiento, calle, zona, ciudad)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [id_usuario, rolData.ci_nit || null, rolData.fecha_nacimiento || null, rolData.calle || null, rolData.zona || null, rolData.ciudad || null]);
                }
                else {
                    await client.query(`
                        UPDATE cliente 
                        SET ci_nit = $1, fecha_nacimiento = $2, calle = $3, zona = $4, ciudad = $5
                        WHERE id_cliente = $6
                    `, [rolData.ci_nit || null, rolData.fecha_nacimiento || null, rolData.calle || null, rolData.zona || null, rolData.ciudad || null, id_usuario]);
                }
            }
            else if (usuarioData.rol === 'Empleado') {
                const existe = await client.query('SELECT id_empleado FROM empleado WHERE id_empleado = $1', [id_usuario]);
                if (existe.rows.length > 0) {
                    await client.query(`UPDATE empleado SET fecha_contratacion = $1, cargo = $2, turno = $3
                         WHERE id_empleado = $4`, [rolData.fecha_contratacion || new Date(), rolData.cargo || 'encargado_cancha', rolData.turno || 'mañana', id_usuario]);
                }
                else {
                    await client.query(`INSERT INTO empleado (id_empleado, fecha_contratacion, cargo, turno)
                         VALUES ($1, $2, $3, $4)`, [id_usuario, rolData.fecha_contratacion || new Date(), rolData.cargo || 'encargado_cancha', rolData.turno || 'mañana']);
                }
            }
            else if (usuarioData.rol === 'Admin' || usuarioData.rol === 'Administrador') {
                const existe = await client.query('SELECT id_administrador FROM administrador WHERE id_administrador = $1', [id_usuario]);
                if (existe.rows.length > 0) {
                    await client.query(`UPDATE administrador SET nivel_acceso = $1 WHERE id_administrador = $2`, [rolData.nivel_acceso || 'total', id_usuario]);
                }
                else {
                    await client.query(`INSERT INTO administrador (id_administrador, nivel_acceso, fecha_asignacion_cargo)
                         VALUES ($1, $2, $3)`, [id_usuario, rolData.nivel_acceso || 'total', new Date()]);
                }
            }
            await client.query('COMMIT');
            return { id_usuario };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    },
    eliminarUsuario: async (id_usuario) => {
        const query = `DELETE FROM usuario WHERE id_usuario = $1 RETURNING id_usuario`;
        const result = await database_1.pool.query(query, [id_usuario]);
        return result.rows[0];
    },
    obtenerUsuarioCompletoPorId: async (id_usuario) => {
        return await UsuarioModel.obtenerPorId(id_usuario);
    },
    guardarTokenRecuperacion: async (correo, token, fechaExpiracion) => {
        const query = `
            UPDATE usuario 
            SET token_recuperacion = $1, fecha_expiracion_token = $2
            WHERE LOWER(correo) = LOWER($3)
            RETURNING id_usuario, correo
        `;
        const result = await database_1.pool.query(query, [token, fechaExpiracion, correo.trim()]);
        return result.rows[0];
    },
    obtenerPorTokenRecuperacion: async (token) => {
        const query = `
            SELECT id_usuario, correo, token_recuperacion, fecha_expiracion_token
            FROM usuario
            WHERE token_recuperacion = $1
        `;
        const result = await database_1.pool.query(query, [token]);
        return result.rows[0];
    },
    actualizarContraseñaConToken: async (id_usuario, nuevaContraseñaHash) => {
        const query = `
            UPDATE usuario 
            SET contrasena = $1, 
                token_recuperacion = NULL, 
                fecha_expiracion_token = NULL
            WHERE id_usuario = $2
            RETURNING id_usuario, correo
        `;
        const result = await database_1.pool.query(query, [nuevaContraseñaHash, id_usuario]);
        return result.rows[0];
    }
};
exports.default = UsuarioModel;
