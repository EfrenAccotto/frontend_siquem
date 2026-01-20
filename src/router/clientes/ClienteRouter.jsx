import { Routes, Route } from 'react-router-dom'
import ClienteView from './views/ClienteView'

const ClienteRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ClienteView />} />
    </Routes>
  )
}

export default ClienteRouter