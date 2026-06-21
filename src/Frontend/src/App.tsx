import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import Login    from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'

import DashboardProdutor from './pages/produtor/DashboardProdutor'
import MeusProdutos      from './pages/produtor/MeusProdutos'
import MinhasVendas      from './pages/produtor/MinhasVendas'
import PerfilProdutor    from './pages/produtor/PerfilProdutor'

import DashboardComprador from './pages/comprador/DashboardComprador'
import BuscarProdutos     from './pages/comprador/BuscarProdutos'
import MeusPedidos        from './pages/comprador/MeusPedidos'
import PerfilEmpresa      from './pages/comprador/PerfilEmpresa'

import AdminDashboard from './pages/admin/AdminDashboard'

// role: 'VENDOR' | 'BUYER' | 'ADMIN'
function Protected({ children, role }: { children: JSX.Element; role?: string }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0d1a0e', color:'#6dbf74' }}>Carregando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (role === 'ADMIN' && !session.isAdmin) return <Navigate to="/" replace />
  if (role === 'VENDOR' && session.account?.role !== 'VENDOR') return <Navigate to="/" replace />
  if (role === 'BUYER'  && session.account?.role !== 'BUYER')  return <Navigate to="/" replace />
  return children
}

function Root() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (session.isAdmin) return <Navigate to="/admin" replace />
  if (session.account?.role === 'VENDOR') return <Navigate to="/produtor/dashboard" replace />
  if (session.account?.role === 'BUYER')  return <Navigate to="/comprador/dashboard" replace />
  return <Navigate to="/cadastro" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Root />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/produtor/dashboard" element={<Protected role="VENDOR"><DashboardProdutor /></Protected>} />
          <Route path="/produtor/produtos"  element={<Protected role="VENDOR"><MeusProdutos /></Protected>} />
          <Route path="/produtor/vendas"    element={<Protected role="VENDOR"><MinhasVendas /></Protected>} />
          <Route path="/produtor/perfil"    element={<Protected role="VENDOR"><PerfilProdutor /></Protected>} />

          <Route path="/comprador/dashboard" element={<Protected role="BUYER"><DashboardComprador /></Protected>} />
          <Route path="/comprador/produtos"  element={<Protected role="BUYER"><BuscarProdutos /></Protected>} />
          <Route path="/comprador/pedidos"   element={<Protected role="BUYER"><MeusPedidos /></Protected>} />
          <Route path="/comprador/perfil"    element={<Protected role="BUYER"><PerfilEmpresa /></Protected>} />

          <Route path="/admin" element={<Protected role="ADMIN"><AdminDashboard /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
