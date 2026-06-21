import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

const mockLogout = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useAuth as jest.Mock).mockReturnValue({ logout: mockLogout })
  ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([{ id: 'u1' }, { id: 'u2' }])
  ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([{ id: 'p1' }])
  ;(api.buscarTodosPedidos as jest.Mock).mockResolvedValue([{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }])
  ;(api.buscarTodasContas as jest.Mock).mockResolvedValue([])
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import AdminHomeScreen from '../../../screens/admin/AdminHomeScreen'

describe('AdminHomeScreen', () => {
  it('renderiza título "Painel Admin" e badge ADMIN', () => {
    const { getByText, getAllByText } = render(<AdminHomeScreen />)
    expect(getByText('Painel Admin')).toBeTruthy()
    expect(getAllByText('ADMIN').length).toBeGreaterThan(0)
  })

  it('exibe as 3 labels de estatísticas', async () => {
    const { findAllByText } = render(<AdminHomeScreen />)
    expect((await findAllByText('Usuários')).length).toBeGreaterThan(0)
    expect((await findAllByText('Produtos')).length).toBeGreaterThan(0)
    expect((await findAllByText('Pedidos')).length).toBeGreaterThan(0)
  })

  it('exibe os valores corretos de cada estatística', async () => {
    const { findAllByText, findByText } = render(<AdminHomeScreen />)
    expect(await findByText('2')).toBeTruthy()  // usuários
    expect(await findByText('1')).toBeTruthy()  // produtos
    expect(await findByText('3')).toBeTruthy()  // pedidos
  })

  it('exibe botão de sair', async () => {
    const { findByText } = render(<AdminHomeScreen />)
    expect(await findByText('Sair')).toBeTruthy()
  })

  it('abre Alert de confirmação ao pressionar Sair', async () => {
    const { findByText } = render(<AdminHomeScreen />)
    const sairBtn = await findByText('Sair')
    fireEvent.press(sairBtn)
    expect(Alert.alert).toHaveBeenCalledWith('Sair', 'Deseja encerrar a sessão?', expect.any(Array))
  })

  it('exibe seção de resumo e relatórios após carregamento', async () => {
    const { findByText } = render(<AdminHomeScreen />)
    expect(await findByText('RESUMO GERAL')).toBeTruthy()
    expect(await findByText('RELATÓRIOS')).toBeTruthy()
  })
})
