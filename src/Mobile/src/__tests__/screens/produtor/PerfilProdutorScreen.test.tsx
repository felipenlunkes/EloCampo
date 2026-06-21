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
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}))

import * as ImagePicker from 'expo-image-picker'

const mockLogout = jest.fn()
const mockSetSession = jest.fn()

const mockSession = {
  userId: 'u1',
  email: 'produtor@teste.com',
  token: 'tok',
  isAdmin: false,
  account: { id: 'acc-1' },
}

const mockConta = {
  id: 'acc-1',
  userId: 'u1',
  name: 'João Silva',
  businessName: 'Fazenda JS',
  cpf: '12345678900',
  cnpj: '',
  birthdayDate: 0,
  role: 'VENDOR' as const,
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
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useAuth as jest.Mock).mockReturnValue({
    session: mockSession,
    setSession: mockSetSession,
    logout: mockLogout,
  })
  ;(api.buscarContaPorUsuario as jest.Mock).mockResolvedValue(mockConta)
  ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([])
  ;(api.atualizarConta as jest.Mock).mockResolvedValue(mockConta)
  ;(api.uploadArquivo as jest.Mock).mockResolvedValue({
    id: 'new-file', publicId: 'new-pid', url: 'https://new.jpg', secureUrl: 'https://new.jpg',
    format: 'jpg', size: 200, entityType: 'PROFILE' as const, entityId: 'acc-1',
    uploadedBy: 'u1', uploadedAt: 0,
  })
  ;(api.deletarArquivo as jest.Mock).mockResolvedValue(undefined)
  ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
  ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true })
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

import PerfilProdutorScreen from '../../../screens/produtor/PerfilProdutorScreen'

