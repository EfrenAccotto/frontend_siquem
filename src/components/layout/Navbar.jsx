import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'primeicons/primeicons.css';
import ActionButtons from './ActionButtons'; 
import '../../assets/css/Navbar.css';

const Navbar = () => {
  const toast = useRef(null);
  const navigate = useNavigate();

  const showNotification = () => {
    toast.current.show({
      severity: 'info',
      summary: 'Notificación',
      detail: 'Tienes nuevas notificaciones',
      life: 3000,
    });
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <nav className="w-full h-4rem bg-primary flex align-items-center px-4 shadow-3">
        {/* Left: back button */}
        <div className="flex align-items-center">
          <Button
            icon="pi pi-arrow-left"
            className="p-button-rounded p-button-text p-button-plain"
            aria-label="Volver"
            tooltip="Volver"
            onClick={() => navigate(-1)}
            tooltipOptions={{ position: 'bottom' }}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: action icons */}
        <div className="flex align-items-center">
          <Button
            icon="pi pi-cog"
            className="p-button-rounded p-button-text p-button-plain"
            aria-label="Configuración"
            tooltip="Configuración"
            tooltipOptions={{ position: 'bottom' }}
          />
          <Button
            icon="pi pi-bell"
            className="p-button-rounded p-button-text p-button-plain ml-2"
            aria-label="Notificaciones"
            onClick={showNotification}
            tooltip="Notificaciones"
            tooltipOptions={{ position: 'bottom' }}
          />
        </div>
      </nav>
    </>
  );
};

export default Navbar;