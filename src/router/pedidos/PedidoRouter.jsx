import { Routes, Route } from 'react-router-dom'
import PedidoView from './views/PedidoView'
import ListadoPesajesView from './views/ListadoPesajesView'

const PedidoRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<PedidoView />} />
      <Route path="/pesajes" element={<ListadoPesajesView />} />
    </Routes>
  )
}

export default PedidoRouter