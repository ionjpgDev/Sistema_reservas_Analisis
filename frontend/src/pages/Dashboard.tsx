import { tieneRol, useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { usuario } = useAuth();

    // Obtener saludo según hora local
    const getSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return 'Buenos días';
        if (hora < 19) return 'Buenas tardes';
        return 'Buenas noches';
    };

    // Fecha actual formateada
    const fechaFormateada = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const esAdmin = tieneRol(usuario, 'administrador', 'admin');
    const esEmpleado = tieneRol(usuario, 'empleado');
    const esCliente = !esAdmin && !esEmpleado;

    return (
        <div className="space-y-8 pb-10">
            {/* =========================================================
                1. HERO BANNER EJECUTIVO CON ACCESO DIRECTO AL HOME
               ========================================================= */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1C3034] via-[#152326] to-[#261211] p-8 md:p-10 text-white shadow-xl border border-white/10">
                {/* Elementos decorativos de fondo con glassmorphism */}
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#1C3034]/40 blur-3xl pointer-events-none" />
                <div className="absolute right-32 -bottom-20 w-72 h-72 rounded-full bg-[#261211]/35 blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 text-[#F1EADA]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Sesión Activa
                            </span>
                            <span className="text-xs uppercase tracking-wider text-slate-300 capitalize font-medium">
                                📅 {fechaFormateada}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F1EADA]">
                            {getSaludo()}, {usuario?.nombre || 'Usuario'} 👋
                        </h1>

                        <p className="text-slate-300 text-base md:text-lg max-w-xl font-normal">
                            Panel de control para <span className="font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-4">{usuario?.rol || 'Usuario'}</span>. Supervisa reservas, canchas y actividades en tiempo real.
                        </p>
                    </div>

                    {/* Botones de Acción Destacada: Retorno al Home + Exploración rápida */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-[#F1EADA] font-semibold text-sm backdrop-blur-md transition-all hover:scale-105 shadow-md"
                            title="Volver a la Página Principal (Home)"
                        >
                            <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Volver al Home</span>
                        </Link>

                        <Link
                            to="/canchas"
                            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-[#F1EADA] font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-950/40"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Explorar Canchas</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* =========================================================
                2. MÉTRICAS KPI RÁPIDAS
               ========================================================= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-claro-texto2 dark:text-oscuro-texto2">Canchas</span>
                        <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">🏟️</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-claro-texto dark:text-oscuro-texto">Disponibles</div>
                    <p className="text-xs text-claro-texto2 dark:text-oscuro-texto2 mt-1">Horario 06:00 - 23:30</p>
                </div>

                <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-claro-texto2 dark:text-oscuro-texto2">Reservas</span>
                        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">📅</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-claro-texto dark:text-oscuro-texto">En Tiempo Real</div>
                    <p className="text-xs text-claro-texto2 dark:text-oscuro-texto2 mt-1">Confirmación al instante</p>
                </div>

                <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-claro-texto2 dark:text-oscuro-texto2">Eventos</span>
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">🏆</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-claro-texto dark:text-oscuro-texto">Torneos</div>
                    <p className="text-xs text-claro-texto2 dark:text-oscuro-texto2 mt-1">Inscripciones abiertas</p>
                </div>

                <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-claro-texto2 dark:text-oscuro-texto2">Pagos QR</span>
                        <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">💳</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-claro-texto dark:text-oscuro-texto">Digitales</div>
                    <p className="text-xs text-claro-texto2 dark:text-oscuro-texto2 mt-1">Verificación segura</p>
                </div>
            </div>

            {/* =========================================================
                3. GRID DE MÓDULOS Y FUNCIONALIDADES
               ========================================================= */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-claro-texto dark:text-oscuro-texto">
                            Módulos de Gestión
                        </h2>
                        <p className="text-sm text-claro-texto2 dark:text-oscuro-texto2">
                            Selecciona una opción para comenzar a operar.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* --- MÓDULOS DE ADMINISTRADOR --- */}
                    {esAdmin && (
                        <>
                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Gestión de Usuarios</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">Admin</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Administra roles, clientes, empleados y permisos del complejo deportivo.
                                    </p>
                                </div>
                                <Link 
                                    to="/panel-admin" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir al Panel de Usuarios</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Gestión de Canchas</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Catálogo</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Crea, edita tarifas, supervisa el estado operativo y agenda de todas las canchas.
                                    </p>
                                </div>
                                <Link 
                                    to="/canchas" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Administrar Canchas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Verificar Pagos</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Finanzas</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Revisa los comprobantes QR virtuales, aprueba o rechaza pagos pendientes.
                                    </p>
                                </div>
                                <Link 
                                    to="/verificar-pagos" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir a Verificación de Pagos</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Gestión de Reservas</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Agenda</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Visualiza, modifica y cancela las reservas de los usuarios en tiempo real.
                                    </p>
                                </div>
                                <Link 
                                    to="/gestion-reservas" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Gestionar Reservas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Gestión de Eventos</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">Torneos</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Programa torneos, asigna canchas y coordina servicios para eventos deportivos.
                                    </p>
                                </div>
                                <Link 
                                    to="/gestion-eventos" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir a Gestión de Eventos</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Reportes y Métricas</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Análisis</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Analiza ocupación, ingresos por disciplina y comportamiento de reservas.
                                    </p>
                                </div>
                                <Link 
                                    to="/reportes" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ver Estadísticas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </>
                    )}

                    {/* --- MÓDULOS DE EMPLEADO --- */}
                    {esEmpleado && (
                        <>
                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto mb-2">Verificar Pagos</h3>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Aprueba o rechaza pagos virtuales pendientes de los clientes de manera rápida.
                                    </p>
                                </div>
                                <Link 
                                    to="/verificar-pagos" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir a Verificación de Pagos</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto mb-2">Gestión de Reservas</h3>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Supervisa la agenda diaria, atiende a los clientes y gestiona cambios.
                                    </p>
                                </div>
                                <Link 
                                    to="/gestion-reservas" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir a Gestión de Reservas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto mb-2">Gestión de Eventos</h3>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Consulta los eventos programados en el complejo y asiste a participantes.
                                    </p>
                                </div>
                                <Link 
                                    to="/gestion-eventos" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ir a Gestión de Eventos</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </>
                    )}

                    {/* --- MÓDULOS DE CLIENTE / USUARIO --- */}
                    {esCliente && (
                        <>
                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Reservar Cancha</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">En vivo</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Explora disponibilidad en tiempo real, elige tu horario y agenda tu próximo partido.
                                    </p>
                                </div>
                                <Link 
                                    to="/canchas" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Explorar Canchas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Mis Reservas</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">Historial</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Revisa tus turnos agendados, cancela o modifica reservas y consulta tus pagos.
                                    </p>
                                </div>
                                <Link 
                                    to="/reservas" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ver Mis Reservas</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Torneos & Eventos</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Activo</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Descubre los torneos oficiales, competencias de fin de semana e inscríbete.
                                    </p>
                                </div>
                                <Link 
                                    to="/eventos" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Explorar Eventos</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="group bg-claro-tarjeta dark:bg-oscuro-tarjeta p-6 rounded-3xl border border-claro-borde dark:border-oscuro-borde shadow-sm hover:shadow-xl hover:border-claro-primario/40 dark:hover:border-oscuro-primario/40 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-claro-texto dark:text-oscuro-texto">Mis Inscripciones</h3>
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">Mis Torneos</span>
                                    </div>
                                    <p className="text-claro-texto2 dark:text-oscuro-texto2 text-sm leading-relaxed mb-6">
                                        Consulta los eventos a los que te inscribiste y los detalles de cada partido.
                                    </p>
                                </div>
                                <Link 
                                    to="/mis-inscripciones" 
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-center bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Ver Inscripciones</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* =========================================================
                4. BARRA INFORMATIVA DEL COMPLEJO Y ACCESOS RÁPIDOS
               ========================================================= */}
            <div className="rounded-3xl bg-claro-tarjeta dark:bg-oscuro-tarjeta border border-claro-borde dark:border-oscuro-borde p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-claro-primario/10 dark:bg-oscuro-primario/10 text-claro-primario dark:text-oscuro-primario flex items-center justify-center text-xl shrink-0">
                        ⚡
                    </div>
                    <div>
                        <h4 className="font-bold text-claro-texto dark:text-oscuro-texto">
                            Complejo Deportivo SportPlex
                        </h4>
                        <p className="text-xs text-claro-texto2 dark:text-oscuro-texto2">
                            Abierto de Lunes a Domingo de 06:00 a 23:30 · Canchas con césped de última generación e iluminación LED.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        to="/perfil"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-claro-tinte hover:bg-claro-primario hover:text-white dark:bg-oscuro-tinte dark:hover:bg-oscuro-primario dark:hover:text-oscuro-fondo text-claro-primario dark:text-oscuro-primario transition-all"
                    >
                        Mi Perfil
                    </Link>
                    <Link
                        to="/"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                    >
                        🌐 Ver Landing Page
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;