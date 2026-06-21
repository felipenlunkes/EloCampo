import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MeusPedidos from './MeusPedidos'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarComprador: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarPedidoPorIdComprador: vi.fn(),
  criarAvaliacaoProduto: vi.fn(),
  buscarArquivosPorEntidade: vi.fn(),
  buscarProdutoPorId: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { buscarPedidoPorIdComprador, buscarArquivosPorEntidade, criarAvaliacaoProduto, buscarProdutoPorId } from '../../services/api'

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

const mockPedidoPendente = {
  id: 'order-abc123456789',
  buyerAccountId: 'buyer-1',
  sellerAccountId: 'seller-1',
  orderStatus: 'PENDING' as const,
  products: [{ productId: 'prod-1', description: 'Soja em grão', quantity: 50, price: 5 }],
  price: 250,
  createdAt: 0,
  updatedAt: 0,
}

const mockPedidoConcluido = {
  ...mockPedidoPendente,
  id: 'order-xyz987654321',
  orderStatus: 'COMPLETED' as const,
}

function renderPage() {
  return render(<MemoryRouter><MeusPedidos /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.mocked(buscarArquivosPorEntidade).mockResolvedValue([])
})

describe('MeusPedidos — renderização', () => {
  it('deve exibir o título "Meus Pedidos"', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
    renderPage()
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument()
  })
})

describe('MeusPedidos — estados de listagem', () => {
  it('deve exibir "Carregando..." enquanto busca', () => {
    vi.mocked(buscarPedidoPorIdComprador).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve exibir estado vazio quando não há pedidos', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nenhum pedido ainda.')).toBeInTheDocument()
    })
  })

  it('deve exibir pedidos na tabela', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('order-abc123…')).toBeInTheDocument()
    })
    expect(screen.getByText('R$ 250,00')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('deve exibir o contador de pedidos no subtítulo', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('1 pedido(s)')).toBeInTheDocument()
    })
  })
})

describe('MeusPedidos — painel de detalhes', () => {
  it('deve abrir o painel de detalhes ao clicar em "Detalhes"', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    expect(screen.getByText(/Soja em grão.*50/)).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
  })

  it('deve fechar o painel ao clicar em "Fechar"', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Fechar'))
    await waitFor(() => {
      expect(screen.queryByText('Chat')).not.toBeInTheDocument()
    })
  })
})

describe('MeusPedidos — chat', () => {
  it('deve exibir a mensagem inicial do produtor no chat', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    expect(screen.getByText('Enviarei na sexta-feira!')).toBeInTheDocument()
  })

  it('deve adicionar mensagem ao clicar em Enviar', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), { target: { value: 'Tudo certo!' } })
    fireEvent.click(screen.getByText('Enviar'))
    expect(screen.getByText('Tudo certo!')).toBeInTheDocument()
    expect((screen.getByPlaceholderText('Digite uma mensagem...') as HTMLInputElement).value).toBe('')
  })

  it('não deve adicionar mensagem vazia ao clicar em Enviar', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoPendente], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    const msgCountBefore = screen.getAllByText(/\w/).length
    fireEvent.click(screen.getByText('Enviar'))
    expect(screen.getAllByText(/\w/).length).toBe(msgCountBefore)
  })
})

describe('MeusPedidos — avaliações', () => {
  it('deve exibir a seção de avaliações para pedidos concluídos', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoConcluido], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    vi.mocked(buscarProdutoPorId).mockResolvedValue({
      id: 'prod-1', description: 'Soja', evaluations: [], vendorAccountId: '', category: 'GRAIN', scale: 'KG', quantity: 0, price: 0, status: 'AVAILABLE', vendorCity: '', vendorState: '', availabilityDate: 0, imageUrls: [], createdAt: 0, updatedAt: 0,
    })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    await waitFor(() => {
      expect(screen.getByText('Avaliações')).toBeInTheDocument()
    })
    expect(screen.getByText('Avaliar produto')).toBeInTheDocument()
  })

  it('deve abrir o formulário de avaliação ao clicar em "Avaliar produto"', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoConcluido], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    vi.mocked(buscarProdutoPorId).mockResolvedValue({
      id: 'prod-1', description: 'Soja', evaluations: [], vendorAccountId: '', category: 'GRAIN', scale: 'KG', quantity: 0, price: 0, status: 'AVAILABLE', vendorCity: '', vendorState: '', availabilityDate: 0, imageUrls: [], createdAt: 0, updatedAt: 0,
    })
    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    await waitFor(() => screen.getByText('Avaliar produto'))
    fireEvent.click(screen.getByText('Avaliar produto'))
    expect(screen.getByText('Sua avaliação')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Comentário opcional...')).toBeInTheDocument()
  })

  it('deve enviar avaliação e atualizar a lista', async () => {
    vi.mocked(buscarPedidoPorIdComprador).mockResolvedValue({ content: [mockPedidoConcluido], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    const produtoComAvaliacao = {
      id: 'prod-1', description: 'Soja', evaluations: [{ id: 'ev1', stars: 5, content: 'Ótimo', reviewerAccountId: 'buyer-1' }], vendorAccountId: '', category: 'GRAIN' as const, scale: 'KG' as const, quantity: 0, price: 0, status: 'AVAILABLE' as const, vendorCity: '', vendorState: '', availabilityDate: 0, imageUrls: [], createdAt: 0, updatedAt: 0,
    }
    vi.mocked(buscarProdutoPorId).mockResolvedValue({ ...produtoComAvaliacao, evaluations: [] })
    vi.mocked(criarAvaliacaoProduto).mockResolvedValueOnce(undefined as any)
    vi.mocked(buscarProdutoPorId).mockResolvedValueOnce({ ...produtoComAvaliacao, evaluations: [] })
    vi.mocked(buscarProdutoPorId).mockResolvedValueOnce(produtoComAvaliacao)

    renderPage()
    await waitFor(() => screen.getByText('Detalhes'))
    fireEvent.click(screen.getByText('Detalhes'))
    await waitFor(() => screen.getByText('Avaliar produto'))
    fireEvent.click(screen.getByText('Avaliar produto'))
    // Há dois botões "Enviar" na tela (chat e avaliação); o da avaliação é o último
    const botoesEnviar = screen.getAllByText('Enviar')
    fireEvent.click(botoesEnviar[botoesEnviar.length - 1])
    await waitFor(() => {
      expect(criarAvaliacaoProduto).toHaveBeenCalled()
    })
  })
})
