import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { buscarTodosProdutos, deletarProduto } from '../../services/api'
import type { ProductResponse } from '../../types'
import { PRODUCT_CATEGORY } from '../../types'
import { Tag } from '../../components/Tag'
import { A } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProdutosAdminScreen() {
  const insets = useSafeAreaInsets()
  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarTodosProdutos().then(setProdutos).finally(() => setLoading(false))
  }, [])

  const catLabel = (v: string) => PRODUCT_CATEGORY.find(c => c.v === v)?.label ?? v

  async function handleRemover(id: string) {
    Alert.alert('Remover produto', 'Tem certeza que deseja remover este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await deletarProduto(id)
            setProdutos(prev => prev.filter(p => p.id !== id))
          } catch { Alert.alert('Erro', 'Não foi possível remover') }
        },
      },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Produtos</Text>
        <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {produtos.length === 0 && <Text style={s.empty}>Nenhum produto cadastrado.</Text>}
          {produtos.map((p, i) => (
            <View key={p.id} style={[s.row, i === produtos.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.description}</Text>
                <Text style={s.rowSub}>
                  {catLabel(p.category)} · R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {p.vendorState}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Tag variant={p.status === 'AVAILABLE' ? 'green' : 'red'} label={p.status === 'AVAILABLE' ? 'Ativo' : 'Inativo'} />
                <TouchableOpacity onPress={() => handleRemover(p.id)} style={s.removeBtn}>
                  <Text style={s.removeBtnText}>Remover</Text>
                </TouchableOpacity>
              </View>
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
  removeBtn:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: '#7a2020', backgroundColor: '#3a1010' },
  removeBtnText:  { fontSize: 9, color: '#e07070' },
  empty:          { fontSize: 13, color: A.text3, textAlign: 'center', marginTop: 40 },
})
