import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: { put: vi.fn(), delete: vi.fn() },
  buscarTodosUsuarios: vi.fn(),
  buscarTodosPedidos: vi.fn(),
  buscarTodosProdutos: vi.fn(),
  buscarTodasContas: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import api, { buscarTodosUsuarios, buscarTodosPedidos, buscarTodosProdutos, buscarTodasContas } from '../../services/api'

const mockLogout = vi.fn()

const mockSession = {
  token: 'tok',
  userId: 'user-admin',
  email: 'admin@elocampo.com',
  isAdmin: true,
  account: null,
}

const mockUsuarios = [
  { id: 'u1', email: 'joao@fazenda.com', isAdmin: false, createdAt: '2024-01-15T00:00:00Z' },
  { id: 'u2', email: 'maria@fazenda.com', isAdmin: true, createdAt: '2024-02-20T00:00:00Z' },
]

const mockProdutos = [
  { id: 'p1', description: 'Soja em grão', category: 'GRAIN', scale: 'KG', price: 5.5 },
  { id: 'p2', description: 'Milho verde', category: 'GRAIN', scale: 'KG', price: 3.2 },
]

const mockPedidos = [
  { id: 'order-1234567890abcd', orderStatus: 'PENDING', price: 100, createdAt: '2024-03-01T00:00:00Z' },
  { id: 'order-0987654321efgh', orderStatus: 'COMPLETED', price: 250.5, createdAt: '2024-03-02T00:00:00Z' },
]

function switchToTab(nameRegex: RegExp) {
  fireEvent.click(screen.getAllByRole('button', { name: nameRegex })[0])
}

function renderPage() {
  return render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ session: mockSession, logout: mockLogout, setSession: vi.fn() } as any)
  vi.mocked(buscarTodosUsuarios).mockResolvedValue(mockUsuarios)
  vi.mocked(buscarTodosPedidos).mockResolvedValue(mockPedidos)
  vi.mocked(buscarTodosProdutos).mockResolvedValue(mockProdutos)
  vi.mocked(buscarTodasContas).mockResolvedValue([])
  vi.mocked(api.put).mockResolvedValue({} as any)
  vi.mocked(api.delete).mockResolvedValue({} as any)
  vi.stubGlobal('confirm', vi.fn(() => true))
})

describe('AdminDashboard — renderização', () => {
  it('deve exibir o badge ADMIN', () => {
    renderPage()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('deve exibir o e-mail da sessão na barra de navegação', () => {
    renderPage()
    expect(screen.getByText(mockSession.email)).toBeInTheDocument()
  })

  it('deve exibir o botão Sair', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('deve chamar logout ao clicar em Sair', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('deve exibir a aba Resumo por padrão', () => {
    renderPage()
    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument()
  })
})

describe('AdminDashboard — aba Resumo', () => {
  it('deve exibir os contadores corretos após carregar os dados', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByText('2')).toHaveLength(3)
    })
  })

  it('deve exibir os rótulos dos cards de estatísticas', () => {
    renderPage()
    expect(screen.getAllByText('Usuários').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Produtos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pedidos').length).toBeGreaterThan(0)
  })

  it('deve exibir os botões de gerenciamento', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Gerenciar Usuários/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gerenciar Produtos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gerenciar Pedidos/ })).toBeInTheDocument()
  })

  it('deve navegar para aba Usuários ao clicar em "Gerenciar Usuários"', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Gerenciar Usuários/ }))
    await waitFor(() => {
      expect(screen.getByText('Usuários cadastrados')).toBeInTheDocument()
    })
  })

  it('deve navegar para aba Produtos ao clicar em "Gerenciar Produtos"', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Gerenciar Produtos/ }))
    await waitFor(() => {
      expect(screen.getByText('Todos os produtos')).toBeInTheDocument()
    })
  })

  it('deve navegar para aba Pedidos ao clicar em "Gerenciar Pedidos"', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Gerenciar Pedidos/ }))
    await waitFor(() => {
      expect(screen.getByText('Todos os pedidos')).toBeInTheDocument()
    })
  })
})

