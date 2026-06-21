import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MinhasVendas from './MinhasVendas'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarProdutor: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarPedidoPorIdVendedor: vi.fn(),
  finalizarPedidoVendedor: vi.fn(),
  buscarArquivosPorEntidade: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { buscarPedidoPorIdVendedor, finalizarPedidoVendedor, buscarArquivosPorEntidade } from '../../services/api'

const mockAccount = {
  id: 'vendor-1',
  userId: 'user-1',
  name: 'Maria Produtora',
  birthdayDate: 0,
  address: { postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
  phone: { countryCode: 55, stateCode: 11, number: '' },
  role: 'VENDOR' as const,
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

const mockVenda = {
  id: 'order-abc123456789',
  buyerAccountId: 'buyer-1',
  sellerAccountId: 'vendor-1',
  orderStatus: 'PENDING' as const,
  products: [{ productId: 'prod-1', description: 'Milho', quantity: 100, price: 3 }],
  price: 300,
  createdAt: 0,
  updatedAt: 0,
}

function renderPage() {
  return render(<MemoryRouter><MinhasVendas /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.mocked(buscarArquivosPorEntidade).mockResolvedValue([])
})

describe('MinhasVendas — renderização', () => {
  it('deve exibir o título "Minhas Vendas"', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
    renderPage()
    expect(screen.getByText('Minhas Vendas')).toBeInTheDocument()
  })
})

describe('MinhasVendas — estados de listagem', () => {
  it('deve exibir "Carregando..." enquanto busca', () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve exibir estado vazio quando não há vendas', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nenhuma venda ainda.')).toBeInTheDocument()
    })
  })

  it('deve exibir vendas na tabela após carregamento', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('order-abc123…')).toBeInTheDocument()
    })
    expect(screen.getByText('R$ 300,00')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('deve exibir o contador de pedidos no subtítulo', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('1 pedido(s)')).toBeInTheDocument()
    })
  })
})

describe('MinhasVendas — painel de detalhes', () => {
  it('deve abrir o painel ao clicar em "Detalhes"', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    expect(screen.getByText(/Milho.*100/)).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Finalizar venda')).toBeInTheDocument()
  })

  it('deve fechar o painel ao clicar em "Fechar"', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Fechar'))
    await waitFor(() => {
      expect(screen.queryByText('Chat')).not.toBeInTheDocument()
    })
  })

  it('deve chamar finalizarPedidoVendedor ao clicar em "Finalizar venda"', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    vi.mocked(finalizarPedidoVendedor).mockResolvedValueOnce(undefined as any)
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Finalizar venda'))
    await waitFor(() => {
      expect(finalizarPedidoVendedor).toHaveBeenCalledWith('order-abc123456789', expect.objectContaining({ status: 'COMPLETED' }))
    })
  })
})

describe('MinhasVendas — chat', () => {
  it('deve exibir a mensagem inicial do comprador no chat', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    expect(screen.getByText('Podemos fechar o pedido?')).toBeInTheDocument()
  })

  it('deve adicionar mensagem ao clicar em Enviar', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), { target: { value: 'Confirmo!' } })
    fireEvent.click(screen.getByText('Enviar'))
    expect(screen.getByText('Confirmo!')).toBeInTheDocument()
  })

  it('deve adicionar mensagem ao pressionar Enter no input', async () => {
    vi.mocked(buscarPedidoPorIdVendedor).mockResolvedValue({ content: [mockVenda], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    const input = screen.getByPlaceholderText('Digite uma mensagem...')
    fireEvent.change(input, { target: { value: 'Olá via Enter' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Olá via Enter')).toBeInTheDocument()
  })
})
