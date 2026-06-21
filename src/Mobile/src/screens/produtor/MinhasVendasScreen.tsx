import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarPedidoPorIdVendedor } from '../../services/api'
import type { OrderResponse } from '../../types'
import { ORDER_STATUS_LABEL } from '../../types'
import { Tag } from '../../components/Tag'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function statusVariant(s: string) {
  if (s === 'PENDING') return 'amber' as const
  if (s === 'ACCEPTED') return 'green' as const
  return 'red' as const
}

export default function MinhasVendasScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    const id = session?.account?.id
    if (!id) return
    await buscarPedidoPorIdVendedor(id).then(p => setPedidos(p.content))
  }

  useFocusEffect(useCallback(() => {
    setLoading(true)
    carregar().finally(() => setLoading(false))
  }, [session?.account?.id]))

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Minhas Vendas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PropostasRecebidas')}>
          <Text style={s.link}>Propostas →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={G.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.accent2} colors={[G.accent2]} />}>
          {pedidos.length === 0 && <Text style={s.empty}>Nenhuma venda ainda.</Text>}
          {pedidos.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              style={[s.row, i === pedidos.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('DetalheVenda', { pedido: p })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>#{p.id.slice(-6).toUpperCase()} · {p.products[0]?.description ?? 'Produto'}</Text>
                <Text style={s.rowSub}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <Tag variant={statusVariant(p.orderStatus)} label={ORDER_STATUS_LABEL[p.orderStatus]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border },
  title: { fontSize: 16, fontWeight: '600', color: G.text },
  link: { fontSize: 12, color: G.accent2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#e8f5e9', marginBottom: 2 },
  rowSub: { fontSize: 11, color: G.accent2 },
  empty: { fontSize: 13, color: G.text3, textAlign: 'center', marginTop: 40 },
})
