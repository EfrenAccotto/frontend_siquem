import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const ActionButtons = ({
  showCreate = true,
  showEdit = true,
  showDelete = true,
  showExport = true,
  showDetail = false,
  editDisabled = false,
  deleteDisabled = false,
  detailDisabled = false,
  onCreate,
  onEdit,
  onDelete,
  onExport,
  onDetail,
  searchValue,
  onSearch,
}) => (
  <div className="flex gap-2 align-items-center w-full">
    {/* Barra de búsqueda */}
    <div className="flex-1">
      <span className="p-input-icon-left">
        <i className="pi pi-search ml-2" />
        <InputText
          placeholder="Buscar..."
          className="w-full pl-5"
          value={searchValue}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </span>
    </div>

    {/* Botones de acción (visibilidad condicional) */}
    <div className="flex gap-2">
      {showCreate && (
        <Button label="Crear" className="p-button-success p-button-raised" onClick={onCreate} />
      )}
      {showEdit && (
        <Button
          label="Editar"
          className="p-button-warning p-button-raised"
          onClick={onEdit}
          disabled={editDisabled}
          style={editDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showDelete && (
        <Button
          label="Eliminar"
          className="p-button-danger p-button-raised"
          onClick={onDelete}
          disabled={deleteDisabled}
          style={deleteDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showDetail && (
        <Button
          label="Ver Detalle"
          icon="pi pi-list"
          className="p-button-info p-button-raised"
          onClick={onDetail}
          disabled={detailDisabled}
          style={detailDisabled ? { opacity: 0.5 } : undefined}
        />
      )}
      {showExport && (
        <Button label="Exportar" className="p-button-info p-button-raised" onClick={onExport} />
      )}
    </div>
  </div>
);

export default ActionButtons;