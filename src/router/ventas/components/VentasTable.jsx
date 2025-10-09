import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import TableComponent from '../../../components/layout/TableComponent';

const VentasTable = () => (
  <div className="bg-white p-6 rounded shadow">
    <TableComponent visible={true} />
  </div>
);

export default VentasTable; 