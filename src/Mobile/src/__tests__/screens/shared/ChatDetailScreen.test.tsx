import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as api from '../../../services/api'

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../services/api')

const makeChat = (messages = []) => ({
  id: 'chat-1',
  senderAccountId: 'me',
  receiverAccountId: 'other',
  messages,
  createdAt: 0,
  updatedAt: 0,
})

const makeMsg = (content: string, sender = 'me') => ({
  id: `msg-${content}`,
  senderAccountId: sender,
  content,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ goBack: jest.fn() })
  ;(useRoute as jest.Mock).mockReturnValue({
    params: { chatId: 'chat-1', myAccountId: 'me', theme: 'produtor' },
  })
  ;(api.buscarChatPorId as jest.Mock).mockResolvedValue(makeChat())
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

import ChatDetailScreen from '../../../screens/shared/ChatDetailScreen'

describe('ChatDetailScreen', () => {
  it('renderiza o cabeçalho "Chat"', async () => {
    const { findByText } = render(<ChatDetailScreen />)
    expect(await findByText('Chat')).toBeTruthy()
  })

  it('exibe mensagem de lista vazia quando não há mensagens', async () => {
    const { findByText } = render(<ChatDetailScreen />)
    expect(await findByText('Nenhuma mensagem ainda. Inicie a conversa!')).toBeTruthy()
  })

  it('exibe mensagens quando o chat tem mensagens', async () => {
    ;(api.buscarChatPorId as jest.Mock).mockResolvedValue(
      makeChat([makeMsg('Olá! Tenho interesse.')])
    )
    const { findByText } = render(<ChatDetailScreen />)
    expect(await findByText('Olá! Tenho interesse.')).toBeTruthy()
  })

  it('não chama enviarMensagem ao pressionar Enviar com texto vazio', async () => {
    const { findByText } = render(<ChatDetailScreen />)
    await findByText('Chat')
    // handleEnviar tem guard: if (!txt || enviando) return
    await act(async () => { fireEvent.press(await findByText('Enviar')) })
    expect(api.enviarMensagem).not.toHaveBeenCalled()
  })

  it('chama enviarMensagem ao pressionar Enviar com texto', async () => {
    ;(api.enviarMensagem as jest.Mock).mockResolvedValue(makeMsg('Boa tarde!'))

    const { findByText, getByPlaceholderText } = render(<ChatDetailScreen />)
    await findByText('Chat')

    fireEvent.changeText(getByPlaceholderText('Mensagem...'), 'Boa tarde!')
    await act(async () => { fireEvent.press(await findByText('Enviar')) })

    expect(api.enviarMensagem).toHaveBeenCalledWith('chat-1', {
      accountId: 'me',
      content: 'Boa tarde!',
    })
  })

  it('adiciona a mensagem enviada à lista', async () => {
    const novaMensagem = makeMsg('Combinado!')
    ;(api.enviarMensagem as jest.Mock).mockResolvedValue(novaMensagem)

    const { findByText, getByPlaceholderText } = render(<ChatDetailScreen />)
    await findByText('Chat')
    fireEvent.changeText(getByPlaceholderText('Mensagem...'), 'Combinado!')
    await act(async () => { fireEvent.press(await findByText('Enviar')) })

    expect(await findByText('Combinado!')).toBeTruthy()
  })

  it('limpa o campo de texto após envio', async () => {
    ;(api.enviarMensagem as jest.Mock).mockResolvedValue(makeMsg('Enviado!'))

    const { findByText, getByPlaceholderText } = render(<ChatDetailScreen />)
    await findByText('Chat')
    const input = getByPlaceholderText('Mensagem...')
    fireEvent.changeText(input, 'Enviado!')
    await act(async () => { fireEvent.press(await findByText('Enviar')) })

    await waitFor(() => expect(input.props.value).toBe(''))
  })
})
