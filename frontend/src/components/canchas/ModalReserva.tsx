import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { tieneRol, useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FieldError from '../FieldError';
import type { Cancha } from './cancha.types';

interface ModalReservaProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    cancha: Cancha | null;
    esPresencial?: boolean;
}

type MetodoPago = 'presencial' | 'tarjeta_debito' | 'tarjeta_credito' | 'qr';

const ModalReserva = ({ isOpen, onClose, onSave, cancha = null, esPresencial = false }: ModalReservaProps) => {
    const { usuario } = useAuth();
    const requiereCliente = esPresencial || tieneRol(usuario, 'admin', 'administrador', 'empleado');

    const [paso, setPaso] = useState<'reserva' | 'pago'>('reserva');
    const [formData, setFormData] = useState({
        fecha_reserva: '',
        hora_inicio: '',
        hora_fin: '',
        id_cancha: cancha?.id_cancha || '',
        id_cliente: '',
        observaciones: ''
    });
    
    const [pagoData, setPagoData] = useState({
        metodo_pago: 'presencial' as MetodoPago,
        comprobante: null as File | null,
        nro_comprobante: '',
        previewUrl: ''
    });
    
    const [canchas, setCanchas] = useState<Cancha[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [filtroCliente, setFiltroCliente] = useState('');
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const [errorClientes, setErrorClientes] = useState('');
    const [versionCargaClientes, setVersionCargaClientes] = useState(0);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [monto, setMonto] = useState(0);
    const [idReservaCreada, setIdReservaCreada] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                if (!cancha) {
                    const res = await api.get('/canchas');
                    setCanchas(res.data.data || []);
                }
            } catch (err) {
                console.error('Error al cargar canchas', err);
            }

            if (requiereCliente) {
                setCargandoClientes(true);
                setErrorClientes('');
                try {
                    const res = await api.get('/usuarios');
                    const usuarios = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
                    const clientesFiltrados = usuarios.filter((usuarioActual: any) => {
                        const rol = String(usuarioActual.rol || '').trim().toLowerCase();
                        return rol === 'cliente';
                    });
                    setClientes(clientesFiltrados);
                    if (clientesFiltrados.length === 0) setErrorClientes('No hay clientes disponibles para asociar a la reserva.');
                } catch (err) {
                    console.error('Error al cargar clientes', err);
                    setClientes([]);
                    setErrorClientes('No se pudo cargar la lista de clientes. Revisa la conexión e inténtalo otra vez.');
                } finally {
                    setCargandoClientes(false);
                }
            }
        };
        fetchData();
    }, [isOpen, cancha, requiereCliente, versionCargaClientes]);

    useEffect(() => {
        if (cancha) {
            setFormData(prev => ({ ...prev, id_cancha: cancha.id_cancha }));
        }
    }, [cancha]);

    useEffect(() => {
        if (isOpen) {
            setPaso('reserva');
            setFormData({
                fecha_reserva: '',
                hora_inicio: '',
                hora_fin: '',
                id_cancha: cancha?.id_cancha || '',
                id_cliente: '',
                observaciones: ''
            });
            setFiltroCliente('');
            setPagoData({ metodo_pago: 'presencial', comprobante: null, nro_comprobante: '', previewUrl: '' });
            setErrores({});
            setError('');
            setMonto(0);
            setIdReservaCreada(null);
            setSuccessMsg('');
        }
    }, [isOpen]);

    const calcularMonto = () => {
        if (!formData.id_cancha || !formData.hora_inicio || !formData.hora_fin) {
            setMonto(0);
            return;
        }
        
        const canchaSeleccionada = cancha?.id_cancha === Number(formData.id_cancha) 
            ? cancha 
            : canchas.find(c => c.id_cancha === Number(formData.id_cancha));
        
        if (!canchaSeleccionada || !canchaSeleccionada.precio_hora) {
            setMonto(0);
            return;
        }
        
        const [hi, mi] = formData.hora_inicio.split(':').map(Number);
        const [hf, mf] = formData.hora_fin.split(':').map(Number);
        const horas = (hf * 60 + mf - (hi * 60 + mi)) / 60;
        
        if (horas > 0) {
            setMonto(horas * Number(canchaSeleccionada.precio_hora));
        } else {
            setMonto(0);
        }
    };

    useEffect(() => {
        calcularMonto();
    }, [formData.hora_inicio, formData.hora_fin, formData.id_cancha, cancha, canchas]);

    const terminoCliente = filtroCliente.trim().toLocaleLowerCase('es');
    const clientesVisibles = clientes.filter((cliente) => {
        const idCliente = cliente.id_cliente ?? cliente.id_usuario ?? cliente.id;
        const nombre = `${cliente.nombre || ''} ${cliente.apellidos || cliente.paterno || cliente.apellido_paterno || cliente.apellidoPaterno || ''}`.trim();
        const datosCliente = `${idCliente} ${nombre} ${cliente.correo || ''}`.toLocaleLowerCase('es');
        return datosCliente.includes(terminoCliente);
    });

    if (!isOpen) return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
    };

    const validarReserva = () => {
        const nuevosErrores: Record<string, string> = {};
        if (!formData.fecha_reserva) nuevosErrores.fecha_reserva = 'La fecha es obligatoria';
        if (!formData.hora_inicio) nuevosErrores.hora_inicio = 'La hora de inicio es obligatoria';
        if (!formData.hora_fin) nuevosErrores.hora_fin = 'La hora de fin es obligatoria';
        if (!formData.id_cancha) nuevosErrores.id_cancha = 'Debe seleccionar una cancha';
        if (requiereCliente && !formData.id_cliente) nuevosErrores.id_cliente = 'Debe seleccionar un cliente';
        
        if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
            nuevosErrores.hora_fin = 'La hora de fin debe ser mayor a la de inicio';
        }
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleCrearReserva = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validarReserva()) return;

        setCargando(true);
        try {
            const payload: any = {
                fecha_reserva: formData.fecha_reserva,
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                id_cancha: Number(formData.id_cancha),
                observaciones: formData.observaciones || undefined
            };
            
            if (requiereCliente) {
                const idCliente = Number(formData.id_cliente);
                if (!Number.isInteger(idCliente) || idCliente <= 0) {
                    setError('Selecciona un cliente válido antes de continuar.');
                    setCargando(false);
                    return;
                }
                payload.id_cliente = idCliente;
            }
            
            const res = await api.post('/reservas', payload);
            const idReserva = res.data?.data?.id_reserva || res.data?.id_reserva;
            setIdReservaCreada(idReserva);
            if (!esPresencial) {
                onSave();
                onClose();
                return;
            }
            setPaso('pago');
        } catch (err: any) {
            console.error('Error al crear reserva:', err.response?.data);
            setError(err.response?.data?.message || 'Error al crear la reserva');
        } finally {
            setCargando(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setErrores(prev => ({ ...prev, comprobante: 'Solo se permiten imágenes (JPG, PNG, WEBP) o PDF' }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrores(prev => ({ ...prev, comprobante: 'El archivo no debe superar 5MB' }));
                return;
            }
            setPagoData(prev => ({ 
                ...prev, 
                comprobante: file,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
            }));
            if (errores.comprobante) setErrores(prev => ({ ...prev, comprobante: '' }));
        }
    };

    const handleEnviarPago = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const esVirtual = ['tarjeta_debito', 'tarjeta_credito', 'qr'].includes(pagoData.metodo_pago);
        
        if (esVirtual && !pagoData.comprobante) {
            setErrores({ comprobante: 'Para pagos virtuales es obligatorio subir el comprobante' });
            return;
        }
        if (esVirtual && !pagoData.nro_comprobante.trim()) {
            setErrores({ nro_comprobante: 'Ingresa el número de operación que aparece en el comprobante' });
            return;
        }

        setCargando(true);
        try {
            if (esVirtual) {
                const formDataPago = new FormData();
                formDataPago.append('id_reserva', String(idReservaCreada));
                formDataPago.append('metodo_pago', pagoData.metodo_pago);
                formDataPago.append('nro_comprobante', pagoData.nro_comprobante.trim());
                formDataPago.append('referencia_pasarela', `RES-${idReservaCreada}`);
                if (pagoData.comprobante) {
                    formDataPago.append('comprobante', pagoData.comprobante);
                }

                await api.post('/pagos/procesar-con-comprobante', formDataPago, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setSuccessMsg('¡Comprobante enviado! Tu reserva será verificada pronto.');
            } else {
                await api.post('/pagos/procesar', {
                    id_reserva: idReservaCreada,
                    metodo_pago: 'presencial'
                });
                setSuccessMsg('¡Reserva confirmada! Pago presencial registrado.');
            }
            onSave();
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('Error al procesar pago:', err.response?.data);
            setError(err.response?.data?.error || err.response?.data?.message || 'Error al procesar el pago');
        } finally {
            setCargando(false);
        }
    };

    const metodosPago: { value: MetodoPago; label: string; icon: string }[] = [
        { value: 'presencial', label: 'Pago Presencial', icon: '🏢' },
        { value: 'tarjeta_debito', label: 'Tarjeta Débito', icon: '💳' },
        { value: 'tarjeta_credito', label: 'Tarjeta Crédito', icon: '💎' },
        { value: 'qr', label: 'Pago QR', icon: '' },
    ];

    const esVirtual = ['tarjeta_debito', 'tarjeta_credito', 'qr'].includes(pagoData.metodo_pago);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-claro-tarjeta dark:bg-oscuro-tarjeta rounded-2xl shadow-xl overflow-hidden border border-claro-borde dark:border-oscuro-borde">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-claro-borde dark:border-oscuro-borde">
                    <div>
                        <h2 className="text-xl font-semibold text-claro-texto dark:text-oscuro-texto">
                            {paso === 'reserva' 
                                ? (cancha ? `Reservar ${cancha.nombre}` : 'Nueva Reserva')
                                : 'Completar Pago'
                            }
                        </h2>
                        {paso === 'pago' && (
                            <p className="text-sm text-claro-texto2 mt-1">
                                Paso 2 de 2 - Monto: <span className="font-bold text-claro-primario">Bs. {monto.toFixed(2)}</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-claro-texto2 hover:text-claro-texto">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {successMsg ? (
                    <div className="p-8 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-lg font-medium text-green-600 dark:text-green-400">{successMsg}</p>
                    </div>
                ) : paso === 'reserva' ? (
                    <form onSubmit={handleCrearReserva} className="p-6 space-y-4">
                        
                        {requiereCliente && (
                            <div>
                                <label htmlFor="filtro-cliente-reserva" className="block text-sm font-medium mb-1">Cliente *</label>
                                <input
                                    id="filtro-cliente-reserva"
                                    type="search"
                                    value={filtroCliente}
                                    onChange={(event) => {
                                        setFiltroCliente(event.target.value);
                                        setFormData((actual) => ({ ...actual, id_cliente: '' }));
                                    }}
                                    placeholder="Buscar por nombre o ID"
                                    aria-label="Buscar cliente por nombre o ID"
                                    autoComplete="off"
                                    disabled={cargandoClientes || clientes.length === 0}
                                    className="mb-2 w-full rounded-xl border border-claro-borde bg-claro-tarjeta px-3 py-2.5 text-claro-texto placeholder:text-claro-texto2 focus:border-claro-primario focus:outline-none dark:border-oscuro-borde dark:bg-oscuro-tarjeta dark:text-oscuro-texto dark:placeholder:text-oscuro-texto2"
                                />
                                <select name="id_cliente" value={formData.id_cliente} onChange={handleChange} disabled={cargandoClientes || clientesVisibles.length === 0}
                                    className="w-full rounded-xl border border-claro-borde bg-claro-tarjeta px-3 py-2.5 text-claro-texto focus:border-claro-primario focus:outline-none dark:border-oscuro-borde dark:bg-oscuro-tarjeta dark:text-oscuro-texto">
                                    <option value="">{cargandoClientes ? 'Cargando clientes...' : clientesVisibles.length ? 'Seleccione un cliente' : 'No hay coincidencias'}</option>
                                    {clientesVisibles.map(c => {
                                        const idCliente = c.id_cliente ?? c.id_usuario ?? c.id;
                                        return <option key={idCliente} value={String(idCliente)}>
                                            {c.nombre} {c.apellidos || c.paterno || c.apellido_paterno || c.apellidoPaterno || ''} · ID {idCliente}
                                        </option>;
                                    })}
                                </select>
                                {errorClientes && <div role="alert" className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-600">
                                    <span>{errorClientes}</span>
                                    <button type="button" onClick={() => setVersionCargaClientes((version) => version + 1)} className="font-semibold underline">Reintentar</button>
                                </div>}
                                {errores.id_cliente && <FieldError error={errores.id_cliente} touched={true} />}
                            </div>
                        )}

                        {!cancha && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Cancha *</label>
                                <select name="id_cancha" value={formData.id_cancha} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo">
                                    <option value="">Seleccione una cancha</option>
                                    {canchas.map(c => (
                                        <option key={c.id_cancha} value={c.id_cancha}>
                                            {c.nombre} - {c.disciplina} (Bs. {c.precio_hora}/h)
                                        </option>
                                    ))}
                                </select>
                                {errores.id_cancha && <FieldError error={errores.id_cancha} touched={true} />}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Fecha *</label>
                            <input type="date" name="fecha_reserva" value={formData.fecha_reserva} onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo" />
                            {errores.fecha_reserva && <FieldError error={errores.fecha_reserva} touched={true} />}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hora Inicio *</label>
                                <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo" />
                                {errores.hora_inicio && <FieldError error={errores.hora_inicio} touched={true} />}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hora Fin *</label>
                                <input type="time" name="hora_fin" value={formData.hora_fin} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo" />
                                {errores.hora_fin && <FieldError error={errores.hora_fin} touched={true} />}
                            </div>
                        </div>

                        {monto > 0 && (
                            <div className="bg-claro-primario/10 dark:bg-oscuro-primario/10 rounded-xl p-4">
                                <p className="text-sm text-claro-texto2">Monto estimado:</p>
                                <p className="text-2xl font-bold text-claro-primario">Bs. {monto.toFixed(2)}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Observaciones</label>
                            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange}
                                rows={2} placeholder="Ej: Necesito pelotas, petos, etc."
                                className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo resize-none" />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-claro-borde dark:border-oscuro-borde">
                            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg hover:bg-claro-tinte">
                                Cancelar
                            </button>
                            <button type="submit" disabled={cargando}
                                className={`px-5 py-2 text-sm font-medium rounded-lg shadow-sm transition-all
                                    ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-claro-primario hover:bg-claro-hover text-white'}`}>
                                {cargando ? 'Procesando...' : 'Continuar al Pago'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleEnviarPago} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Método de Pago *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {metodosPago.map(m => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setPagoData(prev => ({ ...prev, metodo_pago: m.value }))}
                                        className={`p-3 rounded-xl border-2 text-left transition-all
                                            ${pagoData.metodo_pago === m.value 
                                                ? 'border-claro-primario bg-claro-primario/10' 
                                                : 'border-claro-borde hover:border-claro-primario/50'
                                            }`}
                                    >
                                        <span className="text-xl">{m.icon}</span>
                                        <p className="text-sm font-medium mt-1">{m.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {esVirtual && (
                            <>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        ️ <strong>Para pagos virtuales es OBLIGATORIO subir el comprobante de pago.</strong>
                                        {pagoData.metodo_pago === 'qr' && ' Escanea el QR y sube la captura del pago.'}
                                        {(pagoData.metodo_pago === 'tarjeta_debito' || pagoData.metodo_pago === 'tarjeta_credito') && ' Realiza el pago y sube el comprobante.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Número de operación del comprobante *
                                    </label>
                                    <input 
                                        type="text" 
                                        value={pagoData.nro_comprobante}
                                        onChange={(e) => setPagoData(prev => ({ ...prev, nro_comprobante: e.target.value }))}
                                        placeholder="Código de transacción o autorización"
                                        maxLength={50}
                                        className="w-full px-3 py-2.5 border rounded-xl bg-claro-fondo dark:bg-oscuro-fondo"
                                    />
                                    <p className="mt-1 text-xs text-claro-texto2">Usa el identificador que aparece en el recibo. Referencia de reserva: RES-{idReservaCreada}</p>
                                    {errores.nro_comprobante && <FieldError error={errores.nro_comprobante} touched={true} />}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Comprobante de pago * (imagen o PDF)
                                    </label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors bg-claro-fondo dark:bg-oscuro-fondo
                                            ${pagoData.comprobante ? 'border-green-500' : 'border-claro-borde hover:border-claro-primario'}`}
                                    >
                                        {pagoData.previewUrl ? (
                                            <img src={pagoData.previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                                        ) : pagoData.comprobante ? (
                                            <div className="text-center">
                                                <span className="text-3xl">✅</span>
                                                <p className="text-sm mt-2 font-medium text-green-600">{pagoData.comprobante.name}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-3xl">📤</span>
                                                <p className="text-sm mt-2 text-claro-texto2">
                                                    Haz clic para subir el comprobante
                                                </p>
                                                <p className="text-xs text-claro-texto2 mt-1">
                                                    JPG, PNG, WEBP o PDF (máx. 5MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {errores.comprobante && <FieldError error={errores.comprobante} touched={true} />}
                                </div>
                            </>
                        )}

                        {pagoData.metodo_pago === 'presencial' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    🏢 Pagarás directamente en el complejo deportivo al momento de tu reserva.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-claro-borde dark:border-oscuro-borde">
                            <button type="button" onClick={() => setPaso('reserva')} className="px-5 py-2 text-sm font-medium rounded-lg hover:bg-claro-tinte">
                                 Volver
                            </button>
                            <button type="submit" 
                                disabled={cargando || (esVirtual && (!pagoData.comprobante || !pagoData.nro_comprobante.trim()))}
                                className={`px-5 py-2 text-sm font-medium rounded-lg shadow-sm transition-all
                                    ${cargando || (esVirtual && (!pagoData.comprobante || !pagoData.nro_comprobante.trim()))
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-claro-primario hover:bg-claro-hover text-white'}`}>
                                {cargando ? 'Procesando...' : (esVirtual && !pagoData.comprobante ? 'Sube el comprobante' : (esVirtual && !pagoData.nro_comprobante.trim() ? 'Ingresa el número de operación' : 'Confirmar Pago'))}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModalReserva;
