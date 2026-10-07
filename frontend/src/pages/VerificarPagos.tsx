import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tieneRol, useAuth } from '../context/AuthContext';
import api from '../services/api';

interface PagoPendiente {
    id_pago: number;
    id_reserva: number;
    monto: string;
    metodo_pago: string;
    estado: string;
    fecha_pago: string;
    comprobante_url: string | null;
    referencia_pasarela: string | null;
    nro_comprobante: string | null;
    motivo_rechazo?: string | null;
    nombre: string;
    apellido_paterno: string;
    correo: string;
    cancha_nombre: string;
    fecha_reserva: string;
    hora_inicio: string;
    hora_fin: string;
}

const VerificarPagos = () => {
    const { usuario, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [pagos, setPagos] = useState<PagoPendiente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoPendiente | null>(null);
    const [pagoARechazar, setPagoARechazar] = useState<PagoPendiente | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [procesandoId, setProcesandoId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const isAdmin = tieneRol(usuario, 'administrador', 'admin');
        const esEmpleado = tieneRol(usuario, 'empleado');
        if (!isAdmin && !esEmpleado) {
            navigate('/dashboard');
            return;
        }

        cargarPagosPendientes();
    }, [isAuthenticated, usuario, navigate]);

    const cargarPagosPendientes = async () => {
        setCargando(true);
        try {
            const res = await api.get('/pagos/pendientes');
            setPagos(res.data?.data || res.data || []);
        } catch (err: any) {
            console.error('Error al cargar pagos:', err);
            setError('Error al cargar los pagos pendientes');
        } finally {
            setCargando(false);
        }
    };

    const handleVerificar = async (id_pago: number, estado: 'pagado' | 'rechazado', motivo?: string) => {
        setProcesandoId(id_pago);
        try {
            await api.patch(`/pagos/verificar/${id_pago}`, { estado, motivo_rechazo: motivo });
            setMensaje(estado === 'pagado' ? 'Pago aprobado y reserva confirmada' : 'Pago rechazado');
            setPagos(prev => prev.filter(p => p.id_pago !== id_pago));
            setPagoARechazar(null);
            setMotivoRechazo('');
            setTimeout(() => setMensaje(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al verificar el pago');
            setTimeout(() => setError(''), 3000);
        } finally {
            setProcesandoId(null);
        }
    };

    const verComprobante = (pago: PagoPendiente) => {
        setPagoSeleccionado(pago);
        setModalOpen(true);
    };

    const getMetodoLabel = (metodo: string) => {
        const labels: Record<string, string> = {
            presencial: '🏢 Presencial',
            tarjeta_debito: '💳 Tarjeta Débito',
            tarjeta_credito: '💎 Tarjeta Crédito',
            qr: '📱 QR',
            transferencia: '🏦 Transferencia'
        };
        return labels[metodo] || metodo;
    };

    const isAdmin = tieneRol(usuario, 'administrador', 'admin');

    if (cargando) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-claro-primario border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-claro-texto2 dark:text-oscuro-texto2">Cargando pagos pendientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-claro-fondo p-6 text-claro-texto dark:bg-oscuro-fondo dark:text-oscuro-texto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-claro-texto dark:text-oscuro-texto mb-2">
                        ️ Verificar Pagos
                    </h1>
                    <p className="text-claro-texto2 dark:text-oscuro-texto2">
                        {isAdmin ? 'Gestiona los pagos pendientes de verificación' : 'Pagos pendientes de verificación'}
                    </p>
                    <p className="mt-2 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        Abre el comprobante y compara el monto, la referencia y el número de operación. Confirma el abono en la cuenta bancaria antes de marcarlo como recibido; esta acción registra tu verificación, no consulta el banco automáticamente.
                    </p>
                </div>

                {mensaje && (
                    <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                        {error}
                    </div>
                )}

                {pagos.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-6xl mb-4 block">✅</span>
                        <h3 className="text-xl font-semibold text-claro-texto dark:text-oscuro-texto mb-2">
                            No hay pagos pendientes
                        </h3>
                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Todos los pagos han sido verificados</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pagos.map((pago) => (
                            <div key={pago.id_pago} className="bg-claro-tarjeta dark:bg-oscuro-tarjeta rounded-xl shadow-md border border-claro-borde dark:border-oscuro-borde overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-bold text-claro-texto dark:text-oscuro-texto">
                                                    {pago.nombre} {pago.apellido_paterno}
                                                </span>
                                                <span className="text-sm bg-claro-primario/10 text-claro-primario dark:text-oscuro-primario px-3 py-1 rounded-full">
                                                    {getMetodoLabel(pago.metodo_pago)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-claro-texto2 dark:text-oscuro-texto2 mb-3">{pago.correo}</p>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-claro-texto2 dark:text-oscuro-texto2">Cancha</p>
                                                    <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pago.cancha_nombre}</p>
                                                </div>
                                                <div>
                                                    <p className="text-claro-texto2 dark:text-oscuro-texto2">Fecha</p>
                                                    <p className="font-medium text-claro-texto dark:text-oscuro-texto">{new Date(pago.fecha_reserva).toLocaleDateString('es-ES')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-claro-texto2 dark:text-oscuro-texto2">Horario</p>
                                                    <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pago.hora_inicio?.slice(0,5)} - {pago.hora_fin?.slice(0,5)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-claro-texto2 dark:text-oscuro-texto2">Monto</p>
                                                    <p className="font-bold text-claro-primario dark:text-oscuro-primario text-lg">Bs. {parseFloat(pago.monto).toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-claro-texto2 dark:text-oscuro-texto2">
                                                <span>Referencia de reserva: <strong className="font-semibold text-claro-texto dark:text-oscuro-texto">{pago.referencia_pasarela || `RES-${pago.id_reserva}`}</strong></span>
                                                <span>N.º de operación: <strong className="font-semibold text-claro-texto dark:text-oscuro-texto">{pago.nro_comprobante || 'No indicado'}</strong></span>
                                                <span>Registrado: {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleString('es-BO') : 'No disponible'}</span>
                                            </div>
                                            {!pago.comprobante_url && (
                                                <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                                                    Sin comprobante: no se puede aprobar este pago.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 lg:items-end">
                                            {pago.comprobante_url && (
                                                <button
                                                    onClick={() => verComprobante(pago)}
                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                >
                                                     Ver Comprobante
                                                </button>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setPagoARechazar(pago);
                                                        setMotivoRechazo('');
                                                    }}
                                                    disabled={procesandoId === pago.id_pago}
                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {procesandoId === pago.id_pago ? 'Guardando...' : 'Rechazar'}
                                                </button>
                                                <button
                                                    onClick={() => handleVerificar(pago.id_pago, 'pagado')}
                                                    disabled={procesandoId === pago.id_pago || !pago.comprobante_url}
                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {procesandoId === pago.id_pago ? 'Guardando...' : 'Confirmar pago recibido'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && pagoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-claro-borde dark:border-oscuro-borde">
                            <h3 className="text-xl font-semibold text-claro-texto dark:text-oscuro-texto">
                                Comprobante de Pago
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-claro-texto2 hover:text-claro-texto dark:text-oscuro-texto2 dark:hover:text-oscuro-texto">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {pagoSeleccionado.comprobante_url?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                <img 
                                    src={`http://localhost:4000${pagoSeleccionado.comprobante_url}`} 
                                    alt="Comprobante" 
                                    className="w-full rounded-lg"
                                />
                            ) : (
                                <div className="text-center">
                                    <span className="text-5xl mb-4 block">📄</span>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 mb-4">Este es un archivo PDF</p>
                                    <a 
                                        href={`http://localhost:4000${pagoSeleccionado.comprobante_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-claro-primario text-white rounded-lg hover:bg-claro-hover transition-colors inline-block"
                                    >
                                         Abrir PDF
                                    </a>
                                </div>
                            )}
                            <div className="mt-6 p-4 bg-claro-fondo dark:bg-oscuro-fondo rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Cliente</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pagoSeleccionado.nombre} {pagoSeleccionado.apellido_paterno}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Monto</p>
                                        <p className="font-medium text-claro-primario dark:text-oscuro-primario">Bs. {parseFloat(pagoSeleccionado.monto).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Método</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{getMetodoLabel(pagoSeleccionado.metodo_pago)}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Fecha</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{new Date(pagoSeleccionado.fecha_reserva).toLocaleDateString('es-ES')}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Referencia de reserva</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pagoSeleccionado.referencia_pasarela || `RES-${pagoSeleccionado.id_reserva}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">N.º de operación del comprobante</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pagoSeleccionado.nro_comprobante || 'No indicado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-claro-texto2 dark:text-oscuro-texto2">Registrado</p>
                                        <p className="font-medium text-claro-texto dark:text-oscuro-texto">{pagoSeleccionado.fecha_pago ? new Date(pagoSeleccionado.fecha_pago).toLocaleString('es-BO') : 'No disponible'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {pagoARechazar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setPagoARechazar(null)}>
                    <form
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-rechazar-pago"
                        className="w-full max-w-lg rounded-xl border border-claro-borde bg-claro-tarjeta p-6 shadow-2xl dark:border-oscuro-borde dark:bg-oscuro-tarjeta"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleVerificar(pagoARechazar.id_pago, 'rechazado', motivoRechazo.trim());
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="titulo-rechazar-pago" className="text-lg font-bold text-claro-texto dark:text-oscuro-texto">Rechazar pago #{pagoARechazar.id_pago}</h2>
                        <p className="mt-1 text-sm text-claro-texto2 dark:text-oscuro-texto2">El cliente verá este motivo y podrá corregir el pago.</p>
                        <label className="mt-4 block text-sm font-medium text-claro-texto dark:text-oscuro-texto" htmlFor="motivo-rechazo">Motivo del rechazo</label>
                        <textarea
                            id="motivo-rechazo"
                            value={motivoRechazo}
                            onChange={(event) => setMotivoRechazo(event.target.value)}
                            minLength={5}
                            maxLength={500}
                            required
                            rows={4}
                            placeholder="Ej. El monto del comprobante no coincide con el total de la reserva."
                            className="mt-1 w-full rounded-lg border border-claro-borde bg-transparent p-3 text-sm dark:border-oscuro-borde"
                        />
                        <p className="mt-1 text-right text-xs text-claro-texto2 dark:text-oscuro-texto2">{motivoRechazo.trim().length}/500</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setPagoARechazar(null)} className="rounded-lg border border-claro-borde px-4 py-2 text-sm font-semibold dark:border-oscuro-borde">Volver</button>
                            <button type="submit" disabled={motivoRechazo.trim().length < 5 || procesandoId === pagoARechazar.id_pago} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                {procesandoId === pagoARechazar.id_pago ? 'Guardando...' : 'Confirmar rechazo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VerificarPagos;
