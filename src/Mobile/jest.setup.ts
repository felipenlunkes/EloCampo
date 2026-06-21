// Silencia warnings desnecessários do React Native em ambiente de testes
jest.spyOn(console, 'warn').mockImplementation(() => {})
