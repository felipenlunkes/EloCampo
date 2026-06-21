import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import type { AuthSession } from '../../types'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

const mockSession: AuthSession = {
  token: 'token-abc',
  userId: 'user-1',
  email: 'test@test.com',
  isAdmin: false,
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthProvider — estado inicial', () => {
  it('começa com loading=true e session=null quando AsyncStorage está vazio', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.session).toBeNull()
  })

  it('restaura sessão salva do AsyncStorage', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSession))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.session).toEqual(mockSession)
    expect(result.current.loading).toBe(false)
  })

  it('ignora JSON corrompido no AsyncStorage', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('{ INVALIDO }')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})

describe('AuthProvider — setSession', () => {
  it('define a sessão e persiste no AsyncStorage', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.setSession(mockSession)
    })

    expect(result.current.session).toEqual(mockSession)
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('ec_token', mockSession.token)
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('ec_session', JSON.stringify(mockSession))
  })

  it('limpa sessão e remove do AsyncStorage quando chamado com null', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSession))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.setSession(null)
    })

    expect(result.current.session).toBeNull()
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('ec_token')
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('ec_session')
  })
})

describe('AuthProvider — logout', () => {
  it('limpa sessão e chama setSession(null)', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSession))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    expect(result.current.session).toEqual(mockSession)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.session).toBeNull()
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('ec_token')
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('ec_session')
  })
})
