import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState } from 'react';
import ProductoService from '../services/ProductoService';

const Productos = [
  {"name": "Producto 1", "description": "Descripción del producto 1", "price": 199.99, "stock": 50, "reserve_stock": 10},
  {"name": "Producto 2", "description": "Descripción del producto 2", "price": 149.50, "stock": 30, "reserve_stock": 5},
  {"name": "Producto 3", "description": "Descripción del producto 3", "price": 89.00, "stock": 80, "reserve_stock": 20},
  {"name": "Producto 4", "description": "Descripción del producto 4", "price": 59.90, "stock": 15, "reserve_stock": 3},
  {"name": "Producto 5", "description": "Descripción del producto 5", "price": 299.00, "stock": 100, "reserve_stock": 25},
  {"name": "Producto 6", "description": "Descripción del producto 6", "price": 39.99, "stock": 40, "reserve_stock": 4},
  {"name": "Producto 7", "description": "Descripción del producto 7", "price": 22.50, "stock": 70, "reserve_stock": 10},
  {"name": "Producto 8", "description": "Descripción del producto 8", "price": 120.00, "stock": 55, "reserve_stock": 8},
  {"name": "Producto 9", "description": "Descripción del producto 9", "price": 75.75, "stock": 32, "reserve_stock": 6},
  {"name": "Producto 10", "description": "Descripción del producto 10", "price": 18.90, "stock": 20, "reserve_stock": 2},
  {"name": "Producto 11", "description": "Descripción del producto 11", "price": 45.00, "stock": 60, "reserve_stock": 12},
  {"name": "Producto 12", "description": "Descripción del producto 12", "price": 15.00, "stock": 22, "reserve_stock": 1},
  {"name": "Producto 13", "description": "Descripción del producto 13", "price": 255.00, "stock": 90, "reserve_stock": 30},
  {"name": "Producto 14", "description": "Descripción del producto 14", "price": 310.40, "stock": 44, "reserve_stock": 4},
  {"name": "Producto 15", "description": "Descripción del producto 15", "price": 80.00, "stock": 28, "reserve_stock": 5},
  {"name": "Producto 16", "description": "Descripción del producto 16", "price": 105.00, "stock": 95, "reserve_stock": 12},
  {"name": "Producto 17", "description": "Descripción del producto 17", "price": 69.99, "stock": 36, "reserve_stock": 7},
  {"name": "Producto 18", "description": "Descripción del producto 18", "price": 155.49, "stock": 40, "reserve_stock": 6},
  {"name": "Producto 19", "description": "Descripción del producto 19", "price": 420.00, "stock": 120, "reserve_stock": 20},
  {"name": "Producto 20", "description": "Descripción del producto 20", "price": 10.99, "stock": 18, "reserve_stock": 1},
  {"name": "Producto 21", "description": "Descripción del producto 21", "price": 500.00, "stock": 140, "reserve_stock": 30},
  {"name": "Producto 22", "description": "Descripción del producto 22", "price": 72.00, "stock": 33, "reserve_stock": 5},
  {"name": "Producto 23", "description": "Descripción del producto 23", "price": 32.90, "stock": 15, "reserve_stock": 2},
  {"name": "Producto 24", "description": "Descripción del producto 24", "price": 250.00, "stock": 88, "reserve_stock": 10},
  {"name": "Producto 25", "description": "Descripción del producto 25", "price": 19.99, "stock": 25, "reserve_stock": 3},
  {"name": "Producto 26", "description": "Descripción del producto 26", "price": 220.00, "stock": 60, "reserve_stock": 8},
  {"name": "Producto 27", "description": "Descripción del producto 27", "price": 110.00, "stock": 55, "reserve_stock": 5},
  {"name": "Producto 28", "description": "Descripción del producto 28", "price": 65.99, "stock": 42, "reserve_stock": 4},
  {"name": "Producto 29", "description": "Descripción del producto 29", "price": 90.10, "stock": 30, "reserve_stock": 3},
  {"name": "Producto 30", "description": "Descripción del producto 30", "price": 200.00, "stock": 85, "reserve_stock": 15},
  {"name": "Producto 31", "description": "Descripción del producto 31", "price": 14.50, "stock": 10, "reserve_stock": 1},
  {"name": "Producto 32", "description": "Descripción del producto 32", "price": 58.00, "stock": 22, "reserve_stock": 2},
  {"name": "Producto 33", "description": "Descripción del producto 33", "price": 330.00, "stock": 100, "reserve_stock": 20},
  {"name": "Producto 34", "description": "Descripción del producto 34", "price": 288.99, "stock": 70, "reserve_stock": 7},
  {"name": "Producto 35", "description": "Descripción del producto 35", "price": 130.00, "stock": 66, "reserve_stock": 6},
  {"name": "Producto 36", "description": "Descripción del producto 36", "price": 69.00, "stock": 44, "reserve_stock": 4},
  {"name": "Producto 37", "description": "Descripción del producto 37", "price": 18.75, "stock": 12, "reserve_stock": 1},
  {"name": "Producto 38", "description": "Descripción del producto 38", "price": 510.00, "stock": 150, "reserve_stock": 25},
  {"name": "Producto 39", "description": "Descripción del producto 39", "price": 390.00, "stock": 95, "reserve_stock": 10},
  {"name": "Producto 40", "description": "Descripción del producto 40", "price": 12.00, "stock": 20, "reserve_stock": 2},
  {"name": "Producto 41", "description": "Descripción del producto 41", "price": 77.00, "stock": 34, "reserve_stock": 4},
  {"name": "Producto 42", "description": "Descripción del producto 42", "price": 199.50, "stock": 60, "reserve_stock": 10},
  {"name": "Producto 43", "description": "Descripción del producto 43", "price": 260.00, "stock": 85, "reserve_stock": 12},
  {"name": "Producto 44", "description": "Descripción del producto 44", "price": 49.90, "stock": 18, "reserve_stock": 3},
  {"name": "Producto 45", "description": "Descripción del producto 45", "price": 315.99, "stock": 93, "reserve_stock": 9},
  {"name": "Producto 46", "description": "Descripción del producto 46", "price": 88.00, "stock": 40, "reserve_stock": 6},
  {"name": "Producto 47", "description": "Descripción del producto 47", "price": 155.00, "stock": 72, "reserve_stock": 7},
  {"name": "Producto 48", "description": "Descripción del producto 48", "price": 68.49, "stock": 26, "reserve_stock": 2},
  {"name": "Producto 49", "description": "Descripción del producto 49", "price": 22.00, "stock": 14, "reserve_stock": 1},
  {"name": "Producto 50", "description": "Descripción del producto 50", "price": 480.00, "stock": 110, "reserve_stock": 20}
]

