import { useState, useEffect, useRef, type FormEvent } from 'react'
import { SidebarProdutor } from '../../components/layout/Sidebar'
import { buscarContaPorUsuario, atualizarConta, buscarArquivosPorEntidade, uploadArquivo, deletarArquivo } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { AccountResponse, FileUploadResponse } from '../../types'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function PerfilProdutor() {
  const { session, setSession } = useAuth()
  const [conta, setConta]       = useState<AccountResponse | null>(null)
  const [form, setForm]         = useState({
    name: '', businessName: '', cpf: '', cnpj: '',
    ddi: '55', ddd: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [senhas, setSenhas]     = useState({ atual:'', nova:'', confirmar:'' })
  const [sucDados, setSucDados] = useState(false)
  const [sucSenha, setSucSenha] = useState(false)
  const [erroDados, setErroDados] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [loading, setLoading]   = useState(false)
  const [fotoPerfil, setFotoPerfil] = useState<FileUploadResponse | null>(null)
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.userId) return
    buscarContaPorUsuario(session.userId).then(c => {
      setConta(c)
      buscarArquivosPorEntidade('PROFILE', c.id).then(imgs => setFotoPerfil(imgs[0] ?? null)).catch(() => {})
      setForm({
        name:         c.name ?? '',
        businessName: c.businessName ?? '',
        cpf:          c.cpf ?? '',
        cnpj:         c.cnpj ?? '',
        ddi:          String(c.phone?.countryCode ?? '55'),
        ddd:          String(c.phone?.stateCode ?? ''),
        telefone:     c.phone?.number ?? '',
        cep:          c.address?.postalCode ?? '',
        rua:          c.address?.street ?? '',
        numero:       c.address?.number ?? '',
        complemento:  c.address?.complement ?? '',
        bairro:       c.address?.district ?? '',
        cidade:       c.address?.city ?? '',
        estado:       c.address?.state ?? '',
      })
    }).catch(() => {})
  }, [session?.userId])

  async function handleDados(e: FormEvent) {
    e.preventDefault()
    if (!conta || !session?.userId) return
    setErroDados(''); setSucDados(false); setLoading(true)
    try {
      const atualizada = await atualizarConta(conta.id, {
        userId:        session.userId,
        name:          form.name,
        businessName:  form.businessName || undefined,
        cpf:           form.cpf || undefined,
        cnpj:          form.cnpj || undefined,
        birthdayDate:  conta.birthdayDate,
        phone:         { countryCode: parseInt(form.ddi, 10), stateCode: parseInt(form.ddd, 10), number: form.telefone },
        address:       { postalCode:form.cep, street:form.rua, number:form.numero, complement:form.complemento, district:form.bairro, city:form.cidade, state:form.estado },
        role:          conta.role,
      })
      setConta(atualizada)
      if (session) setSession({ ...session, account: atualizada })
      setSucDados(true)
    } catch (err: any) {
      setErroDados(err.response?.data?.message ?? 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !conta) return
    setUploadandoFoto(true)
    try {
      if (fotoPerfil) await deletarArquivo(fotoPerfil.id)
      const nova = await uploadArquivo(file, 'PROFILE', conta.id)
      setFotoPerfil(nova)
    } catch {}
    finally { setUploadandoFoto(false); e.target.value = '' }
  }

  async function handleDeletarFoto() {
    if (!fotoPerfil) return
    await deletarArquivo(fotoPerfil.id)
    setFotoPerfil(null)
  }

  async function handleSenha(e: FormEvent) {
    e.preventDefault()
    setErroSenha(''); setSucSenha(false)
    if (senhas.nova !== senhas.confirmar) { setErroSenha('As senhas não coincidem'); return }
    if (senhas.nova.length < 8) { setErroSenha('Nova senha deve ter ao menos 8 caracteres'); return }
    setSucSenha(true)
    setSenhas({ atual:'', nova:'', confirmar:'' })
  }

  const inp: React.CSSProperties = { width:'100%',height:32,background:'#111f12',border:'0.5px solid #2a4a2c',borderRadius:7,padding:'0 10px',fontSize:12,color:'#a8dca9',outline:'none' }
  const lbl: React.CSSProperties = { fontSize:10,fontWeight:600,color:'#6a9a6c',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:4 }
  const fg:  React.CSSProperties = { marginBottom:10 }

  return (
    <div className="app-shell">
      <SidebarProdutor />
      <main className="main-content">
        <div className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              {fotoPerfil
                ? <img src={fotoPerfil.secureUrl} alt="" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--g600)' }} />
                : <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--g800)', border:'2px solid var(--g600)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'var(--g400)' }}>
                    {(session?.account?.name ?? session?.email ?? '?')[0].toUpperCase()}
                  </div>
              }
              <button
                onClick={() => fotoRef.current?.click()}
                disabled={uploadandoFoto}
                title="Alterar foto"
                style={{ position:'absolute', bottom:0, right:0, width:20, height:20, borderRadius:'50%', background:'var(--g700)', border:'1px solid var(--g500)', color:'var(--g300)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}
              >{uploadandoFoto ? '…' : '📷'}</button>
              {fotoPerfil && (
                <button
                  onClick={handleDeletarFoto}
                  title="Remover foto"
                  style={{ position:'absolute', top:0, right:0, width:16, height:16, borderRadius:'50%', background:'#e07070', border:'none', color:'#fff', fontSize:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}
                >✕</button>
              )}
              <input ref={fotoRef} type="file" accept="image/jpeg,image/png" style={{ display:'none' }} onChange={handleUploadFoto} />
            </div>
            <div>
              <h2 className="topbar-title">Meu Perfil</h2>
              <p className="topbar-sub">{session?.account?.name ?? session?.email}</p>
              {session?.account?.businessName && (
                <p style={{ fontSize:11, color:'#3d6b3f', marginTop:1 }}>{session.account.businessName}</p>
              )}
            </div>
          </div>
        </div>

        <div className="page-body">

          <form onSubmit={handleDados}>
            <div className="card">
              <div className="card-title">Dados da conta</div>
              {sucDados && <div className="alert alert-success">✅ Dados salvos!</div>}
              {erroDados && <div className="alert alert-danger">{erroDados}</div>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
                <div style={fg}><label style={lbl}>Nome completo</label><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
                <div style={fg}><label style={lbl}>Razão social</label><input style={inp} value={form.businessName} onChange={e=>setForm(f=>({...f,businessName:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
                <div style={fg}><label style={lbl}>CPF</label><input style={inp} value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:e.target.value}))} /></div>
                <div style={fg}><label style={lbl}>CNPJ</label><input style={inp} value={form.cnpj} onChange={e=>setForm(f=>({...f,cnpj:e.target.value}))} /></div>
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={lbl}>Telefone</label>
                <div style={{ display:'grid', gridTemplateColumns:'52px 60px 1fr', gap:6 }}>
                  <input style={inp} value={form.ddi} onChange={e=>setForm(f=>({...f,ddi:e.target.value}))} placeholder="+55" title="DDI" />
                  <input style={inp} value={form.ddd} onChange={e=>setForm(f=>({...f,ddd:e.target.value}))} placeholder="DDD" title="DDD" />
                  <input style={inp} value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} placeholder="99999-9999" />
                </div>
              </div>

              <div style={{ fontSize:10, fontWeight:600, color:'#3d6b3f', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, marginTop:4 }}>Endereço</div>

              <div style={{ display:'grid', gridTemplateColumns:'110px 1fr', gap:10, marginBottom:10 }}>
                <div style={fg}><label style={lbl}>CEP</label><input style={inp} value={form.cep} onChange={e=>setForm(f=>({...f,cep:e.target.value}))} /></div>
                <div style={fg}><label style={lbl}>Rua</label><input style={inp} value={form.rua} onChange={e=>setForm(f=>({...f,rua:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:10, marginBottom:10 }}>
                <div style={fg}><label style={lbl}>Número</label><input style={inp} value={form.numero} onChange={e=>setForm(f=>({...f,numero:e.target.value}))} /></div>
                <div style={fg}><label style={lbl}>Complemento</label><input style={inp} value={form.complemento} onChange={e=>setForm(f=>({...f,complemento:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div style={fg}><label style={lbl}>Bairro</label><input style={inp} value={form.bairro} onChange={e=>setForm(f=>({...f,bairro:e.target.value}))} /></div>
                <div style={fg}><label style={lbl}>Cidade</label><input style={inp} value={form.cidade} onChange={e=>setForm(f=>({...f,cidade:e.target.value}))} /></div>
              </div>
              <div style={fg}>
                <label style={lbl}>Estado (UF)</label>
                <select style={{...inp,width:80,appearance:'none'}} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                  <option value="">UF</option>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-prim" disabled={loading}>{loading?'Salvando...':'Salvar alterações'}</button>
            </div>
          </form>

          <form onSubmit={handleSenha}>
            <div className="card">
              <div className="card-title">Trocar senha</div>
              {sucSenha && <div className="alert alert-success">✅ Senha atualizada!</div>}
              {erroSenha && <div className="alert alert-danger">{erroSenha}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <div style={fg}><label style={lbl}>Senha atual</label><input style={inp} type="password" value={senhas.atual} onChange={e=>setSenhas(s=>({...s,atual:e.target.value}))} autoComplete="current-password" /></div>
                <div style={fg}><label style={lbl}>Nova senha</label><input style={inp} type="password" value={senhas.nova} onChange={e=>setSenhas(s=>({...s,nova:e.target.value}))} autoComplete="new-password" /></div>
                <div style={fg}><label style={lbl}>Confirmar nova senha</label><input style={inp} type="password" value={senhas.confirmar} onChange={e=>setSenhas(s=>({...s,confirmar:e.target.value}))} autoComplete="new-password" /></div>
              </div>
              <button type="submit" className="btn btn-prim">Atualizar senha</button>
            </div>
          </form>

        </div>
      </main>
    </div>
  )
}
