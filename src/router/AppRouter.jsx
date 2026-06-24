import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Loader from '../components/ux/Loader';
import '../assets/css/footer.css';

const ClienteRouter = lazy(() => import('./clientes/ClienteRouter'));
const ProductoRouter = lazy(() => import('./productos/ProductoRouter'));
const VentaRouter = lazy(() => import('./ventas/VentaRouter'));
const PedidoRouter = lazy(() => import('./pedidos/PedidoRouter'));
const InicioView = lazy(() => import('./inicio/views/InicioView'));
const ReporteRouter = lazy(() => import('./reportes/ReporteRouter'));
const ListadoPesajesView = lazy(() => import('./pedidos/views/ListadoPesajesView'));

const RouteFallback = () => (
  <div className="flex justify-content-center align-items-center min-h-screen">
    <Loader />
  </div>
);

const AppRouter = () => (
  <Router>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/operario/pesajes" element={<ListadoPesajesView />} />

        <Route path="/*" element={
          <>
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-4">
                <Routes>
                  <Route path="/" element={<InicioView />} />
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
    </Suspense>
  </Router>
);

export default AppRouter;
