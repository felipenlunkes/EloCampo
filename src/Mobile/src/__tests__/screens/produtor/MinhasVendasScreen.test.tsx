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

const pedido = {
  id: 'abcdef123456',
  orderStatus: 'ACCEPTED',
  products: [{ productId: 'p1', description: 'Milho', quantity: 50, price: 80 }],
  price: 4000,
  buyerAccountId: 'b1',
  sellerAccountId: 'acc-1',
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [] })
})

import MinhasVendasScreen from '../../../screens/produtor/MinhasVendasScreen'

describe('MinhasVendasScreen', () => {
  it('exibe mensagem vazia quando não há vendas', async () => {
    const { findByText } = render(<MinhasVendasScreen />)
    expect(await findByText('Nenhuma venda ainda.')).toBeTruthy()
  })

  it('exibe vendas na lista', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [pedido] })

    const { findByText } = render(<MinhasVendasScreen />)
    expect(await findByText(/Milho/)).toBeTruthy()
  })

  it('navega para DetalheVenda ao pressionar um pedido', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [pedido] })

    const { findByText } = render(<MinhasVendasScreen />)
    const item = await findByText(/Milho/)
    fireEvent.press(item)

    expect(mockNavigate).toHaveBeenCalledWith('DetalheVenda', { pedido })
  })

  it('navega para PropostasRecebidas ao pressionar "Propostas →"', async () => {
    const { findByText } = render(<MinhasVendasScreen />)
    const link = await findByText('Propostas →')
    fireEvent.press(link)

    expect(mockNavigate).toHaveBeenCalledWith('PropostasRecebidas')
  })
})
