import { Routes, Route } from 'react-router-dom'
import ProductoView from './views/ProductoView'

const ProductoRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductoView />} />
      <Route path="/crear" element={<ProductoForm />} />
      <Route path="/editar/:id" element={<ProductoForm />} />
    </Routes>
  )
}

export default ProductoRouter