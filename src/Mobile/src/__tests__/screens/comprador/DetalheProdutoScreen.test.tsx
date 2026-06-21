import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const produto = {
  id: 'p1',
  description: 'Mandioca Aipim',
  vendorCity: 'Belém',
  vendorState: 'PA',
  status: 'AVAILABLE' as const,
  category: 'VEGETABLE' as const,
  quantity: 300,
  price: 2.5,
  scale: 'KG' as const,
  vendorAccountId: 'v1',
  availabilityDate: Date.now(),
  imageUrls: [],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { produto } })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-buyer' } } })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import DetalheProdutoScreen from '../../../screens/comprador/DetalheProdutoScreen'

describe('DetalheProdutoScreen', () => {
  it('exibe nome e localização do produto', () => {
    const { getByText } = render(<DetalheProdutoScreen />)
    expect(getByText('Mandioca Aipim')).toBeTruthy()
    expect(getByText(/Belém/)).toBeTruthy()
  })

  it('exibe quantidade disponível', () => {
    const { getByText } = render(<DetalheProdutoScreen />)
    expect(getByText(/300 un/)).toBeTruthy()
  })

  it('valida quantidade vazia ao enviar proposta', () => {
    const { getByText } = render(<DetalheProdutoScreen />)
    fireEvent.press(getByText('Enviar proposta'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Informe uma quantidade válida')
  })

  it('valida quantidade maior que o disponível', () => {
    const { getByText, getByPlaceholderText } = render(<DetalheProdutoScreen />)
    fireEvent.changeText(getByPlaceholderText('Ex: 100'), '999')
    fireEvent.press(getByText('Enviar proposta'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', expect.stringContaining('300'))
  })

  it('chama criarPedido com os dados corretos ao enviar', async () => {
    ;(api.criarPedido as jest.Mock).mockResolvedValue({ id: 'ord1' })

    const { getByText, getByPlaceholderText } = render(<DetalheProdutoScreen />)
    fireEvent.changeText(getByPlaceholderText('Ex: 100'), '50')
    await act(async () => { fireEvent.press(getByText('Enviar proposta')) })

    expect(api.criarPedido).toHaveBeenCalledWith(expect.objectContaining({
      buyerAccountId: 'acc-buyer',
      sellerAccountId: 'v1',
    }))
  })

  it('navega para PropostaEnviada após criar pedido com sucesso', async () => {
    const mockOrder = { id: 'ord1' }
    ;(api.criarPedido as jest.Mock).mockResolvedValue(mockOrder)

    const { getByText, getByPlaceholderText } = render(<DetalheProdutoScreen />)
    fireEvent.changeText(getByPlaceholderText('Ex: 100'), '10')
    await act(async () => { fireEvent.press(getByText('Enviar proposta')) })

    expect(mockNavigate).toHaveBeenCalledWith('PropostaEnviada', expect.objectContaining({ produto, pedido: mockOrder }))
  })
})
