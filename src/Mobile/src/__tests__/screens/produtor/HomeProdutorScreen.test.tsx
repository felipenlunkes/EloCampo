import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
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

const mockSession = {
  account: { id: 'acc-1', name: 'João Silva', evaluation: [] },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn() })
  ;(useAuth as jest.Mock).mockReturnValue({ session: mockSession })
  ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([])
  ;(api.buscarPedidoPorIdVendedor as jest.Mock).mockResolvedValue({ content: [] })
  ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ evaluation: [] })
})

import HomeProdutorScreen from '../../../screens/produtor/HomeProdutorScreen'

describe('HomeProdutorScreen', () => {
  it('exibe saudação com o primeiro nome do produtor', async () => {
    const { findByText } = render(<HomeProdutorScreen />)
    expect(await findByText('Olá, João')).toBeTruthy()
  })

  it('exibe avaliação zerada quando não há avaliações', async () => {
    const { findByText } = render(<HomeProdutorScreen />)
    // avaliação média: 0.toFixed(1) = '0.0' — único valor com essa formatação
    expect(await findByText('0.0')).toBeTruthy()
  })

  it('exibe mensagem de lista vazia quando não há produtos', async () => {
    const { findByText } = render(<HomeProdutorScreen />)
    expect(await findByText('Nenhum produto ainda. Adicione seu primeiro produto!')).toBeTruthy()
  })

  it('exibe produtos na lista quando há dados', async () => {
    ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([
      { id: 'p1', description: 'Soja Premium', status: 'AVAILABLE', quantity: 100, price: 150, scale: 'KG' },
    ])

    const { findByText } = render(<HomeProdutorScreen />)
    expect(await findByText('Soja Premium')).toBeTruthy()
  })

  it('calcula média de avaliações corretamente', async () => {
    ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({
      evaluation: [{ stars: 4 }, { stars: 2 }],
    })

    const { findByText } = render(<HomeProdutorScreen />)
    expect(await findByText('3.0')).toBeTruthy()
  })

  it('conta apenas produtos AVAILABLE nas estatísticas', async () => {
    ;(api.buscarProdutosPorVendedor as jest.Mock).mockResolvedValue([
      { id: 'p1', description: 'Soja', status: 'AVAILABLE', quantity: 10, price: 10, scale: 'KG' },
      { id: 'p2', description: 'Milho', status: 'UNAVAILABLE', quantity: 5, price: 5, scale: 'KG' },
    ])

    const { findAllByText } = render(<HomeProdutorScreen />)
    const stats = await findAllByText('1')
    expect(stats.length).toBeGreaterThan(0)
  })
})
