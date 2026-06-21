import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../contexts/AuthContext'
import { gerarToken, buscarContaPorUsuario } from '../../services/api'
import type { AuthSession } from '../../types'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import type { AuthStackParams } from '../../navigation/AuthStack'

type Nav = NativeStackNavigationProp<AuthStackParams, 'Login'>

function decodeJwt(token: string): { sub: string; email: string; isAdmin: boolean } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

export default function LoginScreen() {
  const navigation = useNavigation<Nav>()
  const { setSession } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erroCred, setErroCred] = useState<string | null>(null)

  async function handleLogin() {
    if (!email || !senha) { Alert.alert('Atenção', 'Preencha e-mail e senha'); return }
    setLoading(true)
    try {
      const { token } = await gerarToken(email, senha)
      const payload = decodeJwt(token)
      if (!payload) throw new Error('Token inválido')
      await AsyncStorage.setItem('ec_token', token)
      let account
      try { account = await buscarContaPorUsuario(payload.sub) } catch { /* sem conta ainda */ }
      const session: AuthSession = { token, userId: payload.sub, email: payload.email, isAdmin: payload.isAdmin, account }
      await setSession(session)
    } catch (err: any) {
      const status = err.response?.status
      if (status === 400 || status === 401) {
        setErroCred('E-mail ou senha incorretos.\nVerifique suas credenciais e tente novamente.')
      } else {
        setErroCred(err.response?.data?.message ?? 'Ocorreu um erro inesperado. Tente novamente.')
      }
    } finally { setLoading(false) }
  }

  return (
    <>
    <Modal visible={!!erroCred} transparent animationType="fade" onRequestClose={() => setErroCred(null)}>
      <View style={s.overlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>Acesso negado</Text>
          <Text style={s.modalMsg}>{erroCred}</Text>
          <TouchableOpacity onPress={() => setErroCred(null)} style={s.modalBtn}>
            <Text style={s.modalBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={s.logoArea}>
          <Text style={s.logo}>
            Elo<Text style={{ color: '#e8b84b' }}>Campo</Text>
          </Text>
          <Text style={s.logoSub}>Marketplace agrícola brasileiro</Text>
        </View>

        <View style={s.divider} />

        {/* Formulário de login */}
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="joao@fazenda.com.br"
        />
        <Input
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="••••••••"
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('RecuperarSenha')}
          style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 }}
        >
          <Text style={s.forgotLink}>Esqueci a senha</Text>
        </TouchableOpacity>

        <Btn
          label="Entrar"
          onPress={handleLogin}
          loading={loading}
          style={{ marginBottom: 12 }}
        />

        <View style={s.divider} />

        {/* Criar conta */}
        <View style={s.registerArea}>
          <Text style={s.registerText}>Não tem conta?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CadastroInicial')}
            style={s.registerBtn}
          >
            <Text style={s.registerBtnText}>Criar conta grátis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1a0e' },
  content: { padding: 28, paddingTop: 72, flexGrow: 1, justifyContent: 'center' },
  logoArea: { marginBottom: 28, alignItems: 'center' },
  logo: { fontSize: 44, fontWeight: '900', color: '#a8dca9', letterSpacing: -1, lineHeight: 48 },
  logoSub: { fontSize: 13, color: '#4a7a4c', marginTop: 4 },
  divider: { height: 0.5, backgroundColor: '#1b341d', marginVertical: 20 },
  forgotLink: { fontSize: 12, color: '#4a9050' },
  registerArea: { alignItems: 'center', gap: 10 },
  registerText: { fontSize: 13, color: '#6a9a6c' },
  registerBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#2a4a2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: { fontSize: 13, color: '#6a9a6c', fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBox: { backgroundColor: '#111f12', borderRadius: 14, borderWidth: 0.5, borderColor: '#2a4a2c', padding: 24, width: '100%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#e07070', marginBottom: 10 },
  modalMsg: { fontSize: 13, color: '#a8dca9', lineHeight: 20, marginBottom: 20 },
  modalBtn: { backgroundColor: '#2f6433', borderRadius: 8, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 13, fontWeight: '600', color: '#d4f0d5' },
})
