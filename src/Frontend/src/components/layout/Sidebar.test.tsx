import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProdutor, SidebarComprador } from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthSession, AccountResponse } from '../../types'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockLogout = vi.fn()

const SESSION_WITH_ACCOUNT: AuthSession = {
  token: 'tok',
  userId: 'u1',
  email: 'joao@fazenda.com.br',
  isAdmin: false,
  account: { id: 'acc-1', name: 'João Silva' } as AccountResponse,
}

function setupAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    session: SESSION_WITH_ACCOUNT,
    setSession: vi.fn(),
    logout: mockLogout,
    loading: false,
    ...overrides,
  })
}

function renderProdutor() {
  return render(<MemoryRouter><SidebarProdutor /></MemoryRouter>)
}

function renderComprador() {
  return render(<MemoryRouter><SidebarComprador /></MemoryRouter>)
}

beforeEach(() => {
  mockLogout.mockClear()
  setupAuth()
})

describe('SidebarProdutor', () => {
  it('deve exibir a logo EloCampo', () => {
    renderProdutor()
    expect(screen.getByText('Elo')).toBeInTheDocument()
    expect(screen.getByText('Campo')).toBeInTheDocument()
  })

  it('deve renderizar os 4 links de navegação do produtor', () => {
    renderProdutor()
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Meus Produtos')).toBeInTheDocument()
    expect(screen.getByText('Minhas Vendas')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('os links devem apontar para as rotas corretas do produtor', () => {
    renderProdutor()
    expect(screen.getByText('Início').closest('a')).toHaveAttribute('href', '/produtor/dashboard')
    expect(screen.getByText('Meus Produtos').closest('a')).toHaveAttribute('href', '/produtor/produtos')
    expect(screen.getByText('Minhas Vendas').closest('a')).toHaveAttribute('href', '/produtor/vendas')
    expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/produtor/perfil')
  })

  it('deve exibir o nome da conta quando disponível', () => {
    renderProdutor()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('deve exibir o email quando a conta não tem name', () => {
    setupAuth({
      session: { token: 'tok', userId: 'u1', email: 'joao@fazenda.com.br', isAdmin: false },
    })
    renderProdutor()
    expect(screen.getByText('joao@fazenda.com.br')).toBeInTheDocument()
  })

  it('deve exibir o botão Sair', () => {
    renderProdutor()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('deve chamar logout ao clicar em Sair', () => {
    renderProdutor()
    fireEvent.click(screen.getByText('Sair'))
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('não deve aplicar a classe buyer ao aside', () => {
    const { container } = renderProdutor()
    const aside = container.querySelector('aside')
    expect(aside?.className).not.toContain('buyer')
  })
})

describe('SidebarComprador', () => {
  it('deve renderizar os 4 links de navegação do comprador', () => {
    renderComprador()
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Produtos')).toBeInTheDocument()
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('os links devem apontar para as rotas corretas do comprador', () => {
    renderComprador()
    expect(screen.getByText('Início').closest('a')).toHaveAttribute('href', '/comprador/dashboard')
    expect(screen.getByText('Produtos').closest('a')).toHaveAttribute('href', '/comprador/produtos')
    expect(screen.getByText('Meus Pedidos').closest('a')).toHaveAttribute('href', '/comprador/pedidos')
    expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/comprador/perfil')
  })

  it('deve aplicar a classe buyer ao aside', () => {
    const { container } = renderComprador()
    const aside = container.querySelector('aside')
    expect(aside?.className).toContain('buyer')
  })

  it('deve chamar logout ao clicar em Sair', () => {
    renderComprador()
    fireEvent.click(screen.getByText('Sair'))
    expect(mockLogout).toHaveBeenCalledOnce()
  })
})
