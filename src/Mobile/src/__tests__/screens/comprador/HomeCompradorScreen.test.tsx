import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn() }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn() })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'acc-1', name: 'Maria Oliveira' } } })
  ;(api.buscarProdutos as jest.Mock).mockResolvedValue([])
  ;(api.buscarPedidoPorIdComprador as jest.Mock).mockResolvedValue({ content: [] })
})

import HomeCompradorScreen from '../../../screens/comprador/HomeCompradorScreen'

describe('HomeCompradorScreen', () => {
  it('exibe saudação com o primeiro nome do comprador', async () => {
    const { findByText } = render(<HomeCompradorScreen />)
    expect(await findByText('Olá, Maria')).toBeTruthy()
  })

  it('exibe badge "Comprador"', async () => {
    const { findByText } = render(<HomeCompradorScreen />)
    expect(await findByText('Comprador')).toBeTruthy()
  })

  it('exibe mensagem vazia quando não há produtos', async () => {
    const { findByText } = render(<HomeCompradorScreen />)
    expect(await findByText('Nenhum produto disponível.')).toBeTruthy()
  })

  it('conta apenas produtos AVAILABLE nas estatísticas', async () => {
    ;(api.buscarProdutos as jest.Mock).mockResolvedValue([
      { id: 'p1', status: 'AVAILABLE', description: 'Soja', vendorState: 'MT', quantity: 10, price: 10 },
      { id: 'p2', status: 'UNAVAILABLE', description: 'Milho', vendorState: 'GO', quantity: 5, price: 5 },
    ])
    const { findByText } = render(<HomeCompradorScreen />)
    await waitFor(async () => {
      expect(await findByText('1')).toBeTruthy()
    })
  })

  it('exibe produtos recentes na lista', async () => {
    ;(api.buscarProdutos as jest.Mock).mockResolvedValue([
      { id: 'p1', status: 'AVAILABLE', description: 'Feijão Preto', vendorState: 'PR', quantity: 20, price: 5 },
    ])
    const { findByText } = render(<HomeCompradorScreen />)
    expect(await findByText(/Feijão Preto/)).toBeTruthy()
  })
})
