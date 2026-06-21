import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import type { AuthSession } from '../types'

const SESSION: AuthSession = {
  token: 'tok-123',
  userId: 'user-1',
  email: 'joao@fazenda.com.br',
  isAdmin: false,
}

beforeEach(() => {
  localStorage.clear()
})

describe('AuthProvider — estado inicial', () => {
  it('deve iniciar com loading=true e depois false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('deve iniciar com session=null quando localStorage está vazio', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
  })
})

describe('AuthProvider — carregamento do localStorage', () => {
  it('deve restaurar a sessão salva no localStorage', async () => {
    localStorage.setItem('ec_session', JSON.stringify(SESSION))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => {
      expect(result.current.session?.email).toBe('joao@fazenda.com.br')
    })
  })

  it('deve ignorar JSON inválido no localStorage sem lançar erro', async () => {
    localStorage.setItem('ec_session', 'nao-e-json')

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
  })

  it('deve restaurar isAdmin corretamente', async () => {
    const adminSession: AuthSession = { ...SESSION, isAdmin: true }
    localStorage.setItem('ec_session', JSON.stringify(adminSession))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.session?.isAdmin).toBe(true))
  })
})

describe('setSession', () => {
  it('deve atualizar a sessão no contexto', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setSession(SESSION) })

    expect(result.current.session?.email).toBe('joao@fazenda.com.br')
  })

  it('deve salvar o token em ec_token no localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setSession(SESSION) })

    expect(localStorage.getItem('ec_token')).toBe('tok-123')
  })

  it('deve salvar a sessão serializada em ec_session no localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setSession(SESSION) })

    expect(JSON.parse(localStorage.getItem('ec_session')!)).toEqual(SESSION)
  })

  it('deve limpar o localStorage ao receber null', async () => {
    localStorage.setItem('ec_token', 'tok-123')
    localStorage.setItem('ec_session', JSON.stringify(SESSION))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.setSession(null) })

    expect(localStorage.getItem('ec_token')).toBeNull()
    expect(localStorage.getItem('ec_session')).toBeNull()
  })

  it('deve definir session como null ao receber null', async () => {
    localStorage.setItem('ec_session', JSON.stringify(SESSION))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    act(() => { result.current.setSession(null) })

    expect(result.current.session).toBeNull()
  })
})

describe('logout', () => {
  it('deve limpar a sessão do contexto', async () => {
    localStorage.setItem('ec_session', JSON.stringify(SESSION))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.session).not.toBeNull())

    act(() => { result.current.logout() })

    expect(result.current.session).toBeNull()
  })

  it('deve remover ec_token e ec_session do localStorage', async () => {
    localStorage.setItem('ec_token', 'tok-123')
    localStorage.setItem('ec_session', JSON.stringify(SESSION))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.logout() })

    expect(localStorage.getItem('ec_token')).toBeNull()
    expect(localStorage.getItem('ec_session')).toBeNull()
  })
})
