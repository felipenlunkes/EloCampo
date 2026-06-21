import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import * as api from '../../../services/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../services/api')

const makeUser = (id: string, email: string, isAdmin = false) => ({
  id,
  email,
  isAdmin,
  createdAt: 1700000000000,
  updatedAt: 0,
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([])
  ;(api.desativarUsuario as jest.Mock).mockResolvedValue({})
  ;(api.ativarUsuario as jest.Mock).mockResolvedValue({})
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import UsuariosAdminScreen from '../../../screens/admin/UsuariosAdminScreen'

describe('UsuariosAdminScreen', () => {
  it('renderiza título e badge ADMIN', () => {
    const { getByText, getAllByText } = render(<UsuariosAdminScreen />)
    expect(getByText('Usuários')).toBeTruthy()
    expect(getAllByText('ADMIN').length).toBeGreaterThan(0)
  })

  it('exibe mensagem vazia quando não há usuários', async () => {
    const { findByText } = render(<UsuariosAdminScreen />)
    expect(await findByText('Nenhum usuário encontrado.')).toBeTruthy()
  })

  it('exibe e-mail dos usuários na lista', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([
      makeUser('u1', 'joao@fazenda.com'),
    ])
    const { findByText } = render(<UsuariosAdminScreen />)
    expect(await findByText('joao@fazenda.com')).toBeTruthy()
  })

  it('exibe badge "Admin" para usuário admin', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'admin@sys.com', true)])
    const { findByText } = render(<UsuariosAdminScreen />)
    expect(await findByText('Admin')).toBeTruthy()
  })

  it('exibe badge "Usuário" para usuário não-admin', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'user@test.com', false)])
    const { findByText } = render(<UsuariosAdminScreen />)
    expect(await findByText('Usuário')).toBeTruthy()
  })

  it('não exibe botões de ação para administradores', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'admin@sys.com', true)])
    const { findByText, queryByText } = render(<UsuariosAdminScreen />)
    await findByText('Admin')
    expect(queryByText('Desativar')).toBeNull()
  })

  it('exibe botões Desativar/Ativar para usuários comuns', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'user@test.com', false)])
    const { findByText } = render(<UsuariosAdminScreen />)
    expect(await findByText('Desativar')).toBeTruthy()
    expect(await findByText('Ativar')).toBeTruthy()
  })

  it('abre Alert ao pressionar Desativar', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'user@test.com')])
    const { findByText } = render(<UsuariosAdminScreen />)
    const btn = await findByText('Desativar')
    fireEvent.press(btn)
    expect(Alert.alert).toHaveBeenCalledWith('Desativar', expect.stringContaining('user@test.com'), expect.any(Array))
  })

  it('chama desativarUsuario ao confirmar', async () => {
    ;(api.buscarTodosUsuarios as jest.Mock).mockResolvedValue([makeUser('u1', 'user@test.com')])
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, btns) => {
      btns?.find((b: any) => b.text === 'Desativar')?.onPress?.()
    })

    const { findByText } = render(<UsuariosAdminScreen />)
    const btn = await findByText('Desativar')
    await act(async () => { fireEvent.press(btn) })

    expect(api.desativarUsuario).toHaveBeenCalledWith('u1')
  })
})
