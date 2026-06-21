import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: (cb) => require('react').useEffect(cb, []),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const mockNavigate = jest.fn()

const produto = {
  id: 'p1',
  description: 'Soja Premium',
  status: 'AVAILABLE',
  quantity: 100,
  price: 150,
  scale: 'KG',
  category: 'GRAIN',
  vendorAccountId: 'acc-1',
  vendorCity: 'Sorriso',
  vendorState: 'MT',
  availabilityDate: 0,
  imageUrls: [],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1' } } })
  ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([])
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import MeusProdutosScreen from '../../../screens/produtor/MeusProdutosScreen'

describe('MeusProdutosScreen', () => {
  it('exibe mensagem vazia quando não há produtos', async () => {
    const { findByText } = render(<MeusProdutosScreen />)
    expect(await findByText('Nenhum produto cadastrado.')).toBeTruthy()
  })

  it('exibe produtos na lista', async () => {
    ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([produto])

    const { findByText } = render(<MeusProdutosScreen />)
    expect(await findByText('Soja Premium')).toBeTruthy()
  })

  it('chama desativarProduto quando produto está AVAILABLE', async () => {
    ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([produto])
    ;(api.desativarProduto as jest.Mock).mockResolvedValue({})

    const { findByText } = render(<MeusProdutosScreen />)
    const desativar = await findByText('Desativar')
    await act(async () => { fireEvent.press(desativar) })

    expect(api.desativarProduto).toHaveBeenCalledWith('p1')
  })

  it('chama ativarProduto quando produto está UNAVAILABLE', async () => {
    ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([
      { ...produto, status: 'UNAVAILABLE' },
    ])
    ;(api.ativarProduto as jest.Mock).mockResolvedValue({})

    const { findByText } = render(<MeusProdutosScreen />)
    const ativar = await findByText('Ativar')
    await act(async () => { fireEvent.press(ativar) })

    expect(api.ativarProduto).toHaveBeenCalledWith('p1')
  })

  it('navega para NovoProduto ao pressionar "+ Adicionar"', async () => {
    const { findByText } = render(<MeusProdutosScreen />)
    const btn = await findByText('+ Adicionar')
    fireEvent.press(btn)
    expect(mockNavigate).toHaveBeenCalledWith('NovoProduto')
  })
})