describe('AdminDashboard — navegação de abas', () => {
  it('deve exibir a seção de usuários ao clicar na aba Usuários', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => {
      expect(screen.getByText('Usuários cadastrados')).toBeInTheDocument()
    })
  })

  it('deve exibir a seção de produtos ao clicar na aba Produtos', async () => {
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => {
      expect(screen.getByText('Todos os produtos')).toBeInTheDocument()
    })
  })

  it('deve exibir a seção de pedidos ao clicar na aba Pedidos', async () => {
    renderPage()
    switchToTab(/Gerenciar Pedidos/)
    await waitFor(() => {
      expect(screen.getByText('Todos os pedidos')).toBeInTheDocument()
    })
  })

  it('deve voltar para o Resumo ao clicar na aba Resumo', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => screen.getByText('Usuários cadastrados'))
    switchToTab(/Resumo/)
    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument()
  })
})

describe('AdminDashboard — aba Usuários', () => {
  it('deve exibir os e-mails dos usuários na tabela', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => {
      expect(screen.getByText('joao@fazenda.com')).toBeInTheDocument()
      expect(screen.getByText('maria@fazenda.com')).toBeInTheDocument()
    })
  })

  it('deve exibir badge "Admin" para administradores', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('deve exibir badge "Usuário" para não-admins', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => {
      expect(screen.getByText('Usuário')).toBeInTheDocument()
    })
  })

  it('deve exibir "Nenhum usuário encontrado" quando a lista está vazia', async () => {
    vi.mocked(buscarTodosUsuarios).mockResolvedValue([])
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => {
      expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument()
    })
  })

  it('deve chamar api.put para desativar usuário ao confirmar', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => screen.getAllByRole('button', { name: 'Desativar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Desativar' })[0])
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/v1/user/u1/deactivate')
    })
  })

  it('não deve chamar api.put para desativar se o usuário cancelar o confirm', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => screen.getAllByRole('button', { name: 'Desativar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Desativar' })[0])
    expect(api.put).not.toHaveBeenCalled()
  })

  it('deve chamar api.put para ativar usuário sem confirmação', async () => {
    renderPage()
    switchToTab(/Usuários/)
    await waitFor(() => screen.getAllByRole('button', { name: 'Ativar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Ativar' })[0])
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/v1/user/u1/activate')
    })
  })
})

describe('AdminDashboard — aba Produtos', () => {
  it('deve exibir os produtos na tabela', async () => {
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => {
      expect(screen.getByText('Soja em grão')).toBeInTheDocument()
      expect(screen.getByText('Milho verde')).toBeInTheDocument()
    })
  })

  it('deve exibir o preço formatado dos produtos', async () => {
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => {
      expect(screen.getByText('R$ 5,50')).toBeInTheDocument()
      expect(screen.getByText('R$ 3,20')).toBeInTheDocument()
    })
  })

  it('deve exibir "Nenhum produto encontrado" quando a lista está vazia', async () => {
    vi.mocked(buscarTodosProdutos).mockResolvedValue([])
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => {
      expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument()
    })
  })

  it('deve chamar api.delete ao confirmar remoção de produto', async () => {
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => screen.getAllByRole('button', { name: 'Remover' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0])
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/v1/product/p1')
    })
  })

  it('não deve chamar api.delete se o usuário cancelar o confirm', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => screen.getAllByRole('button', { name: 'Remover' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0])
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('deve remover o produto da lista após exclusão', async () => {
    renderPage()
    switchToTab(/Gerenciar Produtos/)
    await waitFor(() => screen.getByText('Soja em grão'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0])
    await waitFor(() => {
      expect(screen.queryByText('Soja em grão')).not.toBeInTheDocument()
    })
  })
})

describe('AdminDashboard — aba Pedidos', () => {
  it('deve exibir os status dos pedidos', async () => {
    renderPage()
    switchToTab(/Gerenciar Pedidos/)
    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument()
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    })
  })

  it('deve exibir o preço formatado dos pedidos', async () => {
    renderPage()
    switchToTab(/Gerenciar Pedidos/)
    await waitFor(() => {
      expect(screen.getByText('R$ 100,00')).toBeInTheDocument()
      expect(screen.getByText('R$ 250,50')).toBeInTheDocument()
    })
  })

  it('deve exibir "Nenhum pedido encontrado" quando a lista está vazia', async () => {
    vi.mocked(buscarTodosPedidos).mockResolvedValue([])
    renderPage()
    switchToTab(/Gerenciar Pedidos/)
    await waitFor(() => {
      expect(screen.getByText('Nenhum pedido encontrado.')).toBeInTheDocument()
    })
  })

  it('deve exibir o ID truncado dos pedidos', async () => {
    renderPage()
    switchToTab(/Gerenciar Pedidos/)
    await waitFor(() => {
      expect(screen.getByText('order-123456…')).toBeInTheDocument()
    })
  })
})
