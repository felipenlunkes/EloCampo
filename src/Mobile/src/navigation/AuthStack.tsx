import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/auth/LoginScreen'
import CadastroInicialScreen from '../screens/auth/CadastroInicialScreen'
import TipoContaScreen from '../screens/auth/TipoContaScreen'
import CadastroScreen from '../screens/auth/CadastroScreen'
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen'

export type AuthStackParams = {
  Login: undefined
  CadastroInicial: undefined
  TipoConta: { nome: string; email: string; senha: string }
  Cadastro: { userId: string; role: 'VENDOR' | 'BUYER'; nome: string; email: string; senha: string }
  RecuperarSenha: undefined
}

const Stack = createNativeStackNavigator<AuthStackParams>()

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
      <Stack.Screen name="TipoConta" component={TipoContaScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
    </Stack.Navigator>
  )
}
