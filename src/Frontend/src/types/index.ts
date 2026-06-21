export interface UserResponse {
  id: string
  email: string
  isAdmin: boolean
  createdAt: number
  updatedAt: number
}

// Conta (account-service)
export type AccountRole = 'BUYER' | 'VENDOR'

export interface AccountAddress {
  street: string
  number: string
  city: string
  district: string
  state: string
  complement: string
  postalCode: string
}

export interface AccountPhone {
  countryCode: number
  stateCode: number
  number: string
}

export interface AccountEvaluation {
  id: string
  stars: number
  content: string
  reviewerAccountId: string
  productId: string
}

export interface AccountResponse {
  id: string
  userId: string
  name: string
  businessName?: string
  cpf?: string
  cnpj?: string
  birthdayDate: number
  address: AccountAddress
  phone: AccountPhone
  role: AccountRole
  createdAt: number
  updatedAt: number
  evaluation?: AccountEvaluation[]
}

export interface AccountInput {
  userId: string
  name: string
  businessName?: string
  cpf?: string
  cnpj?: string
  birthdayDate: number
  address: AccountAddress
  phone: AccountPhone
  role: AccountRole
}

// Sessão autenticada
export interface AuthSession {
  token: string
  userId: string
  email: string
  isAdmin: boolean
  account?: AccountResponse
}

// Produto (product-service)
export type ProductCategory = 'GRAIN' | 'VEGETABLE' | 'FRUIT' | 'DAIRY' | 'ANIMAL_PRODUCTS' | 'PROTEINS' | 'CONFECTIONERY'
export type ProductStatus = 'AVAILABLE' | 'UNAVAILABLE'
export type ProductScale = 'KG' | 'UNIT' | 'LITER'

export interface ProductEvaluation {
  id?: string
  stars: number
  content?: string
  productId?: string
  reviewerAccountId: string;
}

export interface ProductEvaluationInput {
  stars: number
  content?: string
  reviewerAccountId: string;
}

export const PRODUCT_CATEGORY: { v: ProductCategory; label: string }[] = [
    { v: 'GRAIN', label: 'Grão' },
    { v: 'VEGETABLE', label: 'Vegetal' },
    { v: 'FRUIT', label: 'Fruta' },
    { v: 'DAIRY', label: 'Laticínio' },
    { v: 'ANIMAL_PRODUCTS', label: 'Origem animal' },
    { v: 'PROTEINS', label: 'Proteínas' },
    { v: 'CONFECTIONERY', label: 'Artesanato' },
  ];

export const PRODUCT_SCALE: { v: ProductScale; label: string }[] = [
  { v: 'KG', label: 'Quilograma (kg)' },
  { v: 'UNIT', label: 'Unidade' },
  { v: 'LITER', label: 'Litro (L)' },
];

export interface ProductResponse {
  id: string
  vendorAccountId: string
  description: string
  category: ProductCategory
  status: ProductStatus
  scale: ProductScale
  quantity: number
  price: number
  vendorCity: string
  vendorState: string
  availabilityDate: number
  imageUrls: string[]
  createdAt: number
  updatedAt: number
  evaluations?: ProductEvaluation[]
}

export interface ProductInput {
  vendorAccountId: string
  description: string
  category: ProductCategory
  scale: ProductScale
  quantity: number
  price: number
  availabilityDate: number
  imageUrls?: string[]
}

// Pedido / Venda (order-service)

export type ORDER_DEFAULT_PAGINATION = 100

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED'

export interface OrderItem {
  productId: string
  description: string
  quantity: number
  price: number
}

export interface OrderHistoryResponse {
  type: string
  createdAt: number
}

export interface OrderResponse {
  id: string
  buyerAccountId: string
  sellerAccountId: string
  orderStatus: OrderStatus
  products: OrderItem[]
  history?: OrderHistoryResponse[]
  price: number
  createdAt: number
  updatedAt: number
}

export interface OrderInput {
  buyerAccountId: string
  sellerAccountId: string
  productsIds: OrderItem[]
}

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED'
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:   'Pendente',
  ACCEPTED:  'Aceito',
  COMPLETED: 'Concluído',
}

export const ACCOUNT_ROLE_LABEL: Record<AccountRole, string> = {
  VENDOR: 'Produtor',
  BUYER:  'Comprador',
}

export interface OrderStatusChangeInput {
  status: OrderStatusEnum
  note?: string
}

// Chat (chat-service)
export interface MessageResponse {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface ChatResponse {
  id: string
  senderAccountId: string
  receiverAccountId: string
  messages: MessageResponse[]
  createdAt: number
  updatedAt: number
}

export interface ChatInput {
  senderAccountId: string
  receiverAccountId: string
}

export interface MessageInput {
  content: string
}

// Arquivo (file-service)
export type FileEntityType = 'PRODUCT' | 'PROFILE'

export interface FileUploadResponse {
  id: string
  publicId: string
  url: string
  secureUrl: string
  format: string
  size: number
  entityType: FileEntityType
  entityId: string
  uploadedBy: string
  uploadedAt: number
}

// Paginação
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
