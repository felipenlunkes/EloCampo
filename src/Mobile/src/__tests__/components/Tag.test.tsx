import React from 'react'
import { render } from '@testing-library/react-native'
import { Tag } from '../../components/Tag'
import { TAG } from '../../theme/colors'

describe('Tag', () => {
  it('renderiza o rótulo corretamente', () => {
    const { getByText } = render(<Tag variant="green" label="Disponível" />)
    expect(getByText('Disponível')).toBeTruthy()
  })

  it('aplica as cores corretas para variante green', () => {
    const { toJSON } = render(<Tag variant="green" label="Verde" />)
    const tree = toJSON() as any
    const containerStyle = tree.props.style
    expect(containerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: TAG.green.bg,
          borderColor: TAG.green.border,
        }),
      ]),
    )
  })

  it('aplica as cores corretas para variante amber', () => {
    const { toJSON } = render(<Tag variant="amber" label="Pendente" />)
    const tree = toJSON() as any
    const containerStyle = tree.props.style
    expect(containerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: TAG.amber.bg,
          borderColor: TAG.amber.border,
        }),
      ]),
    )
    const text = tree.children[0]
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: TAG.amber.color }),
      ]),
    )
  })

  it('aplica as cores corretas para variante blue', () => {
    const { toJSON } = render(<Tag variant="blue" label="Info" />)
    const tree = toJSON() as any
    const containerStyle = tree.props.style
    expect(containerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: TAG.blue.bg }),
      ]),
    )
  })

  it('aplica as cores corretas para variante red', () => {
    const { toJSON } = render(<Tag variant="red" label="Cancelado" />)
    const tree = toJSON() as any
    const containerStyle = tree.props.style
    expect(containerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: TAG.red.bg }),
      ]),
    )
  })

  it('corresponde ao snapshot para cada variante', () => {
    const variants = ['green', 'amber', 'blue', 'red'] as const
    variants.forEach(variant => {
      const { toJSON } = render(<Tag variant={variant} label={variant} />)
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
