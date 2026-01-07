 import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ReporteService from '../services/ReporteService';

const ReporteView = () => {
    const toast = useRef(null);
    const [tipoReporte, setTipoReporte] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(null);
    const [fechaHasta, setFechaHasta] = useState(null);
    const [formatoExportacion, setFormatoExportacion] = useState('pdf');
    const [loading, setLoading] = useState(false);

    // Opciones para el dropdown de tipo de reporte
    const tiposReporte = [
        { label: 'Ventas', value: 'ventas' },
        { label: 'Productos', value: 'productos' },
        { label: 'Clientes', value: 'clientes' }
    ];

    // Opciones para el selector de formato
    const formatosOptions = [
        { label: 'PDF', value: 'pdf', icon: 'pi pi-file-pdf' },
        { label: 'Excel', value: 'excel', icon: 'pi pi-file-excel' }
    ];
    const handleExportar = async () => {
        // Validar que se hayan seleccionado todos los campos
        if (!tipoReporte) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe seleccionar un tipo de reporte',
                life: 3000
            });
            return;
        }

        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'La fecha de inicio debe ser anterior a la fecha fin',
                life: 3000
            });
            return;
        }
        
        try {
            setLoading(true);
            
            // Mostrar loading
            toast.current?.show({
                severity: 'info',
                summary: 'Procesando',
                detail: 'Generando reporte...',
                life: 2000
            });

            const response = await ReporteService.getReportByModel(
                tipoReporte, 
                formatoExportacion, 
                fechaDesde, 
                fechaHasta
            );
            
            if (response.success && response.data) {
                // El response.data ya es un Blob
                const blob = response.data;
                
                // Verificar que el blob tenga contenido
                if (blob.size === 0) {
                    throw new Error('El archivo generado está vacío');
                }
                
                // Generar nombre del archivo con timestamp
                const timestamp = new Date().toISOString().split('T')[0];
                const extension = formatoExportacion === 'pdf' ? 'pdf' : 'xlsx';
                const filename = `reporte_${tipoReporte}_${timestamp}.${extension}`;
                
                // Crear URL y descargar
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                
                // Cleanup
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Reporte de ${tipoReporte} exportado correctamente`,
                    life: 3000
                });
            } else {
                throw new Error(response.error || 'Error desconocido al generar el reporte');
            }
        } catch (error) {
            console.error('Error al exportar reporte:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Error al exportar el reporte: ${error.message}`,
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const formatOptionTemplate = (option) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className={option.icon}></i>
                <span>{option.label}</span>
            </div>
        );
    };

    // Header de la tabla con los controles
    const tableHeader = (
        <div className="flex flex-column gap-3">
            <div className="flex align-items-center justify-content-between">
                <h3 className="m-0">Configuración de Reporte</h3>
            </div>

            {/* Controles en la tabla */}
            <div className="grid">
                {/* Tipo de Reporte */}
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-2">
                        <label htmlFor="tipo-reporte" className="font-semibold">
                            <i className="pi pi-file-export mr-2"></i>
                            Tipo de Reporte
                        </label>
                        <Dropdown
                            id="tipo-reporte"
                            value={tipoReporte}
                            onChange={(e) => setTipoReporte(e.value)}
                            options={tiposReporte}
                            placeholder="Seleccione tipo"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Fecha Desde */}
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-2">
                        <label htmlFor="fecha-desde" className="font-semibold">
                            <i className="pi pi-calendar mr-2"></i>
                            Fecha Desde
                        </label>
                        <Calendar
                            id="fecha-desde"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.value)}
                            dateFormat="dd/mm/yy"
                            placeholder="Seleccione fecha"
                            showIcon
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Fecha Hasta */}
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-2">
                        <label htmlFor="fecha-hasta" className="font-semibold">
                            <i className="pi pi-calendar mr-2"></i>
                            Fecha Hasta
                        </label>
                        <Calendar
                            id="fecha-hasta"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.value)}
                            dateFormat="dd/mm/yy"
                            placeholder="Seleccione fecha"
                            showIcon
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Formato de Exportación */}
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-2">
                        <label className="font-semibold">
                            <i className="pi pi-download mr-2"></i>
                            Formato
                        </label>
                        <SelectButton
                            value={formatoExportacion}
                            onChange={(e) => setFormatoExportacion(e.value)}
                            options={formatosOptions}
                            itemTemplate={formatOptionTemplate}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Botón Exportar */}
            <div className="flex justify-content-end">
                <Button
                    label={loading ? "Generando..." : "Exportar Reporte"}
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-file-export"}
                    className="p-button-success"
                    onClick={handleExportar}
                    disabled={loading}
                    loading={loading}
                />
            </div>
        </div>
    );

    // Datos vacíos para la tabla (solo mostrará los controles)
    const datos = [];
    const columns = [];

    return (
        <div className="reporte-view h-full">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="text-3xl font-bold m-0">Reportes y Exportaciones</h1>
            </div>

            <DataTable
                value={datos}
                header={tableHeader}
                emptyMessage="Configure los parámetros del reporte y presione 'Exportar Reporte'"
                className="p-datatable-sm"
            >
                {columns.map((column) => (
                    <Column
                        key={column.field}
                        field={column.field}
                        header={column.header}
                    />
                ))}
            </DataTable>
        </div>
    );
};

export default ReporteView;
