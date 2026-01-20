import { Routes, Route } from 'react-router-dom'
import InicioView from './views/InicioView'

const InicioRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<InicioView />} />
    </Routes>
  )
}

export default InicioRouter