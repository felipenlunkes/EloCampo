import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(() => ({ params: {} })),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import CadastroInicialScreen from '../../../screens/auth/CadastroInicialScreen'

describe('CadastroInicialScreen', () => {
  it('renderiza campos, indicador de etapas e botão', () => {
    const { getByPlaceholderText, getByText } = render(<CadastroInicialScreen />)
    expect(getByText('Criar conta')).toBeTruthy()
    expect(getByPlaceholderText('João da Silva')).toBeTruthy()
    expect(getByPlaceholderText('joao@fazenda.com.br')).toBeTruthy()
    expect(getByText('Continuar →')).toBeTruthy()
    expect(getByText('1')).toBeTruthy()
  })

  it('valida nome vazio', () => {
    const { getByText } = render(<CadastroInicialScreen />)
    fireEvent.press(getByText('Continuar →'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Informe seu nome completo')
  })

  it('valida e-mail vazio', () => {
    const { getByText, getByPlaceholderText } = render(<CadastroInicialScreen />)
    fireEvent.changeText(getByPlaceholderText('João da Silva'), 'João')
    fireEvent.press(getByText('Continuar →'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Informe seu e-mail')
  })

  it('valida senha com menos de 6 caracteres', () => {
    const { getByText, getByPlaceholderText } = render(<CadastroInicialScreen />)
    fireEvent.changeText(getByPlaceholderText('João da Silva'), 'João')
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'j@j.com')
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123')
    fireEvent.press(getByText('Continuar →'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'A senha deve ter no mínimo 6 caracteres')
  })

  it('valida senhas que não coincidem', () => {
    const { getByText, getByPlaceholderText } = render(<CadastroInicialScreen />)
    fireEvent.changeText(getByPlaceholderText('João da Silva'), 'João')
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'j@j.com')
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456')
    fireEvent.changeText(getByPlaceholderText('Repita a senha'), '654321')
    fireEvent.press(getByText('Continuar →'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'As senhas não coincidem')
  })

  it('valida termos não aceitos', () => {
    const { getByText, getByPlaceholderText } = render(<CadastroInicialScreen />)
    fireEvent.changeText(getByPlaceholderText('João da Silva'), 'João')
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'j@j.com')
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456')
    fireEvent.changeText(getByPlaceholderText('Repita a senha'), '123456')
    // não aceita termos
    fireEvent.press(getByText('Continuar →'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Aceite os termos para continuar')
  })

  it('navega para TipoConta com os dados corretos quando formulário é válido', () => {
    const { getByText, getByPlaceholderText } = render(<CadastroInicialScreen />)
    fireEvent.changeText(getByPlaceholderText('João da Silva'), 'João Silva')
    fireEvent.changeText(getByPlaceholderText('joao@fazenda.com.br'), 'j@j.com')
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456')
    fireEvent.changeText(getByPlaceholderText('Repita a senha'), '123456')
    fireEvent.press(getByText(/Li e aceito/))
    fireEvent.press(getByText('Continuar →'))

    expect(mockNavigate).toHaveBeenCalledWith('TipoConta', {
      nome: 'João Silva',
      email: 'j@j.com',
      senha: '123456',
    })
  })
})
