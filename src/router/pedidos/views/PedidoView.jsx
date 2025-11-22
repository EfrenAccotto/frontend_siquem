import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import PedidoForm from '../components/PedidoForm';

const PedidoView = () => {
	const toast = useRef(null);
	const [showDialog, setShowDialog] = useState(false);
	const [selectedPedido, setSelectedPedido] = useState(null);
	// Mock data
	const [pedidos, setPedidos] = useState([]);

	const handleNuevo = () => {
		setShowDialog(true);
	};

	const handleGuardarPedido = (pedidoData) => {
		console.log("Guardando pedido:", pedidoData);
		// Mock save
		const newPedido = {
			id: Date.now(),
			cliente: pedidoData.cliente.nombreCompleto,
			fechaPedido: pedidoData.fechaPedido.toLocaleDateString(),
			fechaEntrega: pedidoData.fechaEntrega ? pedidoData.fechaEntrega.toLocaleDateString() : '-',
			estado: pedidoData.estado
		};
		setPedidos([...pedidos, newPedido]);

		toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pedido creado correctamente', life: 3000 });
		setShowDialog(false);
	};

	const columns = [
		{ field: 'id', header: 'ID' },
		{ field: 'cliente', header: 'Cliente' },
		{ field: 'fechaPedido', header: 'Fecha Pedido' },
		{ field: 'fechaEntrega', header: 'Fecha Entrega' },
		{ field: 'estado', header: 'Estado' }
	];

	return (
		<div className="pedido-view h-full">
			<Toast ref={toast} />

			<div className="flex justify-content-between align-items-center mb-4">
				<h1 className="text-3xl font-bold m-0">Gestión de Pedidos</h1>
			</div>

			<div className="bg-white p-6 rounded shadow h-full">
				<TableComponent
					data={pedidos}
					columns={columns}
					header={<ActionButtons
						showCreate={true}
						showEdit={true}
						showDelete={true}
						editDisabled={!selectedPedido}
						deleteDisabled={!selectedPedido}
						onCreate={handleNuevo}
						onEdit={() => selectedPedido && console.log('editar', selectedPedido)}
						onDelete={() => selectedPedido && console.log('eliminar', selectedPedido)}
					/>}
					selection={selectedPedido}
					onSelectionChange={setSelectedPedido}
				/>
			</div>

			<PedidoForm
				visible={showDialog}
				onHide={() => setShowDialog(false)}
				onSave={handleGuardarPedido}
			/>
		</div>
	);
};

export default PedidoView;
