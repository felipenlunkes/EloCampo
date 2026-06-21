import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navProdutor = [
  { to: '/produtor/dashboard', icon: '🏠', label: 'Início' },
  { to: '/produtor/produtos',  icon: '🌾', label: 'Meus Produtos' },
  { to: '/produtor/vendas',    icon: '📦', label: 'Minhas Vendas' },
  { to: '/produtor/perfil',    icon: '👤', label: 'Perfil' },
]

const navComprador = [
  { to: '/comprador/dashboard', icon: '🏠', label: 'Início' },
  { to: '/comprador/produtos',  icon: '🔍', label: 'Produtos' },
  { to: '/comprador/pedidos',   icon: '📋', label: 'Meus Pedidos' },
  { to: '/comprador/perfil',    icon: '🏢', label: 'Perfil' },
]

function SidebarBase({ items, buyer }: { items: typeof navProdutor; buyer?: boolean }) {
  const { session, logout } = useAuth()
  return (
    <aside className={`sidebar${buyer ? ' buyer' : ''}`}>
      <span className="sidebar-logo">Elo<span>Campo</span></span>
      <nav className="sidebar-nav">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item${buyer ? ' buyer' : ''}${isActive ? ' ativo' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="nav-sep" />
        <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text4)' }}>
          {session?.account?.name ?? session?.email}
        </div>
        <button
          onClick={logout}
          style={{ all:'unset', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, fontSize:13, fontWeight:500, color:'#e07070', cursor:'pointer', width:'100%', background:'#3a1010', border:'0.5px solid #7a2020', marginTop:4 }}
        >
          <span className="nav-icon">↩</span>
          Sair
        </button>
      </nav>
    </aside>
  )
}

export function SidebarProdutor() { return <SidebarBase items={navProdutor} /> }
export function SidebarComprador() { return <SidebarBase items={navComprador} buyer /> }
