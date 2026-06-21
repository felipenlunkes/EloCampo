import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

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

const pedido = {
  id: 'o1',
  orderStatus: 'COMPLETED',
  products: [{ productId: 'p1', description: 'Uva Italia', quantity: 5, price: 20 }],
  price: 100,
  buyerAccountId: 'acc-1',
  sellerAccountId: 's1',
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { pedido } })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, btns) => {
    // Simula pressionar o botão OK quando Alert.alert é chamado
    btns?.find((b: any) => b.text === 'OK')?.onPress?.()
  })
})

import AvaliacoesScreen from '../../../screens/comprador/AvaliacoesScreen'

describe('AvaliacoesScreen', () => {
  it('renderiza seções de avaliação de produto e vendedor', () => {
    const { getByText } = render(<AvaliacoesScreen />)
    expect(getByText('Avaliar produto')).toBeTruthy()
    expect(getByText('Avaliar vendedor')).toBeTruthy()
    expect(getByText('Enviar avaliações')).toBeTruthy()
  })

  it('renderiza 5 estrelas para cada avaliação', () => {
    const { getAllByText } = render(<AvaliacoesScreen />)
    const estrelas = getAllByText('★')
    expect(estrelas.length).toBe(10) // 5 produto + 5 vendedor (todas preenchidas por padrão)
  })

  it('chama criarAvaliacaoProduto e criarAvaliacaoConta ao enviar', async () => {
    ;(api.criarAvaliacaoProduto as jest.Mock).mockResolvedValue({})
    ;(api.criarAvaliacaoConta as jest.Mock).mockResolvedValue({})

    const { getByText } = render(<AvaliacoesScreen />)
    await act(async () => { fireEvent.press(getByText('Enviar avaliações')) })

    expect(api.criarAvaliacaoProduto).toHaveBeenCalledWith('p1', expect.objectContaining({
      stars: 5,
      reviewerAccountId: 'acc-1',
    }))
    expect(api.criarAvaliacaoConta).toHaveBeenCalledWith('s1', expect.objectContaining({
      stars: 5,
      reviewerAccountId: 'acc-1',
    }))
  })

  it('navega de volta após envio bem-sucedido', async () => {
    ;(api.criarAvaliacaoProduto as jest.Mock).mockResolvedValue({})
    ;(api.criarAvaliacaoConta as jest.Mock).mockResolvedValue({})

    const { getByText } = render(<AvaliacoesScreen />)
    await act(async () => { fireEvent.press(getByText('Enviar avaliações')) })

    expect(mockGoBack).toHaveBeenCalled()
  })
})
