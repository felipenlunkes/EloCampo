import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import { criarUsuario } from '../../services/api'
import { Btn } from '../../components/Btn'
import type { AuthStackParams } from '../../navigation/AuthStack'

type Nav = NativeStackNavigationProp<AuthStackParams, 'TipoConta'>
type Route = RouteProp<AuthStackParams, 'TipoConta'>

export default function TipoContaScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { nome, email, senha } = route.params

  const [role, setRole] = useState<'VENDOR' | 'BUYER'>('VENDOR')
  const [loading, setLoading] = useState(false)

  async function handleContinuar() {
    setLoading(true)
    try {
      const user = await criarUsuario({ email, password: senha, isAdmin: false })
      navigation.navigate('Cadastro', { userId: user.id, role, nome, email, senha })
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Erro ao criar usuário')
    } finally { setLoading(false) }
  }

  const opts = [
    { v: 'VENDOR' as const, label: 'Produtor rural', sub: 'Publico e vendo produtos' },
    { v: 'BUYER'  as const, label: 'Comprador', sub: 'Busco e compro produtos' },
  ]

  return (
    <View style={s.root}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
        <Text style={s.back}>← Login</Text>
      </TouchableOpacity>
      <Text style={s.title}>Criar conta</Text>
      <Text style={s.hint}>Escolha como você vai usar a plataforma</Text>

      {opts.map(opt => {
        const sel = role === opt.v
        return (
          <TouchableOpacity
            key={opt.v}
            onPress={() => setRole(opt.v)}
            activeOpacity={0.8}
            style={[s.card, sel && s.cardSel]}
          >
            <View style={[s.radio, sel && s.radioSel]}>
              {sel && <View style={s.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, sel && s.cardLabelSel]}>{opt.label}</Text>
              <Text style={[s.cardSub, sel && s.cardSubSel]}>{opt.sub}</Text>
            </View>
          </TouchableOpacity>
        )
      })}

      <Btn label="Continuar →" onPress={handleContinuar} loading={loading} style={{ marginTop: 24 }} />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1a0e', padding: 24, paddingTop: 60 },
  back: { fontSize: 12, color: '#6a9a6c', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#a8dca9', marginBottom: 4 },
  hint: { fontSize: 12, color: '#6a9a6c', marginBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 0.5, borderColor: '#264d29',
    backgroundColor: '#0b1f0c', padding: 14, marginBottom: 10,
  },
  cardSel: { borderWidth: 1.5, borderColor: '#4a9050', backgroundColor: '#122114' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#264d29' },
  radioSel: { borderColor: '#4a9050', backgroundColor: '#4a9050', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d4f0d5' },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#5a8a5c' },
  cardLabelSel: { color: '#a8dca9' },
  cardSub: { fontSize: 11, color: '#2f5530', marginTop: 2 },
  cardSubSel: { color: '#4a9050' },
})
