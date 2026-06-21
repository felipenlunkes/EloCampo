import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarPedidoPorIdComprador } from '../../services/api'
import type { OrderResponse } from '../../types'
import { ORDER_STATUS_LABEL } from '../../types'
import { Tag } from '../../components/Tag'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function statusVariant(s: string) {
  if (s === 'PENDING') return 'amber' as const
  if (s === 'ACCEPTED') return 'green' as const
  return 'red' as const
}

export default function MeusPedidosScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    const id = session?.account?.id
    if (!id) return
    await buscarPedidoPorIdComprador(id).then(p => setPedidos(p.content))
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
        <Text style={s.title}>Meus Pedidos</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={B.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B.accent2} colors={[B.accent2]} />}>
          {pedidos.length === 0 && <Text style={s.empty}>Nenhum pedido ainda.</Text>}
          {pedidos.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              style={[s.row, i === pedidos.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => {
                if (p.orderStatus === 'COMPLETED') {
                  navigation.navigate('Avaliacoes', { pedido: p })
                } else {
                  navigation.navigate('ChatComprador', { pedido: p })
                }
              }}
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
  root: { flex: 1, backgroundColor: B.bg },
  topbar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  title: { fontSize: 16, fontWeight: '600', color: B.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#a8c5aa', marginBottom: 2 },
  rowSub: { fontSize: 11, color: B.accent },
  empty: { fontSize: 13, color: B.text4, textAlign: 'center', marginTop: 40 },
})
