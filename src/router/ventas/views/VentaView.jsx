import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import VentaForm from '../components/VentaForm';

const VentaView = () => {
	const toast = useRef(null);
	const [showDialog, setShowDialog] = useState(false);
	const [selectedVenta, setSelectedVenta] = useState(null);
	// Mock data for sales list
	const [ventas, setVentas] = useState([]);

	const handleNuevo = () => {
		setShowDialog(true);
	};

	const handleGuardarVenta = (ventaData) => {
		console.log("Guardando venta:", ventaData);
		// Mock save
		const newVenta = {
			id: Date.now(),
			cliente: ventaData.cliente.nombreCompleto,
			fecha: ventaData.fecha.toLocaleDateString(),
			total: ventaData.total,
			items: ventaData.items.length
		};
		setVentas([...ventas, newVenta]);

		toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta registrada correctamente', life: 3000 });
		setShowDialog(false);
	};

	const columns = [
		{ field: 'id', header: 'ID' },
		{ field: 'cliente', header: 'Cliente' },
		{ field: 'fecha', header: 'Fecha' },
		{ field: 'items', header: 'Items' },
		{ field: 'total', header: 'Total', body: (rowData) => `$${rowData.total}` }
	];

	return (
		<div className="venta-view h-full">
			<Toast ref={toast} />

			<div className="flex justify-content-between align-items-center mb-4">
				<h1 className="text-3xl font-bold m-0">Gestión de Ventas</h1>
			</div>

			<div className="bg-white p-6 rounded shadow h-full">
				<TableComponent
					data={ventas}
					columns={columns}
					header={<ActionButtons
						showCreate={true}
						showEdit={true}
						showDelete={true}
						editDisabled={!selectedVenta}
						deleteDisabled={!selectedVenta}
						onCreate={handleNuevo}
						onEdit={() => selectedVenta && console.log('editar', selectedVenta)}
						onDelete={() => selectedVenta && console.log('eliminar', selectedVenta)}
					/>}
					selection={selectedVenta}
					onSelectionChange={setSelectedVenta}
				/>
			</div>

			<VentaForm
				visible={showDialog}
				onHide={() => setShowDialog(false)}
				onSave={handleGuardarVenta}
			/>
		</div>
	);
};

export default VentaView;
