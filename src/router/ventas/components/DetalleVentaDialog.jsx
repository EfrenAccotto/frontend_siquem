import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useState, useEffect } from 'react';

const DetalleVentaDialog = ({ visible, venta, onHide, onSave }) => {
    const [detalles, setDetalles] = useState([]);
    const [editingRows, setEditingRows] = useState({});

    // Mock productos para el dropdown
    const productosDisponibles = [
        { id: 1, name: 'Producto A', price: 100 },
        { id: 2, name: 'Producto B', price: 200 },
        { id: 3, name: 'Producto C', price: 300 },
    ];

    useEffect(() => {
        if (venta?.detalles) {
            setDetalles(venta.detalles);
        } else {
            setDetalles([]);
        }
    }, [venta]);

    const agregarItem = () => {
        const nuevoItem = {
            id: Date.now(),
            producto: null,
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
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

        // Calcular subtotal
        newData.subtotal = (newData.cantidad || 0) * (newData.precioUnitario || 0);

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
                    // Auto-completar precio unitario
                    if (producto) {
                        const index = detalles.findIndex(d => d.id === options.rowData.id);
                        if (index !== -1) {
                            const newDetalles = [...detalles];
                            newDetalles[index].precioUnitario = producto.price;
                            newDetalles[index].subtotal = newDetalles[index].cantidad * producto.price;
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
        return (
            <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback(e.value)}
                min={1}
                showButtons
                className="w-full"
            />
        );
    };

    const precioEditor = (options) => {
        return (
            <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback(e.value)}
                mode="currency"
                currency="ARS"
                locale="es-AR"
                min={0}
                className="w-full"
            />
        );
    };

    const productoBodyTemplate = (rowData) => {
        return rowData.producto?.name || '-';
    };

    const precioBodyTemplate = (rowData) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.precioUnitario || 0);
    };

    const subtotalBodyTemplate = (rowData) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.subtotal || 0);
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

    const calcularTotal = () => {
        return detalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    };

    const handleGuardar = () => {
        // Validar que todos los items tengan producto y cantidad
        const itemsValidos = detalles.every(item => item.producto && item.cantidad > 0);

        if (!itemsValidos) {
            return; // Aquí podrías mostrar un toast de error
        }

        const ventaActualizada = {
            ...venta,
            detalles: detalles,
            montoTotal: calcularTotal()
        };

        onSave(ventaActualizada);
        onHide();
    };

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <div className="text-xl font-bold">
                Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(calcularTotal())}
            </div>
            <div className="flex gap-2">
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
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '900px' }}
            header={`Detalle de Venta ${venta?.id ? `#${venta.id}` : ''}`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="grid mb-3">
                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Cliente</label>
                        <div className="text-lg">{venta?.cliente || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Fecha</label>
                        <div className="text-lg">{venta?.fecha || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Forma de Pago</label>
                        <div className="text-lg">{venta?.formaPago || '-'}</div>
                    </div>
                </div>
            </div>

            <div className="field">
                <div className="flex justify-content-between align-items-center mb-2">
                    <label className="font-bold text-lg">Items de la Venta</label>
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
                    emptyMessage="No hay items en esta venta"
                    className="p-datatable-sm"
                >
                    <Column
                        field="producto"
                        header="Producto"
                        body={productoBodyTemplate}
                        editor={productoEditor}
                        style={{ width: '30%' }}
                    />
                    <Column
                        field="cantidad"
                        header="Cantidad"
                        editor={cantidadEditor}
                        style={{ width: '15%' }}
                    />
                    <Column
                        field="precioUnitario"
                        header="Precio Unitario"
                        body={precioBodyTemplate}
                        editor={precioEditor}
                        style={{ width: '20%' }}
                    />
                    <Column
                        field="subtotal"
                        header="Subtotal"
                        body={subtotalBodyTemplate}
                        style={{ width: '20%' }}
                    />
                    <Column
                        rowEditor
                        headerStyle={{ width: '10%', minWidth: '8rem' }}
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

export default DetalleVentaDialog;
