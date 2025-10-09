import { Card } from 'primereact/card';
import indexImg from '@/assets/img/index.png';

const Inicio = () => {
  return (
    <div className="flex align-items-center justify-content-center min-h-screen p-4">
      <Card className="text-center shadow-2 border-round">
        <h2 className="text-4xl font-bold text-primary mb-3">
          Bienvenido a Cooperativa La Soberana
        </h2>
        <p className="text-600 text-lg mb-4">
          Gestiona tus productos, ventas, pedidos y clientes de forma eficiente
        </p>

        <div className="flex justify-content-center">
          <img
            src={indexImg}
            alt="Cooperativa La Soberana"
            className="border-round shadow-2 w-12 md:w-8 lg:w-6"
          />
        </div>
      </Card>
    </div>
  );
};

export default Inicio;
