import { Routes, Route } from 'react-router-dom'
import VentaTable from './components/VentasTable'
import VentaView from './views/VentaView'

const VentaRouter = () => {
  return (
    <Routes>
  <Route path="/" element={<VentaView />} />
    </Routes>
  )
}

export default VentaRouter