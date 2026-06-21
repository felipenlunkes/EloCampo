import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: (cb) => require('react').useEffect(cb, []),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const makeChat = (id = 'c1', otherId = 'other-1') => ({
  id,
  senderAccountId: 'me',
  receiverAccountId: otherId,
  messages: [{ id: 'm1', senderAccountId: 'me', content: 'Olá!', createdAt: Date.now(), updatedAt: Date.now() }],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  ;(useAuth as jest.Mock).mockReturnValue({ session: { account: { id: 'me' } } })
  ;(api.buscarChatsPorConta as jest.Mock).mockResolvedValue([])
})

import ChatsListScreen from '../../../screens/shared/ChatsListScreen'

describe('ChatsListScreen — produtor', () => {
  const renderProdutor = () => render(<ChatsListScreen theme="produtor" />)

  it('exibe título "Conversas"', async () => {
    const { findByText } = renderProdutor()
    expect(await findByText('Conversas')).toBeTruthy()
  })

  it('exibe mensagem vazia quando não há conversas', async () => {
    const { findByText } = renderProdutor()
    expect(await findByText('Nenhuma conversa encontrada.')).toBeTruthy()
  })

  it('exibe estado de erro quando a API falha', async () => {
    ;(api.buscarChatsPorConta as jest.Mock).mockRejectedValue(new Error('Falha'))
    const { findByText } = renderProdutor()
    expect(await findByText('Não foi possível carregar as conversas.')).toBeTruthy()
  })

  it('exibe botão de tentar novamente no estado de erro', async () => {
    ;(api.buscarChatsPorConta as jest.Mock).mockRejectedValue(new Error('Falha'))
    const { findByText } = renderProdutor()
    expect(await findByText('Tentar novamente')).toBeTruthy()
  })

  it('exibe chats quando há conversas', async () => {
    ;(api.buscarChatsPorConta as jest.Mock).mockResolvedValue([makeChat()])
    ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ name: 'Pedro Comprador' })

    const { findByText } = renderProdutor()
    expect(await findByText('Pedro')).toBeTruthy()
  })

  it('navega para ChatDetail ao pressionar uma conversa', async () => {
    ;(api.buscarChatsPorConta as jest.Mock).mockResolvedValue([makeChat('c1', 'other-1')])
    ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ name: 'Pedro Comprador' })

    const { findByText } = renderProdutor()
    fireEvent.press(await findByText('Pedro'))

    expect(mockNavigate).toHaveBeenCalledWith('ChatDetail', {
      chatId: 'c1',
      myAccountId: 'me',
      theme: 'produtor',
    })
  })

  it('exibe preview da última mensagem', async () => {
    ;(api.buscarChatsPorConta as jest.Mock).mockResolvedValue([makeChat()])
    ;(api.buscarContaPorId as jest.Mock).mockResolvedValue({ name: 'Pedro' })

    const { findByText } = renderProdutor()
    expect(await findByText('Olá!')).toBeTruthy()
  })
})
