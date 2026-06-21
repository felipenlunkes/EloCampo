import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn() }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../services/api')

const produto = {
  id: 'p1',
  description: 'Arroz Integral',
  status: 'AVAILABLE',
  category: 'GRAIN',
  quantity: 200,
  price: 3.5,
  scale: 'KG',
  vendorState: 'RS',
  vendorCity: 'Passo Fundo',
  vendorAccountId: 'v1',
  availabilityDate: 0,
  imageUrls: [],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  ;(api.buscarProdutos as jest.Mock).mockResolvedValue([produto])
})

import BuscarProdutosScreen from '../../../screens/comprador/BuscarProdutosScreen'

describe('BuscarProdutosScreen', () => {
  it('exibe produto após carregamento', async () => {
    const { findByText } = render(<BuscarProdutosScreen />)
    expect(await findByText(/Arroz Integral/)).toBeTruthy()
  })

  it('exibe mensagem vazia quando nenhum produto disponível', async () => {
    ;(api.buscarProdutos as jest.Mock).mockResolvedValue([])
    const { findByText } = render(<BuscarProdutosScreen />)
    expect(await findByText('Nenhum produto encontrado.')).toBeTruthy()
  })

  it('filtra apenas produtos AVAILABLE', async () => {
    ;(api.buscarProdutos as jest.Mock).mockResolvedValue([
      produto,
      { ...produto, id: 'p2', description: 'Produto Inativo', status: 'UNAVAILABLE' },
    ])
    const { findByText, queryByText } = render(<BuscarProdutosScreen />)
    await findByText(/Arroz Integral/)
    expect(queryByText('Produto Inativo')).toBeNull()
  })

  it('navega para DetalheProduto ao pressionar um item', async () => {
    const { findByText } = render(<BuscarProdutosScreen />)
    const item = await findByText(/Arroz Integral/)
    fireEvent.press(item)
    expect(mockNavigate).toHaveBeenCalledWith('DetalheProduto', { produto })
  })

  it('chama buscarProdutos com filtros ao pressionar Buscar', async () => {
    const { getByPlaceholderText, getByText } = render(<BuscarProdutosScreen />)
    await waitFor(() => {})
    fireEvent.changeText(getByPlaceholderText('Estado (UF)'), 'MT')
    await act(async () => { fireEvent.press(getByText('Buscar')) })
    expect(api.buscarProdutos).toHaveBeenCalledWith(
      expect.objectContaining({ vendorState: 'MT' }),
    )
  })
})
