import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClienteRouter from './clientes/ClienteRouter';
import ProductoRouter from './productos/ProductoRouter';
import VentaRouter from './ventas/VentaRouter';
import PedidoRouter from './pedidos/PedidoRouter';
import InicioRouter from "./inicio/InicioRouter";
import ReporteRouter from "./reportes/ReporteRouter";
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import '../assets/css/footer.css';

const AppRouter = () => {
  return (
    <Router>
      {/* Navbar y Sidebar se renderizan SIEMPRE */}
      <Navbar />
      <div className="flex">
        <Sidebar />

        {/* Contenedor principal de las rutas */}
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

    </Router>
  );
};

export default AppRouter;
