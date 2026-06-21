import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: (cb) => require('react').useEffect(cb, []),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const makePedido = (status: string, id = 'abc123456789') => ({
  id,
  orderStatus: status,
  products: [{ productId: 'p1', description: 'Tomate', quantity: 5, price: 8 }],
  price: 40,
  buyerAccountId: 'acc-1',
  sellerAccountId: 's1',
  createdAt: 0,
  updatedAt: 0,
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [] })
})

import MeusPedidosScreen from '../../../screens/comprador/MeusPedidosScreen'

describe('MeusPedidosScreen', () => {
  it('exibe mensagem vazia quando não há pedidos', async () => {
    const { findByText } = render(<MeusPedidosScreen />)
    expect(await findByText('Nenhum pedido ainda.')).toBeTruthy()
  })

  it('exibe pedidos na lista', async () => {
    ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [makePedido('PENDING')] })
    const { findByText } = render(<MeusPedidosScreen />)
    expect(await findByText(/Tomate/)).toBeTruthy()
  })

  it('navega para Avaliacoes ao pressionar pedido COMPLETED', async () => {
    const pedidoConcluido = makePedido('COMPLETED', 'xyz987654321')
    ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [pedidoConcluido] })

    const { findByText } = render(<MeusPedidosScreen />)
    const item = await findByText(/Tomate/)
    fireEvent.press(item)

    expect(mockNavigate).toHaveBeenCalledWith('Avaliacoes', { pedido: pedidoConcluido })
  })

  it('navega para ChatComprador ao pressionar pedido PENDING', async () => {
    const pedidoPendente = makePedido('PENDING', 'zzz111222333')
    ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [pedidoPendente] })

    const { findByText } = render(<MeusPedidosScreen />)
    const item = await findByText(/Tomate/)
    fireEvent.press(item)

    expect(mockNavigate).toHaveBeenCalledWith('ChatComprador', { pedido: pedidoPendente })
  })

  it('exibe o status correto com Tag', async () => {
    ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [makePedido('PENDING')] })
    const { findByText } = render(<MeusPedidosScreen />)
    expect(await findByText('Pendente')).toBeTruthy()
  })
})
