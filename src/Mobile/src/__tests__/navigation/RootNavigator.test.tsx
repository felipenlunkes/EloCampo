import React from 'react'
import { render } from '@testing-library/react-native'
import type { AuthSession, AccountResponse } from '../../types'

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../navigation/AuthStack', () => {
  const { View, Text } = require('react-native')
  return function MockAuthStack() {
    return <View><Text>AuthStack</Text></View>
  }
})

jest.mock('../../navigation/ProdutorTabs', () => {
  const { View, Text } = require('react-native')
  return function MockProdutorTabs() {
    return <View><Text>ProdutorTabs</Text></View>
  }
})

jest.mock('../../navigation/CompradorTabs', () => {
  const { View, Text } = require('react-native')
  return function MockCompradorTabs() {
    return <View><Text>CompradorTabs</Text></View>
  }
})

jest.mock('../../navigation/AdminTabs', () => {
  const { View, Text } = require('react-native')
  return function MockAdminTabs() {
    return <View><Text>AdminTabs</Text></View>
  }
})

import RootNavigator from '../../navigation/RootNavigator'
import { useAuth } from '../../contexts/AuthContext'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const makeSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  token: 'tok',
  userId: 'u1',
  email: 'a@b.com',
  isAdmin: false,
  ...overrides,
})

const makeAccount = (role: 'VENDOR' | 'BUYER'): AccountResponse => ({
  id: 'acc-1',
  userId: 'u1',
  name: 'Teste',
  birthdayDate: 0,
  address: { street: '', number: '', city: '', district: '', state: 'SP', complement: '', postalCode: '' },
  phone: { countryCode: 55, stateCode: 11, number: '999999999' },
  role,
  createdAt: 0,
  updatedAt: 0,
})

describe('RootNavigator', () => {
  it('exibe spinner de carregamento quando loading=true', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: true,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByTestId, toJSON } = render(<RootNavigator />)
    // ActivityIndicator é exibido — verifica via snapshot
    expect(toJSON()).toMatchSnapshot()
  })

  it('renderiza AuthStack quando não há sessão', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: false,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByText } = render(<RootNavigator />)
    expect(getByText('AuthStack')).toBeTruthy()
  })

  it('renderiza AdminTabs quando o usuário é admin', () => {
    mockUseAuth.mockReturnValue({
      session: makeSession({ isAdmin: true }),
      loading: false,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByText } = render(<RootNavigator />)
    expect(getByText('AdminTabs')).toBeTruthy()
  })

  it('renderiza ProdutorTabs quando a conta é VENDOR', () => {
    mockUseAuth.mockReturnValue({
      session: makeSession({ account: makeAccount('VENDOR') }),
      loading: false,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByText } = render(<RootNavigator />)
    expect(getByText('ProdutorTabs')).toBeTruthy()
  })

  it('renderiza CompradorTabs quando a conta é BUYER', () => {
    mockUseAuth.mockReturnValue({
      session: makeSession({ account: makeAccount('BUYER') }),
      loading: false,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByText } = render(<RootNavigator />)
    expect(getByText('CompradorTabs')).toBeTruthy()
  })

  it('cai no AuthStack quando há sessão mas sem conta definida', () => {
    mockUseAuth.mockReturnValue({
      session: makeSession({ account: undefined }),
      loading: false,
      setSession: jest.fn(),
      logout: jest.fn(),
    })

    const { getByText } = render(<RootNavigator />)
    expect(getByText('AuthStack')).toBeTruthy()
  })
})
