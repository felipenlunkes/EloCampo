import React from 'react'
import { render } from '@testing-library/react-native'
import * as api from '../../../services/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../services/api')

const makePedido = (status: string, desc = 'Arroz') => ({
  id: 'o1',
  orderStatus: status,
  products: [{ productId: 'p1', description: desc, quantity: 50, price: 3 }],
  price: 150,
  buyerAccountId: 'b1',
  sellerAccountId: 's1',
  createdAt: 1700000000000,
  updatedAt: 0,
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([])
})

import PedidosAdminScreen from '../../../screens/admin/PedidosAdminScreen'

describe('PedidosAdminScreen', () => {
  it('renderiza título "Pedidos" e badge ADMIN', () => {
    const { getByText, getAllByText } = render(<PedidosAdminScreen />)
    expect(getByText('Pedidos')).toBeTruthy()
    expect(getAllByText('ADMIN').length).toBeGreaterThan(0)
  })

  it('exibe mensagem vazia quando não há pedidos', async () => {
    const { findByText } = render(<PedidosAdminScreen />)
    expect(await findByText('Nenhum pedido encontrado.')).toBeTruthy()
  })

  it('exibe pedidos na lista com descrição e preço', async () => {
    ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([makePedido('PENDING', 'Trigo')])
    const { findByText } = render(<PedidosAdminScreen />)
    expect(await findByText('Trigo')).toBeTruthy()
    expect(await findByText(/R\$ 150,00/)).toBeTruthy()
  })

  it('exibe tag "Pendente" para pedido PENDING', async () => {
    ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([makePedido('PENDING')])
    const { findByText } = render(<PedidosAdminScreen />)
    expect(await findByText('Pendente')).toBeTruthy()
  })

  it('exibe tag "Aceito" para pedido ACCEPTED', async () => {
    ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([makePedido('ACCEPTED')])
    const { findByText } = render(<PedidosAdminScreen />)
    expect(await findByText('Aceito')).toBeTruthy()
  })

  it('exibe múltiplos pedidos', async () => {
    ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([
      makePedido('PENDING', 'Milho'),
      { ...makePedido('COMPLETED', 'Soja'), id: 'o2' },
    ])
    const { findByText } = render(<PedidosAdminScreen />)
    expect(await findByText('Milho')).toBeTruthy()
    expect(await findByText('Soja')).toBeTruthy()
  })
})
