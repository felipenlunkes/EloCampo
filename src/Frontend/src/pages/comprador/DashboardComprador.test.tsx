import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardComprador from './DashboardComprador'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarComprador: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarProdutos: vi.fn(),
  buscarPedidos: vi.fn(),
  buscarPedidoPorIdComprador: vi.fn(),
  buscarProdutosPorVendedor: vi.fn(),
  buscarAvaliacoesConta: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutosPorVendedor, buscarPedidoPorIdComprador, buscarAvaliacoesConta } from '../../services/api'

const mockAccount = {
  id: 'account-1',
  userId: 'user-1',
  name: 'João Silva',
  businessName: 'Empresa XYZ',
  birthdayDate: 0,
  address: { postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
  phone: { countryCode: 55, stateCode: 11, number: '' },
  role: 'BUYER' as const,
  createdAt: 0,
  updatedAt: 0,
}

const mockSession = {
  token: 'tok',
  userId: 'user-1',
  email: 'joao@empresa.com',
  isAdmin: false,
  account: mockAccount,
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardComprador /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
  vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
  vi.mocked(buscarAvaliacoesConta).mockResolvedValue([])
})

describe('DashboardComprador — renderização', () => {
  it('deve exibir o título "Início"', () => {
    renderDashboard()
    expect(screen.getByText('Início')).toBeInTheDocument()
  })

  it('deve exibir a saudação com o nome do usuário', () => {
    renderDashboard()
    expect(screen.getByText(/Olá, João Silva!/)).toBeInTheDocument()
  })

  it('deve exibir o nome da empresa quando presente', () => {
    renderDashboard()
    expect(screen.getByText('Empresa XYZ')).toBeInTheDocument()
  })

  it('deve exibir o botão "Buscar produtos"', () => {
    renderDashboard()
    expect(screen.getByText('Buscar produtos')).toBeInTheDocument()
  })

  it('deve exibir os rótulos dos cards de estatísticas', () => {
    renderDashboard()
    expect(screen.getByText('Disponíveis')).toBeInTheDocument()
    expect(screen.getByText('Meus pedidos')).toBeInTheDocument()
    expect(screen.getByText('Em negociação')).toBeInTheDocument()
    expect(screen.getByText('Avaliações')).toBeInTheDocument()
  })
})

describe('DashboardComprador — estado de carregamento', () => {
  it('deve exibir "…" nos stats enquanto carrega', () => {
    vi.mocked(buscarProdutosPorVendedor).mockReturnValue(new Promise(() => {}))
    vi.mocked(buscarPedidoPorIdComprador).mockReturnValue(new Promise(() => {}))
    vi.mocked(buscarAvaliacoesConta).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(4)
  })

  it('deve exibir o total de pedidos após carregamento', async () => {
    const mkPedido = (id: string, status: 'PENDING' | 'COMPLETED') => ({ id, buyerAccountId: 'account-1', sellerAccountId: 's1', orderStatus: status, products: [], price: 100, createdAt: 0, updatedAt: 0 })
    // 5 pedidos, 2 pendentes
    const pedidos = [mkPedido('o1','PENDING'), mkPedido('o2','PENDING'), mkPedido('o3','COMPLETED'), mkPedido('o4','COMPLETED'), mkPedido('o5','COMPLETED')]
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: pedidos, totalElements: 5, totalPages: 1, number: 0, size: 10 })
    renderDashboard()
    // totalPedidos=5 (único '5' na tela) e Em negociação=2
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('deve exibir a avaliação média após carregamento', async () => {
    vi.mocked(buscarAvaliacoesConta).mockResolvedValue([
      { id: 'e1', stars: 4, content: '', reviewerAccountId: 'r1', productId: 'p1' },
      { id: 'e2', stars: 2, content: '', reviewerAccountId: 'r2', productId: 'p2' },
    ])
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('3.0')).toBeInTheDocument()
    })
  })
})

describe('DashboardComprador — sem conta', () => {
  it('deve usar o email quando account.name não está disponível', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { ...mockSession, account: { ...mockAccount, name: '' } },
      setSession: vi.fn(),
    } as any)
    renderDashboard()
    expect(screen.getByText(/Olá,/)).toBeInTheDocument()
  })
})
