import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardProdutor from './DashboardProdutor'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarProdutor: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarContaPorId: vi.fn(),
  buscarPedidoPorIdComprador: vi.fn(),
  buscarPedidoPorIdVendedor: vi.fn(),
  buscarProdutos: vi.fn(),
  buscarProdutosPorVendedor: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { useAuth } from '../../contexts/AuthContext'
import { buscarContaPorId, buscarPedidoPorIdVendedor, buscarProdutosPorVendedor } from '../../services/api'

const mockAccount = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Maria Produtora',
  businessName: 'Fazenda Verde',
  birthdayDate: 0,
  address: { postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
  phone: { countryCode: 55, stateCode: 11, number: '' },
  role: 'VENDOR' as const,
  evaluation: [],
  createdAt: 0,
  updatedAt: 0,
}

const mockSession = {
  token: 'tok',
  userId: 'user-1',
  email: 'maria@fazenda.com',
  isAdmin: false,
  account: mockAccount,
}

const mockProduto = {
  id: 'prod-1',
  vendorAccountId: 'account-1',
  description: 'Soja em grão',
  category: 'GRAIN' as const,
  scale: 'KG' as const,
  quantity: 100,
  price: 5,
  status: 'AVAILABLE' as const,
  vendorCity: 'São Paulo',
  vendorState: 'SP',
  availabilityDate: 0,
  imageUrls: [],
  evaluations: [],
  createdAt: 0,
  updatedAt: 0,
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardProdutor /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.mocked(buscarContaPorId).mockResolvedValue({ ...mockAccount, evaluation: [] })
  vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
  vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
})

describe('DashboardProdutor — renderização', () => {
  it('deve exibir o título "Início"', () => {
    renderDashboard()
    expect(screen.getByText('Início')).toBeInTheDocument()
  })

  it('deve exibir a saudação com o nome do usuário', () => {
    renderDashboard()
    expect(screen.getByText(/Olá, Maria Produtora!/)).toBeInTheDocument()
  })

  it('deve exibir o nome da fazenda quando presente', () => {
    renderDashboard()
    expect(screen.getByText('Fazenda Verde')).toBeInTheDocument()
  })

  it('deve exibir o botão "+ Novo produto"', () => {
    renderDashboard()
    expect(screen.getByText('+ Novo produto')).toBeInTheDocument()
  })

  it('deve exibir os rótulos dos cards de estatísticas', () => {
    renderDashboard()
    expect(screen.getByText('Produtos ativos')).toBeInTheDocument()
    expect(screen.getByText('Total cadastrado')).toBeInTheDocument()
    expect(screen.getByText('Em negociação')).toBeInTheDocument()
    expect(screen.getByText('Avaliações')).toBeInTheDocument()
  })
})

describe('DashboardProdutor — estado de carregamento', () => {
  it('deve exibir o spinner enquanto carrega', () => {
    vi.mocked(buscarProdutosPorVendedor).mockReturnValue(new Promise(() => {}))
    vi.mocked(buscarPedidoPorIdVendedor).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve exibir estado vazio quando não há produtos', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Nenhum produto ainda.')).toBeInTheDocument()
    })
  })

  it('deve exibir a tabela de produtos após carregamento', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Soja em grão')).toBeInTheDocument()
    })
  })

  it('deve contar corretamente os produtos ativos', async () => {
    const inativo = { ...mockProduto, id: 'prod-2', status: 'UNAVAILABLE' as const }
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto, inativo])
    renderDashboard()
    await waitFor(() => {
      // 1 ativo, 2 total
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
