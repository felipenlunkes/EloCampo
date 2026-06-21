import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import * as api from '../../../services/api'

const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../../services/api')

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ goBack: mockGoBack })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import RecuperarSenhaScreen from '../../../screens/auth/RecuperarSenhaScreen'

describe('RecuperarSenhaScreen', () => {
  it('renderiza título, campo de e-mail e botão', () => {
    const { getByText, getByPlaceholderText } = render(<RecuperarSenhaScreen />)
    expect(getByText('Recuperar senha')).toBeTruthy()
    expect(getByPlaceholderText('joao@fazenda.com.br')).toBeTruthy()
    expect(getByText('Enviar código')).toBeTruthy()
  })

  it('mostra Alert quando o campo de e-mail está vazio', () => {
    const { getByText } = render(<RecuperarSenhaScreen />)
    fireEvent.press(getByText('Enviar código'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Informe seu e-mail')
  })

  it('chama resetarSenha com o e-mail fornecido', async () => {
    ;(api.resetarSenha as jest.Mock).mockResolvedValue({})

    const { getByPlaceholderText, getByText } = render(<RecuperarSenhaScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'joao@farm.com')
    await act(async () => { fireEvent.press(getByText('Enviar código')) })

    expect(api.resetarSenha).toHaveBeenCalledWith('joao@farm.com')
  })

  it('exibe mensagem de sucesso após envio', async () => {
    ;(api.resetarSenha as jest.Mock).mockResolvedValue({})

    const { getByPlaceholderText, getByText, findByText } = render(<RecuperarSenhaScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'joao@farm.com')
    await act(async () => { fireEvent.press(getByText('Enviar código')) })

    expect(await findByText(/E-mail enviado com sucesso/)).toBeTruthy()
  })

  it('mostra Alert de erro quando a API falha', async () => {
    ;(api.resetarSenha as jest.Mock).mockRejectedValue({ response: { data: { message: 'E-mail não encontrado' } } })

    const { getByPlaceholderText, getByText } = render(<RecuperarSenhaScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'x@x.com')
    await act(async () => { fireEvent.press(getByText('Enviar código')) })

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail não encontrado')
  })
})
