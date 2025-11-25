import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { useState, useEffect } from 'react';

const DetallePedidoDialog = ({ visible, pedido, onHide, onSave }) => {
    const [detalles, setDetalles] = useState([]);
    const [estado, setEstado] = useState('Pendiente');
    const [observaciones, setObservaciones] = useState('');

    // Mock productos con stock
    const productosDisponibles = [
        { id: 1, name: 'Producto A', stock: 50, reserve_stock: 10 },
        { id: 2, name: 'Producto B', stock: 30, reserve_stock: 5 },
        { id: 3, name: 'Producto C', stock: 100, reserve_stock: 20 },
    ];

    const estadosOptions = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    useEffect(() => {
        if (pedido) {
            setDetalles(pedido.detalles || []);
            setEstado(pedido.estado || 'Pendiente');
            setObservaciones(pedido.observaciones || '');
        } else {
            setDetalles([]);
            setEstado('Pendiente');
            setObservaciones('');
        }
    }, [pedido]);

    const agregarItem = () => {
        const nuevoItem = {
            id: Date.now(),
            producto: null,
            cantidad: 1,
            stockDisponible: 0,
            isNew: true
        };
        setDetalles([...detalles, nuevoItem]);
    };

    const eliminarItem = (rowData) => {
        setDetalles(detalles.filter(item => item.id !== rowData.id));
    };

    const onRowEditComplete = (e) => {
        let _detalles = [...detalles];
        let { newData, index } = e;
        _detalles[index] = newData;
        setDetalles(_detalles);
    };

    const productoEditor = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={productosDisponibles}
                onChange={(e) => {
                    const producto = e.value;
                    options.editorCallback(producto);
                    // Auto-completar stock disponible
                    if (producto) {
                        const index = detalles.findIndex(d => d.id === options.rowData.id);
                        if (index !== -1) {
                            const newDetalles = [...detalles];
                            newDetalles[index].stockDisponible = producto.stock - producto.reserve_stock;
                            setDetalles(newDetalles);
                        }
                    }
                }}
                optionLabel="name"
                placeholder="Seleccione producto"
                className="w-full"
            />
        );
    };

    const cantidadEditor = (options) => {
        const stockDisponible = options.rowData.stockDisponible || 0;
        return (
            <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback(e.value)}
                min={1}
                max={stockDisponible}
                showButtons
                className="w-full"
            />
        );
    };

    const productoBodyTemplate = (rowData) => {
        return rowData.producto?.name || '-';
    };

    const stockDisponibleBodyTemplate = (rowData) => {
        const stock = rowData.stockDisponible || 0;
        const className = stock < 10 ? 'text-red-500 font-bold' : '';
        return <span className={className}>{stock}</span>;
    };

    const accionesBodyTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-text"
                onClick={() => eliminarItem(rowData)}
                tooltip="Eliminar item"
            />
        );
    };

    const handleGuardar = () => {
        // Validar que todos los items tengan producto y cantidad
        const itemsValidos = detalles.every(item => {
            if (!item.producto || item.cantidad <= 0) return false;
            // Verificar que la cantidad no exceda el stock disponible
            if (item.cantidad > item.stockDisponible) return false;
            return true;
        });

        if (!itemsValidos) {
            return; // Aquí podrías mostrar un toast de error
        }

        // Verificar duplicados
        const productosIds = detalles.map(d => d.producto?.id);
        const hasDuplicados = productosIds.length !== new Set(productosIds).size;

        if (hasDuplicados) {
            return; // Aquí podrías mostrar un toast de error
        }

        const pedidoActualizado = {
            ...pedido,
            detalles: detalles,
            estado: estado,
            observaciones: observaciones
        };

        onSave(pedidoActualizado);
        onHide();
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
            />
            <Button
                label="Guardar"
                icon="pi pi-check"
                onClick={handleGuardar}
                autoFocus
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '900px' }}
            header={`Detalle de Pedido ${pedido?.id ? `#${pedido.id}` : ''}`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="grid mb-3">
                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Cliente</label>
                        <div className="text-lg">{pedido?.cliente || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Dirección de Envío</label>
                        <div className="text-lg">{pedido?.direccionEnvio || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="field">
                        <label className="font-bold">Fecha del Pedido</label>
                        <div className="text-lg">{pedido?.fechaPedido || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="field">
                        <label htmlFor="estado" className="font-bold">Estado</label>
                        <Dropdown
                            id="estado"
                            value={estado}
                            options={estadosOptions}
                            onChange={(e) => setEstado(e.value)}
                            placeholder="Seleccione estado"
                        />
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="field">
                        <label className="font-bold">Total Items</label>
                        <div className="text-lg">{detalles.length}</div>
                    </div>
                </div>
                <div className="col-12">
                    <div className="field">
                        <label htmlFor="observaciones" className="font-bold">Observaciones</label>
                        <InputTextarea
                            id="observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows={3}
                            placeholder="Ingrese observaciones del pedido..."
                        />
                    </div>
                </div>
            </div>

            <div className="field">
                <div className="flex justify-content-between align-items-center mb-2">
                    <label className="font-bold text-lg">Items del Pedido</label>
                    <Button
                        label="Agregar Item"
                        icon="pi pi-plus"
                        className="p-button-sm p-button-success"
                        onClick={agregarItem}
                    />
                </div>

                <DataTable
                    value={detalles}
                    editMode="row"
                    dataKey="id"
                    onRowEditComplete={onRowEditComplete}
                    emptyMessage="No hay items en este pedido"
                    className="p-datatable-sm"
                >
                    <Column
                        field="producto"
                        header="Producto"
                        body={productoBodyTemplate}
                        editor={productoEditor}
                        style={{ width: '40%' }}
                    />
                    <Column
                        field="cantidad"
                        header="Cantidad"
                        editor={cantidadEditor}
                        style={{ width: '20%' }}
                    />
                    <Column
                        field="stockDisponible"
                        header="Stock Disponible"
                        body={stockDisponibleBodyTemplate}
                        style={{ width: '20%' }}
                    />
                    <Column
                        rowEditor
                        headerStyle={{ width: '15%', minWidth: '8rem' }}
                        bodyStyle={{ textAlign: 'center' }}
                    />
                    <Column
                        body={accionesBodyTemplate}
                        exportable={false}
                        style={{ width: '5%' }}
                    />
                </DataTable>
            </div>
        </Dialog>
    );
};

export default DetallePedidoDialog;
