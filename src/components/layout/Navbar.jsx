import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import 'primeicons/primeicons.css';
import ActionButtons from './ActionButtons'; 
import '../../assets/css/Navbar.css';

const Navbar = () => {
  const toast = useRef(null);

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
      <nav className="w-full h-4rem bg-primary flex align-items-center justify-end px-4 shadow-3">
          <Button
            icon="pi pi-cog"
            className="p-button-rounded p-button-text p-button-plain"
            aria-label="Configuración"
            tooltip="Configuración"
            tooltipOptions={{ position: 'bottom' }}
          />
          <Button
            icon="pi pi-bell"
            className="p-button-rounded p-button-text p-button-plain"
            aria-label="Notificaciones"
            onClick={showNotification}
            tooltip="Notificaciones"
            tooltipOptions={{ position: 'bottom' }}
          />
      </nav>
    </>
  );
};

export default Navbar;