import {
  PRODUCT_CATEGORY,
  PRODUCT_SCALE,
  ORDER_STATUS_LABEL,
  OrderStatusEnum,
} from '../../types'

describe('PRODUCT_CATEGORY', () => {
  it('contém todas as 7 categorias', () => {
    expect(PRODUCT_CATEGORY).toHaveLength(7)
  })

  it('cada categoria possui valor e rótulo', () => {
    PRODUCT_CATEGORY.forEach(item => {
      expect(item).toHaveProperty('v')
      expect(item).toHaveProperty('label')
      expect(typeof item.v).toBe('string')
      expect(typeof item.label).toBe('string')
    })
  })

  it('contém a categoria GRAIN com rótulo correto', () => {
    const grain = PRODUCT_CATEGORY.find(c => c.v === 'GRAIN')
    expect(grain?.label).toBe('Grão')
  })

  it('não contém valores duplicados', () => {
    const valores = PRODUCT_CATEGORY.map(c => c.v)
    const unicos = new Set(valores)
    expect(unicos.size).toBe(valores.length)
  })
})

describe('PRODUCT_SCALE', () => {
  it('contém exatamente 3 escalas', () => {
    expect(PRODUCT_SCALE).toHaveLength(3)
  })

  it('contém KG, UNIT e LITER', () => {
    const valores = PRODUCT_SCALE.map(s => s.v)
    expect(valores).toContain('KG')
    expect(valores).toContain('UNIT')
    expect(valores).toContain('LITER')
  })
})

describe('ORDER_STATUS_LABEL', () => {
  it('mapeia PENDING para "Pendente"', () => {
    expect(ORDER_STATUS_LABEL.PENDING).toBe('Pendente')
  })

  it('mapeia ACCEPTED para "Aceito"', () => {
    expect(ORDER_STATUS_LABEL.ACCEPTED).toBe('Aceito')
  })

  it('mapeia COMPLETED para "Concluído"', () => {
    expect(ORDER_STATUS_LABEL.COMPLETED).toBe('Concluído')
  })

  it('cobre todos os status do enum OrderStatusEnum', () => {
    const enumKeys = Object.keys(OrderStatusEnum) as (keyof typeof OrderStatusEnum)[]
    enumKeys.forEach(key => {
      expect(ORDER_STATUS_LABEL[key]).toBeDefined()
    })
  })
})
