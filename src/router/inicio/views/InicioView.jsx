import { Card } from 'primereact/card';
import indexImg from '@/assets/img/index.png';
import '../components/inicio.css';

const Inicio = () => {
  return (
    <div className="inicio-container">
      <Card className="text-center shadow-2 border-round inicio-card">
        <h2 className="text-4xl font-bold text-primary mb-3">
          Cooperativa La Soberana
        </h2>
        <h3 className='mb-3'>Software de Gestión</h3>
        <p className="text-600 text-md mb-4">
          Gestiona tus productos, ventas, pedidos y clientes de forma eficiente
        </p>

        <div className="flex justify-content-center">
          <img
            src={indexImg}
            alt="Cooperativa La Soberana"
            className="border-round inicio-image"
          />
        </div>
        <div className="flex justify-content-center p-3">
          © 2025 – PampaCode · Todos los derechos reservados.
        </div>
      </Card>
    </div>
  );
};

export default Inicio;
