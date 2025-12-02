import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

const AppSidebar = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();


  const menuItems = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      command: () => navigate('/')
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => navigate('/clientes')
    },
    {
      label: 'Productos',
      icon: 'pi pi-box',
      command: () => navigate('/productos')
    },
    {
      label: 'Ventas',
      icon: 'pi pi-shopping-cart',
      command: () => navigate('/ventas')
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-list',
      command: () => navigate('/pedidos')
    },
    {
      label: 'Reportes',
      icon: 'pi pi-file-export',
      command: () => navigate('/reportes')
    }
  ];


  const startContent = (
    <Button
      icon="pi pi-bars"
      onClick={() => setVisible(true)}
      className="p-button-text p-button-rounded"
    />
  );

  return (
    <>
      {/* Menubar superior (opcional) */}
      <Menubar
        start={startContent}
        className="shadow-1"
        breakpoint="0px"
        pt={{ menuButton: { style: { display: 'none' } } }}
      />

      {/* Sidebar principal */}
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: '250px' }}
        className="p-sidebar-md"
      >
        <div className="flex flex-column h-full">
          <div className="mt-3 mb-5 flex justify-content-center">
            <h2 className="text-xl font-bold">Granja Siquem</h2>
          </div>
          <div className="flex flex-column gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                label={item.label}
                icon={item.icon}
                onClick={item.command}
                className="p-button-text p-button-plain"
              />
            ))}
          </div>
        </div>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
