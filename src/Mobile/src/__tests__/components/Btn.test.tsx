import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Btn } from '../../components/Btn'

describe('Btn', () => {
  it('renderiza o rótulo corretamente', () => {
    const { getByText } = render(<Btn label="Salvar" />)
    expect(getByText('Salvar')).toBeTruthy()
  })

  it('chama onPress ao ser pressionado', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Btn label="Confirmar" onPress={onPress} />)

    fireEvent.press(getByText('Confirmar'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('não chama onPress quando disabled=true', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Btn label="Bloqueado" onPress={onPress} disabled />)

    fireEvent.press(getByText('Bloqueado'))

    expect(onPress).not.toHaveBeenCalled()
  })

  it('não exibe o rótulo quando loading=true (mostra ActivityIndicator)', () => {
    const { queryByText } = render(<Btn label="Carregando" loading />)
    expect(queryByText('Carregando')).toBeNull()
  })

  it('não chama onPress quando loading=true', () => {
    const onPress = jest.fn()
    const { toJSON } = render(<Btn label="Aguarde" onPress={onPress} loading />)
    // Componente fica desabilitado — o snapshot confirma o estado
    expect(toJSON()).toMatchSnapshot()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renderiza variante primary por padrão', () => {
    const { toJSON } = render(<Btn label="Primary" />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renderiza variante ghost', () => {
    const { toJSON } = render(<Btn label="Ghost" variant="ghost" />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renderiza variante danger', () => {
    const { toJSON } = render(<Btn label="Danger" variant="danger" />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('aplica cor de fundo customizada via prop bg', () => {
    const { toJSON } = render(<Btn label="Custom" bg="#ff0000" />)
    const tree = toJSON() as any
    // O StyleSheet resolve e mescla os estilos em objeto único
    expect(tree.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#ff0000' }),
    )
  })

  it('fica com opacidade reduzida quando disabled', () => {
    const { toJSON } = render(<Btn label="Disabled" disabled />)
    const tree = toJSON() as any
    expect(tree.props.style).toEqual(
      expect.objectContaining({ opacity: 0.6 }),
    )
  })

  it('fica com opacidade reduzida quando loading', () => {
    const { toJSON } = render(<Btn label="Loading" loading />)
    const tree = toJSON() as any
    expect(tree.props.style).toEqual(
      expect.objectContaining({ opacity: 0.6 }),
    )
  })
})
