import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cadastro from './Cadastro'

vi.mock('../../services/api', () => ({
  criarUsuario: vi.fn(),
  criarConta: vi.fn(),
  gerarToken: vi.fn(),
  buscarContaPorUsuario: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ setSession: vi.fn() })),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { criarUsuario } from '../../services/api'

function renderCadastro(state?: object) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/cadastro', state: state ?? null }]}>
      <Cadastro />
    </MemoryRouter>
  )
}

function clickTermos() {
  fireEvent.click(screen.getByText(/Li e concordo/).closest('label')!.querySelector('div')!)
}

function submitEtapa1() {
  fireEvent.submit(screen.getByText('Continuar para etapa 2 →').closest('form')!)
}

beforeEach(() => { vi.clearAllMocks() })

describe('Cadastro — renderização (etapa 1)', () => {
  it('deve exibir o título "Criar conta gratuita"', () => {
    renderCadastro()
    expect(screen.getByText('Criar conta gratuita')).toBeInTheDocument()
  })

  it('deve exibir as opções de perfil VENDOR e BUYER', () => {
    renderCadastro()
    expect(screen.getByText('Produtor rural')).toBeInTheDocument()
    expect(screen.getByText('Empresa compradora')).toBeInTheDocument()
  })

  it('deve exibir o botão de continuar', () => {
    renderCadastro()
    expect(screen.getByText('Continuar para etapa 2 →')).toBeInTheDocument()
  })

  it('deve exibir o link para login', () => {
    renderCadastro()
    expect(screen.getByText('Já tenho uma conta — Entrar')).toBeInTheDocument()
  })

  it('deve exibir o banner do marketplace', () => {
    renderCadastro()
    expect(screen.getByText('Marketplace agrícola brasileiro')).toBeInTheDocument()
  })
})

describe('Cadastro — validações etapa 1', () => {
  it('deve exibir erro se os termos não forem aceitos', async () => {
    renderCadastro()
    submitEtapa1()
    await waitFor(() => {
      expect(screen.getByText('Aceite os termos para continuar')).toBeInTheDocument()
    })
    expect(criarUsuario).not.toHaveBeenCalled()
  })

  it('deve exibir erro se as senhas não coincidirem', async () => {
    renderCadastro()
    clickTermos()
    fireEvent.change(screen.getByPlaceholderText('Mín. 8 caracteres'), { target: { value: 'senha1111' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senha2222' } })
    submitEtapa1()
    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument()
    })
    expect(criarUsuario).not.toHaveBeenCalled()
  })

  it('deve exibir erro se a senha tiver menos de 8 caracteres', async () => {
    renderCadastro()
    clickTermos()
    fireEvent.change(screen.getByPlaceholderText('Mín. 8 caracteres'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'abc' } })
    submitEtapa1()
    await waitFor(() => {
      expect(screen.getByText('A senha deve ter ao menos 8 caracteres')).toBeInTheDocument()
    })
  })

  it('deve chamar criarUsuario e avançar para etapa 2 com formulário válido', async () => {
    vi.mocked(criarUsuario).mockResolvedValueOnce({ id: 'u1', email: 'j@test.com', isAdmin: false, createdAt: 0, updatedAt: 0 })
    renderCadastro()
    clickTermos()
    fireEvent.change(screen.getByPlaceholderText('joao@fazenda.com.br'), { target: { value: 'j@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Mín. 8 caracteres'), { target: { value: 'senhaForte1' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senhaForte1' } })
    submitEtapa1()
    await waitFor(() => {
      expect(screen.getByText('Complete seu perfil')).toBeInTheDocument()
    })
  })

  it('deve exibir erro de API quando criarUsuario falhar', async () => {
    vi.mocked(criarUsuario).mockRejectedValueOnce({ response: { data: { message: 'E-mail já cadastrado' } } })
    renderCadastro()
    clickTermos()
    fireEvent.change(screen.getByPlaceholderText('Mín. 8 caracteres'), { target: { value: 'senhaForte1' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senhaForte1' } })
    submitEtapa1()
    await waitFor(() => {
      expect(screen.getByText('E-mail já cadastrado')).toBeInTheDocument()
    })
  })
})

describe('Cadastro — etapa 2 via estado de rota', () => {
  it('deve iniciar em etapa 2 quando recebe estado fromLogin', () => {
    renderCadastro({ fromLogin: true, userId: 'u1', role: 'VENDOR', email: 'j@test.com', senha: 'senhaForte1' })
    expect(screen.getByText('Complete seu perfil')).toBeInTheDocument()
    expect(screen.getByText('Criar minha conta')).toBeInTheDocument()
  })

  it('deve exibir campo Razão social apenas para BUYER', () => {
    renderCadastro({ fromLogin: true, userId: 'u1', role: 'BUYER' })
    expect(screen.getByPlaceholderText('Empresa Ltda.')).toBeInTheDocument()
  })

  it('não deve exibir campo Razão social para VENDOR', () => {
    renderCadastro({ fromLogin: true, userId: 'u1', role: 'VENDOR' })
    expect(screen.queryByPlaceholderText('Empresa Ltda.')).not.toBeInTheDocument()
  })
})
