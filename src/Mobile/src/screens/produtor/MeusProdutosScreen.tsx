import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { buscarProdutosPorVendedor, ativarProduto, desativarProduto, deletarProduto } from '../../services/api'
import type { ProductResponse } from '../../types'
import { PRODUCT_CATEGORY, PRODUCT_SCALE } from '../../types'
import { Tag } from '../../components/Tag'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function MeusProdutosScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const vendorId = session?.account?.id

  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    if (!vendorId) return
    await buscarProdutosPorVendedor(vendorId).then(setProdutos)
  }

  useFocusEffect(useCallback(() => {
    setLoading(true)
    carregar().finally(() => setLoading(false))
  }, [vendorId]))

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  async function handleToggle(p: ProductResponse) {
    try {
      if (p.status === 'AVAILABLE') await desativarProduto(p.id)
      else await ativarProduto(p.id)
      setProdutos(prev => prev.map(x => x.id === p.id ? { ...x, status: p.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE' } : x))
    } catch { Alert.alert('Erro', 'Não foi possível alterar o status') }
  }

  async function handleDeletar(id: string) {
    Alert.alert('Remover produto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try {
          await deletarProduto(id)
          setProdutos(prev => prev.filter(p => p.id !== id))
        } catch { Alert.alert('Erro', 'Não foi possível remover') }
      }},
    ])
  }

  const catLabel = (v: string) => PRODUCT_CATEGORY.find(c => c.v === v)?.label ?? v
  const scaleLabel = (v: string) => PRODUCT_SCALE.find(s => s.v === v)?.label ?? v

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Meus produtos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NovoProduto')}>
          <Text style={s.addBtn}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={G.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.accent2} colors={[G.accent2]} />}>
          {produtos.length === 0 && (
            <Text style={s.empty}>Nenhum produto cadastrado.</Text>
          )}
          {produtos.map((p, i) => (
            <View key={p.id} style={[s.row, i === produtos.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.description}</Text>
                <Text style={s.rowSub}>{catLabel(p.category)} · {p.quantity} {scaleLabel(p.scale)} · R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Tag variant={p.status === 'AVAILABLE' ? 'green' : 'red'} label={p.status === 'AVAILABLE' ? 'Ativo' : 'Inativo'} />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => handleToggle(p)} style={s.actionBtn}>
                    <Text style={{ fontSize: 9, color: p.status === 'AVAILABLE' ? '#e07070' : '#6dbf74' }}>
                      {p.status === 'AVAILABLE' ? 'Desativar' : 'Ativar'}
                    </Text>
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
  title: { fontSize: 16, fontWeight: '600', color: G.text },
  addBtn: { fontSize: 13, color: G.accent2, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#e8f5e9', marginBottom: 2 },
  rowSub: { fontSize: 11, color: G.accent2 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#264d29', backgroundColor: '#0b1f0c' },
  empty: { fontSize: 13, color: G.text3, textAlign: 'center', marginTop: 40 },
})
