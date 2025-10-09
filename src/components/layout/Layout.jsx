import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TableComponent from './TableComponent';
import { Outlet } from 'react-router-dom';

const Layout = () => (
  <div className="flex h-screen surface-ground">
    <div className="hidden md:block flex-shrink-0">
      <Sidebar />
    </div>

    <div className="flex-1 flex flex-column min-w-0">
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      <main className="flex-1 overflow-auto">
        {/* Contenido de la ruta */}
        <div className="p-4">
          <div className="surface-card p-5 shadow-2 border-round max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>

        {/* TableComponent con ancho completo */}
        <div className="p-4">
          <TableComponent />
        </div>
      </main>
    </div>
  </div>
);

export default Layout;