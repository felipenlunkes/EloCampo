import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { gerarToken, buscarContaPorUsuario, resetarSenha, criarUsuario } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthSession, AccountRole } from '../../types'

function decodeJwt(token: string): { sub: string; email: string; isAdmin: boolean } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

const FEATURES = [
  'Publique produtos e receba pedidos de compradores verificados',
  'Negocie diretamente com chat integrado entre produtor e comprador',
  'Gerencie seu catálogo e acompanhe o status de cada venda',
  'Contratos e pagamentos com segurança e rastreabilidade',
  'Sistema de avaliações para construir reputação na plataforma',
]

export default function Login() {
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [lembrar, setLembrar] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)

  // Cadastro rápido (etapa 1)
  const [role, setRole]     = useState<AccountRole>('VENDOR')
  const [reg, setReg]       = useState({ nome:'', email:'', senha:'', confirmar:'' })
  const [termos, setTermos] = useState(false)
  const [erroReg, setErroReg]     = useState('')
  const [loadingReg, setLoadingReg] = useState(false)

  // Recuperação de senha
  const [showReset, setShowReset]     = useState(false)
  const [resetEmail, setResetEmail]   = useState('')
  const [resetStatus, setResetStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [resetErro, setResetErro]     = useState('')

  // Handlers
  
  async function handleLogin(e: FormEvent) {
   
    e.preventDefault()
    setErroLogin(''); setLoadingLogin(true)
    try {
      const { token } = await gerarToken(email, senha)
      const payload = decodeJwt(token)
      if (!payload) throw new Error('Token inválido recebido do servidor')
      localStorage.setItem('ec_token', token)
      let account
      try { account = await buscarContaPorUsuario(payload.sub) } catch { /* sem conta */ }
      const session: AuthSession = { token, userId: payload.sub, email: payload.email, isAdmin: payload.isAdmin, account }
      setSession(session)
      if (payload.isAdmin)              navigate('/admin')
      else if (account?.role === 'VENDOR') navigate('/produtor/dashboard')
      else if (account?.role === 'BUYER')  navigate('/comprador/dashboard')
      else                              navigate('/cadastro')
    } catch (err: any) {
      localStorage.removeItem('ec_token')
      setErroLogin(err.response?.data?.message ?? err.message ?? 'Usuário ou senha incorretos')
    } finally { setLoadingLogin(false) }
  }

  async function handleCadastro(e: FormEvent) {
    e.preventDefault()
    if (!termos)                         { setErroReg('Aceite os termos para continuar'); return }
    if (reg.senha !== reg.confirmar)     { setErroReg('As senhas não coincidem'); return }
    if (reg.senha.length < 8)            { setErroReg('A senha deve ter ao menos 8 caracteres'); return }
    setErroReg(''); setLoadingReg(true)
    try {
      const user = await criarUsuario({ email: reg.email, password: reg.senha, isAdmin: false })
      navigate('/cadastro', { state: { fromLogin: true, userId: user.id, role, nome: reg.nome, email: reg.email, senha: reg.senha } })
    } catch (err: any) {
      setErroReg(err.response?.data?.message ?? 'Erro ao criar usuário')
    } finally { setLoadingReg(false) }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    setResetErro(''); setResetStatus('loading')
    try {
      await resetarSenha(resetEmail)
      setResetStatus('success')
    } catch (err: any) {
      setResetErro(err.response?.data?.message ?? 'Erro ao solicitar recuperação de senha')
      setResetStatus('error')
    }
  }

  function fecharModal() { setShowReset(false); setResetEmail(''); setResetStatus('idle'); setResetErro('') }

  //  Estilos compartilhados
  const inpL: React.CSSProperties = { width:'100%', height:36, background:'#111f12', border:'0.5px solid #2a4a2c', borderRadius:8, padding:'0 12px', fontSize:13, color:'#a8dca9', outline:'none' }
  const inpR: React.CSSProperties = { width:'100%', height:36, background:'#0b1f0c', border:'0.5px solid #1b341d', borderRadius:8, padding:'0 12px', fontSize:13, color:'#a8dca9', outline:'none' }
  const lbl:  React.CSSProperties = { fontSize:10, fontWeight:600, color:'#6a9a6c', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }
  const fg:   React.CSSProperties = { marginBottom:12 }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0d1a0e', fontFamily:'var(--font-sans)' }}>

      {/* ESQUERDA — identidade + login */}
      <div style={{ flex:1, padding:'60px 7%', display:'flex', flexDirection:'column', justifyContent:'center' }}>

        {/* Logo */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:42, fontWeight:900, color:'#a8dca9', letterSpacing:'-1px', lineHeight:1, marginBottom:6 }}>
            Elo<span style={{ color:'#e8b84b' }}>Campo</span>
          </div>
          <div style={{ fontSize:13, color:'#4a7a4c', letterSpacing:'0.02em' }}>Marketplace agrícola brasileiro</div>
        </div>

        {/* Features */}
        <div style={{ marginBottom:32 }}>
          {FEATURES.map((text, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#2f6433', marginTop:5, flexShrink:0 }} />
              <span style={{ fontSize:13, color:'#6a9a6c', lineHeight:1.55 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ height:'0.5px', background:'#1b341d', marginBottom:28 }} />

        {/* Login form */}
        <div style={{ fontSize:15, fontWeight:600, color:'#a8dca9', marginBottom:18 }}>Entrar na sua conta</div>

        {erroLogin && <div className="alert alert-danger" style={{ marginBottom:14, fontSize:12 }}>{erroLogin}</div>}

        <form onSubmit={handleLogin}>
          <div style={fg}>
            <label style={lbl}>E-mail</label>
            <input style={inpL} type="email" placeholder="joao@fazenda.com.br" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div style={fg}>
            <label style={lbl}>Senha</label>
            <input style={inpL} type="password" placeholder="••••••••" value={senha} onChange={e=>setSenha(e.target.value)} required autoComplete="current-password" />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
              <div
                onClick={() => setLembrar(v => !v)}
                style={{ width:14, height:14, borderRadius:3, border:'1px solid #2f6433', background:'#1b341d', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}
              >
                {lembrar && <div style={{ width:7, height:5, borderLeft:'1.5px solid #6dbf74', borderBottom:'1.5px solid #6dbf74', transform:'rotate(-45deg) translateY(-1px)' }} />}
              </div>
              <span style={{ fontSize:11, color:'#6a9a6c' }}>Lembrar de mim</span>
            </label>
            <span onClick={() => setShowReset(true)} style={{ fontSize:11, color:'#4a9050', cursor:'pointer', textDecoration:'underline', textDecorationColor:'#2f6433' }}>
              Esqueci a senha
            </span>
          </div>
          <button type="submit" disabled={loadingLogin} style={{ width:'100%', height:40, background:'#2f6433', border:'0.5px solid #4a9050', borderRadius:8, fontSize:13, fontWeight:600, color:'#d4f0d5', cursor:'pointer' }}>
            {loadingLogin ? 'Entrando…' : 'Entrar na plataforma'}
          </button>
        </form>
      </div>

      {/* DIVISOR */}
      <div style={{ width:'0.5px', background:'#1b341d', flexShrink:0 }} />

      {/* DIREITA — cadastro rápido (etapa 1) */}
      <div style={{ flex:1, padding:'60px 7%', display:'flex', flexDirection:'column', justifyContent:'center', background:'#0b1a0c' }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#d4f0d5', marginBottom:4 }}>Criar conta gratuita</div>
          <div style={{ fontSize:13, color:'#6a9a6c' }}>Conecte-se ao mercado agrícola brasileiro em minutos</div>
        </div>

        {/* Seletor de perfil */}
        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Você é</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { v:'VENDOR' as AccountRole, label:'Produtor rural', sub:'Vendo minha produção' },
              { v:'BUYER'  as AccountRole, label:'Empresa compradora', sub:'Busco e adquiro produtos' },
            ].map(opt => (
              <div key={opt.v} onClick={() => setRole(opt.v)}
                style={{ border:`1.5px solid ${role===opt.v?'#4a9050':'#1b341d'}`, background:role===opt.v?'#122114':'#0d1a0e', borderRadius:10, padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'border-color 0.15s' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:role===opt.v?'#4a9050':'#264d29', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:role===opt.v?'#a8dca9':'#5a8a5c', lineHeight:1.3 }}>{opt.label}</div>
                  <div style={{ fontSize:10, color:role===opt.v?'#4a9050':'#2f5530', lineHeight:1.3, marginTop:1 }}>{opt.sub}</div>
                </div>
                <div style={{ marginLeft:'auto', width:14, height:14, borderRadius:'50%', border:`1.5px solid ${role===opt.v?'#4a9050':'#264d29'}`, background:role===opt.v?'#4a9050':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {role===opt.v && <div style={{ width:6, height:6, borderRadius:'50%', background:'#d4f0d5' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {erroReg && <div className="alert alert-danger" style={{ marginBottom:12, fontSize:12 }}>{erroReg}</div>}

        <form onSubmit={handleCadastro}>
          <div style={fg}>
            <label style={lbl}>Nome completo</label>
            <input style={inpR} placeholder="João da Silva" value={reg.nome} onChange={e=>setReg(r=>({...r,nome:e.target.value}))} required />
          </div>
          <div style={fg}>
            <label style={lbl}>E-mail</label>
            <input style={inpR} type="email" placeholder="joao@fazenda.com.br" value={reg.email} onChange={e=>setReg(r=>({...r,email:e.target.value}))} required autoComplete="email" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={lbl}>Senha</label>
              <input style={inpR} type="password" placeholder="Mín. 8 caracteres" value={reg.senha} onChange={e=>setReg(r=>({...r,senha:e.target.value}))} required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <label style={lbl}>Confirmar senha</label>
              <input style={inpR} type="password" placeholder="••••••••" value={reg.confirmar} onChange={e=>setReg(r=>({...r,confirmar:e.target.value}))} required autoComplete="new-password" />
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:18, cursor:'pointer' }}>
            <div
              onClick={() => setTermos(v => !v)}
              style={{ width:14, height:14, borderRadius:3, border:'1px solid #2f6433', background:'#122114', marginTop:1, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
            >
              {termos && <div style={{ width:7, height:5, borderLeft:'1.5px solid #6dbf74', borderBottom:'1.5px solid #6dbf74', transform:'rotate(-45deg) translateY(-1px)' }} />}
            </div>
            <span style={{ fontSize:11, color:'#6a9a6c', lineHeight:1.55 }}>
              Li e concordo com os <span style={{ color:'#4a9050' }}>Termos de Uso</span> e a <span style={{ color:'#4a9050' }}>Política de Privacidade</span>
            </span>
          </label>

          <button type="submit" disabled={loadingReg} style={{ width:'100%', height:40, background:'#1b341d', border:'1px solid #2f6433', borderRadius:8, fontSize:13, fontWeight:600, color:'#6dbf74', cursor:'pointer' }}>
            {loadingReg ? 'Criando usuário…' : 'Continuar para etapa 2 →'}
          </button>
        </form>

        <div style={{ marginTop:16, fontSize:11, color:'#3d6b3f', textAlign:'center' }}>
          Etapa 1 de 2 — na próxima etapa você concluirá seu cadastro
        </div>
      </div>

      {/* MODAL — Recuperação de senha */}
      {showReset && (
        <div onClick={fecharModal} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0d1a0e', border:'0.5px solid #2a4a2c', borderRadius:14, padding:32, width:360, maxWidth:'90vw' }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#a8dca9', marginBottom:6 }}>Recuperar senha</div>
            <div style={{ fontSize:12, color:'#6a9a6c', marginBottom:20, lineHeight:1.6 }}>
              Informe seu e-mail cadastrado. Você receberá um link para redefinir a senha.
            </div>
            {resetStatus === 'success' ? (
              <div style={{ fontSize:12, color:'#6dbf74', lineHeight:1.6, marginBottom:16 }}>
                E-mail de recuperação enviado! Verifique sua caixa de entrada.
              </div>
            ) : (
              <form onSubmit={handleReset}>
                {resetErro && <div className="alert alert-danger" style={{ marginBottom:12, fontSize:11 }}>{resetErro}</div>}
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>E-mail</label>
                  <input style={inpL} type="email" placeholder="joao@fazenda.com.br" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" disabled={resetStatus==='loading'} style={{ width:'100%', height:38, background:'#2f6433', border:'0.5px solid #4a9050', borderRadius:8, fontSize:12, fontWeight:600, color:'#d4f0d5', cursor:'pointer' }}>
                  {resetStatus==='loading' ? 'Enviando…' : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
            <button onClick={fecharModal} style={{ all:'unset', marginTop:14, display:'block', fontSize:11, color:'#3d6b3f', cursor:'pointer', textAlign:'center', width:'100%' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
