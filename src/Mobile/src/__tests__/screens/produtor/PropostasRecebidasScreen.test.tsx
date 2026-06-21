import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'
import { OrderStatusEnum } from '../../../types'

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: (cb) => require('react').useEffect(cb, []),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const pendingOrder = {
  id: 'o1',
  orderStatus: 'PENDING',
  products: [{ productId: 'p1', description: 'Soja', quantity: 10, price: 100 }],
  price: 1000,
  buyerAccountId: 'b1',
  sellerAccountId: 'acc-1',
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ goBack: jest.fn() })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [] })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import PropostasRecebidasScreen from '../../../screens/produtor/PropostasRecebidasScreen'

describe('PropostasRecebidasScreen', () => {
  it('exibe mensagem vazia quando não há propostas', async () => {
    const { findByText } = render(<PropostasRecebidasScreen />)
    expect(await findByText('Nenhuma proposta pendente.')).toBeTruthy()
  })

  it('exibe propostas pendentes na lista', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [pendingOrder] })

    const { findByText } = render(<PropostasRecebidasScreen />)
    expect(await findByText('Soja')).toBeTruthy()
  })

  it('chama atualizarStatusPedido com ACCEPTED ao aceitar', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [pendingOrder] })
    ;(api.atualizarStatusPedido as jest.Mock).mockResolvedValue({ ...pendingOrder, orderStatus: 'ACCEPTED' })

    const { findByText } = render(<PropostasRecebidasScreen />)
    const aceitar = await findByText('Aceitar')
    await act(async () => { fireEvent.press(aceitar) })

    expect(api.atualizarStatusPedido).toHaveBeenCalledWith('o1', { status: OrderStatusEnum.ACCEPTED })
  })

  it('remove a proposta da lista após aceitar', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [pendingOrder] })
    ;(api.atualizarStatusPedido as jest.Mock).mockResolvedValue({})

    const { findByText, queryByText } = render(<PropostasRecebidasScreen />)
    const aceitar = await findByText('Aceitar')
    await act(async () => { fireEvent.press(aceitar) })

    await waitFor(() => expect(queryByText('Soja')).toBeNull())
  })

  it('filtra apenas pedidos PENDING da API', async () => {
    ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({
      content: [
        pendingOrder,
        { ...pendingOrder, id: 'o2', orderStatus: 'ACCEPTED' },
      ],
    })

    const { findAllByText } = render(<PropostasRecebidasScreen />)
    const aceitar = await findAllByText('Aceitar')
    expect(aceitar).toHaveLength(1)
  })
})
