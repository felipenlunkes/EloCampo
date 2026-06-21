import axios from 'axios'
import type {
  UserResponse,
  AccountResponse,
  AccountInput,
  ProductResponse,
  ProductInput,
  OrderResponse,
  OrderStatusChangeInput,
  OrderInput,
  ChatResponse,
  ChatInput,
  MessageInput,
  Page,
  ORDER_DEFAULT_PAGINATION,
  AccountEvaluation,
  ProductEvaluation,
  ProductEvaluationInput,
  FileEntityType,
  FileUploadResponse,
} from '../types'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api' })

const PUBLIC_ROUTES = ['/v1/token', '/v1/user']

api.interceptors.request.use(cfg => {
  if (!PUBLIC_ROUTES.includes(cfg.url ?? '')) {
    const token = localStorage.getItem('ec_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('ec_token')
    localStorage.removeItem('ec_session')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

// Autenticação (auth-service)
export const gerarToken = (email: string, password: string) =>
  api.post<{ token: string }>('/v1/token', { email, password }).then(r => r.data)

export const criarUsuario = (data: { email: string; password: string; isAdmin: boolean }) =>
  api.post<UserResponse>('/v1/user', data).then(r => r.data)

export const resetarSenha = (email: string) =>
  api.post(`/v1/user/reset-password/${encodeURIComponent(email)}`).then(r => r.data)

export const buscarTodosUsuarios = () => 
  api.get('/v1/user/all').then(r => r.data)

// Conta (account-service)
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

// Produto (product-service)
export const buscarProdutos = (params?: { description?: string; category?: string; vendorCity?: string; vendorState?: string }) =>
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

// Pedido / Venda (order-service)
export const buscarPedidos = (params?: { page?: number | ORDER_DEFAULT_PAGINATION; size?: number }) =>
  api.get<Page<OrderResponse>>('/v1/order', { params }).then(r => r.data)

export const criarPedido = (data: OrderInput) =>
  api.post<OrderResponse>('/v1/order', data).then(r => r.data)

export const buscarPedidoPorId = (id: string) =>
  api.get<OrderResponse>(`/v1/order/${id}`).then(r => r.data)

export const buscarPedidoPorIdComprador = (id: string, params?: { page?: number | ORDER_DEFAULT_PAGINATION; size?: number }) =>
  api.get<Page<OrderResponse>>(`/v1/order/buyer/${id}`, { params }).then(r => r.data)

export const buscarPedidoPorIdVendedor = (id: string, params?: { page?: number | ORDER_DEFAULT_PAGINATION; size?: number }) =>
  api.get<Page<OrderResponse>>(`/v1/order/seller/${id}`, { params }).then(r => r.data)

export const finalizarPedidoVendedor = (id: string, data: OrderStatusChangeInput) =>
  api.put<OrderResponse>(`/v1/order/${id}/status`, data).then(r => r.data)

export const buscarTodosPedidos = () => 
  api.get('/v1/order/all').then(r => r.data)

// Chat (chat-service)
export const buscarChats = () =>
  api.get<ChatResponse[]>('/v1/chat').then(r => r.data)

export const criarChat = (data: ChatInput) =>
  api.post<ChatResponse>('/v1/chat', data).then(r => r.data)

export const enviarMensagem = (chatId: string, data: MessageInput) =>
  api.post(`/v1/chat/${chatId}/message`, data).then(r => r.data)

// Avaliações (evaluation-service)

export const buscarAvaliacoesConta = (accountId: string) =>
  api.get<AccountEvaluation[]>(`/v1/evaluation/account/${accountId}`).then(r => r.data)

export const criarAvaliacaoProduto = (productId: string, data: ProductEvaluationInput) =>
  api.post<ProductResponse>(`/v1/product/${productId}/evaluate`, data).then(r => r.data)

export const criarAvaliacaoConta = (accountId: string, data: AccountEvaluation) =>
  api.post<AccountEvaluation>(`/v1/account/${accountId}/evaluate`, data).then(r => r.data)

// Arquivo (file-service)
export const buscarArquivosPorEntidade = (entityType: FileEntityType, entityId: string) =>
  api.get<FileUploadResponse[]>('/v1/file', { params: { entityType, entityId } }).then(r => r.data)

export const uploadArquivo = (file: File, entityType: FileEntityType, entityId: string) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('entityType', entityType)
  fd.append('entityId', entityId)
  return api.post<FileUploadResponse>('/v1/file/upload', fd).then(r => r.data)
}

export const deletarArquivo = (id: string) =>
  api.delete(`/v1/file/${id}`)

export default api
