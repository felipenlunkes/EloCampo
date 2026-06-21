import { describe, it, expect } from 'vitest'
import { decodeJwt } from './jwt'

function makeJwt(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
  return `header.${encoded}.signature`
}

describe('decodeJwt', () => {
  it('deve decodificar um token válido', () => {
    const payload = { sub: 'user-123', email: 'user@test.com', isAdmin: false }
    const result = decodeJwt(makeJwt(payload))
    expect(result).toEqual(payload)
  })

  it('deve retornar null para token sem separador de ponto', () => {
    expect(decodeJwt('token-sem-ponto')).toBeNull()
  })

  it('deve retornar null para string vazia', () => {
    expect(decodeJwt('')).toBeNull()
  })

  it('deve retornar null se o payload não for JSON válido', () => {
    const notJsonB64 = btoa('conteudo-nao-json')
    expect(decodeJwt(`header.${notJsonB64}.sig`)).toBeNull()
  })

  it('deve suportar caracteres base64url (- e _)', () => {
    const payload = { sub: 'user-456', email: 'b@b.com', isAdmin: true }
    const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_')
    const result = decodeJwt(`header.${base64url}.sig`)
    expect(result).toEqual(payload)
  })

  it('deve decodificar isAdmin = true corretamente', () => {
    const payload = { sub: 'admin-1', email: 'admin@test.com', isAdmin: true }
    expect(decodeJwt(makeJwt(payload))?.isAdmin).toBe(true)
  })

  it('deve decodificar isAdmin = false corretamente', () => {
    const payload = { sub: 'user-1', email: 'user@test.com', isAdmin: false }
    expect(decodeJwt(makeJwt(payload))?.isAdmin).toBe(false)
  })
})
