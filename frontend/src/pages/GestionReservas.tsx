import { useEffect, useState } from 'react';
import { tieneRol, useAuth } from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import ModalReserva from '../components/canchas/ModalReserva';
import ModalCancelarReserva from '../components/canchas/ModalCancelarReserva';

type FiltroEstado = 'todas' | 'pendientes' | 'confirmada' | 'cancelada' | 'rechazada';

const obtenerEtiquetaEstado = (estado: string) => {
    const etiquetas: Record<string, string> = {
        pendiente_pago: 'Pendiente de pago',
        pendiente_verificacion: 'Pendiente de verificación',
        pagado: 'Pagado',
        rechazado: 'Rechazado',
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        cancelada: 'Cancelada',
        reembolsado: 'Reembolsado'
    };
    return etiquetas[estado] || estado.charAt(0).toUpperCase() + estado.slice(1);
};

const obtenerClaseEstado = (estado: string) => {
    if (estado === 'confirmada') return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800';
    if (estado === 'pendiente' || estado === 'pendiente_pago') return 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800';
    if (estado === 'cancelada' || estado === 'rechazada') return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800';
    return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
};

const formatearFecha = (fecha: string) =>
    new Date(`${String(fecha).slice(0, 10)}T00:00:00`).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

const GestionReservas = () => {
    const [reservas, setReservas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [fechaFiltro, setFechaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('todas');
    const [modalOpen, setModalOpen] = useState(false);
    const [reservaARevisar, setReservaARevisar] = useState<any>(null);
    const [revisionPago, setRevisionPago] = useState<any>(null);
    const [revisionCargando, setRevisionCargando] = useState(false);
    const [errorRevision, setErrorRevision] = useState('');
    const [modalRevisionOpen, setModalRevisionOpen] = useState(false);
    const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);
    const [reservaACancelar, setReservaACancelar] = useState<any>(null);
    const [cancelando, setCancelando] = useState(false);

    const { usuario } = useAuth();
    const esAdmin = tieneRol(usuario, 'admin', 'administrador');
    const esAdminOEmpleado = esAdmin || tieneRol(usuario, 'empleado');

    const cargarReservas = async () => {
        setErrorCarga('');
        try {
            const respuesta = await api.get('/reservas');
            setReservas(Array.isArray(respuesta.data?.data) ? respuesta.data.data : []);
        } catch (error) {
            console.error('Error al cargar reservas', error);
            setErrorCarga('No se pudieron cargar las reservas. Revisa la conexión e inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void cargarReservas(); }, []);

    const reservasFiltradas = reservas.filter((reserva) => {
        const termino = busqueda.trim().toLocaleLowerCase('es');
        const textoReserva = [
            reserva.id_reserva,
            reserva.cliente_nombre,
            reserva.apellido_paterno,
            reserva.cancha_nombre
        ].join(' ').toLocaleLowerCase('es');

        const coincideTexto = !termino || textoReserva.includes(termino);
        const coincideFecha = !fechaFiltro || String(reserva.fecha_reserva).slice(0, 10) === fechaFiltro;
        const coincideEstado = estadoFiltro === 'todas'
            || (estadoFiltro === 'pendientes' && ['pendiente', 'pendiente_pago'].includes(reserva.estado))
            || reserva.estado === estadoFiltro;

        return coincideTexto && coincideFecha && coincideEstado;
    });

    const cantidadPendiente = reservas.filter((reserva) => ['pendiente', 'pendiente_pago'].includes(reserva.estado)).length;
    const cantidadConfirmada = reservas.filter((reserva) => reserva.estado === 'confirmada').length;
    const cantidadCancelada = reservas.filter((reserva) => reserva.estado === 'cancelada').length;

    const filtrosActivos = Boolean(busqueda || fechaFiltro || estadoFiltro !== 'todas');
    const limpiarFiltros = () => {
        setBusqueda('');
        setFechaFiltro('');
        setEstadoFiltro('todas');
    };

    const handleAbrirCancelar = (reserva: any) => {
        setReservaACancelar(reserva);
        setIsCancelarModalOpen(true);
    };

    const handleConfirmarCancelar = async (motivo: string) => {
        if (!reservaACancelar) return;

        setCancelando(true);
        try {
            await api.put(`/reservas/${reservaACancelar.id_reserva}/cancelar`, { motivo });
            setIsCancelarModalOpen(false);
            setReservaACancelar(null);
            await cargarReservas();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al cancelar la reserva');
        } finally {
            setCancelando(false);
        }
    };

    const handleRevisarPago = async (reserva: any) => {
        setReservaARevisar(reserva);
        setRevisionPago(null);
        setErrorRevision('');
        setModalRevisionOpen(true);
        setRevisionCargando(true);
        try {
            const respuesta = await api.get(`/pagos/reserva/${reserva.id_reserva}/revision`);
            setRevisionPago(respuesta.data?.data || null);
        } catch (error: any) {
            setErrorRevision(error.response?.data?.error || 'No se pudo consultar el pago de esta reserva.');
        } finally {
            setRevisionCargando(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-claro-texto2">Cargando reservas...</div>;
    }

    return (
        <div className="min-h-full bg-claro-fondo p-4 text-claro-texto dark:bg-oscuro-fondo dark:text-oscuro-texto md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 border-b border-claro-borde pb-5 dark:border-oscuro-borde sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-claro-primario">Operaciones</p>
                        <h1 className="mt-1 text-2xl font-bold">Gestión de reservas</h1>
                        <p className="mt-1 text-sm text-claro-texto2 dark:text-oscuro-texto2">Busca, filtra y administra turnos del complejo.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-claro-primario px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-claro-hover"
                    >
                        <span aria-hidden="true">+</span>
                        {esAdminOEmpleado ? 'Reserva presencial' : 'Nueva reserva'}
                    </button>
                </header>

                <section aria-label="Resumen de reservas" className="grid grid-cols-2 border-y border-claro-borde dark:border-oscuro-borde md:grid-cols-4">
                    {[
                        { label: 'Todas', count: reservas.length, value: 'todas' as FiltroEstado, tone: 'text-claro-texto dark:text-oscuro-texto' },
                        { label: 'Pendientes', count: cantidadPendiente, value: 'pendientes' as FiltroEstado, tone: 'text-amber-700 dark:text-amber-300' },
                        { label: 'Confirmadas', count: cantidadConfirmada, value: 'confirmada' as FiltroEstado, tone: 'text-emerald-700 dark:text-emerald-300' },
                        { label: 'Canceladas', count: cantidadCancelada, value: 'cancelada' as FiltroEstado, tone: 'text-rose-700 dark:text-rose-300' }
                    ].map((indicador) => (
                        <button
                            key={indicador.value}
                            type="button"
                            onClick={() => setEstadoFiltro(indicador.value)}
                            aria-pressed={estadoFiltro === indicador.value}
                            className={`border-b border-r border-claro-borde px-4 py-3 text-left transition hover:bg-claro-tinte dark:border-oscuro-borde dark:hover:bg-oscuro-tinte md:border-b-0 ${estadoFiltro === indicador.value ? 'bg-claro-tinte/70 dark:bg-oscuro-tinte/70' : ''}`}
                        >
                            <span className="block text-xs font-medium text-claro-texto2 dark:text-oscuro-texto2">{indicador.label}</span>
                            <span className={`mt-1 block text-2xl font-semibold tabular-nums ${indicador.tone}`}>{indicador.count}</span>
                        </button>
                    ))}
                </section>

                <section aria-label="Filtros de reservas" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_190px_auto]">
                    <label className="sr-only" htmlFor="buscar-reservas">Buscar reserva</label>
                    <input
                        id="buscar-reservas"
                        type="search"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                        placeholder="Buscar por cliente, cancha o número"
                        className="min-w-0 rounded-lg border border-claro-borde bg-claro-tarjeta px-3 py-2.5 text-sm outline-none transition placeholder:text-claro-texto2 focus:border-claro-primario dark:border-oscuro-borde dark:bg-oscuro-tarjeta"
                    />
                    <label className="sr-only" htmlFor="filtrar-fecha">Filtrar por fecha</label>
                    <input
                        id="filtrar-fecha"
                        type="date"
                        value={fechaFiltro}
                        onChange={(event) => setFechaFiltro(event.target.value)}
                        className="rounded-lg border border-claro-borde bg-claro-tarjeta px-3 py-2.5 text-sm outline-none transition focus:border-claro-primario dark:border-oscuro-borde dark:bg-oscuro-tarjeta"
                    />
                    <label className="sr-only" htmlFor="filtrar-estado">Filtrar por estado</label>
                    <select
                        id="filtrar-estado"
                        value={estadoFiltro}
                        onChange={(event) => setEstadoFiltro(event.target.value as FiltroEstado)}
                        className="rounded-lg border border-claro-borde bg-claro-tarjeta px-3 py-2.5 text-sm outline-none transition focus:border-claro-primario dark:border-oscuro-borde dark:bg-oscuro-tarjeta"
                    >
                        <option value="todas">Todos los estados</option>
                        <option value="pendientes">Pendientes</option>
                        <option value="confirmada">Confirmadas</option>
                        <option value="cancelada">Canceladas</option>
                        <option value="rechazada">Rechazadas</option>
                    </select>
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        disabled={!filtrosActivos}
                        className="rounded-lg border border-claro-borde px-4 py-2.5 text-sm font-medium text-claro-texto2 transition hover:border-claro-primario hover:text-claro-primario disabled:cursor-not-allowed disabled:opacity-40 dark:border-oscuro-borde"
                    >
                        Limpiar filtros
                    </button>
                </section>

                {errorCarga && (
                    <div role="alert" className="flex flex-col justify-between gap-3 border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center">
                        <span>{errorCarga}</span>
                        <button type="button" onClick={() => void cargarReservas()} className="font-semibold underline">Reintentar</button>
                    </div>
                )}

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold">Reservas</h2>
                    <p className="text-sm text-claro-texto2 dark:text-oscuro-texto2">
                        {reservasFiltradas.length} de {reservas.length} resultados
                    </p>
                </div>

                {reservasFiltradas.length === 0 ? (
                    <div className="border-y border-claro-borde py-12 text-center dark:border-oscuro-borde">
                        <p className="font-semibold">{reservas.length ? 'No hay reservas que coincidan con los filtros' : 'Todavía no hay reservas'}</p>
                        <p className="mt-1 text-sm text-claro-texto2 dark:text-oscuro-texto2">
                            {reservas.length ? 'Cambia los criterios o limpia los filtros.' : 'Las nuevas reservas aparecerán aquí.'}
                        </p>
                        {filtrosActivos && (
                            <button type="button" onClick={limpiarFiltros} className="mt-3 text-sm font-semibold text-claro-primario hover:underline">Limpiar filtros</button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto border-y border-claro-borde dark:border-oscuro-borde">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-claro-tinte/70 text-xs uppercase text-claro-texto2 dark:bg-oscuro-tinte/70 dark:text-oscuro-texto2">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Cancha</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Horario</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                                    <th scope="col" className="px-4 py-3 font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservasFiltradas.map((reserva) => (
                                    <tr key={reserva.id_reserva} className="border-t border-claro-borde transition-colors hover:bg-claro-tinte/40 dark:border-oscuro-borde dark:hover:bg-oscuro-tinte/40">
                                        <td className="px-4 py-3.5 font-medium">
                                            {reserva.cliente_nombre} {reserva.apellido_paterno}
                                            <span className="mt-0.5 block text-xs font-normal text-claro-texto2 dark:text-oscuro-texto2">Reserva #{reserva.id_reserva}</span>
                                        </td>
                                        <td className="px-4 py-3.5">{reserva.cancha_nombre}</td>
                                        <td className="px-4 py-3.5">{formatearFecha(reserva.fecha_reserva)}</td>
                                        <td className="whitespace-nowrap px-4 py-3.5">{String(reserva.hora_inicio).slice(0, 5)} - {String(reserva.hora_fin).slice(0, 5)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${obtenerClaseEstado(reserva.estado)}`}>
                                                {obtenerEtiquetaEstado(reserva.estado)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-wrap gap-2">
                                                {esAdminOEmpleado && (
                                                    <button type="button" onClick={() => void handleRevisarPago(reserva)} className="rounded-md border border-claro-borde px-2.5 py-1.5 text-xs font-semibold transition hover:border-claro-primario hover:text-claro-primario dark:border-oscuro-borde">
                                                        Revisar pago
                                                    </button>
                                                )}
                                                {reserva.estado !== 'cancelada' && reserva.estado !== 'rechazada' && (
                                                    <button type="button" onClick={() => handleAbrirCancelar(reserva)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40">
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ModalReserva
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={cargarReservas}
                esPresencial={esAdminOEmpleado}
                cancha={null}
            />

            <ModalCancelarReserva
                isOpen={isCancelarModalOpen}
                onClose={() => {
                    setIsCancelarModalOpen(false);
                    setReservaACancelar(null);
                }}
                onConfirm={handleConfirmarCancelar}
                reserva={reservaACancelar}
                cargando={cancelando}
            />

            {modalRevisionOpen && reservaARevisar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setModalRevisionOpen(false)}>
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-revision-pago"
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-claro-borde bg-claro-tarjeta shadow-2xl dark:border-oscuro-borde dark:bg-oscuro-tarjeta"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="flex items-start justify-between border-b border-claro-borde px-5 py-4 dark:border-oscuro-borde">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-claro-primario">Reserva #{reservaARevisar.id_reserva}</p>
                                <h2 id="titulo-revision-pago" className="mt-1 text-xl font-bold">Revisión de pago</h2>
                            </div>
                            <button type="button" onClick={() => setModalRevisionOpen(false)} aria-label="Cerrar revisión" className="rounded-md px-2 py-1 text-xl text-claro-texto2 hover:bg-claro-tinte dark:hover:bg-oscuro-tinte">×</button>
                        </header>

                        <div className="space-y-4 p-5">
                            <div className="grid grid-cols-2 gap-3 rounded-lg bg-claro-fondo p-4 text-sm dark:bg-oscuro-fondo">
                                <div>
                                    <p className="text-xs text-claro-texto2">Cliente</p>
                                    <p className="font-semibold">{reservaARevisar.cliente_nombre} {reservaARevisar.apellido_paterno}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-claro-texto2">Cancha</p>
                                    <p className="font-semibold">{reservaARevisar.cancha_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-claro-texto2">Fecha y horario</p>
                                    <p className="font-semibold">{formatearFecha(reservaARevisar.fecha_reserva)} · {String(reservaARevisar.hora_inicio).slice(0, 5)}-{String(reservaARevisar.hora_fin).slice(0, 5)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-claro-texto2">Estado de reserva</p>
                                    <p className="font-semibold">{obtenerEtiquetaEstado(reservaARevisar.estado)}</p>
                                </div>
                            </div>

                            {revisionCargando ? (
                                <p className="py-6 text-center text-sm text-claro-texto2">Consultando registro de pago...</p>
                            ) : errorRevision ? (
                                <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{errorRevision}</div>
                            ) : revisionPago?.pago ? (
                                <>
                                    <div className="flex items-center justify-between rounded-lg border border-claro-borde p-4 dark:border-oscuro-borde">
                                        <div>
                                            <p className="text-xs text-claro-texto2">Pago registrado</p>
                                            <p className="mt-1 text-xl font-bold">Bs. {Number(revisionPago.pago.monto).toFixed(2)}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${revisionPago.pago.estado === 'pagado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : revisionPago.pago.estado === 'rechazado' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                            {obtenerEtiquetaEstado(revisionPago.pago.estado)}
                                        </span>
                                    </div>
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                        <div><dt className="text-xs text-claro-texto2">Método</dt><dd className="mt-1 font-medium">{revisionPago.pago.metodo_pago}</dd></div>
                                        <div><dt className="text-xs text-claro-texto2">Fecha de registro</dt><dd className="mt-1 font-medium">{revisionPago.pago.fecha_pago ? new Date(revisionPago.pago.fecha_pago).toLocaleString('es-BO') : 'No disponible'}</dd></div>
                                        <div><dt className="text-xs text-claro-texto2">Referencia de reserva</dt><dd className="mt-1 font-medium">{revisionPago.pago.referencia_pasarela || `RES-${reservaARevisar.id_reserva}`}</dd></div>
                                        <div><dt className="text-xs text-claro-texto2">N.º de operación</dt><dd className="mt-1 font-medium">{revisionPago.pago.nro_comprobante || 'No indicado'}</dd></div>
                                    </dl>
                                    {revisionPago.pago.comprobante_url ? (
                                        <a
                                            href={`${API_URL.replace(/\/api\/?$/, '')}${revisionPago.pago.comprobante_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex rounded-lg bg-claro-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-claro-hover"
                                        >
                                            Ver comprobante
                                        </a>
                                    ) : (
                                        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">No hay comprobante adjunto.</p>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-lg border border-dashed border-claro-borde p-6 text-center dark:border-oscuro-borde">
                                    <p className="font-semibold">No hay pago registrado</p>
                                    <p className="mt-1 text-sm text-claro-texto2">Esta reserva todavía no tiene un pago asociado.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default GestionReservas;