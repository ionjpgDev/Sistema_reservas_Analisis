import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DetallesPagos {
  fecha: string;
  concepto: string;
  monto: number;
  metodo: string;
  estado: string;
}

interface ComponentProps {
  fechaInicio: string;
  fechaFin: string;
}

export const DetallesPagosTabla: React.FC<ComponentProps> = ({ fechaInicio, fechaFin }) => {
  const [pagos, setPagos] = useState<DetallesPagos[]>([]);
  const [cargando, setCargando] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  useEffect(() => {
    const obtenerDetallesPagos = async () => {
      if (!fechaInicio || !fechaFin) return;
      setCargando(true);

      try {
        const res = await api.post('/reportes/detallesPagos', { fechaInicio, fechaFin });
        if (res.data.success) {
          setPagos(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (error) {
        console.error('Error al obtener los detalles de pagos:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDetallesPagos();
  }, [fechaInicio, fechaFin]);

  const pagosFiltrados = pagos.filter((pago: DetallesPagos) => {
    const cumpleEstado =
      filtroEstado === 'todos' || pago.estado?.toLowerCase() === filtroEstado.toLowerCase();
    const cumpleMetodo =
      filtroMetodo === 'todos' || pago.metodo?.toLowerCase() === filtroMetodo.toLowerCase();

    return cumpleEstado && cumpleMetodo;
  });

  const exportarExcel = () => {
    if (pagosFiltrados.length === 0) return;

    const dataExcel = pagosFiltrados.map((item) => ({
      Fecha: item.fecha,
      Concepto: item.concepto,
      'Monto (Bs.)': Number(item.monto).toFixed(2),
      'Método de Pago': item.metodo,
      Estado: item.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle_Pagos');
    XLSX.writeFile(workbook, `Reporte_Pagos.xlsx`);
  };

  const exportarPDF = async () => {
    const elemento = document.getElementById('tabla-pagos-pdf');
    if (!elemento) return;

    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`Reporte_Pagos.pdf`);
  };

  const getBadgeClass = (estado: string) => {
    const est = estado?.toLowerCase();
    if (est === 'pagado') {
      return 'inline-flex px-2.5 py-1 rounded-full bg-[#E4F0EA] dark:bg-[#173F30] text-[#245743] dark:text-[#DCEFE5] font-medium text-xs';
    }
    if (est === 'reembolsado') {
      return 'inline-flex px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium text-xs';
    }
    return 'inline-flex px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-medium text-xs';
  };

 return (
    <div className="bg-claro-tarjeta dark:bg-oscuro-tarjeta p-5 rounded-2x border border-claro-borde dark:border-oscuro-borde shadow-sm transition-colors space-y-4">
      <div className="flex flex-col fdmsflex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-claro-texto2 dark:text-oscuro-texto2">Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-claro-fondo dark:bg -oscuro-fondo text-claro-texto dark:text-oscuro-texto text-xs rounded-xl border border-claro-borde dark:border-oscuro-borde px-3 py-1.5 focus:outline-none transition-colors">
              <option value="todos">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="reembolsado">Reembolsado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-claro-texto2 dark:text-oscuro-texto2">Método:</label>
            <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className="bg-claro-fondo dark:bg-oscuro-fondo text-claro-texto dark:text-oscuro-texto text-xs rounded-xl border border-claro-borde dark:border-oscuro-borde px-3 py-1.5 focus:outline-none transition-colors">
              <option value="todos">Todos los métodos</option>
              <option value="qr">QR</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={exportarExcel} disabled={pagosFiltrados.length === 0} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-colors shadow-sm">Exportar Excel</button>
          <button onClick={exportarPDF} disabled={pagosFiltrados.length === 0} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-colors shadow-sm">Exportar PDF</button>
        </div>
      </div>

      <div id="tabla-pagos-pdf" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-claro-borde dark:border-oscuro-borde">
              <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">Fecha</th>
              <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">Concepto</th>
              <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">Monto</th>
              <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">Método</th>
              <th className="text-left py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-claro-texto2 dark:text-oscuro-texto2">
                  Cargando detalles de pagos...
                </td>
              </tr>
            ) : pagosFiltrados.length > 0 ? (
              pagosFiltrados.map((pago, index) => (
                <tr
                  key={index}
                  className="border-b border-claro-borde dark:border-oscuro-borde hover:bg-claro-fondo dark:hover:bg-oscuro-fondo/50 transition-colors"
                >
                  <td className="py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2">{pago.fecha}</td>
                  <td className="py-3 px-3 text-claro-texto dark:text-oscuro-texto font-semibold">{pago.concepto || '_'}</td>
                  <td className="py-3 px-3 text-claro-texto dark:text-oscuro-texto font-medium">{pago.monto} Bs.</td>
                  <td className="py-3 px-3 text-claro-texto2 dark:text-oscuro-texto2 capitalize">{pago.metodo || '_'}</td>
                  <td className="py-3 px-3">
                    <span className={getBadgeClass(pago.estado)}>
                      {pago.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-claro-texto2 dark:text-oscuro-texto2">
                  No se encontraron pagos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DetallesPagosTabla