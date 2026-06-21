import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { API_BASE_URL } from '../config'
import type {
  UserResponse,
  AccountResponse,
  AccountInput,
  AccountEvaluation,
  ProductResponse,
  ProductInput,
  ProductEvaluationInput,
  OrderResponse,
  OrderInput,
  OrderStatusChangeInput,
  ChatResponse,
  ChatInput,
  MessageInput,
  MessageResponse,
  Page,
  FileEntityType,
  FileUploadResponse,
} from '../types'

const api = axios.create({ baseURL: API_BASE_URL })

const PUBLIC_ROUTES = ['/v1/token', '/v1/user']

api.interceptors.request.use(async cfg => {
  if (!PUBLIC_ROUTES.includes(cfg.url ?? '')) {
    const token = await AsyncStorage.getItem('ec_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// Auth
export const gerarToken = (email: string, password: string) =>
  api.post<{ token: string }>('/v1/token', { email, password }).then(r => r.data)

export const criarUsuario = (data: { email: string; password: string; isAdmin: boolean }) =>
  api.post<UserResponse>('/v1/user', data).then(r => r.data)

export const resetarSenha = (email: string) =>
  api.post(`/v1/user/reset-password/${encodeURIComponent(email)}`).then(r => r.data)

export const buscarTodosUsuarios = () =>
  api.get<UserResponse[]>('/v1/user/all').then(r => r.data)

export const ativarUsuario = (id: string) =>
  api.put(`/v1/user/${id}/activate`).then(r => r.data)

export const desativarUsuario = (id: string) =>
  api.put(`/v1/user/${id}/deactivate`).then(r => r.data)

// Conta
export const criarConta = (data: AccountInput) =>
  api.post<AccountResponse>('/v1/account', data).then(r => r.data)

export const buscarContaPorUsuario = (userId: string) =>
  api.get<AccountResponse>(`/v1/account/user/${userId}`).then(r => r.data)

export const buscarContaPorId = (id: string) =>
  api.get<AccountResponse>(`/v1/account/${id}`).then(r => r.data)

export const buscarTodasContas = () =>
  api.get<AccountResponse[]>('/v1/account/all').then(r => r.data)

export const atualizarConta = (id: string, data: AccountInput) =>
  api.put<AccountResponse>(`/v1/account/${id}`, data).then(r => r.data)

export const criarAvaliacaoConta = (accountId: string, data: AccountEvaluation) =>
  api.post<AccountEvaluation>(`/v1/account/${accountId}/evaluate`, data).then(r => r.data)

// Produto
export const buscarProdutos = (params?: { description?: string; category?: string; vendorState?: string }) =>
  api.get<ProductResponse[]>('/v1/product/query', { params }).then(r => r.data)

export const buscarProdutoPorId = (id: string) =>
  api.get<ProductResponse>(`/v1/product/${id}`).then(r => r.data)

export const buscarProdutosPorVendedor = (vendorAccountId: string) =>
  api.get<ProductResponse[]>(`/v1/product/vendor/${vendorAccountId}`).then(r => r.data)

export const criarProduto = (data: ProductInput) =>
  api.post<ProductResponse>('/v1/product', data).then(r => r.data)

export const atualizarProduto = (id: string, data: ProductInput) =>
  api.put<ProductResponse>(`/v1/product/${id}`, data).then(r => r.data)

export const ativarProduto = (id: string) =>
  api.put(`/v1/product/${id}/activate`)

export const desativarProduto = (id: string) =>
  api.put(`/v1/product/${id}/deactivate`)

export const deletarProduto = (id: string) =>
  api.delete(`/v1/product/${id}`)

export const buscarTodosProdutos = () =>
  api.get('/v1/product/all').then(r => r.data)

export const criarAvaliacaoProduto = (productId: string, data: ProductEvaluationInput) =>
  api.post<ProductResponse>(`/v1/product/${productId}/evaluate`, data).then(r => r.data)

// Pedido
export const buscarPedidos = () =>
  api.get<Page<OrderResponse>>('/v1/order').then(r => r.data)

export const criarPedido = (data: OrderInput) =>
  api.post<OrderResponse>('/v1/order', data).then(r => r.data)

export const buscarPedidoPorIdComprador = (id: string) =>
  api.get<Page<OrderResponse>>(`/v1/order/buyer/${id}`).then(r => r.data)

export const buscarPedidoPorIdVendedor = (id: string) =>
  api.get<Page<OrderResponse>>(`/v1/order/seller/${id}`).then(r => r.data)

export const atualizarStatusPedido = (id: string, data: OrderStatusChangeInput) =>
  api.put<OrderResponse>(`/v1/order/${id}/status`, data).then(r => r.data)

export const buscarTodosPedidos = () =>
  api.get('/v1/order/all').then(r => r.data)

// Arquivo
export const buscarArquivosPorEntidade = (entityType: FileEntityType, entityId: string) =>
  api.get<FileUploadResponse[]>('/v1/file', { params: { entityType, entityId } }).then(r => r.data)

export const deletarArquivo = (id: string) =>
  api.delete(`/v1/file/${id}`)

const normalizeMimeType = (type: string): string => {
  if (type === 'image/jpg') return 'image/jpeg'
  if (type === 'image/heic' || type === 'image/heif') return 'image/jpeg'
  return type
}

export const uploadArquivo = async (
  entityType: FileEntityType,
  entityId: string,
  file: { uri: string; name: string; type: string },
): Promise<FileUploadResponse> => {
  const mimeType = normalizeMimeType(file.type)
  const form = new FormData()

  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then(r => r.blob())
    form.append('file', new File([blob], file.name, { type: mimeType }))
  } else {
    form.append('file', { uri: file.uri, name: file.name, type: mimeType } as unknown as Blob)
  }
  form.append('entityType', entityType)
  form.append('entityId', entityId)

  const token = await AsyncStorage.getItem('ec_token')
  const response = await fetch(`${API_BASE_URL}/v1/file/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const err: any = new Error(data?.message ?? `HTTP ${response.status}`)
    err.response = { data, status: response.status }
    throw err
  }

  return response.json()
}

// Chat
export const buscarChatsPorConta = (accountId: string) =>
  api.get<ChatResponse[]>(`/v1/chat/${accountId}/chats`).then(r => r.data)

export const buscarChatPorId = (id: string) =>
  api.get<ChatResponse>(`/v1/chat/${id}`).then(r => r.data)

export const criarChat = (data: ChatInput) =>
  api.post<ChatResponse>('/v1/chat', data).then(r => r.data)

export async function criarOuBuscarChat(senderAccountId: string, receiverAccountId: string): Promise<ChatResponse> {
  try {
    return await criarChat({ senderAccountId, receiverAccountId })
  } catch (err: any) {
    if (err.response?.status === 422 || err.response?.status === 400) {
      const chats = await buscarChatsPorConta(senderAccountId)
      const existing = chats.find(c =>
        (c.senderAccountId === senderAccountId && c.receiverAccountId === receiverAccountId) ||
        (c.senderAccountId === receiverAccountId && c.receiverAccountId === senderAccountId)
      )
      if (existing) return existing
    }
    throw err
  }
}

export const enviarMensagem = (chatId: string, data: MessageInput) =>
  api.post<MessageResponse>(`/v1/chat/${chatId}/message`, data).then(r => r.data)

export default api