const Columns = [
  { field: 'name', header: 'Nombre', style: { width: '25%' } },
  { field: 'description', header: 'Descripción', style: { width: '35%' } },
  { field: 'price', header: 'Precio', style: { width: '15%' } },
  { field: 'stock', header: 'Stock', style: { width: '12%' } },
  { field: 'reserve_stock', header: 'Stock Reservado', style: { width: '13%' } },
];

const ProductoView = () => {
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);

  const useEffect = (() => {
  try {
    const fetchProductos = async () => {
      const response = await ProductoService.getAll();
      if (response.success) {
        console.log('Productos obtenidos:', response.data);
        setProductos(response.data);
      } else {
        console.error('Error al obtener productos:', response.error);
      }
    };

    fetchProductos();
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}, []);

  // El manejo de CRUD lo realiza la tabla (ActionButtons dentro del header),
  // por eso eliminamos el botón "Nuevo Producto" que estaba duplicado.

  return (
    <div className="producto-view h-full">

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Productos</h1>
      </div>

      <div className="bg-white p-6 rounded shadow h-full">
        <TableComponent
          visible={true}
          data={productos}
          columns={Columns}
          selection={selectedProducto}
          onSelectionChange={setSelectedProducto}
          header={<ActionButtons
            showEdit={true}
            showDelete={true}
            editDisabled={!selectedProducto}
            deleteDisabled={!selectedProducto}
            onEdit={() => selectedProducto && console.log('editar', selectedProducto)}
            onDelete={() => selectedProducto && console.log('eliminar', selectedProducto)}
          />}
        />
      </div>
    </div>
  )

}

export default ProductoView; 