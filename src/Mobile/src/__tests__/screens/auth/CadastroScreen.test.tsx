import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockNavigate = jest.fn()
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

const vendorParams = { userId: 'u1', role: 'VENDOR', nome: 'João', email: 'j@j.com', senha: '123456' }
const buyerParams  = { userId: 'u1', role: 'BUYER',  nome: 'Maria', email: 'm@m.com', senha: '654321' }

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: vendorParams })
  ;(useAuth as jest.Mock).mockReturnValue({ setSession: jest.fn() })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import CadastroScreen from '../../../screens/auth/CadastroScreen'

describe('CadastroScreen', () => {
  it('exibe campo CPF para VENDOR', () => {
    const { getByPlaceholderText } = render(<CadastroScreen />)
    expect(getByPlaceholderText('000.000.000-00')).toBeTruthy()
  })

  it('exibe campo CNPJ para BUYER', () => {
    ;(useRoute as jest.Mock).mockReturnValue({ params: buyerParams })
    const { getByPlaceholderText } = render(<CadastroScreen />)
    expect(getByPlaceholderText('00.000.000/0001-00')).toBeTruthy()
  })

  it('exibe Alert quando campos obrigatórios estão vazios', () => {
    const { getByText } = render(<CadastroScreen />)
    fireEvent.press(getByText('Criar minha conta'))
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Preencha os campos obrigatórios')
  })

  it('chama criarConta ao submeter com dados válidos', async () => {
    ;(api.criarConta as jest.Mock).mockResolvedValue({})
    ;(api.buscarContaPorUsuario as jest.Mock).mockResolvedValue({ id: 'acc-1', role: 'VENDOR' })
    ;(api.gerarToken as jest.Mock).mockResolvedValue({ token: 'tok' })

    const { getByPlaceholderText, getByText } = render(<CadastroScreen />)
    fireEvent.changeText(getByPlaceholderText('(65) 9 9999-9999'), '(66) 9 9999-9999')

    await act(async () => { fireEvent.press(getByText('Criar minha conta')) })

    expect(api.criarConta).toHaveBeenCalled()
  })
})
