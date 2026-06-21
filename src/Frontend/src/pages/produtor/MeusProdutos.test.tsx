import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MeusProdutos from './MeusProdutos'

vi.mock('../../components/layout/Sidebar', () => ({
  SidebarProdutor: () => null,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  buscarProdutosPorVendedor: vi.fn(),
  criarProduto: vi.fn(),
  deletarProduto: vi.fn(),
  ativarProduto: vi.fn(),
  desativarProduto: vi.fn(),
  buscarArquivosPorEntidade: vi.fn(),
  uploadArquivo: vi.fn(),
  deletarArquivo: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutosPorVendedor, criarProduto, deletarProduto, desativarProduto, ativarProduto, buscarArquivosPorEntidade } from '../../services/api'

const mockAccount = {
  id: 'vendor-1',
  userId: 'user-1',
  name: 'Maria Produtora',
  birthdayDate: 0,
  address: { postalCode: '', street: '', number: '', complement: '', district: '', city: 'SP', state: 'SP' },
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

const mockProduto = {
  id: 'prod-1',
  vendorAccountId: 'vendor-1',
  description: 'Soja em grão',
  category: 'GRAIN' as const,
  scale: 'KG' as const,
  quantity: 200,
  price: 5.5,
  status: 'AVAILABLE' as const,
  vendorCity: 'Ribeirão Preto',
  vendorState: 'SP',
  availabilityDate: Date.now(),
  imageUrls: [],
  evaluations: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function renderPage() {
  return render(<MemoryRouter><MeusProdutos /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, setSession: vi.fn() } as any)
  vi.stubGlobal('confirm', vi.fn(() => true))
  vi.mocked(buscarArquivosPorEntidade).mockResolvedValue([])
})

describe('MeusProdutos — renderização', () => {
  it('deve exibir o título "Meus Produtos"', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    expect(screen.getByText('Meus Produtos')).toBeInTheDocument()
  })

  it('deve exibir o botão "+ Adicionar produto"', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    expect(screen.getByText('+ Adicionar produto')).toBeInTheDocument()
  })
})

describe('MeusProdutos — estados de listagem', () => {
  it('deve exibir "Carregando..." enquanto busca', () => {
    vi.mocked(buscarProdutosPorVendedor).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve exibir estado vazio quando não há produtos', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nenhum produto cadastrado ainda.')).toBeInTheDocument()
    })
  })

  it('deve exibir produtos na tabela após carregamento', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Soja em grão')).toBeInTheDocument()
    })
    expect(screen.getByText('Grão')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('R$ 5,50')).toBeInTheDocument()
  })

  it('deve exibir o contador de produtos no subtítulo', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('1 produto(s) cadastrado(s)')).toBeInTheDocument()
    })
  })
})

describe('MeusProdutos — formulário de novo produto', () => {
  it('deve exibir o formulário ao clicar em "+ Adicionar produto"', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    fireEvent.click(screen.getByText('+ Adicionar produto'))
    expect(screen.getByText('Novo produto')).toBeInTheDocument()
    expect(screen.getByText('Publicar produto')).toBeInTheDocument()
  })

  it('deve ocultar o formulário ao clicar novamente em "+ Adicionar produto"', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    fireEvent.click(screen.getByText('+ Adicionar produto'))
    fireEvent.click(screen.getByText('+ Adicionar produto'))
    await waitFor(() => {
      expect(screen.queryByText('Novo produto')).not.toBeInTheDocument()
    })
  })

  it('deve exibir erro ao tentar publicar sem preencher campos obrigatórios', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    renderPage()
    fireEvent.click(screen.getByText('+ Adicionar produto'))
    fireEvent.click(screen.getByText('Publicar produto'))
    await waitFor(() => {
      expect(screen.getByText('Preencha todos os campos obrigatórios')).toBeInTheDocument()
    })
    expect(criarProduto).not.toHaveBeenCalled()
  })

  it('deve chamar criarProduto com os dados preenchidos', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([])
    vi.mocked(criarProduto).mockResolvedValueOnce({ ...mockProduto, id: 'novo-1', description: 'Milho' })
    renderPage()
    fireEvent.click(screen.getByText('+ Adicionar produto'))
    fireEvent.change(screen.getByPlaceholderText('Ex: Soja em grão, safra 2025'), { target: { value: 'Milho' } })
    fireEvent.click(screen.getByText('Grão')) // categoria
    fireEvent.click(screen.getByText('Quilograma (kg)')) // escala
    // Dois inputs com placeholder "0,00": quantidade (index 0) e preço (index 1)
    const numInputs = screen.getAllByPlaceholderText('0,00')
    fireEvent.change(numInputs[0], { target: { value: '50' } })  // quantidade
    fireEvent.change(numInputs[1], { target: { value: '10' } })  // preço
    // Data de disponibilidade
    const dateInput = document.querySelector('input[type="date"]')!
    fireEvent.change(dateInput, { target: { value: '2025-12-01' } })
    fireEvent.click(screen.getByText('Publicar produto'))
    await waitFor(() => {
      expect(criarProduto).toHaveBeenCalled()
    })
  })
})

describe('MeusProdutos — painel de detalhes', () => {
  it('deve exibir o painel ao clicar em um produto', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    renderPage()
    await waitFor(() => screen.getByText('Soja em grão'))
    fireEvent.click(screen.getByText('Soja em grão'))
    expect(screen.getByText('Detalhes')).toBeInTheDocument()
    expect(screen.getByText('Desativar')).toBeInTheDocument()
    expect(screen.getByText('Remover')).toBeInTheDocument()
  })

  it('deve chamar desativarProduto ao clicar em "Desativar"', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    vi.mocked(desativarProduto).mockResolvedValueOnce(undefined as any)
    renderPage()
    await waitFor(() => screen.getByText('Soja em grão'))
    fireEvent.click(screen.getByText('Soja em grão'))
    await waitFor(() => screen.getByText('Desativar'))
    fireEvent.click(screen.getByText('Desativar'))
    await waitFor(() => {
      expect(desativarProduto).toHaveBeenCalledWith('prod-1')
    })
  })

  it('deve chamar deletarProduto ao confirmar remoção', async () => {
    vi.mocked(buscarProdutosPorVendedor).mockResolvedValue([mockProduto])
    vi.mocked(deletarProduto).mockResolvedValueOnce(undefined as any)
    renderPage()
    await waitFor(() => screen.getByText('Soja em grão'))
    fireEvent.click(screen.getByText('Soja em grão'))
    await waitFor(() => screen.getByText('Remover'))
    fireEvent.click(screen.getByText('Remover'))
    await waitFor(() => {
      expect(deletarProduto).toHaveBeenCalledWith('prod-1')
    })
  })
})
