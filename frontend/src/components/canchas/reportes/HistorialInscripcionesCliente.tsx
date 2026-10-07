import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface Inscripcion {
    id_inscripcion: number;
    id_evento: number;
    nombre_evento: string;
    descripcion: string | null;
    hora_inicio: string;
    hora_fin: string;
    tipo_evento: string | null;
    fecha_inscripcion: string;
    estado_inscripcion: string;
    estado_evento: string;
}

const HistorialInscripcionesCliente = () => {
    const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    // Filtros
    const [tipoEventoFiltro, setTipoEventoFiltro] = useState<string>("");
    const [estadoInscripcionFiltro, setEstadoInscripcionFiltro] =
        useState<string>("");
    const [estadoEventoFiltro, setEstadoEventoFiltro] =
        useState<string>("");

    useEffect(() => {
        const obtenerInscripciones = async () => {
            try {
                setCargando(true);
                setError("");

                const response = await api.get(
                    "/reportes/historial-inscripciones"
                );

                setInscripciones(response.data.data);
            } catch (error) {
                console.error(
                    "Error al obtener historial de inscripciones:",
                    error
                );

                setError(
                    "No se pudo cargar el historial de inscripciones."
                );
            } finally {
                setCargando(false);
            }
        };

        obtenerInscripciones();
    }, []);

    const formatearFechaHora = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatearEstado = (estado: string) => {
        return estado.charAt(0).toUpperCase() + estado.slice(1);
    };

    // Opciones únicas para los filtros
    const tiposEvento = useMemo(() => {
        return [
            ...new Set(
                inscripciones
                    .map((inscripcion) => inscripcion.tipo_evento)
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }, [inscripciones]);

    const estadosInscripcion = useMemo(() => {
        return [
            ...new Set(
                inscripciones.map(
                    (inscripcion) =>
                        inscripcion.estado_inscripcion
                )
            ),
        ]
            .filter(Boolean)
            .sort();
    }, [inscripciones]);

    const estadosEvento = useMemo(() => {
        return [
            ...new Set(
                inscripciones.map(
                    (inscripcion) => inscripcion.estado_evento
                )
            ),
        ]
            .filter(Boolean)
            .sort();
    }, [inscripciones]);

    // Aplicar filtros
    const inscripcionesFiltradas = useMemo(() => {
        return inscripciones.filter((inscripcion) => {
            const cumpleTipo =
                !tipoEventoFiltro ||
                inscripcion.tipo_evento === tipoEventoFiltro;

            const cumpleEstadoInscripcion =
                !estadoInscripcionFiltro ||
                inscripcion.estado_inscripcion ===
                    estadoInscripcionFiltro;

            const cumpleEstadoEvento =
                !estadoEventoFiltro ||
                inscripcion.estado_evento === estadoEventoFiltro;

            return (
                cumpleTipo &&
                cumpleEstadoInscripcion &&
                cumpleEstadoEvento
            );
        });
    }, [
        inscripciones,
        tipoEventoFiltro,
        estadoInscripcionFiltro,
        estadoEventoFiltro,
    ]);

    const limpiarFiltros = () => {
        setTipoEventoFiltro("");
        setEstadoInscripcionFiltro("");
        setEstadoEventoFiltro("");
    };

    // =========================
    // EXPORTAR EXCEL
    // =========================
    const exportarExcel = () => {
        const datos = inscripcionesFiltradas.map((inscripcion) => ({
            "Evento": inscripcion.nombre_evento,
            "Hora inicio": inscripcion.hora_inicio,
            "Hora fin": inscripcion.hora_fin,
            "Tipo de evento":
                inscripcion.tipo_evento || "—",
            "Fecha de inscripción": formatearFechaHora(
                inscripcion.fecha_inscripcion
            ),
            "Estado inscripción":
                formatearEstado(
                    inscripcion.estado_inscripcion
                ),
            "Estado evento":
                formatearEstado(
                    inscripcion.estado_evento
                ),
        }));

        const hoja = XLSX.utils.json_to_sheet(datos);

        const libro = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            libro,
            hoja,
            "Mis Inscripciones"
        );

        XLSX.writeFile(
            libro,
            "historial-inscripciones.xlsx"
        );
    };

    // =========================
    // EXPORTAR PDF
    // =========================
    const exportarPDF = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        doc.setFontSize(18);
        doc.text(
            "Historial de Inscripciones",
            14,
            18
        );

        doc.setFontSize(10);
        doc.text(
            `Total de inscripciones: ${inscripcionesFiltradas.length}`,
            14,
            26
        );

        let y = 36;

        doc.setFontSize(9);

        // Encabezados
        doc.text("Evento", 14, y);
        doc.text("Horario", 105, y);
        doc.text("Tipo", 140, y);
        doc.text("Fecha inscripción", 175, y);
        doc.text("Estado inscripción", 215, y);
        doc.text("Estado evento", 255, y);

        y += 7;

        inscripcionesFiltradas.forEach((inscripcion) => {
            if (y > 190) {
                doc.addPage();
                y = 20;

                doc.setFontSize(9);

                doc.text("Evento", 14, y);
                doc.text("Horario", 105, y);
                doc.text("Tipo", 140, y);
                doc.text("Fecha inscripción", 175, y);
                doc.text(
                    "Estado inscripción",
                    215,
                    y
                );
                doc.text(
                    "Estado evento",
                    255,
                    y
                );

                y += 7;
            }

            doc.text(
                inscripcion.nombre_evento.substring(
                    0,
                    30
                ),
                14,
                y
            );

           
            doc.text(
                `${inscripcion.hora_inicio} - ${inscripcion.hora_fin}`,
                105,
                y
            );

            doc.text(
                (inscripcion.tipo_evento || "—").substring(
                    0,
                    18
                ),
                140,
                y
            );

            doc.text(
                formatearFechaHora(
                    inscripcion.fecha_inscripcion
                ),
                175,
                y
            );

            doc.text(
                formatearEstado(
                    inscripcion.estado_inscripcion
                ),
                215,
                y
            );

            doc.text(
                formatearEstado(
                    inscripcion.estado_evento
                ),
                255,
                y
            );

            y += 7;
        });

        doc.save(
            "historial-inscripciones.pdf"
        );
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center py-10">
                <p className="text-gray-600 dark:text-gray-300">
                    Cargando historial de inscripciones...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Historial de Inscripciones
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Consulta y filtra tus inscripciones a eventos.
                </p>
            </div>

            {/* FILTROS */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow p-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    🔎 Filtrar inscripciones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tipo de evento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de evento
                        </label>

                        <select
                            value={tipoEventoFiltro}
                            onChange={(e) =>
                                setTipoEventoFiltro(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                            <option value="">
                                Todos los tipos
                            </option>

                            {tiposEvento.map((tipo) => (
                                <option
                                    key={tipo}
                                    value={tipo}
                                >
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estado inscripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado de inscripción
                        </label>

                        <select
                            value={estadoInscripcionFiltro}
                            onChange={(e) =>
                                setEstadoInscripcionFiltro(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                            <option value="">
                                Todos los estados
                            </option>

                            {estadosInscripcion.map(
                                (estado) => (
                                    <option
                                        key={estado}
                                        value={estado}
                                    >
                                        {formatearEstado(
                                            estado
                                        )}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Estado evento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado del evento
                        </label>

                        <select
                            value={estadoEventoFiltro}
                            onChange={(e) =>
                                setEstadoEventoFiltro(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                            <option value="">
                                Todos los estados
                            </option>

                            {estadosEvento.map((estado) => (
                                <option
                                    key={estado}
                                    value={estado}
                                >
                                    {formatearEstado(
                                        estado
                                    )}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 mt-5">
                    <button
                        onClick={limpiarFiltros}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition"
                    >
                        ↄ Limpiar filtros
                    </button>

                    <button
                        onClick={exportarPDF}
                        disabled={
                            inscripcionesFiltradas.length === 0
                        }
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition"
                    >
                        📄 PDF
                    </button>

                    <button
                        onClick={exportarExcel}
                        disabled={
                            inscripcionesFiltradas.length === 0
                        }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition"
                    >
                        📊 Excel
                    </button>
                </div>
            </div>

            {/* RESULTADOS */}
            {inscripcionesFiltradas.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                        No se encontraron inscripciones con
                        los filtros seleccionados.
                    </p>
                </div>
            ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow">
                    <div className="px-5 py-4 border-b dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Mostrando{" "}
                            <strong>
                                {inscripcionesFiltradas.length}
                            </strong>{" "}
                            de{" "}
                            <strong>
                                {inscripciones.length}
                            </strong>{" "}
                            inscripciones.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Evento
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Horario
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Tipo
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Fecha inscripción
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Estado
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Evento
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {inscripcionesFiltradas.map(
                                    (inscripcion) => (
                                        <tr
                                            key={
                                                inscripcion.id_inscripcion
                                            }
                                            className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-white">
                                                        {
                                                            inscripcion.nombre_evento
                                                        }
                                                    </p>

                                                    {inscripcion.descripcion && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {
                                                                inscripcion.descripcion
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {
                                                    inscripcion.hora_inicio
                                                }{" "}
                                                -{" "}
                                                {
                                                    inscripcion.hora_fin
                                                }
                                            </td>

                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {inscripcion.tipo_evento ||
                                                    "—"}
                                            </td>

                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {formatearFechaHora(
                                                    inscripcion.fecha_inscripcion
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm ${
                                                        inscripcion.estado_inscripcion.toLowerCase() ===
                                                        "confirmada"
                                                            ? "bg-green-100 text-green-700"
                                                            : inscripcion.estado_inscripcion.toLowerCase() ===
                                                              "cancelada"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {formatearEstado(
                                                        inscripcion.estado_inscripcion
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                                                    {formatearEstado(
                                                        inscripcion.estado_evento
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialInscripcionesCliente;