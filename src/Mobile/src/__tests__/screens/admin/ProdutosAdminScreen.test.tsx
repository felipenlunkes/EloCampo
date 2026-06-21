import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'
import * as api from '../../../services/api'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../services/api')

const produto = {
  id: 'p1',
  description: 'Feijão Carioca',
  status: 'AVAILABLE',
  category: 'GRAIN',
  quantity: 200,
  price: 4.5,
  scale: 'KG',
  vendorAccountId: 'v1',
  vendorCity: 'Campinas',
  vendorState: 'SP',
  availabilityDate: 0,
  imageUrls: [],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([])
  ;(api.deletarProduto as jest.Mock).mockResolvedValue({})
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, btns) => {
    btns?.find((b: any) => b.text === 'Remover')?.onPress?.()
  })
})

import ProdutosAdminScreen from '../../../screens/admin/ProdutosAdminScreen'

describe('ProdutosAdminScreen', () => {
  it('renderiza título "Produtos" e badge ADMIN', () => {
    const { getByText, getAllByText } = render(<ProdutosAdminScreen />)
    expect(getByText('Produtos')).toBeTruthy()
    expect(getAllByText('ADMIN').length).toBeGreaterThan(0)
  })

  it('exibe mensagem vazia quando não há produtos', async () => {
    const { findByText } = render(<ProdutosAdminScreen />)
    expect(await findByText('Nenhum produto cadastrado.')).toBeTruthy()
  })

  it('exibe produtos na lista com descrição e categoria', async () => {
    ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([produto])
    const { findByText } = render(<ProdutosAdminScreen />)
    expect(await findByText('Feijão Carioca')).toBeTruthy()
    expect(await findByText(/Grão/)).toBeTruthy()
  })

  it('exibe o estado (UF) do vendedor', async () => {
    ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([produto])
    const { findByText } = render(<ProdutosAdminScreen />)
    expect(await findByText(/SP/)).toBeTruthy()
  })

  it('chama deletarProduto ao confirmar remoção', async () => {
    ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([produto])

    const { findByText } = render(<ProdutosAdminScreen />)
    const remover = await findByText('Remover')
    await act(async () => { fireEvent.press(remover) })

    expect(api.deletarProduto).toHaveBeenCalledWith('p1')
  })

  it('remove o produto da lista após deletar', async () => {
    ;(api.buscarTodosProdutos as jest.Mock).mockResolvedValue([produto])

    const { findByText, queryByText } = render(<ProdutosAdminScreen />)
    const remover = await findByText('Remover')
    await act(async () => { fireEvent.press(remover) })

    await waitFor(() => expect(queryByText('Feijão Carioca')).toBeNull())
  })
})
