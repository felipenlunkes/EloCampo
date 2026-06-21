import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
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

jest.mock('../../../services/api')

beforeEach(() => {
  jest.clearAllMocks()
  ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate, goBack: mockGoBack })
  ;(useRoute as jest.Mock).mockReturnValue({ params: { nome: 'João', email: 'j@j.com', senha: '123456' } })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import TipoContaScreen from '../../../screens/auth/TipoContaScreen'

describe('TipoContaScreen', () => {
  it('renderiza as duas opções de tipo de conta', () => {
    const { getByText } = render(<TipoContaScreen />)
    expect(getByText('Produtor rural')).toBeTruthy()
    expect(getByText('Comprador')).toBeTruthy()
  })

  it('VENDOR está selecionado por padrão', () => {
    const { getByText } = render(<TipoContaScreen />)
    expect(getByText('Publico e vendo produtos')).toBeTruthy()
  })

  it('chama criarUsuario ao pressionar continuar', async () => {
    ;(api.criarUsuario as jest.Mock).mockResolvedValue({ id: 'u1', email: 'j@j.com', isAdmin: false })

    const { getByText } = render(<TipoContaScreen />)
    await act(async () => { fireEvent.press(getByText('Continuar →')) })

    expect(api.criarUsuario).toHaveBeenCalledWith({ email: 'j@j.com', password: '123456', isAdmin: false })
  })

  it('navega para Cadastro com os parâmetros corretos após criação', async () => {
    ;(api.criarUsuario as jest.Mock).mockResolvedValue({ id: 'u1', email: 'j@j.com', isAdmin: false })

    const { getByText } = render(<TipoContaScreen />)
    await act(async () => { fireEvent.press(getByText('Continuar →')) })

    expect(mockNavigate).toHaveBeenCalledWith('Cadastro', {
      userId: 'u1',
      role: 'VENDOR',
      nome: 'João',
      email: 'j@j.com',
      senha: '123456',
    })
  })

  it('seleciona BUYER ao pressionar a opção Comprador', async () => {
    ;(api.criarUsuario as jest.Mock).mockResolvedValue({ id: 'u1', email: 'j@j.com', isAdmin: false })

    const { getByText } = render(<TipoContaScreen />)
    fireEvent.press(getByText('Comprador'))
    await act(async () => { fireEvent.press(getByText('Continuar →')) })

    expect(mockNavigate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'BUYER' }))
  })

  it('exibe Alert de erro quando a API falha', async () => {
    ;(api.criarUsuario as jest.Mock).mockRejectedValue({ response: { data: { message: 'E-mail já cadastrado' } } })

    const { getByText } = render(<TipoContaScreen />)
    await act(async () => { fireEvent.press(getByText('Continuar →')) })

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail já cadastrado')
  })
})
