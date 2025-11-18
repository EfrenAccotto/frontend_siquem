import { Routes, Route } from 'react-router-dom'
import PedidoView from './views/PedidoView'

const PedidoRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<PedidoView />} />
    </Routes>
  )
}

export default PedidoRouter