import api from "../../../services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResponsivePie } from "@nivo/pie";
import React, { useEffect, useState } from "react";

interface Cancha {
  id_cancha: number;
  nombre: string;
  disciplina: string;
  capacidad: number;
  precio_hora: number;
  estado: string;
  ubicacion: string;
}

export const ReporteCanchas: React.FC = () => {
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const [todasCanchas, setTodasCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(false);

  const obtenerCanchas = async () => {
    try {
      setCargando(true);
      const response = await api.get("/canchas");
      
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
        
      setTodasCanchas(data);
    } catch (error) {
      console.error("Error al obtener las canchas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerCanchas();
  }, []);

  // Extraer lista única de disciplinas directamente de la BD para el <select>
  const disciplinasDisponibles = Array.from(
    new Set(todasCanchas.map((c) => c.disciplina).filter(Boolean))
  );

  // Filtrado local normalizado (insensible a mayúsculas/minúsculas)
  const canchasFiltradas = todasCanchas.filter((cancha) => {
    const cumpleEstado =
      filtroEstado === "todos" ||
      cancha.estado?.toLowerCase() === filtroEstado.toLowerCase();

    const cumpleDisciplina =
      filtroDisciplina === "todas" ||
      cancha.disciplina?.toLowerCase() === filtroDisciplina.toLowerCase();

    const cumpleBusqueda =
      !busqueda ||
      cancha.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.ubicacion?.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleEstado && cumpleDisciplina && cumpleBusqueda;
  });

  // Conteo para gráfico de dona
  const conteoEstados = canchasFiltradas.reduce((acc, cancha) => {
    const estado = cancha.estado || "Desconocido";
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const datosDona = Object.keys(conteoEstados).map((estado) => ({
    id: estado,
    label: estado,
    value: conteoEstados[estado],
  }));

  // Exportar Excel
  const exportarExcel = () => {
    const datosExcel = canchasFiltradas.map((cancha) => ({
      ID: cancha.id_cancha,
      Nombre: cancha.nombre,
      Disciplina: cancha.disciplina,
      Capacidad: cancha.capacidad ? `${cancha.capacidad} pers.` : "N/A",
      "Precio / Hora": `${cancha.precio_hora} Bs.`,
      Estado: cancha.estado,
      Ubicación: cancha.ubicacion || "N/A",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Canchas");
    XLSX.writeFile(libro, "reporte-canchas.xlsx");
  };

  // Exportar PDF
  const exportarPDF = async () => {
    const elemento = document.getElementById("reporte-canchas-pdf");
    if (!elemento) return;

    const canvas = await html2canvas(elemento, { scale: 2 });
    const imagen = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const ancho = 190;
    const alto = (canvas.height * ancho) / canvas.width;

    pdf.text("Reporte General de Canchas", 10, 10);
    pdf.addImage(imagen, "PNG", 10, 15, ancho, alto);
    pdf.save("reporte-canchas.pdf");
  };

  return (
    <div
      className="space-y-6 bg-claro-fondo dark:bg-oscuro-fondo p-6 rounded-2xl text-claro-texto dark:text-oscuro-texto"
      id="reporte-canchas-pdf"
    >
      <h2 className="text-2xl font-bold text-claro-texto dark:text-oscuro-texto">
        Reporte de Canchas
      </h2>

      {/* Sección de Filtros */}
      <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-colors">
        <h2 className="text-lg font-bold text-claro-texto dark:text-oscuro-texto mb-4">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-claro-texto2 dark:text-oscuro-texto2 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-claro-borde dark:border-oscuro-borde bg-claro-tarjeta dark:bg-oscuro-tarjeta text-claro-texto dark:text-oscuro-texto focus:outline-none focus:ring-2 focus:ring-[#2E6B52]"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="ocupada">Ocupada</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-claro-texto2 dark:text-oscuro-texto2 mb-1">
              Disciplina
            </label>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-claro-borde dark:border-oscuro-borde bg-claro-tarjeta dark:bg-oscuro-tarjeta text-claro-texto dark:text-oscuro-texto focus:outline-none focus:ring-2 focus:ring-[#2E6B52]"
            >
              <option value="todas">Todas las disciplinas</option>
              {disciplinasDisponibles.map((dis) => (
                <option key={dis} value={dis}>
                  {dis}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-claro-texto2 dark:text-oscuro-texto2 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o ubicación..."
              className="w-full px-3 py-2 rounded-lg border border-claro-borde dark:border-oscuro-borde bg-claro-tarjeta dark:bg-oscuro-tarjeta text-claro-texto dark:text-oscuro-texto placeholder-claro-texto2 dark:placeholder-oscuro-texto2 focus:outline-none focus:ring-2 focus:ring-[#2E6B52]"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={obtenerCanchas}
            disabled={cargando}
            className="px-5 py-2 rounded-lg bg-[#245743] text-white font-medium hover:bg-[#1D4635] transition shadow-sm disabled:opacity-60"
          >
            {cargando ? "Actualizando..." : "Aplicar filtros"}
          </button>
        </div>
      </div>

      {/* Gráfica de Distribución Centrada y Contenida */}
      <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-colors">
        <div className="mb-2">
          <h3 className="text-base font-bold text-claro-texto dark:text-oscuro-texto">
            Distribución por Estado
          </h3>
          <p className="text-xs font-medium text-claro-texto2 dark:text-oscuro-texto2">
            Estado operativo de las canchas registradas
          </p>
        </div>

        <div className="h-72 w-full max-w-lg mx-auto relative">
          {datosDona.length > 0 ? (
            <ResponsivePie
              data={datosDona}
              colors={["#245743", "#D97706", "#DC2626", "#4B5563"]}
              margin={{ top: 30, right: 90, bottom: 30, left: 90 }}
              innerRadius={0.65}
              padAngle={2}
              cornerRadius={5}
              activeOuterRadiusOffset={6}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              enableArcLinkLabels={true}
              arcLinkLabel={(d) => `${d.id}`}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#ffffff"
              valueFormat={(value) => `${value} canchas`}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-claro-texto2 dark:text-oscuro-texto2 font-medium">
                No hay datos para mostrar en la gráfica
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Exportación */}
      <div className="flex gap-3">
        <button
          onClick={exportarExcel}
          disabled={canchasFiltradas.length === 0}
          className="px-4 py-2 rounded-lg bg-[#2E6B52] text-white font-medium hover:bg-[#245743] transition shadow-sm disabled:opacity-50"
        >
          Exportar Excel
        </button>

        <button
          onClick={exportarPDF}
          disabled={canchasFiltradas.length === 0}
          className="px-4 py-2 rounded-lg bg-[#173F30] text-white font-medium hover:bg-[#102C21] transition shadow-sm disabled:opacity-50"
        >
          Exportar PDF
        </button>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2xl border border-claro-borde dark:border-oscuro-borde shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-claro-texto dark:text-oscuro-texto">
              Canchas encontradas
            </h2>
            <p className="text-sm text-claro-texto2 dark:text-oscuro-texto2">
              Total: {canchasFiltradas.length} canchas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-claro-borde dark:border-oscuro-borde">
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Nombre
                </th>
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Disciplina
                </th>
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Capacidad
                </th>
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Precio / Hora
                </th>
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Estado
                </th>
                <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">
                  Ubicación
                </th>
              </tr>
            </thead>

            <tbody>
              {canchasFiltradas.length > 0 ? (
                canchasFiltradas.map((cancha) => (
                  <tr
                    key={cancha.id_cancha}
                    className="border-b border-claro-borde dark:border-oscuro-borde hover:bg-claro-fondo dark:hover:bg-oscuro-fondo/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-claro-texto dark:text-oscuro-texto font-semibold">
                      {cancha.nombre}
                    </td>
                    <td className="py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 capitalize">
                      {cancha.disciplina || "—"}
                    </td>
                    <td className="py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2">
                      {cancha.capacidad ? `${cancha.capacidad} pers.` : "—"}
                    </td>
                    <td className="py-3 px-3 text-claro-texto dark:text-oscuro-texto font-medium">
                      {cancha.precio_hora} Bs.
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          cancha.estado?.toLowerCase() === "disponible"
                            ? "inline-flex px-2.5 py-1 rounded-full bg-[#E4F0EA] dark:bg-[#173F30] text-[#245743] dark:text-[#DCEFE5] font-medium"
                            : cancha.estado?.toLowerCase() === "mantenimiento"
                            ? "inline-flex px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium"
                            : "inline-flex px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-medium"
                        }
                      >
                        {cancha.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2">
                      {cancha.ubicacion || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-claro-texto2 dark:text-oscuro-texto2">
                    No se encontraron canchas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReporteCanchas;