import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const pedido = {
  id: 'o1abcdefgh',
  orderStatus: 'PENDING',
  products: [{ productId: 'p1', description: 'Manteiga', quantity: 2, price: 15 }],
  price: 30,
  buyerAccountId: 'acc-1',
  sellerAccountId: 'seller-1',
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: jest.fn() })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { pedido } })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ name: 'Carlos Vendedor' })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import ChatCompradorScreen from '../../../screens/comprador/ChatCompradorScreen'

describe('ChatCompradorScreen', () => {
  it('exibe detalhes do pedido', () => {
    const { getByText } = render(<ChatCompradorScreen />)
    expect(getByText(/Manteiga/)).toBeTruthy()
  })

  it('exibe o nome do vendedor após carregamento', async () => {
    const { findByText } = render(<ChatCompradorScreen />)
    expect(await findByText('Vendedor: Carlos Vendedor')).toBeTruthy()
  })

  it('exibe o botão de abrir chat', () => {
    const { getByText } = render(<ChatCompradorScreen />)
    expect(getByText('Abrir chat com o vendedor')).toBeTruthy()
  })

  it('chama criarOuBuscarChat e navega para ChatDetail ao pressionar o botão', async () => {
    ;(api.criarOuBuscarChat as jest.Mock).mockResolvedValue({ id: 'chat-123' })

    const { getByText } = render(<ChatCompradorScreen />)
    await act(async () => { fireEvent.press(getByText('Abrir chat com o vendedor')) })

    expect(api.criarOuBuscarChat).toHaveBeenCalledWith('acc-1', 'seller-1')
    expect(mockNavigate).toHaveBeenCalledWith('ChatDetail', {
      chatId: 'chat-123',
      myAccountId: 'acc-1',
      theme: 'comprador',
    })
  })
})
