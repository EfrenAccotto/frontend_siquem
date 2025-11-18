import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';

const VentaView = () => {
	const toast = useRef(null);

	const [selectedVenta, setSelectedVenta] = useState(null);

	const handleNuevo = () => {
		toast.current?.show({ severity: 'info', summary: 'Info', detail: 'Nuevo venta (placeholder)', life: 2000 });
	};

	return (
			<div className="venta-view h-full">
				<Toast ref={toast} />

				<div className="flex justify-content-between align-items-center mb-4">
					<h1 className="text-3xl font-bold m-0">Gestión de Ventas</h1>
				</div>

				<div className="bg-white p-6 rounded shadow h-full">
					<TableComponent
						header={<ActionButtons showEdit={true} showDelete={true} editDisabled={!selectedVenta} deleteDisabled={!selectedVenta} onEdit={() => selectedVenta && console.log('editar', selectedVenta)} onDelete={() => selectedVenta && console.log('eliminar', selectedVenta)} />}
						selection={selectedVenta}
						onSelectionChange={setSelectedVenta}
					/>
				</div>
			</div>
	);
};

export default VentaView;
