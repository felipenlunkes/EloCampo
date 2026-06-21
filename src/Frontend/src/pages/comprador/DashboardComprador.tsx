import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SidebarComprador } from '../../components/layout/Sidebar'
import { buscarProdutos, buscarPedidos, buscarPedidoPorIdComprador, buscarProdutosPorVendedor, buscarAvaliacoesConta } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { OrderResponse, ProductResponse, OrderStatusEnum } from '../../types'

export default function DashboardComprador() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[]>();
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [totalPedidos, setTotalPedidos]   = useState(0)
  const [evaluation, setEvaluation] = useState<number>(0)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {

    const buyerId = session?.account?.id;

    buyerId &&
    Promise.allSettled([
      buscarProdutosPorVendedor(buyerId).then(p => setTotalProdutos(p.length)),
      buscarPedidoPorIdComprador(buyerId).then(p => {
        setOrders(p.content)
        console.log(p.content)
        console.log(p.content?.filter(o => OrderStatusEnum.PENDING === o.orderStatus).length)
        setTotalPedidos(p.totalElements)
      }),
    buscarAvaliacoesConta(buyerId).then((evaluations) => {
        if (evaluations && evaluations.length > 0) {
          const avg = evaluations.reduce((sum, e) => sum + e.stars, 0) / evaluations.length;
          setEvaluation(avg);
        } else {
          setEvaluation(0);
        }
      }),
    ]).finally(() => setLoading(false))

  }, [])

  return (
    <div className="app-shell">
      <SidebarComprador />
      <main className="main-content" style={{ background:'var(--buyer-bg)' }}>
        <div className="topbar" style={{ background:'var(--buyer-bg)', borderBottomColor:'var(--buyer-border)' }}>
          <div>
            <h2 className="topbar-title">Início</h2>
            <p className="topbar-sub" style={{ color:'#4a7090' }}>Olá, {session?.account?.name ?? session?.email}!</p>
            {session?.account?.businessName && (
              <p style={{ fontSize:11, color:'#4a7090', marginTop:1 }}>{session.account.businessName}</p>
            )}
          </div>
          <Link to="/comprador/produtos"><button className="btn btn-buyer">Buscar produtos</button></Link>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            {[
              { icon:'📦', val: loading ? '…' : totalProdutos, lbl:'Disponíveis', blue:true },
              { icon:'📋', val: loading ? '…' : totalPedidos,  lbl:'Meus pedidos', blue:true },
              { icon:'💬', val: loading ? '…' : orders?.filter(o => OrderStatusEnum.PENDING === o.orderStatus).length, lbl:'Em negociação', blue:true },
              { icon:'⭐', val: loading ? '…' : evaluation.toFixed(1), lbl:'Avaliações', gold:true },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ background:'var(--buyer-card)', borderColor:'var(--buyer-border)' }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                <div className={`stat-value ${s.blue?'blue':''}`} style={s.gold?{color:'var(--gold)'}:{}}>{s.val}</div>
                <div className="stat-label">{s.lbl}</div>
              </div>
            ))}
          </div>
          <div className="card buyer">
            <div className="card-title">
              Produtos disponíveis <Link to="/comprador/produtos" style={{ color:'var(--sky-l)', fontSize:12, fontWeight:400 }}>Ver todos →</Link>
            </div>
            <div className="empty">
              <div className="empty-icon">🔍</div>
              Use a seção <strong>Produtos</strong> para buscar e fazer pedidos.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
