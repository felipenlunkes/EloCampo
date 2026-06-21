import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import type { AuthStackParams } from '../../navigation/AuthStack'

type Nav = NativeStackNavigationProp<AuthStackParams, 'CadastroInicial'>

export default function CadastroInicialScreen() {
  const navigation = useNavigation<Nav>()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [termos, setTermos] = useState(false)

  function handleContinuar() {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe seu nome completo'); return }
    if (!email.trim()) { Alert.alert('Atenção', 'Informe seu e-mail'); return }
    if (senha.length < 6) { Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres'); return }
    if (senha !== confirmar) { Alert.alert('Atenção', 'As senhas não coincidem'); return }
    if (!termos) { Alert.alert('Atenção', 'Aceite os termos para continuar'); return }
    navigation.navigate('TipoConta', { nome: nome.trim(), email: email.trim(), senha })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.title}>Criar conta</Text>
          <Text style={s.subtitle}>Preencha seus dados para começar</Text>
        </View>

        <View style={s.stepRow}>
          <View style={[s.step, s.stepActive]}>
            <Text style={[s.stepNum, s.stepNumActive]}>1</Text>
          </View>
          <View style={s.stepLine} />
          <View style={s.step}>
            <Text style={s.stepNum}>2</Text>
          </View>
          <View style={s.stepLine} />
          <View style={s.step}>
            <Text style={s.stepNum}>3</Text>
          </View>
        </View>
        <View style={s.stepLabels}>
          <Text style={[s.stepLabel, s.stepLabelActive]}>Dados</Text>
          <Text style={s.stepLabel}>Perfil</Text>
          <Text style={s.stepLabel}>Endereço</Text>
        </View>

        <View style={s.divider} />

        <Input
          label="Nome completo"
          value={nome}
          onChangeText={setNome}
          placeholder="João da Silva"
          autoCapitalize="words"
        />
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
          placeholder="Mínimo 6 caracteres"
        />
        <Input
          label="Confirmar senha"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          placeholder="Repita a senha"
        />

        <TouchableOpacity
          onPress={() => setTermos(v => !v)}
          style={s.termosRow}
          activeOpacity={0.8}
        >
          <View style={[s.checkbox, termos && s.checkboxActive]}>
            {termos && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.termosText}>
            Li e aceito os{' '}
            <Text style={s.termosLink}>Termos de Uso</Text>
            {' '}e a{' '}
            <Text style={s.termosLink}>Política de Privacidade</Text>
          </Text>
        </TouchableOpacity>

        <Btn
          label="Continuar →"
          onPress={handleContinuar}
          style={{ marginTop: 20 }}
        />

        <View style={s.loginRow}>
          <Text style={s.loginText}>Já tem conta?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.loginLink}> Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1a0e' },
  content: { padding: 24, paddingTop: 56, flexGrow: 1 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 12, color: '#4a9050' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#a8dca9', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#4a7a4c', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  step: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: '#264d29',
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { borderColor: '#4a9050', backgroundColor: '#4a9050' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#2f5530' },
  stepNumActive: { color: '#d4f0d5' },
  stepLine: { flex: 1, height: 0.5, backgroundColor: '#1b341d', marginHorizontal: 4 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  stepLabel: { fontSize: 9, color: '#2f5530', textTransform: 'uppercase', letterSpacing: 0.4 },
  stepLabelActive: { color: '#4a9050' },
  divider: { height: 0.5, backgroundColor: '#1b341d', marginVertical: 20 },
  termosRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1, borderColor: '#264d29',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  checkboxActive: { borderColor: '#4a9050', backgroundColor: '#4a9050' },
  checkmark: { fontSize: 11, color: '#d4f0d5', fontWeight: '700' },
  termosText: { fontSize: 12, color: '#4a7a4c', flex: 1, lineHeight: 18 },
  termosLink: { color: '#4a9050' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 13, color: '#4a7a4c' },
  loginLink: { fontSize: 13, color: '#4a9050', fontWeight: '600' },
})
