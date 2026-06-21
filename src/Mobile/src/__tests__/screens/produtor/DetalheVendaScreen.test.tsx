import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'
import { OrderStatusEnum } from '../../../types'

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

const makePedido = (status: string) => ({
  id: 'abcdef123456',
  orderStatus: status,
  products: [{ productId: 'p1', description: 'Soja', quantity: 10, price: 100 }],
  price: 1000,
  buyerAccountId: 'buyer-1',
  sellerAccountId: 'acc-1',
  createdAt: 0,
  updatedAt: 0,
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { pedido: makePedido('PENDING') } })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ name: 'Maria Compradora' })
  ;(api.atualizarStatusPedido as jest.Mock).mockResolvedValue(makePedido('ACCEPTED'))
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import DetalheVendaScreen from '../../../screens/produtor/DetalheVendaScreen'

describe('DetalheVendaScreen', () => {
  it('exibe ID, itens e total do pedido', async () => {
    const { getByText, findByText } = render(<DetalheVendaScreen />)
    expect(getByText('Detalhe da Venda')).toBeTruthy()
    expect(getByText(/Soja/)).toBeTruthy()
    expect(await findByText('Comprador: Maria Compradora')).toBeTruthy()
  })

  it('exibe botões Aceitar e Recusar para pedido PENDING', () => {
    const { getByText } = render(<DetalheVendaScreen />)
    expect(getByText('Aceitar proposta')).toBeTruthy()
    expect(getByText('Recusar proposta')).toBeTruthy()
  })

  it('não exibe botões de ação para pedido ACCEPTED com ação diferente', () => {
    ;(useRoute as jest.Mock).mockReturnValue({ params: { pedido: makePedido('ACCEPTED') } })
    const { getByText, queryByText } = render(<DetalheVendaScreen />)
    expect(getByText('Finalizar venda')).toBeTruthy()
    expect(queryByText('Aceitar proposta')).toBeNull()
  })

  it('chama atualizarStatusPedido com ACCEPTED ao aceitar', async () => {
    const { getByText } = render(<DetalheVendaScreen />)
    await act(async () => { fireEvent.press(getByText('Aceitar proposta')) })
    expect(api.atualizarStatusPedido).toHaveBeenCalledWith('abcdef123456', { status: OrderStatusEnum.ACCEPTED })
  })

  it('abre modal de confirmação ao pressionar "Recusar proposta"', async () => {
    const { getByText, findByText } = render(<DetalheVendaScreen />)
    fireEvent.press(getByText('Recusar proposta'))
    // O texto completo inclui "Essa ação não pode ser desfeita." — busca por regex
    expect(await findByText(/Tem certeza que deseja recusar/)).toBeTruthy()
  })

  it('fecha o modal sem chamar a API ao pressionar Cancelar', async () => {
    const { getByText, queryByText } = render(<DetalheVendaScreen />)
    fireEvent.press(getByText('Recusar proposta'))
    fireEvent.press(getByText('Cancelar'))
    await waitFor(() => expect(queryByText(/Tem certeza que deseja recusar/)).toBeNull())
    expect(api.atualizarStatusPedido).not.toHaveBeenCalled()
  })

  it('chama atualizarStatusPedido com CANCELLED ao confirmar recusa', async () => {
    ;(api.atualizarStatusPedido as jest.Mock).mockResolvedValue(makePedido('CANCELLED'))

    const { getByText, getAllByText } = render(<DetalheVendaScreen />)
    fireEvent.press(getByText('Recusar proposta'))

    const recusarBtns = getAllByText('Recusar')
    await act(async () => { fireEvent.press(recusarBtns[recusarBtns.length - 1]) })

    expect(api.atualizarStatusPedido).toHaveBeenCalledWith('abcdef123456', { status: OrderStatusEnum.CANCELLED })
  })

  it('fecha o modal após recusa bem-sucedida', async () => {
    ;(api.atualizarStatusPedido as jest.Mock).mockResolvedValue(makePedido('CANCELLED'))

    const { getByText, getAllByText, queryByText } = render(<DetalheVendaScreen />)
    fireEvent.press(getByText('Recusar proposta'))
    const recusarBtns = getAllByText('Recusar')
    await act(async () => { fireEvent.press(recusarBtns[recusarBtns.length - 1]) })

    await waitFor(() => expect(queryByText(/Tem certeza que deseja recusar/)).toBeNull())
  })
})
