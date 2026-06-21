import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutos, buscarPedidoPorIdComprador } from '../../services/api'
import type { ProductResponse, OrderResponse } from '../../types'
import { Tag } from '../../components/Tag'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeCompradorScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)

  const accountId = session?.account?.id

  useEffect(() => {
    Promise.allSettled([
      buscarProdutos().then(setProdutos),
      accountId ? buscarPedidoPorIdComprador(accountId).then(p => setPedidos(p.content)) : Promise.resolve(),
    ]).finally(() => setLoading(false))
  }, [accountId])

  const disponíveis = produtos.filter(p => p.status === 'AVAILABLE').length
  const negociando = pedidos.filter(p => p.orderStatus === 'PENDING').length

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.greeting}>Olá, {session?.account?.name?.split(' ')[0] ?? 'Comprador'}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>Comprador</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={B.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: B.accent2 }]}>{disponíveis}</Text>
              <Text style={s.statLbl}>Disponíveis</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: B.accent2 }]}>{pedidos.length}</Text>
              <Text style={s.statLbl}>Pedidos</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#e8b84b' }]}>{negociando}</Text>
              <Text style={s.statLbl}>Negoc.</Text>
            </View>
          </View>

          <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Produtos', { screen: 'BuscarProdutos' })}>
            <Text style={s.ctaText}>Buscar produtos</Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>RECENTES</Text>
          {produtos.slice(0, 5).map((p, i) => (
            <TouchableOpacity
              key={p.id}
              style={[s.row, i === Math.min(produtos.length, 5) - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('Produtos', { screen: 'DetalheProduto', params: { produto: p } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.description} — {p.vendorState}</Text>
                <Text style={s.rowSub}>{p.quantity} un · R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <Tag variant="blue" label="Disp." />
            </TouchableOpacity>
          ))}
          {produtos.length === 0 && <Text style={s.empty}>Nenhum produto disponível.</Text>}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  greeting: { fontSize: 15, fontWeight: '600', color: B.text },
  roleBadge: { backgroundColor: B.bg3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, borderWidth: 0.5, borderColor: B.border },
  roleText: { fontSize: 10, color: B.text4 },
  body: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: B.bg3, borderRadius: 8, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '600' },
  statLbl: { fontSize: 10, color: B.text4, marginTop: 2 },
  cta: { backgroundColor: B.accent, borderWidth: 0.5, borderColor: B.accent2, borderRadius: 8, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ctaText: { color: '#cce4f5', fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 9, color: B.text2, letterSpacing: 0.8, marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: B.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#a8c5aa', marginBottom: 2 },
  rowSub: { fontSize: 11, color: B.accent },
  empty: { fontSize: 12, color: B.text4, textAlign: 'center', marginTop: 20 },
})
