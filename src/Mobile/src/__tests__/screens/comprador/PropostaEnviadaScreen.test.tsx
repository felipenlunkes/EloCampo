import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const produto = {
  id: 'p1',
  description: 'Café Especial',
  vendorCity: 'Minas Gerais',
  vendorState: 'MG',
  status: 'AVAILABLE',
  category: 'GRAIN',
  quantity: 50,
  price: 25,
  scale: 'KG',
  vendorAccountId: 'v1',
  availabilityDate: 0,
  imageUrls: [],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { produto, oferta: '25' } })
})

import PropostaEnviadaScreen from '../../../screens/comprador/PropostaEnviadaScreen'

describe('PropostaEnviadaScreen', () => {
  it('exibe mensagem de sucesso', () => {
    const { getByText } = render(<PropostaEnviadaScreen />)
    expect(getByText('Proposta enviada!')).toBeTruthy()
    expect(getByText('O produtor receberá sua oferta em breve.')).toBeTruthy()
  })

  it('exibe o resumo do produto', () => {
    const { getByText } = render(<PropostaEnviadaScreen />)
    expect(getByText(/Café Especial/)).toBeTruthy()
    expect(getByText(/Minas Gerais/)).toBeTruthy()
  })

  it('navega para MeusPedidos ao pressionar o botão', () => {
    const { getByText } = render(<PropostaEnviadaScreen />)
    fireEvent.press(getByText('Ver meus pedidos'))
    expect(mockNavigate).toHaveBeenCalledWith('Pedidos', { screen: 'MeusPedidos' })
  })

  it('navega para BuscarProdutos ao pressionar "Buscar outros produtos"', () => {
    const { getByText } = render(<PropostaEnviadaScreen />)
    fireEvent.press(getByText('Buscar outros produtos'))
    expect(mockNavigate).toHaveBeenCalledWith('Produtos', { screen: 'BuscarProdutos' })
  })
})
