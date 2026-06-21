import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(() => ({ params: {} })),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

// JWT com payload: {"sub":"user-1","email":"test@test.com","isAdmin":false}
const MOCK_TOKEN = 'h.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpc0FkbWluIjpmYWxzZX0=.s'

const mockSetSession = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useAuth as jest.Mock).mockReturnValue({ setSession: mockSetSession })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import LoginScreen from '../../../screens/auth/LoginScreen'

describe('LoginScreen', () => {
  it('renderiza logo, campos e botões', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />)
    expect(getByText(/EloCampo/)).toBeTruthy()
    expect(getByPlaceholderText('joao@fazenda.com.br')).toBeTruthy()
    expect(getByPlaceholderText('••••••••')).toBeTruthy()
    expect(getByText('Entrar')).toBeTruthy()
    expect(getByText('Criar conta grátis')).toBeTruthy()
  })

  it('mostra Alert quando e-mail e senha estão vazios', () => {
    const { getByText } = render(<LoginScreen />)
    fireEvent.press(getByText('Entrar'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Preencha e-mail e senha')
  })

  it('navega para RecuperarSenha ao pressionar o link', () => {
    const { getByText } = render(<LoginScreen />)
    fireEvent.press(getByText('Esqueci a senha'))
    expect(mockNavigate).toHaveBeenCalledWith('RecuperarSenha')
  })

  it('navega para CadastroInicial ao pressionar o link de criação de conta', () => {
    const { getByText } = render(<LoginScreen />)
    fireEvent.press(getByText('Criar conta grátis'))
    expect(mockNavigate).toHaveBeenCalledWith('CadastroInicial')
  })

  it('chama gerarToken com email e senha ao submeter', async () => {
    ;(api.gerarToken as jest.Mock).mockResolvedValue({ token: MOCK_TOKEN })
    ;(api.buscarContaPorUsuario as jest.Mock).mockResolvedValue(null)

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'senha123')
    await act(async () => { fireEvent.press(getByText('Entrar')) })

    expect(api.gerarToken).toHaveBeenCalledWith('test@test.com', 'senha123')
  })

  it('exibe modal de erro para resposta 401', async () => {
    ;(api.gerarToken as jest.Mock).mockRejectedValue({ response: { status: 401 } })

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'x@x.com')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'errada')
    await act(async () => { fireEvent.press(getByText('Entrar')) })

    expect(await findByText('Acesso negado')).toBeTruthy()
    expect(await findByText(/E-mail ou senha incorretos/)).toBeTruthy()
  })

  it('fecha o modal de erro ao pressionar OK', async () => {
    ;(api.gerarToken as jest.Mock).mockRejectedValue({ response: { status: 401 } })

    const { getByPlaceholderText, getByText, findByText, queryByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'x@x.com')
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'errada')
    await act(async () => { fireEvent.press(getByText('Entrar')) })

    const okBtn = await findByText('OK')
    fireEvent.press(okBtn)
    await waitFor(() => expect(queryByText('Acesso negado')).toBeNull())
  })
})
