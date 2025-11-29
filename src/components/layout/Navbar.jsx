// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// PrimeReact Components
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Avatar } from 'primereact/avatar';
import { SplitButton } from 'primereact/splitbutton';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';

// Context
import { useTheme } from '@/context/ThemeContext';

// Components
import HelpSupportDialog from './HelpSupportDialog';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Mapeo de rutas a títulos de página
const PAGE_ROUTES = {
  '/inicio': 'Dashboard Principal',
  '/clientes': 'Gestión de Clientes',
  '/productos': 'Inventario de Productos',
  '/ventas': 'Registro de Ventas',
  '/pedidos': 'Seguimiento de Pedidos',
  '/reportes': 'Reportes y Exportaciones'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene el título de la página actual basado en la ruta
 * @param {string} pathname - Ruta actual
 * @returns {string} Título de la página
 */
const getPageTitle = (pathname) => {
  return PAGE_ROUTES[pathname] || 'Granja Siquem';
};

/**
 * Genera los items del menú de usuario
 * @param {Function} onHelpClick - Función para abrir el dialog de ayuda
 * @returns {Array} Array de items del menú
 */
const getUserMenuItems = (onHelpClick) => [
  {
    label: 'Configuración',
    icon: 'pi pi-cog',
    command: () => console.log('Configuración')
  },
  {
    label: 'Ayuda',
    icon: 'pi pi-question-circle',
    command: onHelpClick
  }
];

/**
 * Template de item de notificación
 */
const NotificationItemTemplate = ({ item }) => (
  <div className="flex align-items-center p-2 hover:surface-100 cursor-pointer">
    <i className={`${item.icon} ${item.color} text-lg mr-3`} />
    <div className="flex-1">
      <div className="font-medium text-sm">{item.label}</div>
      <small className="text-color-secondary text-xs">{item.time}</small>
    </div>
  </div>
);

/**
 * Genera los items de notificaciones
 * @param {number} notificationCount - Cantidad de notificaciones
 * @returns {Array} Array de items de notificaciones
 */
const getNotificationItems = (notificationCount) => [
  {
    template: () => (
      <div className="p-3 border-bottom-1 surface-border">
        <div className="flex justify-content-between align-items-center">
          <span className="font-semibold text-base">Notificaciones</span>
          <Badge value={notificationCount} severity="danger" />
        </div>
      </div>
    )
  },
  {
    label: 'Nueva venta registrada',
    icon: 'pi pi-shopping-cart',
    color: 'text-primary',
    time: 'Hace 5 minutos',
    template: (item) => <NotificationItemTemplate item={item} />
  },
  {
    label: 'Stock bajo en productos',
    icon: 'pi pi-exclamation-triangle',
    color: 'text-yellow-500',
    time: 'Hace 1 hora',
    template: (item) => <NotificationItemTemplate item={item} />
  },
  {
    label: 'Pedido entregado',
    icon: 'pi pi-check-circle',
    color: 'text-green-500',
    time: 'Hace 2 horas',
    template: (item) => <NotificationItemTemplate item={item} />
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AppNavbar = () => {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(3);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const location = useLocation();
  const notificationMenuRef = useRef(null);
  const toastRef = useRef(null);
  const { theme, toggleTheme, isDark } = useTheme();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Actualizar hora en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ============================================================================
  // NAVBAR SECTIONS
  // ============================================================================

  // Sección izquierda: Título y fecha
  const startContent = (
    <div className="flex align-items-center gap-4">
      <div className="flex flex-column">
        <span className="text-900 font-bold text-xl">
          {getPageTitle(location.pathname)}
        </span>
        <span className="text-600 text-sm">
          {currentTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );

  // Sección derecha: Acciones y perfil
  const endContent = (
    <div className="flex align-items-center gap-3">
      {/* Indicador de estado del sistema */}
      <div className="hidden md:flex align-items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
        <i className="pi pi-check-circle text-lg text-green-500"></i>
        <span className="text-sm font-medium">Sistema Activo</span>
      </div>

      {/* Modo claro/oscuro */}
      <Button
        icon={isDark ? 'pi pi-sun' : 'pi pi-moon'}
        className="p-button-text p-button-rounded text-600"
        tooltip={isDark ? 'Modo claro' : 'Modo oscuro'}
        tooltipOptions={{ position: 'bottom' }}
        onClick={toggleTheme}
      />

      {/* Notificaciones */}
      <div className="relative">
        <Menu
          model={getNotificationItems(notifications)}
          popup
          ref={notificationMenuRef}
          style={{ width: '320px' }}
        />
        <Button
          icon="pi pi-bell"
          className="p-button-text p-button-rounded"
          tooltip="Notificaciones"
          tooltipOptions={{ position: 'bottom' }}
          onClick={(e) => notificationMenuRef.current.toggle(e)}
        >
          {notifications > 0 && (
            <Badge
              value={notifications}
              severity="danger"
              className="absolute -top-1 -right-1"
              size="small"
            />
          )}
        </Button>
      </div>

      {/* Perfil de usuario */}
      <SplitButton
        model={getUserMenuItems(() => setShowHelpDialog(true))}
        className="p-button-text p-button-plain"
        buttonTemplate={() => (
          <div className="flex align-items-center gap-2 cursor-pointer">
            <Avatar
              icon="pi pi-user"
              size="large"
              shape="circle"
              className="bg-gradient-to-r from-blue-500 to-blue-600 shadow"
            />
            <div className="hidden md:flex flex-column text-left">
              <span className="font-bold text-900 text-base">Admin Granja</span>
              <span className="text-600 text-xs">Administrador</span>
            </div>
          </div>
        )}
      />
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <Toast ref={toastRef} position="top-right" />

      <Menubar
        start={startContent}
        end={endContent}
        className="bg-white shadow-2 border-bottom-1 surface-border px-4 py-3"
        style={{
          backdropFilter: 'blur(10px)',
          border: 'none'
        }}
      />

      <HelpSupportDialog
        visible={showHelpDialog}
        onHide={() => setShowHelpDialog(false)}
        toastRef={toastRef}
      />
    </>
  );
};

// ============================================================================
// EXPORT
// ============================================================================
export default AppNavbar;