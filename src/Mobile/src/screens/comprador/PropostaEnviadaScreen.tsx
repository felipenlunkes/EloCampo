import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { ProductResponse, OrderResponse } from '../../types'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PropostaEnviadaScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const produto: ProductResponse = route.params?.produto
  const oferta: string = route.params?.oferta

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Confirmação</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.center}>
        <View style={s.checkCircle}>
          <Text style={s.check}>✓</Text>
        </View>
        <Text style={s.successTitle}>Proposta enviada!</Text>
        <Text style={s.successSub}>O produtor receberá sua oferta em breve.</Text>

        {produto && (
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>Resumo</Text>
            <Text style={s.summaryMain}>{produto.description} — R$ {Number(oferta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un</Text>
            <Text style={s.summarySub}>{produto.vendorCity} · {produto.vendorState}</Text>
          </View>
        )}

        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => navigation.navigate('Pedidos', { screen: 'MeusPedidos' })}
        >
          <Text style={s.btnPrimaryText}>Ver meus pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnGhost}
          onPress={() => navigation.navigate('Produtos', { screen: 'BuscarProdutos' })}
        >
          <Text style={s.btnGhostText}>Buscar outros produtos</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  back: { fontSize: 18, color: B.text2, width: 40 },
  topTitle: { fontSize: 15, fontWeight: '600', color: B.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#122114', borderWidth: 1.5, borderColor: '#264d29', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  check: { fontSize: 28, color: '#6dbf74' },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#6dbf74', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#4a9050', marginBottom: 20, textAlign: 'center' },
  summaryBox: { width: '100%', backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 10, padding: 14, marginBottom: 20 },
  summaryLabel: { fontSize: 10, color: B.text2, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryMain: { fontSize: 13, color: '#a8c5aa', fontWeight: '500' },
  summarySub: { fontSize: 11, color: B.accent, marginTop: 2 },
  btnPrimary: { width: '100%', backgroundColor: B.accent, borderWidth: 0.5, borderColor: B.accent2, borderRadius: 9, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnPrimaryText: { color: '#cce4f5', fontSize: 14, fontWeight: '600' },
  btnGhost: { width: '100%', borderWidth: 0.5, borderColor: B.border, borderRadius: 9, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { color: B.text2, fontSize: 13 },
})
