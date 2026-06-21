import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BuscarProdutos from './BuscarProdutos'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarComprador: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarProdutos: vi.fn(),
  criarPedido: vi.fn(),
  buscarArquivosPorEntidade: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutos, criarPedido, buscarArquivosPorEntidade } from '../../services/api'

const mockAccount = {
  id: 'buyer-1',
  userId: 'user-1',
  name: 'João Comprador',
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

const mockProduto = {
  id: 'prod-1',
  vendorAccountId: 'vendor-1',
  description: 'Soja em grão',
  category: 'GRAIN' as const,
  scale: 'KG' as const,
  quantity: 100,
  price: 5.5,
  status: 'AVAILABLE' as const,
  vendorCity: 'Ribeirão Preto',
  vendorState: 'SP',
  availabilityDate: 0,
  imageUrls: [],
  evaluations: [],
  createdAt: 0,
  updatedAt: 0,
}

function renderPage() {
  return render(<MemoryRouter><BuscarProdutos /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.mocked(buscarArquivosPorEntidade).mockResolvedValue([])
})

describe('BuscarProdutos — renderização', () => {
  it('deve exibir o título "Produtos disponíveis"', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    expect(screen.getByText('Produtos disponíveis')).toBeInTheDocument()
  })

  it('deve exibir o campo de busca', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    expect(screen.getByPlaceholderText('Buscar produto...')).toBeInTheDocument()
  })

  it('deve exibir os filtros de categoria', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    expect(screen.getByText('Grão')).toBeInTheDocument()
    expect(screen.getByText('Fruta')).toBeInTheDocument()
    expect(screen.getByText('Vegetal')).toBeInTheDocument()
  })
})

describe('BuscarProdutos — estados de listagem', () => {
  it('deve chamar buscarProdutos ao montar', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(buscarProdutos).toHaveBeenCalledTimes(1))
  })

  it('deve exibir estado vazio quando não há produtos', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument()
    })
  })

  it('deve exibir produtos na tabela após carregamento', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Soja em grão')).toBeInTheDocument()
    })
    // A categoria 'Grão' aparece tanto no filtro quanto na tabela
    expect(screen.getAllByText('Grão').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/5[,.]50/)).toBeInTheDocument()
  })

  it('deve exibir o contador de produtos no subtítulo', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('1 produto(s)')).toBeInTheDocument()
    })
  })
})

describe('BuscarProdutos — painel de detalhes', () => {
  it('deve abrir o painel ao clicar em "Ver"', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Ver'))
    expect(screen.getByText('Ribeirão Preto, SP')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: 100')).toBeInTheDocument()
  })

  it('deve fechar o painel ao clicar em "Fechar"', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Fechar'))
    expect(screen.queryByPlaceholderText('Ex: 100')).not.toBeInTheDocument()
  })

  it('deve exibir erro ao tentar fazer pedido sem quantidade', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Ver'))
    fireEvent.click(screen.getByText('📩 Fazer pedido'))
    await waitFor(() => {
      expect(screen.getByText('Informe a quantidade')).toBeInTheDocument()
    })
    expect(criarPedido).not.toHaveBeenCalled()
  })

  it('deve exibir sucesso após criar pedido', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    vi.mocked(criarPedido).mockResolvedValueOnce({} as any)
    renderPage()
    await waitFor(() => screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Ver'))
    fireEvent.change(screen.getByPlaceholderText('Ex: 100'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('📩 Fazer pedido'))
    await waitFor(() => {
      expect(screen.getByText('Pedido criado com sucesso!')).toBeInTheDocument()
    })
  })

  it('deve exibir erro de API ao falhar na criação do pedido', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([mockProduto])
    vi.mocked(criarPedido).mockRejectedValueOnce({ response: { data: { message: 'Saldo insuficiente' } } })
    renderPage()
    await waitFor(() => screen.getByText('Ver'))
    fireEvent.click(screen.getByText('Ver'))
    fireEvent.change(screen.getByPlaceholderText('Ex: 100'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('📩 Fazer pedido'))
    await waitFor(() => {
      expect(screen.getByText('Saldo insuficiente')).toBeInTheDocument()
    })
  })
})

describe('BuscarProdutos — busca e filtros', () => {
  it('deve chamar buscarProdutos com o termo de busca ao submeter', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    await waitFor(() => screen.getByPlaceholderText('Buscar produto...'))
    fireEvent.change(screen.getByPlaceholderText('Buscar produto...'), { target: { value: 'milho' } })
    fireEvent.submit(screen.getByPlaceholderText('Buscar produto...').closest('form')!)
    await waitFor(() => {
      expect(buscarProdutos).toHaveBeenCalledWith(expect.objectContaining({ description: 'milho' }))
    })
  })

  it('deve chamar buscarProdutos com a categoria ao clicar no filtro', async () => {
    vi.mocked(buscarProdutos).mockResolvedValue([])
    renderPage()
    await waitFor(() => screen.getByText('Grão'))
    const calls = vi.mocked(buscarProdutos).mock.calls.length
    fireEvent.click(screen.getByText('Grão'))
    await waitFor(() => {
      expect(vi.mocked(buscarProdutos).mock.calls.length).toBeGreaterThan(calls)
    })
    const lastCall = vi.mocked(buscarProdutos).mock.calls.at(-1)![0]
    expect(lastCall).toMatchObject({ category: 'GRAIN' })
  })
})
