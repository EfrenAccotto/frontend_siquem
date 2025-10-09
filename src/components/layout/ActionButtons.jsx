import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const ActionButtons = () => (
  <div className="flex gap-2 align-items-center w-full">
    {/* Barra de búsqueda */}
    <div className="flex-1">
      <span className="p-input-icon-left">
        <i className="pi pi-search ml-2" />
        <InputText 
          placeholder="Buscar..." 
          className="w-full pl-5"
        />
      </span>
    </div>
    
    {/* Botones de acción */}
    <div className="flex gap-2">
      <Button label="Crear" className="p-button-success p-button-raised" />
      <Button label="Editar" className="p-button-warning p-button-raised" />
      <Button label="Eliminar" className="p-button-danger p-button-raised" />
      <Button label="Exportar" className="p-button-info p-button-raised" />
    </div>
  </div>
);

export default ActionButtons;