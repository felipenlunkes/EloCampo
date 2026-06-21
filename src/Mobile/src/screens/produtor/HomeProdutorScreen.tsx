import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutosPorVendedor, buscarPedidoPorIdVendedor, buscarContaPorId } from '../../services/api'
import type { ProductResponse, OrderResponse } from '../../types'
import { Tag } from '../../components/Tag'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeProdutorScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [pedidos, setPedidos] = useState<OrderResponse[]>([])
  const [avaliacao, setAvaliacao] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const accountId = session?.account?.id

  async function carregar() {
    if (!accountId) return
    await Promise.allSettled([
      buscarProdutosPorVendedor(accountId).then(setProdutos),
      buscarPedidoPorIdVendedor(accountId).then(p => setPedidos(p.content)),
      buscarContaPorId(accountId).then(a => {
        const evs = a.evaluation ?? []
        setAvaliacao(evs.length ? evs.reduce((s, e) => s + e.stars, 0) / evs.length : 0)
      }),
    ])
  }

  useFocusEffect(useCallback(() => {
    setLoading(true)
    carregar().finally(() => setLoading(false))
  }, [accountId]))

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  const ativos = produtos.filter(p => p.status === 'AVAILABLE').length
  const pendentes = pedidos.filter(p => p.orderStatus === 'PENDING').length

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.greeting}>Olá, {session?.account?.name?.split(' ')[0] ?? 'Produtor'}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>Produtor</Text></View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={G.green} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.accent2} colors={[G.accent2]} />}>
          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: G.green }]}>{ativos}</Text>
              <Text style={s.statLbl}>Produtos</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: G.green }]}>{pendentes}</Text>
              <Text style={s.statLbl}>Propostas</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#e8b84b' }]}>{avaliacao.toFixed(1)}</Text>
              <Text style={s.statLbl}>Avaliação</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Produtos', { screen: 'NovoProduto' })}>
            <Text style={s.ctaText}>+ Novo produto</Text>
          </TouchableOpacity>

          {/* Recentes */}
          <Text style={s.sectionLabel}>RECENTES</Text>
          {produtos.slice(0, 5).map((p, i) => (
            <View key={p.id} style={[s.row, i === Math.min(produtos.length, 5) - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.description}</Text>
                <Text style={s.rowSub}>{p.quantity} un · R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{p.scale}</Text>
              </View>
              <Tag variant={p.status === 'AVAILABLE' ? 'green' : 'red'} label={p.status === 'AVAILABLE' ? 'Ativo' : 'Inativo'} />
            </View>
          ))}
          {produtos.length === 0 && (
            <Text style={s.empty}>Nenhum produto ainda. Adicione seu primeiro produto!</Text>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border },
  greeting: { fontSize: 15, fontWeight: '600', color: G.text },
  roleBadge: { backgroundColor: G.bg4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  roleText: { fontSize: 10, color: G.text3 },
  body: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: G.bg3, borderRadius: 8, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '600' },
  statLbl: { fontSize: 10, color: G.text3, marginTop: 2 },
  cta: { backgroundColor: G.accent, borderWidth: 0.5, borderColor: G.accent2, borderRadius: 8, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ctaText: { color: '#d4f0d5', fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 9, color: G.text2, letterSpacing: 0.8, marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: G.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#e8f5e9', marginBottom: 2 },
  rowSub: { fontSize: 11, color: G.accent2 },
  empty: { fontSize: 12, color: G.text3, textAlign: 'center', marginTop: 20 },
})
