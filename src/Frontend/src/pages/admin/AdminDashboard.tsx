import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import api, { buscarTodasContas, buscarTodosPedidos, buscarTodosProdutos, buscarTodosUsuarios } from '../../services/api'
import type { AccountResponse } from '../../types'
import { PRODUCT_CATEGORY, ORDER_STATUS_LABEL, ACCOUNT_ROLE_LABEL } from '../../types'

type Aba = 'resumo' | 'usuarios' | 'produtos' | 'pedidos'
type Grafico = 'contas' | 'produtos' | 'pedidos'

type Granularity = 'day' | 'week' | 'month' | 'year'

function getGranularity(start: string, end: string): Granularity {
  const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  if (days <= 31)  return 'day'
  if (days <= 90)  return 'week'
  if (days <= 365) return 'month'
  return 'year'
}

function getBucketKey(date: Date, g: Granularity): string {
  if (g === 'year')  return String(date.getFullYear())
  if (g === 'month') return date.toISOString().slice(0, 7)
  if (g === 'day')   return date.toISOString().slice(0, 10)
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return d.toISOString().slice(0, 10)
}

function groupByPeriod(
  items: any[],
  getTs: (item: any) => number,
  filterFn: (item: any) => boolean,
  start: string,
  end: string,
  g: Granularity
): { date: string; count: number }[] {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end   + 'T23:59:59')
  const counts: Record<string, number> = {}
  if (g === 'day') {
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1))
      counts[getBucketKey(new Date(d), g)] = 0
  } else if (g === 'week') {
    const mon = new Date(s)
    const dow = mon.getDay()
    mon.setDate(mon.getDate() + (dow === 0 ? -6 : 1 - dow))
    for (let d = new Date(mon); d <= e; d.setDate(d.getDate() + 7))
      counts[getBucketKey(new Date(d), g)] = 0
  } else if (g === 'month') {
    const cur = new Date(s.getFullYear(), s.getMonth(), 1)
    const last = new Date(e.getFullYear(), e.getMonth(), 1)
    for (; cur <= last; cur.setMonth(cur.getMonth() + 1))
      counts[getBucketKey(new Date(cur), g)] = 0
  } else {
    for (let y = s.getFullYear(); y <= e.getFullYear(); y++)
      counts[String(y)] = 0
  }
  items.forEach(item => {
    if (!filterFn(item)) return
    const ts = getTs(item)
    if (!ts) return
    const dt = new Date(ts)
    if (dt < s || dt > e) return
    const key = getBucketKey(dt, g)
    if (key in counts) counts[key]++
  })
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

