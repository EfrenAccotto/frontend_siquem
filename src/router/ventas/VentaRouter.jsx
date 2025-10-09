import { Routes, Route } from 'react-router-dom'
import VentaTable from './components/VentasTable'

const VentaRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<VentaTable />} />
    </Routes>
  )
}

export default VentaRouter