describe('PerfilProdutorScreen', () => {
  it('renderiza o título "Meu Perfil"', () => {
    const { getByText } = render(<PerfilProdutorScreen />)
    expect(getByText('Meu Perfil')).toBeTruthy()
  })

  it('exibe a role "Produtor rural"', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    expect(await findByText('Produtor rural')).toBeTruthy()
  })

  it('carrega e exibe os dados da conta no formulário', async () => {
    const { findByDisplayValue } = render(<PerfilProdutorScreen />)
    expect(await findByDisplayValue('João Silva')).toBeTruthy()
    expect(await findByDisplayValue('Fazenda JS')).toBeTruthy()
    expect(await findByDisplayValue('São Paulo')).toBeTruthy()
    expect(await findByDisplayValue('SP')).toBeTruthy()
  })

  it('chama buscarContaPorUsuario com o userId da sessão', async () => {
    render(<PerfilProdutorScreen />)
    await waitFor(() => {
      expect(api.buscarContaPorUsuario).toHaveBeenCalledWith('u1')
    })
  })

  it('chama buscarArquivosPorEntidade para buscar a foto de perfil', async () => {
    render(<PerfilProdutorScreen />)
    await waitFor(() => {
      expect(api.buscarArquivosPorEntidade).toHaveBeenCalledWith('PROFILE', 'acc-1')
    })
  })

  it('exibe as iniciais do nome quando não há foto de perfil', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    expect(await findByText('JS')).toBeTruthy()
  })

  it('exibe imagem de perfil quando a API retorna foto', async () => {
    const mockFoto = {
      id: 'f1',
      secureUrl: 'https://example.com/foto.jpg',
      url: 'https://example.com/foto.jpg',
      publicId: 'pub1',
      format: 'jpg',
      size: 1000,
      entityType: 'PROFILE' as const,
      entityId: 'acc-1',
      uploadedBy: 'u1',
      uploadedAt: 0,
    }
    ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([mockFoto])

    const { queryByText, findByText } = render(<PerfilProdutorScreen />)
    await findByText('Produtor rural')
    expect(queryByText('JS')).toBeNull()
  })

  it('exibe o e-mail da sessão no campo de e-mail (não editável)', async () => {
    const { findByDisplayValue } = render(<PerfilProdutorScreen />)
    expect(await findByDisplayValue('produtor@teste.com')).toBeTruthy()
  })

  it('aplica máscara de CPF ao preencher o campo', async () => {
    const { findByDisplayValue, getByPlaceholderText } = render(<PerfilProdutorScreen />)
    await findByDisplayValue('João Silva')
    const cpfInput = getByPlaceholderText('000.000.000-00')
    fireEvent.changeText(cpfInput, '12345678900')
    expect(await findByDisplayValue('123.456.789-00')).toBeTruthy()
  })

  it('aplica máscara de CEP ao preencher o campo', async () => {
    const { findByDisplayValue } = render(<PerfilProdutorScreen />)
    await findByDisplayValue('João Silva')
    const cepInput = await findByDisplayValue('01310-100')
    fireEvent.changeText(cepInput, '04538133')
    expect(await findByDisplayValue('04538-133')).toBeTruthy()
  })

  it('desabilita CPF quando CNPJ está preenchido', async () => {
    ;(api.buscarContaPorUsuario as jest.Mock).mockResolvedValue({
      ...mockConta,
      cpf: '',
      cnpj: '12345678000195',
    })
    const { findByPlaceholderText } = render(<PerfilProdutorScreen />)
    const cpfInput = await findByPlaceholderText('000.000.000-00')
    expect(cpfInput.props.editable).toBe(false)
  })

  it('desabilita CNPJ quando CPF está preenchido', async () => {
    const { findByDisplayValue, findByPlaceholderText } = render(<PerfilProdutorScreen />)
    await findByDisplayValue('João Silva')
    const cnpjInput = await findByPlaceholderText('00.000.000/0001-00')
    expect(cnpjInput.props.editable).toBe(false)
  })

  it('chama atualizarConta ao pressionar "Salvar alterações"', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    const salvar = await findByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })
    expect(api.atualizarConta).toHaveBeenCalledWith('acc-1', expect.objectContaining({
      userId: 'u1',
      name: 'João Silva',
    }))
  })

  it('exibe Alert de sucesso após salvar com êxito', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    const salvar = await findByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })
    expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Perfil atualizado!')
  })

  it('atualiza a sessão com a conta nova após salvar', async () => {
    const contaAtualizada = { ...mockConta, name: 'João Atualizado' }
    ;(api.atualizarConta as jest.Mock).mockResolvedValue(contaAtualizada)

    const { findByText } = render(<PerfilProdutorScreen />)
    const salvar = await findByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })

    expect(mockSetSession).toHaveBeenCalledWith(expect.objectContaining({
      account: contaAtualizada,
    }))
  })

  it('exibe Alert de erro quando atualizarConta falha', async () => {
    ;(api.atualizarConta as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Dados inválidos' } },
    })

    const { findByText } = render(<PerfilProdutorScreen />)
    const salvar = await findByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Dados inválidos')
  })

  it('exibe mensagem genérica de erro quando a resposta não tem mensagem', async () => {
    ;(api.atualizarConta as jest.Mock).mockRejectedValue(new Error('Network Error'))

    const { findByText } = render(<PerfilProdutorScreen />)
    const salvar = await findByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Não foi possível salvar')
  })

  it('chama logout ao pressionar "Sair da conta"', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    const sair = await findByText('Sair da conta')
    fireEvent.press(sair)
    expect(mockLogout).toHaveBeenCalled()
  })

  it('não chama atualizarConta se sessão não tem userId', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      session: null,
      setSession: mockSetSession,
      logout: mockLogout,
    })

    const { getByText } = render(<PerfilProdutorScreen />)
    const salvar = getByText('Salvar alterações')
    await act(async () => { fireEvent.press(salvar) })

    expect(api.atualizarConta).not.toHaveBeenCalled()
  })

  it('exibe seções de formulário: "Dados da conta" e "Endereço"', async () => {
    const { findByText } = render(<PerfilProdutorScreen />)
    expect(await findByText('Dados da conta')).toBeTruthy()
    expect(await findByText('Endereço')).toBeTruthy()
  })

  it('exibe botão de edição de foto no avatar', async () => {
    const { getByTestId } = render(<PerfilProdutorScreen />)
    expect(getByTestId('avatar-btn')).toBeTruthy()
  })

  it('solicita permissão de galeria ao pressionar o avatar', async () => {
    const { getByTestId } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))
    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled()
    })
  })

  it('exibe alerta quando permissão de galeria negada', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' })

    const { getByTestId } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Permissão necessária', expect.any(String))
    })
    expect(api.uploadArquivo).not.toHaveBeenCalled()
  })

  it('não faz upload quando usuário cancela o picker', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true })

    const { getByTestId } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled())
    expect(api.uploadArquivo).not.toHaveBeenCalled()
  })

  it('faz upload da imagem selecionada e atualiza a foto de perfil', async () => {
    const novaFoto = {
      id: 'new-file', publicId: 'new-pid', url: 'https://new.jpg', secureUrl: 'https://new.jpg',
      format: 'jpg', size: 200, entityType: 'PROFILE' as const, entityId: 'acc-1',
      uploadedBy: 'u1', uploadedAt: 0,
    }
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })
    ;(api.uploadArquivo as jest.Mock).mockResolvedValue(novaFoto)

    const { getByTestId, queryByText } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(api.uploadArquivo).toHaveBeenCalledWith('PROFILE', 'acc-1', {
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
      format: 'jpg', size: 100, entityType: 'PROFILE' as const, entityId: 'acc-1',
      uploadedBy: 'u1', uploadedAt: 0,
    }
    ;(api.buscarArquivosPorEntidade as jest.Mock).mockResolvedValue([fotoExistente])
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })

    const { getByTestId } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarArquivosPorEntidade).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(api.deletarArquivo).toHaveBeenCalledWith('old-file')
      expect(api.uploadArquivo).toHaveBeenCalled()
    })
  })

  it('exibe alerta de erro quando upload da foto falha', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })
    ;(api.uploadArquivo as jest.Mock).mockRejectedValue(new Error('upload failed'))

    const { getByTestId } = render(<PerfilProdutorScreen />)
    await waitFor(() => expect(api.buscarContaPorUsuario).toHaveBeenCalled())
    fireEvent.press(getByTestId('avatar-btn'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro ao enviar foto', 'upload failed')
    })
  })
})
