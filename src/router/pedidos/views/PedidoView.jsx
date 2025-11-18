import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';

const PedidoView = () => {
	const toast = useRef(null);

		const [selectedPedido, setSelectedPedido] = useState(null);

		const handleNuevo = () => {
			toast.current?.show({ severity: 'info', summary: 'Info', detail: 'Nuevo pedido (placeholder)', life: 2000 });
		};

	return (
			<div className="pedido-view h-full">
				<Toast ref={toast} />

				<div className="flex justify-content-between align-items-center mb-4">
					<h1 className="text-3xl font-bold m-0">Gestión de Pedidos</h1>
				</div>

						<div className="bg-white p-6 rounded shadow h-full">
							<TableComponent header={<ActionButtons showEdit={true} showDelete={true} editDisabled={!selectedPedido} deleteDisabled={!selectedPedido} onEdit={() => selectedPedido && console.log('editar', selectedPedido)} onDelete={() => selectedPedido && console.log('eliminar', selectedPedido)} />} selection={selectedPedido} onSelectionChange={setSelectedPedido} />
						</div>
			</div>
	);
};

export default PedidoView;
