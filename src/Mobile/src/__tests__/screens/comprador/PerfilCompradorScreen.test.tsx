import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import * as api from '../../../services/api'

const mockLogout = jest.fn()
const mockSetSession = jest.fn()

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}))

import * as ImagePicker from 'expo-image-picker'

const makeConta = (overrides = {}) => ({
  id: 'conta-1',
  userId: 'user-1',
  name: 'João Silva',
  businessName: 'Silva LTDA',
  cpf: '12345678900',
  cnpj: undefined,
  birthdayDate: 0,
  phone: { countryCode: 55, stateCode: 11, number: '999999999' },
  address: {
    postalCode: '01310100',
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Apto 1',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  role: 'BUYER' as const,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

const makeSession = (overrides = {}) => ({
  userId: 'user-1',
  email: 'joao@example.com',
  token: 'tok',
  isAdmin: false,
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  ;(useAuth as jest.Mock).mockReturnValue({
    session: makeSession(),
    setSession: mockSetSession,
    logout: mockLogout,
  })
  ;(api.buscarContaPorUsuario as jest.Mock).mockResolvedValue(makeConta())
  ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([])
  ;(api.atualizarConta as jest.Mock).mockResolvedValue(makeConta())
  ;(api.uploadArquivo as jest.Mock).mockResolvedValue({
    id: 'new-file', publicId: 'new-pid', url: 'https://new.jpg', secureUrl: 'https://new.jpg',
    format: 'jpg', size: 200, entityType: 'PROFILE' as const, entityId: 'conta-1',
    uploadedBy: 'user-1', uploadedAt: 0,
  })
  ;(api.deletarArquivo as jest.Mock).mockResolvedValue(undefined)
  ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
  ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true })
})

import PerfilCompradorScreen from '../../../screens/comprador/PerfilCompradorScreen'

describe('PerfilCompradorScreen', () => {
  it('exibe o título da tela', () => {
    const { getByText } = render(<PerfilCompradorScreen />)
    expect(getByText('Perfil do comprador')).toBeTruthy()
  })

  it('exibe o papel "Comprador(a)"', () => {
    const { getByText } = render(<PerfilCompradorScreen />)
    expect(getByText('Comprador(a)')).toBeTruthy()
  })

  it('busca a conta do usuário ao montar', async () => {
    render(<PerfilCompradorScreen />)
    await waitFor(() => {
      expect(api.buscarContaPorUsuario).toHaveBeenCalledWith('user-1')
    })
  })

  it('preenche o formulário com os dados da conta', async () => {
    const { findByDisplayValue } = render(<PerfilCompradorScreen />)
    expect(await findByDisplayValue('João Silva')).toBeTruthy()
    expect(await findByDisplayValue('Av. Paulista')).toBeTruthy()
    expect(await findByDisplayValue('SP')).toBeTruthy()
  })

  it('exibe o nome do usuário na área do avatar', async () => {
    const { findByText } = render(<PerfilCompradorScreen />)
    expect(await findByText('João Silva')).toBeTruthy()
  })

  it('exibe as iniciais no avatar quando não há foto de perfil', async () => {
    const { findByText } = render(<PerfilCompradorScreen />)
    expect(await findByText('JS')).toBeTruthy()
  })

  it('exibe foto de perfil quando disponível', async () => {
    const foto = {
      id: 'f1', publicId: 'pid', url: 'http://img', secureUrl: 'https://img',
      format: 'jpg', size: 100, entityType: 'PROFILE' as const, entityId: 'conta-1',
      uploadedBy: 'user-1', uploadedAt: 0,
    }
    ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([foto])

    const { findByTestId, queryByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => {
      expect(api.buscarArquivosPorEntidade).toHaveBeenCalledWith('PROFILE', 'conta-1')
    })
    await waitFor(() => {
      expect(queryByText('JS')).toBeNull()
    })
  })

  it('exibe o e-mail da sessão no campo de e-mail', async () => {
    const { findByDisplayValue } = render(<PerfilCompradorScreen />)
    expect(await findByDisplayValue('joao@example.com')).toBeTruthy()
  })

  it('exibe a businessName do comprador', async () => {
    const { findByText } = render(<PerfilCompradorScreen />)
    expect(await findByText('Silva LTDA')).toBeTruthy()
  })

  it('não busca a conta quando não há sessão', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      session: null,
      setSession: mockSetSession,
      logout: mockLogout,
    })
    render(<PerfilCompradorScreen />)
    expect(api.buscarContaPorUsuario).not.toHaveBeenCalled()
  })

  it('salva as alterações e exibe alerta de sucesso', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    const { findByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())

    fireEvent.press(await findByText('Salvar alterações'))

    await waitFor(() => {
      expect(api.atualizarConta).toHaveBeenCalledWith('conta-1', expect.objectContaining({
        userId: 'user-1',
        name: 'João Silva',
      }))
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Perfil atualizado!')
    })
  })

  it('exibe alerta de erro quando o salvamento falha', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    ;(api.atualizarConta as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Erro de validação' } },
    })

    const { findByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())

    fireEvent.press(await findByText('Salvar alterações'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Erro de validação')
    })
  })

  it('exibe mensagem genérica de erro quando a resposta não tem message', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    ;(api.atualizarConta as jest.Mock).mockRejectedValue(new Error('network'))

    const { findByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())

    fireEvent.press(await findByText('Salvar alterações'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível salvar')
    })
  })

  it('chama logout ao pressionar "Sair da conta"', async () => {
    const { findByText } = render(<PerfilCompradorScreen />)
    fireEvent.press(await findByText('Sair da conta'))
    expect(mockLogout).toHaveBeenCalled()
  })

  it('desabilita o campo CNPJ quando CPF está preenchido', async () => {
    const { findAllByDisplayValue } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    // CPF mascarado "123.456.789-00" preenchido → CNPJ deve ficar não editável
    const cnpjInputs = await findAllByDisplayValue('')
    // O campo CNPJ fica com value '' e editable={false}
    const cnpjInput = cnpjInputs.find(el => el.props.placeholder === '00.000.000/0001-00')
    expect(cnpjInput?.props.editable).toBe(false)
  })

  it('atualiza a sessão após salvar', async () => {
    const contaAtualizada = makeConta({ name: 'João Atualizado' })
    ;(api.atualizarConta as jest.Mock).mockResolvedValue(contaAtualizada)

    const { findByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())

    fireEvent.press(await findByText('Salvar alterações'))

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(
        expect.objectContaining({ account: contaAtualizada }),
      )
    })
  })

  it('exibe botão de edição de foto no avatar', async () => {
    const { getByTestId } = render(<PerfilCompradorScreen />)
    expect(getByTestId('avatar-btn')).toBeTruthy()
  })

  it('solicita permissão de galeria ao pressionar o avatar', async () => {
    const { getByTestId } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))
    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled()
    })
  })

  it('exibe alerta quando permissão de galeria negada', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' })

    const { getByTestId } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Permissão necessária', expect.any(String))
    })
    expect(api.uploadArquivo).not.toHaveBeenCalled()
  })

  it('não faz upload quando usuário cancela o picker', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true })

    const { getByTestId } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled())
    expect(api.uploadArquivo).not.toHaveBeenCalled()
  })

  it('faz upload da imagem selecionada e atualiza a foto de perfil', async () => {
    const novaFoto = {
      id: 'new-file', publicId: 'new-pid', url: 'https://new.jpg', secureUrl: 'https://new.jpg',
      format: 'jpg', size: 200, entityType: 'PROFILE' as const, entityId: 'conta-1',
      uploadedBy: 'user-1', uploadedAt: 0,
    }
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })
    ;(api.uploadArquivo as jest.Mock).mockResolvedValue(novaFoto)

    const { getByTestId, queryByText } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(api.uploadArquivo).toHaveBeenCalledWith('PROFILE', 'conta-1', {
        uri: 'file:///photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
      })
    })
    await waitFor(() => expect(queryByText('JS')).toBeNull())
  })

  it('apaga foto anterior antes de fazer novo upload', async () => {
    const fotoExistente = {
      id: 'old-file', publicId: 'old-pid', url: 'https://old.jpg', secureUrl: 'https://old.jpg',
      format: 'jpg', size: 100, entityType: 'PROFILE' as const, entityId: 'conta-1',
      uploadedBy: 'user-1', uploadedAt: 0,
    }
    ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([fotoExistente])
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })

    const { getByTestId } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarArquivosPorEntidade).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(api.deletarArquivo).toHaveBeenCalledWith('old-file')
      expect(api.uploadArquivo).toHaveBeenCalled()
    })
  })

  it('exibe alerta de erro quando upload da foto falha', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })
    ;(api.uploadArquivo as jest.Mock).mockRejectedValue(new Error('upload failed'))

    const { getByTestId } = render(<PerfilCompradorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro ao enviar foto', 'upload failed')
    })
  })
})
