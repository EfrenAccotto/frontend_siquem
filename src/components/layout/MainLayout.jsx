import Sidebar from './Sidebar'
import Navbar from './Navbar'
import './MainLayout.css'

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout-container bg-gray-50">
      <Sidebar />
      <div className="main-layout-content">
        <div className="main-layout-navbar">
          <Navbar />
        </div>
        <main className="main-layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout