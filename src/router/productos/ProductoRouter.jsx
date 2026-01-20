import { Routes, Route } from 'react-router-dom'
import ProductoView from './views/ProductoView'

const ProductoRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductoView />} />
    </Routes>
  )
}

export default ProductoRouter