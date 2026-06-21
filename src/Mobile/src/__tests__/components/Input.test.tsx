import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Input } from '../../components/Input'

describe('Input', () => {
  it('renderiza o rótulo quando fornecido', () => {
    const { getByText } = render(
      <Input label="E-mail" value="" onChangeText={jest.fn()} />,
    )
    expect(getByText('E-mail')).toBeTruthy()
  })

  it('não renderiza rótulo quando não fornecido', () => {
    const { queryByText } = render(
      <Input value="" onChangeText={jest.fn()} />,
    )
    // Nenhum elemento de texto extra deve aparecer
    expect(queryByText(/.+/)).toBeNull()
  })

  it('chama onChangeText quando o texto muda', () => {
    const onChangeText = jest.fn()
    const { getByDisplayValue } = render(
      <Input value="inicial" onChangeText={onChangeText} />,
    )

    fireEvent.changeText(getByDisplayValue('inicial'), 'novo texto')

    expect(onChangeText).toHaveBeenCalledWith('novo texto')
  })

  it('exibe o placeholder correto', () => {
    const { getByPlaceholderText } = render(
      <Input value="" onChangeText={jest.fn()} placeholder="Digite seu nome" />,
    )
    expect(getByPlaceholderText('Digite seu nome')).toBeTruthy()
  })

  it('renderiza campo de senha quando secureTextEntry=true', () => {
    const { toJSON } = render(
      <Input value="" onChangeText={jest.fn()} secureTextEntry />,
    )
    const tree = toJSON() as any
    // Encontra o TextInput (último filho do View)
    const textInput = tree.children[0]
    expect(textInput.props.secureTextEntry).toBe(true)
  })

  it('renderiza como não editável quando editable=false', () => {
    const { toJSON } = render(
      <Input value="valor" onChangeText={jest.fn()} editable={false} />,
    )
    const tree = toJSON() as any
    const textInput = tree.children[0]
    expect(textInput.props.editable).toBe(false)
  })

  it('renderiza com cores customizadas', () => {
    const { toJSON } = render(
      <Input
        value=""
        onChangeText={jest.fn()}
        bg="#000"
        border="#fff"
        textColor="#f00"
      />,
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renderiza em modo multiline', () => {
    const { toJSON } = render(
      <Input value="" onChangeText={jest.fn()} multiline numberOfLines={4} />,
    )
    const tree = toJSON() as any
    const textInput = tree.children[0]
    expect(textInput.props.multiline).toBe(true)
    expect(textInput.props.numberOfLines).toBe(4)
  })
})
