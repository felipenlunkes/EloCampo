import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { resetarSenha } from '../../services/api'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'

export default function RecuperarSenhaScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleEnviar() {
    if (!email) { Alert.alert('Atenção', 'Informe seu e-mail'); return }
    setLoading(true)
    try {
      await resetarSenha(email)
      setEnviado(true)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Erro ao solicitar recuperação')
    } finally { setLoading(false) }
  }

  return (
    <View style={s.root}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.back}>← Login</Text>
      </TouchableOpacity>
      <Text style={s.title}>Recuperar senha</Text>
      <Text style={s.hint}>Informe seu e-mail para receber o código de recuperação</Text>

      {enviado ? (
        <View style={s.successBox}>
          <Text style={s.successText}>✓ E-mail enviado com sucesso!</Text>
          <Text style={s.successSub}>Verifique sua caixa de entrada e siga as instruções.</Text>
        </View>
      ) : (
        <>
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="joao@fazenda.com.br"
          />
          <Btn label="Enviar código" onPress={handleEnviar} loading={loading} />
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1a0e', padding: 24, paddingTop: 60 },
  back: { fontSize: 12, color: '#6a9a6c', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#a8dca9', marginBottom: 4 },
  hint: { fontSize: 13, color: '#6a9a6c', marginBottom: 24, lineHeight: 20 },
  successBox: {
    backgroundColor: '#122114', borderRadius: 10, borderWidth: 0.5,
    borderColor: '#264d29', padding: 16, marginTop: 8,
  },
  successText: { fontSize: 15, fontWeight: '600', color: '#6dbf74', marginBottom: 6 },
  successSub: { fontSize: 12, color: '#4a9050', lineHeight: 18 },
})