export default function AdminDashboard() {
  const { session, logout } = useAuth()
  const [aba, setAba]             = useState<Aba>('resumo')
  const [usuarios, setUsuarios]   = useState<any[]>([])
  const [produtos, setProdutos]   = useState<any[]>([])
  const [pedidos, setPedidos]     = useState<any[]>([])
  const [contas, setContas]       = useState<AccountResponse[]>([])
  const [loading, setLoading]     = useState(false)

  const [grafico, setGrafico]     = useState<Grafico>('contas')
  const [relStart, setRelStart]   = useState(() => new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10))
  const [relEnd,   setRelEnd]     = useState(() => new Date().toISOString().slice(0, 10))
  const [roleFilter,   setRoleFilter]   = useState<string[]>([])
  const [catFilter,    setCatFilter]    = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  const roleInit   = useRef(false)
  const catInit    = useRef(false)
  const statusInit = useRef(false)

  useEffect(() => {
    Promise.allSettled([
      buscarTodosUsuarios().then((a) => { setUsuarios(a); console.log(a) }),
      buscarTodosPedidos().then((o) => setPedidos(o)),
      buscarTodosProdutos().then((p) => setProdutos(p)),
      buscarTodasContas().then((a) => setContas(a)),
    ]).finally(() => setLoading(false))
  }, [])

  function mudarAba(a: Aba) { setAba(a) }

  async function handleDesativarUsuario(id: string) {
    if (!confirm('Desativar este usuário?')) return
    await api.put(`/v1/user/${id}/deactivate`)
    setUsuarios(u => u.map((x: any) => x.id === id ? { ...x, ativo: false } : x))
  }

  async function handleAtivarUsuario(id: string) {
    await api.put(`/v1/user/${id}/activate`)
    setUsuarios(u => u.map((x: any) => x.id === id ? { ...x, ativo: true } : x))
  }

  async function handleDeletarProduto(id: string) {
    if (!confirm('Remover este produto permanentemente?')) return
    await api.delete(`/v1/product/${id}`)
    setProdutos(p => p.filter((x: any) => x.id !== id))
  }

  const roleOptions   = useMemo(() => [...new Set(contas.map(c => c.role))],                [contas])
  const catOptions    = useMemo(() => [...new Set(produtos.map((p: any) => p.category))],   [produtos])
  const statusOptions = useMemo(() => [...new Set(pedidos.map((p: any) => p.orderStatus))], [pedidos])

  useEffect(() => { if (roleOptions.length   > 0 && !roleInit.current)   { roleInit.current   = true; setRoleFilter(roleOptions)   } }, [roleOptions])
  useEffect(() => { if (catOptions.length    > 0 && !catInit.current)    { catInit.current    = true; setCatFilter(catOptions)     } }, [catOptions])
  useEffect(() => { if (statusOptions.length > 0 && !statusInit.current) { statusInit.current = true; setStatusFilter(statusOptions) } }, [statusOptions])

  const granularity = getGranularity(relStart, relEnd)

  const contaChartData = useMemo(() =>
    groupByPeriod(contas, (c: AccountResponse) => c.createdAt,
      (c: AccountResponse) => roleFilter.includes(c.role),
      relStart, relEnd, granularity),
    [contas, roleFilter, relStart, relEnd, granularity])

  const produtoChartData = useMemo(() =>
    groupByPeriod(produtos, (p: any) => p.createdAt,
      (p: any) => catFilter.includes(p.category),
      relStart, relEnd, granularity),
    [produtos, catFilter, relStart, relEnd, granularity])

  const pedidoChartData = useMemo(() =>
    groupByPeriod(pedidos, (p: any) => p.createdAt,
      (p: any) => statusFilter.includes(p.orderStatus),
      relStart, relEnd, granularity),
    [pedidos, statusFilter, relStart, relEnd, granularity])

  const roleLabeledOptions   = useMemo(() => roleOptions.map(v => ({ value: v, label: ACCOUNT_ROLE_LABEL[v as keyof typeof ACCOUNT_ROLE_LABEL] ?? v })),   [roleOptions])
  const catLabeledOptions    = useMemo(() => catOptions.map(v => ({ value: v, label: PRODUCT_CATEGORY.find(c => c.v === v)?.label ?? v })),                [catOptions])
  const statusLabeledOptions = useMemo(() => statusOptions.map(v => ({ value: v, label: ORDER_STATUS_LABEL[v as keyof typeof ORDER_STATUS_LABEL] ?? v })), [statusOptions])

  const activeLabeledOptions = grafico === 'contas' ? roleLabeledOptions : grafico === 'produtos' ? catLabeledOptions : statusLabeledOptions
  const activeFilter         = grafico === 'contas' ? roleFilter         : grafico === 'produtos' ? catFilter        : statusFilter
  const activeChartData      = grafico === 'contas' ? contaChartData     : grafico === 'produtos' ? produtoChartData : pedidoChartData

  function toggleActiveFilter(opt: string) {
    const toggle = (f: string[]) => f.includes(opt) ? f.filter(x => x !== opt) : [...f, opt]
    if (grafico === 'contas') setRoleFilter(toggle)
    else if (grafico === 'produtos') setCatFilter(toggle)
    else setStatusFilter(toggle)
  }

  function selectAllActiveFilter() {
    if (grafico === 'contas') setRoleFilter([...roleOptions])
    else if (grafico === 'produtos') setCatFilter([...catOptions])
    else setStatusFilter([...statusOptions])
  }

  const th = { textAlign:'left' as const, padding:'6px 10px', fontSize:10, color:'#888', fontWeight:500 as const, borderBottom:'0.5px solid #2a4a2c', background:'#0f1f10' }
  const td = { padding:'8px 10px', fontSize:11, borderBottom:'0.5px solid #1a2e1c', verticalAlign:'middle' as const }

  return (
    <div style={{ minHeight:'100vh', background:'#080e08', fontFamily:'var(--font-sans)', color:'#e8f5e9' }}>

      <div style={{ background:'#0b1f0c', borderBottom:'0.5px solid #1b341d', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:900, color:'#a8dca9' }}>
            Elo<span style={{ color:'#e8b84b' }}>Campo</span>
            <span style={{ fontSize:10, background:'#e8b84b', color:'#1a1000', borderRadius:4, padding:'2px 6px', marginLeft:8, fontFamily:'var(--font-sans)', fontWeight:700 }}>ADMIN</span>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {([['resumo','📊','Resumo'],['usuarios','👥','Gerenciar Usuários'],['produtos','📦','Gerenciar Produtos'],['pedidos','🤝','Gerenciar Pedidos']] as [Aba,string,string][]).map(([id,icon,label]) => (
              <button key={id} onClick={() => mudarAba(id)}
                style={{ padding:'6px 14px', borderRadius:7, border:'0.5px solid', fontSize:11, fontWeight:500, cursor:'pointer', background:aba===id?'#1b341d':'transparent', borderColor:aba===id?'#2f6433':'#1b341d', color:aba===id?'#a8dca9':'#6a9a6c', display:'flex', alignItems:'center', gap:5 }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, color:'#6a9a6c' }}>{session?.email}</span>
          <button onClick={logout} style={{ padding:'5px 12px', borderRadius:6, border:'0.5px solid #7a2020', background:'#3a1010', color:'#e07070', fontSize:11, cursor:'pointer' }}>Sair</button>
        </div>
      </div>

      <div style={{ padding:'24px 28px' }}>

        {aba === 'resumo' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:900, marginBottom:20, color:'#a8dca9' }}>Painel Administrativo</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
              {[
                { icon:'👥', label:'Usuários', val:usuarios.length },
                { icon:'📦', label:'Produtos', val:produtos.length },
                { icon:'🤝', label:'Pedidos', val:pedidos.length },
              ].map(s => (
                <div key={s.label} style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', borderRadius:10, padding:16, textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:900, color:'#6dbf74' }}>{s.val}</div>
                  <div style={{ fontSize:10, color:'#6a9a6c', marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:900, marginBottom:16, color:'#a8dca9' }}>Relatórios</h2>

            <div style={{ display:'flex', gap:4, marginBottom:16 }}>
              {([['contas','👥','Registros de Usuários'],['produtos','📦','Registros de Produtos'],['pedidos','🤝','Registros de Pedidos']] as [Grafico,string,string][]).map(([id,icon,label]) => (
                <button key={id} onClick={() => setGrafico(id)}
                  style={{ padding:'5px 14px', borderRadius:7, border:'0.5px solid', fontSize:11, fontWeight:500, cursor:'pointer',
                    background: grafico===id ? '#1b341d' : 'transparent',
                    borderColor: grafico===id ? '#2f6433' : '#1b341d',
                    color: grafico===id ? '#a8dca9' : '#6a9a6c', display:'flex', alignItems:'center', gap:5 }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#6a9a6c' }}>Período:</span>
              <input type="date" value={relStart} onChange={e => setRelStart(e.target.value)}
                style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', color:'#e8f5e9', borderRadius:6, padding:'4px 8px', fontSize:11 }} />
              <span style={{ fontSize:11, color:'#6a9a6c' }}>até</span>
              <input type="date" value={relEnd} onChange={e => setRelEnd(e.target.value)}
                style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', color:'#e8f5e9', borderRadius:6, padding:'4px 8px', fontSize:11 }} />
              <span style={{ fontSize:10, color:'#e8b84b', border:'0.5px solid #b8882b', borderRadius:5, padding:'2px 8px', background:'#2e2410' }}>
                {granularity === 'day' ? 'por dia' : granularity === 'week' ? 'por semana' : granularity === 'month' ? 'por mês' : 'por ano'}
              </span>
              {activeLabeledOptions.length > 0 && (
                <span style={{ width:1, height:16, background:'#2a4a2c', display:'inline-block', margin:'0 2px' }} />
              )}
              {activeLabeledOptions.map(({ value, label }) => (
                <label key={value} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, cursor:'pointer',
                  color: activeFilter.includes(value) ? '#e8b84b' : '#6a9a6c',
                  border: `0.5px solid ${activeFilter.includes(value) ? '#b8882b' : '#2a4a2c'}`,
                  borderRadius:5, padding:'2px 8px',
                  background: activeFilter.includes(value) ? '#2e2410' : 'transparent' }}>
                  <input type="checkbox" style={{ display:'none' }}
                    checked={activeFilter.includes(value)}
                    onChange={() => toggleActiveFilter(value)} />
                  {label}
                </label>
              ))}
              {activeFilter.length < activeLabeledOptions.length && (
                <button onClick={selectAllActiveFilter}
                  style={{ fontSize:10, color:'#6a9a6c', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                  Todos
                </button>
              )}
            </div>

            <div style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', borderRadius:10, padding:'16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activeChartData} margin={{ top:22, right:12, left:0, bottom:52 }}>
                  <XAxis dataKey="date" tick={{ fill:'#6a9a6c', fontSize:9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill:'#6a9a6c', fontSize:10 }} width={28} />
                  <Tooltip contentStyle={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', color:'#e8f5e9', fontSize:11 }} />
                  <Bar dataKey="count" fill="#6dbf74" radius={[4,4,0,0]}>
                    <LabelList dataKey="count" position="top" style={{ fill:'#a8dca9', fontSize:10, fontWeight:600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === 'usuarios' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:900, marginBottom:16, color:'#a8dca9' }}>Usuários cadastrados</h2>
            {loading && <div style={{ color:'#6a9a6c', textAlign:'center', padding:40 }}>Carregando...</div>}
            {!loading && (
              <div style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', borderRadius:10, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['E-mail','Admin','Criado em','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {usuarios.map((u: any) => (
                      <tr key={u.id}>
                        <td style={{ ...td, color:'#a8c5aa' }}>{u.email}</td>
                        <td style={td}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, background:u.isAdmin?'#2e2410':'#122114', color:u.isAdmin?'#e8b84b':'#6dbf74', border:`0.5px solid ${u.isAdmin?'#b8882b':'#264d29'}` }}>{u.isAdmin?'Admin':'Usuário'}</span></td>
                        <td style={{ ...td, color:'#6a9a6c', fontSize:10 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={td}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => handleDesativarUsuario(u.id)} style={{ padding:'3px 10px', borderRadius:5, border:'0.5px solid #7a2020', background:'#3a1010', color:'#e07070', fontSize:10, cursor:'pointer' }}>Desativar</button>
                            <button onClick={() => handleAtivarUsuario(u.id)} style={{ padding:'3px 10px', borderRadius:5, border:'0.5px solid #264d29', background:'#122114', color:'#6dbf74', fontSize:10, cursor:'pointer' }}>Ativar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuarios.length === 0 && <div style={{ textAlign:'center', padding:32, color:'#6a9a6c', fontSize:12 }}>Nenhum usuário encontrado.</div>}
              </div>
            )}
          </div>
        )}

        {aba === 'produtos' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:900, marginBottom:16, color:'#a8dca9' }}>Todos os produtos</h2>
            {loading && <div style={{ color:'#6a9a6c', textAlign:'center', padding:40 }}>Carregando...</div>}
            {!loading && (
              <div style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', borderRadius:10, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Descrição','Categoria','Escala','Preço','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {produtos.map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ ...td, fontWeight:500, color:'#e8f5e9' }}>{p.description}</td>
                        <td style={{ ...td, color:'#a8c5aa' }}>{p.category}</td>
                        <td style={td}><span className="tag tag-gold">{p.scale}</span></td>
                        <td style={{ ...td, color:'#6dbf74', fontWeight:500 }}>R$ {Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td style={td}>
                          <button onClick={() => handleDeletarProduto(p.id)} style={{ padding:'3px 10px', borderRadius:5, border:'0.5px solid #7a2020', background:'#3a1010', color:'#e07070', fontSize:10, cursor:'pointer' }}>Remover</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {produtos.length === 0 && <div style={{ textAlign:'center', padding:32, color:'#6a9a6c', fontSize:12 }}>Nenhum produto encontrado.</div>}
              </div>
            )}
          </div>
        )}

        {aba === 'pedidos' && (
          <div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:900, marginBottom:16, color:'#a8dca9' }}>Todos os pedidos</h2>
            {loading && <div style={{ color:'#6a9a6c', textAlign:'center', padding:40 }}>Carregando...</div>}
            {!loading && (
              <div style={{ background:'#1a2e1c', border:'0.5px solid #2a4a2c', borderRadius:10, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['ID','Status','Valor','Criado em'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pedidos.map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ ...td, color:'#6a9a6c', fontSize:10, fontFamily:'monospace' }}>{String(p.id).substring(0, 12)}…</td>
                        <td style={td}><span className="tag tag-gold">{p.orderStatus}</span></td>
                        <td style={{ ...td, color:'#6dbf74', fontWeight:500 }}>R$ {Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td style={{ ...td, color:'#6a9a6c', fontSize:10 }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pedidos.length === 0 && <div style={{ textAlign:'center', padding:32, color:'#6a9a6c', fontSize:12 }}>Nenhum pedido encontrado.</div>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
