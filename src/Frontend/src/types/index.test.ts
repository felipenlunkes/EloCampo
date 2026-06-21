import { describe, it, expect } from 'vitest'
import { PRODUCT_CATEGORY, PRODUCT_SCALE, OrderStatusEnum } from './index'

describe('PRODUCT_CATEGORY', () => {
  it('deve conter 7 categorias', () => {
    expect(PRODUCT_CATEGORY).toHaveLength(7)
  })

  it.each([
    ['GRAIN', 'Grão'],
    ['VEGETABLE', 'Vegetal'],
    ['FRUIT', 'Fruta'],
    ['DAIRY', 'Laticínio'],
    ['ANIMAL_PRODUCTS', 'Origem animal'],
    ['PROTEINS', 'Proteínas'],
    ['CONFECTIONERY', 'Artesanato'],
  ] as const)('deve conter a categoria %s com label "%s"', (value, label) => {
    const found = PRODUCT_CATEGORY.find(c => c.v === value)
    expect(found).toBeDefined()
    expect(found?.label).toBe(label)
  })

  it('cada categoria deve ter propriedades v e label', () => {
    for (const cat of PRODUCT_CATEGORY) {
      expect(cat).toHaveProperty('v')
      expect(cat).toHaveProperty('label')
      expect(typeof cat.v).toBe('string')
      expect(typeof cat.label).toBe('string')
    }
  })
})

describe('PRODUCT_SCALE', () => {
  it('deve conter 3 escalas', () => {
    expect(PRODUCT_SCALE).toHaveLength(3)
  })

  it.each([
    ['KG', 'Quilograma (kg)'],
    ['UNIT', 'Unidade'],
    ['LITER', 'Litro (L)'],
  ] as const)('deve conter a escala %s com label "%s"', (value, label) => {
    const found = PRODUCT_SCALE.find(s => s.v === value)
    expect(found).toBeDefined()
    expect(found?.label).toBe(label)
  })
})

describe('OrderStatusEnum', () => {
  it('deve ter o valor PENDING = "PENDING"', () => {
    expect(OrderStatusEnum.PENDING).toBe('PENDING')
  })

  it('deve ter o valor ACCEPTED = "ACCEPTED"', () => {
    expect(OrderStatusEnum.ACCEPTED).toBe('ACCEPTED')
  })

  it('deve ter o valor COMPLETED = "COMPLETED"', () => {
    expect(OrderStatusEnum.COMPLETED).toBe('COMPLETED')
  })
})
