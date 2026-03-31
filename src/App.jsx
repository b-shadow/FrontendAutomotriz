import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import RegistrarEmpresa from './pages/RegistrarEmpresa'
import ListarEmpresas from './pages/ListarEmpresas'
import LoginTenant from './pages/LoginTenant'
import RegistroTenant from './pages/RegistroTenant'
import RecuperarPasswordTenant from './pages/RecuperarPasswordTenant'
import TenantDashboard from './pages/TenantDashboard'
import TenantResolver from './components/TenantResolver'
import TenantGuard from './components/TenantGuard'

/**
 * Layout para rutas de tenant (/:tenantSlug/*)
 * Resuelve el tenant y lo proporciona via contexto
 */
const TenantLayout = () => {
  return (
    <TenantResolver>
      <Outlet />
    </TenantResolver>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== RUTAS GLOBALES / HOME ===== */}
        <Route path="/" element={<Home />} />
        
        {/* Registro de nueva empresa (multi-paso wizard) */}
        <Route path="/empresas/nueva" element={<RegistrarEmpresa />} />
        
        {/* Listado público de empresas */}
        <Route path="/empresas" element={<ListarEmpresas />} />

        {/* ===== RUTAS POR TENANT ===== */}
        {/* Layout que resuelve tenant por slug */}
        <Route element={<TenantLayout />}>
          {/* Login por tenant */}
          <Route path="/:tenantSlug/login" element={<LoginTenant />} />
          
          {/* Registro de nuevo usuario en tenant */}
          <Route path="/:tenantSlug/registro" element={<RegistroTenant />} />
          
          {/* Recuperar contraseña */}
          <Route path="/:tenantSlug/forgot-password" element={<RecuperarPasswordTenant />} />
          
          {/* Dashboard tenant (protegido) */}
          <Route
            path="/:tenantSlug/app"
            element={
              <TenantGuard>
                <TenantDashboard />
              </TenantGuard>
            }
          />
        </Route>

        {/* Catch-all - redirige a home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
