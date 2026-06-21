import type { ChatResponse } from '../../types'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}))

// Usando jest.fn() diretamente dentro da factory — sem closures externas
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() } },
    })),
  },
}))

import axios from 'axios'
import { criarOuBuscarChat, gerarToken, criarUsuario } from '../../services/api'

// Captura a instância do axios usada internamente pelo módulo api.ts
const mockAxiosInstance = (axios.create as jest.Mock).mock.results[0].value

const makeChat = (overrides: Partial<ChatResponse> = {}): ChatResponse => ({
  id: 'chat-1',
  senderAccountId: 'sender-1',
  receiverAccountId: 'receiver-1',
  messages: [],
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('gerarToken', () => {
  it('faz POST em /v1/token e retorna o token', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: { token: 'abc123' } })

    const result = await gerarToken('user@test.com', 'senha123')

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/token', {
      email: 'user@test.com',
      password: 'senha123',
    })
    expect(result).toEqual({ token: 'abc123' })
  })
})

describe('criarUsuario', () => {
  it('faz POST em /v1/user com os dados fornecidos', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', isAdmin: false, createdAt: 0, updatedAt: 0 }
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockUser })

    const result = await criarUsuario({ email: 'a@b.com', password: '1234', isAdmin: false })

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/user', {
      email: 'a@b.com',
      password: '1234',
      isAdmin: false,
    })
    expect(result).toEqual(mockUser)
  })
})

describe('criarOuBuscarChat', () => {
  it('retorna o chat recém-criado quando criarChat tem sucesso', async () => {
    const novoChat = makeChat()
    mockAxiosInstance.post.mockResolvedValueOnce({ data: novoChat })

    const result = await criarOuBuscarChat('sender-1', 'receiver-1')

    expect(result).toEqual(novoChat)
    expect(mockAxiosInstance.get).not.toHaveBeenCalled()
  })

  it('busca chat existente quando criarChat retorna 422', async () => {
    const chatExistente = makeChat({ id: 'chat-existente' })
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 422 } })
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [chatExistente] })

    const result = await criarOuBuscarChat('sender-1', 'receiver-1')

    expect(result).toEqual(chatExistente)
    expect(mockAxiosInstance.get).toHaveBeenCalled()
  })

  it('busca chat existente quando criarChat retorna 400', async () => {
    const chatExistente = makeChat({ id: 'chat-existente-400' })
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 400 } })
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [chatExistente] })

    const result = await criarOuBuscarChat('sender-1', 'receiver-1')

    expect(result).toEqual(chatExistente)
  })

  it('encontra o chat correto na lista quando há múltiplos chats', async () => {
    const chatErrado = makeChat({ id: 'outro', senderAccountId: 'sender-1', receiverAccountId: 'terceiro' })
    const chatCerto = makeChat({ id: 'correto', senderAccountId: 'sender-1', receiverAccountId: 'receiver-1' })
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 422 } })
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [chatErrado, chatCerto] })

    const result = await criarOuBuscarChat('sender-1', 'receiver-1')

    expect(result.id).toBe('correto')
  })

  it('encontra o chat quando sender e receiver estão invertidos na lista', async () => {
    const chatInvertido = makeChat({ id: 'invertido', senderAccountId: 'receiver-1', receiverAccountId: 'sender-1' })
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 422 } })
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [chatInvertido] })

    const result = await criarOuBuscarChat('sender-1', 'receiver-1')

    expect(result.id).toBe('invertido')
  })

  it('relança o erro quando o status não é 422 nem 400', async () => {
    const erroServidor = { response: { status: 500 } }
    mockAxiosInstance.post.mockRejectedValueOnce(erroServidor)

    await expect(criarOuBuscarChat('sender-1', 'receiver-1')).rejects.toEqual(erroServidor)
    expect(mockAxiosInstance.get).not.toHaveBeenCalled()
  })

  it('relança o erro quando não há response (erro de rede)', async () => {
    const erroRede = new Error('Network Error')
    mockAxiosInstance.post.mockRejectedValueOnce(erroRede)

    await expect(criarOuBuscarChat('sender-1', 'receiver-1')).rejects.toThrow('Network Error')
  })

  it('relança o erro 422 quando nenhum chat existente corresponde aos IDs', async () => {
    // Comportamento real: se a busca não encontra o chat, o erro original é relançado
    const chatNaoRelacionado = makeChat({ id: 'outro', senderAccountId: 'x', receiverAccountId: 'y' })
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 422 } })
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [chatNaoRelacionado] })

    await expect(criarOuBuscarChat('sender-1', 'receiver-1')).rejects.toEqual({
      response: { status: 422 },
    })
  })
})
