import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { criarUsuario, criarConta, gerarToken, buscarContaPorUsuario } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { AccountRole, AuthSession } from '../../types'

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

export default function Cadastro() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()

  const [etapa, setEtapa]   = useState<1 | 2>(1)
  const [userId, setUserId] = useState('')
  const [role, setRole]     = useState<AccountRole>('VENDOR')
  const [creds, setCreds]   = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [termos, setTermos] = useState(false)

  useEffect(() => {
    const s = location.state as { fromLogin?: boolean; userId?: string; role?: AccountRole; nome?: string; email?: string; senha?: string } | null
    if (s?.fromLogin && s.userId) {
      setUserId(s.userId)
      if (s.role) setRole(s.role)
      if (s.nome || s.email || s.senha)
        setCreds(c => ({ ...c, nome: s.nome ?? c.nome, email: s.email ?? c.email, senha: s.senha ?? c.senha }))
      setEtapa(2)
    }
  }, [])

  const [perfil, setPerfil] = useState({
    cpf: '', cnpj: '', businessName: '', birthday: '',
    ddi: '55', ddd: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })

  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)

  function updCreds(k: string, v: string)  { setCreds(f => ({ ...f, [k]: v })) }
  function updPerfil(k: string, v: string) { setPerfil(f => ({ ...f, [k]: v })) }

  async function handleEtapa1(e: FormEvent) {
    e.preventDefault()
    if (!termos)                         { setErro('Aceite os termos para continuar'); return }
    if (creds.senha !== creds.confirmar) { setErro('As senhas não coincidem'); return }
    if (creds.senha.length < 8)          { setErro('A senha deve ter ao menos 8 caracteres'); return }
    setErro(''); setLoading(true)
    try {
      const user = await criarUsuario({ email: creds.email, password: creds.senha, isAdmin: false })
      setUserId(user.id)
      setEtapa(2)
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  async function handleEtapa2(e: FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      await criarConta({
        userId,
        name: creds.nome,
        businessName: perfil.businessName || undefined,
        cpf:          perfil.cpf          || undefined,
        cnpj:         perfil.cnpj         || undefined,
        birthdayDate: new Date(perfil.birthday).getTime(),
        phone: {
          countryCode: parseInt(perfil.ddi, 10),
          stateCode:   parseInt(perfil.ddd, 10),
          number:      perfil.telefone,
        },
        address: {
          postalCode: perfil.cep,
          street:     perfil.rua,
          number:     perfil.numero,
          complement: perfil.complemento,
          district:   perfil.bairro,
          city:       perfil.cidade,
          state:      perfil.estado,
        },
        role,
      })

      const { token } = await gerarToken(creds.email, creds.senha)
      const payload = decodeJwt(token)
      if (!payload) throw new Error('Token inválido')

      localStorage.setItem('ec_token', token)
      const account = await buscarContaPorUsuario(payload.sub)

      const session: AuthSession = {
        token,
        userId:  payload.sub,
        email:   payload.email,
        isAdmin: payload.isAdmin,
        account,
      }
      setSession(session)
      navigate(role === 'VENDOR' ? '/produtor/dashboard' : '/comprador/dashboard')
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', height: 36, background: '#0b1f0c', border: '0.5px solid #1b341d', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#a8dca9', outline: 'none' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#6a9a6c', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }
  const fg:  React.CSSProperties = { marginBottom: 12 }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1a0e', fontFamily: 'var(--font-sans)' }}>

      {/* ESQUERDA — identidade */}
      <div style={{ flex: 1, padding: '60px 7%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 42, fontWeight: 900, color: '#a8dca9', letterSpacing: '-1px', lineHeight: 1, marginBottom: 6 }}>
            Elo<span style={{ color: '#e8b84b' }}>Campo</span>
          </div>
          <div style={{ fontSize: 13, color: '#4a7a4c', letterSpacing: '0.02em' }}>Marketplace agrícola brasileiro</div>
        </div>

        <div style={{ marginBottom: 32 }}>
          {FEATURES.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2f6433', marginTop: 5, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#6a9a6c', lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ height: '0.5px', background: '#1b341d', marginBottom: 28 }} />

        <div style={{ fontSize: 13, color: '#4a7a4c', marginBottom: 20 }}>
          {etapa === 1 ? 'Etapa 1 de 2 — preencha seus dados de acesso.' : 'Etapa 2 de 2 — informe seu perfil e endereço.'}
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{ width: '100%', height: 40, background: '#1b341d', border: '0.5px solid #2f6433', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6dbf74', cursor: 'pointer' }}
        >
          Já tenho uma conta — Entrar
        </button>
      </div>

      {/* DIVISOR */}
      <div style={{ width: '0.5px', background: '#1b341d', flexShrink: 0 }} />

      {/* DIREITA — formulário */}
      <div style={{ flex: 1, padding: '60px 7%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#0b1a0c', overflowY: 'auto' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d4f0d5', marginBottom: 4 }}>
            {etapa === 1 ? 'Criar conta gratuita' : 'Complete seu perfil'}
          </div>
          <div style={{ fontSize: 13, color: '#6a9a6c' }}>
            {etapa === 1 ? 'Passo 1 de 2 — dados de acesso' : 'Passo 2 de 2 — informações pessoais e endereço'}
          </div>
        </div>

        {erro && <div className="alert alert-danger" style={{ marginBottom: 14, fontSize: 12 }}>{erro}</div>}

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <form onSubmit={handleEtapa1}>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Você é</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { v: 'VENDOR' as AccountRole, label: 'Produtor rural',      sub: 'Vendo minha produção'     },
                  { v: 'BUYER'  as AccountRole, label: 'Empresa compradora',  sub: 'Busco e adquiro produtos' },
                ]).map(opt => (
                  <div key={opt.v} onClick={() => setRole(opt.v)}
                    style={{ border: `1.5px solid ${role === opt.v ? '#4a9050' : '#1b341d'}`, background: role === opt.v ? '#122114' : '#0d1a0e', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: role === opt.v ? '#4a9050' : '#264d29', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: role === opt.v ? '#a8dca9' : '#5a8a5c', lineHeight: 1.3 }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: role === opt.v ? '#4a9050' : '#2f5530', lineHeight: 1.3, marginTop: 1 }}>{opt.sub}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${role === opt.v ? '#4a9050' : '#264d29'}`, background: role === opt.v ? '#4a9050' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {role === opt.v && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4f0d5' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={fg}>
              <label style={lbl}>Nome completo</label>
              <input style={inp} value={creds.nome} onChange={e => updCreds('nome', e.target.value)} required placeholder="João da Silva" />
            </div>
            <div style={fg}>
              <label style={lbl}>E-mail</label>
              <input style={inp} type="email" value={creds.email} onChange={e => updCreds('email', e.target.value)} required autoComplete="email" placeholder="joao@fazenda.com.br" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Senha</label>
                <input style={inp} type="password" value={creds.senha} onChange={e => updCreds('senha', e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Mín. 8 caracteres" />
              </div>
              <div>
                <label style={lbl}>Confirmar senha</label>
                <input style={inp} type="password" value={creds.confirmar} onChange={e => updCreds('confirmar', e.target.value)} required autoComplete="new-password" placeholder="••••••••" />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 18, cursor: 'pointer' }}>
              <div
                onClick={() => setTermos(v => !v)}
                style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid #2f6433', background: '#122114', marginTop: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {termos && <div style={{ width: 7, height: 5, borderLeft: '1.5px solid #6dbf74', borderBottom: '1.5px solid #6dbf74', transform: 'rotate(-45deg) translateY(-1px)' }} />}
              </div>
              <span style={{ fontSize: 11, color: '#6a9a6c', lineHeight: 1.55 }}>
                Li e concordo com os <span style={{ color: '#4a9050' }}>Termos de Uso</span> e a <span style={{ color: '#4a9050' }}>Política de Privacidade</span>
              </span>
            </label>

            <button type="submit" disabled={loading} style={{ width: '100%', height: 40, background: '#1b341d', border: '1px solid #2f6433', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6dbf74', cursor: 'pointer' }}>
              {loading ? 'Criando usuário…' : 'Continuar para etapa 2 →'}
            </button>
          </form>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <form onSubmit={handleEtapa2}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fg}>
                <label style={lbl}>CPF</label>
                <input style={inp} value={perfil.cpf} onChange={e => updPerfil('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div style={fg}>
                <label style={lbl}>CNPJ</label>
                <input style={inp} value={perfil.cnpj} onChange={e => updPerfil('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
            </div>

            {role === 'BUYER' && (
              <div style={fg}>
                <label style={lbl}>Razão social</label>
                <input style={inp} value={perfil.businessName} onChange={e => updPerfil('businessName', e.target.value)} placeholder="Empresa Ltda." />
              </div>
            )}

            <div style={fg}>
              <label style={lbl}>Data de nascimento</label>
              <input style={inp} type="date" value={perfil.birthday} onChange={e => updPerfil('birthday', e.target.value)} required />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Telefone</label>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 70px 1fr', gap: 8 }}>
                <input style={inp} value={perfil.ddi}      onChange={e => updPerfil('ddi', e.target.value)}      placeholder="+55"       required title="DDI" />
                <input style={inp} value={perfil.ddd}      onChange={e => updPerfil('ddd', e.target.value)}      placeholder="DDD"       required title="DDD" />
                <input style={inp} value={perfil.telefone} onChange={e => updPerfil('telefone', e.target.value)} placeholder="99999-9999" required title="Número" />
              </div>
            </div>

            <div style={{ height: '0.5px', background: '#1b341d', margin: '14px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: '#3d6b3f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Endereço</div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
              <div style={fg}>
                <label style={lbl}>CEP</label>
                <input style={inp} value={perfil.cep} onChange={e => updPerfil('cep', e.target.value)} placeholder="00000-000" required />
              </div>
              <div style={fg}>
                <label style={lbl}>Rua / Logradouro</label>
                <input style={inp} value={perfil.rua} onChange={e => updPerfil('rua', e.target.value)} placeholder="Rua das Flores" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10 }}>
              <div style={fg}>
                <label style={lbl}>Número</label>
                <input style={inp} value={perfil.numero} onChange={e => updPerfil('numero', e.target.value)} placeholder="123" required />
              </div>
              <div style={fg}>
                <label style={lbl}>Complemento</label>
                <input style={inp} value={perfil.complemento} onChange={e => updPerfil('complemento', e.target.value)} placeholder="Apto 2B (opcional)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fg}>
                <label style={lbl}>Bairro</label>
                <input style={inp} value={perfil.bairro} onChange={e => updPerfil('bairro', e.target.value)} placeholder="Centro" required />
              </div>
              <div style={fg}>
                <label style={lbl}>Cidade</label>
                <input style={inp} value={perfil.cidade} onChange={e => updPerfil('cidade', e.target.value)} placeholder="São Paulo" required />
              </div>
            </div>

            <div style={fg}>
              <label style={lbl}>Estado (UF)</label>
              <input style={{ ...inp, width: 90 }} value={perfil.estado} onChange={e => updPerfil('estado', e.target.value)} placeholder="SP" maxLength={2} required />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', height: 40, background: '#2f6433', border: '0.5px solid #4a9050', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#d4f0d5', cursor: 'pointer', marginTop: 4 }}>
              {loading ? 'Criando conta…' : 'Criar minha conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
