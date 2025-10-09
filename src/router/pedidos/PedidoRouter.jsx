import { Routes, Route } from 'react-router-dom'

const PedidoRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<PedidoView />} />
      <Route path="/crear" element={<PedidoForm />} />
      <Route path="/editar/:id" element={<PedidoForm />} />
    </Routes>
  )
}

export default PedidoRouter