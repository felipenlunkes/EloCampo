import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { buscarTodosPedidos } from '../../services/api'
import type { OrderResponse } from '../../types'
import { ORDER_STATUS_LABEL } from '../../types'
import { Tag } from '../../components/Tag'
import { A } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function statusVariant(s: string) {
  if (s === 'PENDING')  return 'amber' as const
  if (s === 'ACCEPTED') return 'green' as const
  return 'red' as const
}

export default function PedidosAdminScreen() {
  const insets = useSafeAreaInsets()
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarTodosPedidos().then(setPedidos).finally(() => setLoading(false))
  }, [])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Pedidos</Text>
        <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {pedidos.length === 0 && <Text style={s.empty}>Nenhum pedido encontrado.</Text>}
          {pedidos.map((p, i) => (
            <View key={p.id} style={[s.row, i === pedidos.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.products[0]?.description ?? 'Produto'}</Text>
                <Text style={s.rowSub}>
                  R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Tag variant={statusVariant(p.orderStatus)} label={ORDER_STATUS_LABEL[p.orderStatus]} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: A.bg },
  topbar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: A.border },
  title:          { fontSize: 16, fontWeight: '600', color: A.accent2 },
  adminBadge:     { backgroundColor: '#e8b84b', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText: { fontSize: 9, fontWeight: '700', color: '#1a1000' },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#2e2a1a', gap: 10 },
  rowTitle:       { fontSize: 13, fontWeight: '500', color: '#e8f5e9' },
  rowSub:         { fontSize: 11, color: A.text3, marginTop: 2 },
  empty:          { fontSize: 13, color: A.text3, textAlign: 'center', marginTop: 40 },
})
