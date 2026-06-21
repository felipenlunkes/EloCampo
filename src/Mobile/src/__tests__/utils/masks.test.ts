import { maskCpf, maskCnpj, maskCep, unmask } from '../../utils/masks'

describe('maskCpf', () => {
  it('retorna vazio quando recebe string vazia', () => {
    expect(maskCpf('')).toBe('')
  })

  it('formata até 3 dígitos sem pontuação', () => {
    expect(maskCpf('123')).toBe('123')
  })

  it('formata 4 dígitos com primeiro ponto', () => {
    expect(maskCpf('1234')).toBe('123.4')
  })

  it('formata 7 dígitos com dois pontos', () => {
    expect(maskCpf('1234567')).toBe('123.456.7')
  })

  it('formata CPF completo (11 dígitos)', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01')
  })

  it('ignora caracteres não numéricos na entrada', () => {
    expect(maskCpf('123.456.789-01')).toBe('123.456.789-01')
    expect(maskCpf('abc123def')).toBe('123')
  })

  it('limita a 11 dígitos', () => {
    expect(maskCpf('123456789012345')).toBe('123.456.789-01')
  })
})

describe('maskCnpj', () => {
  it('retorna vazio quando recebe string vazia', () => {
    expect(maskCnpj('')).toBe('')
  })

  it('formata até 2 dígitos sem pontuação', () => {
    expect(maskCnpj('12')).toBe('12')
  })

  it('formata 3 dígitos com ponto', () => {
    expect(maskCnpj('123')).toBe('12.3')
  })

  it('formata 6 dígitos com dois pontos', () => {
    expect(maskCnpj('123456')).toBe('12.345.6')
  })

  it('formata 9 dígitos com barra', () => {
    expect(maskCnpj('123456789')).toBe('12.345.678/9')
  })

  it('formata CNPJ completo (14 dígitos)', () => {
    expect(maskCnpj('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('ignora caracteres não numéricos', () => {
    expect(maskCnpj('12.345.678/0001-95')).toBe('12.345.678/0001-95')
  })

  it('limita a 14 dígitos', () => {
    expect(maskCnpj('123456789012345678')).toBe('12.345.678/9012-34')
  })
})

describe('maskCep', () => {
  it('retorna vazio quando recebe string vazia', () => {
    expect(maskCep('')).toBe('')
  })

  it('formata até 5 dígitos sem hífen', () => {
    expect(maskCep('12345')).toBe('12345')
  })

  it('formata 6 dígitos com hífen', () => {
    expect(maskCep('123456')).toBe('12345-6')
  })

  it('formata CEP completo (8 dígitos)', () => {
    expect(maskCep('12345678')).toBe('12345-678')
  })

  it('ignora caracteres não numéricos', () => {
    expect(maskCep('12345-678')).toBe('12345-678')
  })

  it('limita a 8 dígitos', () => {
    expect(maskCep('123456789')).toBe('12345-678')
  })
})

describe('unmask', () => {
  it('remove pontos, hífens e barras do CPF', () => {
    expect(unmask('123.456.789-01')).toBe('12345678901')
  })

  it('remove formatação do CNPJ', () => {
    expect(unmask('12.345.678/0001-95')).toBe('12345678000195')
  })

  it('remove hífen do CEP', () => {
    expect(unmask('12345-678')).toBe('12345678')
  })

  it('retorna string vazia quando entrada é vazia', () => {
    expect(unmask('')).toBe('')
  })

  it('mantém string sem formatação inalterada', () => {
    expect(unmask('12345')).toBe('12345')
  })

  it('remove todos os caracteres não numéricos', () => {
    expect(unmask('abc-123.def/456')).toBe('123456')
  })
})
