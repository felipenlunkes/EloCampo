import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import { useAuth } from '../../contexts/AuthContext'
import { criarConta, buscarContaPorUsuario, gerarToken } from '../../services/api'
import type { AuthSession } from '../../types'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import { maskCpf, maskCnpj, unmask } from '../../utils/masks'
import type { AuthStackParams } from '../../navigation/AuthStack'

type Nav = NativeStackNavigationProp<AuthStackParams, 'Cadastro'>
type Route = RouteProp<AuthStackParams, 'Cadastro'>

export default function CadastroScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { userId, role, nome, email, senha } = route.params
  const { setSession } = useAuth()

  const [nomeCompleto, setNomeCompleto] = useState(nome)
  const [cpf, setCpf] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [estado, setEstado] = useState('')
  const [cidade, setCidade] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCriar() {
    if (!nomeCompleto || !telefone) { Alert.alert('Atenção', 'Preencha os campos obrigatórios'); return }
    setLoading(true)
    try {
      await criarConta({
        userId,
        name: nomeCompleto,
        cpf: role === 'VENDOR' ? unmask(cpf) : undefined,
        cnpj: role === 'BUYER' ? unmask(cnpj) : undefined,
        birthdayDate: Date.now(),
        role,
        phone: { countryCode: 55, stateCode: parseInt(telefone.slice(1, 3)) || 65, number: telefone },
        address: { street: '', number: '', city: cidade, district: '', state: estado, complement: '', postalCode: '' },
      })
      const account = await buscarContaPorUsuario(userId)
      const { token } = await gerarToken(email, senha)
      const session: AuthSession = { token, userId, email, isAdmin: false, account }
      await setSession(session)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Erro ao criar conta. Tente fazer login.')
      navigation.navigate('Login')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Tipo de conta</Text>
        </TouchableOpacity>
        <Text style={s.title}>Dados pessoais</Text>
        <Text style={s.hint}>Etapa 2 de 2 — complete seu perfil</Text>

        <Input label="Nome completo" value={nomeCompleto} onChangeText={setNomeCompleto} placeholder="João da Silva" autoCapitalize="words" />
        <Input label="E-mail" value={email} onChangeText={() => {}} editable={false} placeholder={email} />

        {role === 'VENDOR' && (
          <Input label="CPF" value={cpf} onChangeText={v => setCpf(maskCpf(v))} keyboardType="numeric" placeholder="000.000.000-00" />
        )}
        {role === 'BUYER' && (
          <Input label="CNPJ" value={cnpj} onChangeText={v => setCnpj(maskCnpj(v))} keyboardType="numeric" placeholder="00.000.000/0001-00" />
        )}

        <Input label="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="(65) 9 9999-9999" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label="Estado (UF)" value={estado} onChangeText={setEstado} autoCapitalize="characters" placeholder="MT" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Município" value={cidade} onChangeText={setCidade} autoCapitalize="words" placeholder="Sorriso" />
          </View>
        </View>

        <Btn label="Criar minha conta" onPress={handleCriar} loading={loading} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1a0e' },
  content: { padding: 24, paddingTop: 60 },
  back: { fontSize: 12, color: '#6a9a6c', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#a8dca9', marginBottom: 4 },
  hint: { fontSize: 12, color: '#6a9a6c', marginBottom: 20 },
})
