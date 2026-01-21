import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClienteRouter from './clientes/ClienteRouter';
import ProductoRouter from './productos/ProductoRouter';
import VentaRouter from './ventas/VentaRouter';
import PedidoRouter from './pedidos/PedidoRouter';
import InicioRouter from "./inicio/InicioRouter";
import ReporteRouter from "./reportes/ReporteRouter";
import ListadoPesajesView from './pedidos/views/ListadoPesajesView';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import '../assets/css/footer.css';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta para Operario (Sin Navbar/Sidebar) */}
        <Route path="/operario/pesajes" element={<ListadoPesajesView />} />

        {/* Aplicación Principal */}
        <Route path="/*" element={
          <>
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-4">
                <Routes>
                  <Route path="/" element={<InicioRouter />} />
                  <Route path="/clientes/*" element={<ClienteRouter />} />
                  <Route path="/productos/*" element={<ProductoRouter />} />
                  <Route path="/ventas/*" element={<VentaRouter />} />
                  <Route path="/pedidos/*" element={<PedidoRouter />} />
                  <Route path="/reportes/*" element={<ReporteRouter />} />
                </Routes>
              </main>
            </div>
          </>
        } />
      </Routes>
    </Router>
  );
};

export default AppRouter;
