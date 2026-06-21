import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarPedidoPorIdVendedor, atualizarStatusPedido } from '../../services/api'
import type { OrderResponse } from '../../types'
import { OrderStatusEnum } from '../../types'
import { Tag } from '../../components/Tag'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PropostasRecebidasScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    const id = session?.account?.id
    if (!id) return
    await buscarPedidoPorIdVendedor(id)
      .then(p => setPedidos(p.content.filter(o => o.orderStatus === 'PENDING')))
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

  async function handleAceitar(id: string) {
    try {
      await atualizarStatusPedido(id, { status: OrderStatusEnum.ACCEPTED })
      setPedidos(prev => prev.filter(p => p.id !== id))
      Alert.alert('Sucesso', 'Proposta aceita!')
    } catch { Alert.alert('Erro', 'Não foi possível aceitar') }
  }

  async function handleRecusar(id: string) {
    try {
      await atualizarStatusPedido(id, { status: OrderStatusEnum.COMPLETED })
      setPedidos(prev => prev.filter(p => p.id !== id))
    } catch { Alert.alert('Erro', 'Não foi possível recusar') }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Vendas</Text>
        </TouchableOpacity>
        <Text style={s.title}>Propostas</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={G.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.accent2} colors={[G.accent2]} />}>
          {pedidos.length === 0 && <Text style={s.empty}>Nenhuma proposta pendente.</Text>}
          {pedidos.map((p, i) => (
            <View key={p.id} style={[s.row, i === pedidos.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.products[0]?.description ?? 'Produto'}</Text>
                <Text style={s.rowSub}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Tag variant="amber" label="Pendente" />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => handleAceitar(p.id)} style={s.acceptBtn}>
                    <Text style={{ fontSize: 9, color: '#6dbf74' }}>Aceitar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRecusar(p.id)} style={s.rejectBtn}>
                    <Text style={{ fontSize: 9, color: '#e07070' }}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border },
  back: { fontSize: 12, color: G.text2, width: 70 },
  title: { fontSize: 15, fontWeight: '600', color: G.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#e8f5e9', marginBottom: 2 },
  rowSub: { fontSize: 11, color: G.accent2 },
  acceptBtn: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: '#264d29', backgroundColor: '#122114' },
  rejectBtn: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: '#7a2020', backgroundColor: '#3a1010' },
  empty: { fontSize: 13, color: G.text3, textAlign: 'center', marginTop: 40 },
})
