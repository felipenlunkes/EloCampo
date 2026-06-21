import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { buscarProdutos } from '../../services/api'
import type { ProductResponse } from '../../types'
import { PRODUCT_CATEGORY } from '../../types'
import { Input } from '../../components/Input'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BuscarProdutosScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [produtos, setProdutos] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDesc, setFiltroDesc] = useState('')

  useEffect(() => { carregarProdutos() }, [])

  async function carregarProdutos(silent = false) {
    if (!silent) setLoading(true)
    try {
      const data = await buscarProdutos({
        description: filtroDesc || undefined,
        vendorState: filtroEstado || undefined,
      })
      setProdutos(data.filter(p => p.status === 'AVAILABLE'))
    } finally { if (!silent) setLoading(false) }
  }

  async function onRefresh() {
    setRefreshing(true)
    await carregarProdutos(true)
    setRefreshing(false)
  }

  const catLabel = (v: string) => PRODUCT_CATEGORY.find(c => c.v === v)?.label ?? v

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Produtos</Text>
      </View>

      <View style={s.filters}>
        <View style={{ flex: 1 }}>
          <Input
            value={filtroDesc} onChangeText={setFiltroDesc}
            placeholder="Buscar produto..." bg={B.bg3} border={B.border}
            textColor={B.accent2} style={{ marginBottom: 0 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            value={filtroEstado} onChangeText={setFiltroEstado}
            placeholder="Estado (UF)" autoCapitalize="characters"
            bg={B.bg3} border={B.border} textColor={B.accent2} style={{ marginBottom: 0 }}
          />
        </View>
        <TouchableOpacity onPress={carregarProdutos} style={s.searchBtn}>
          <Text style={{ color: '#cce4f5', fontSize: 12, fontWeight: '600' }}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={B.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B.accent2} colors={[B.accent2]} />}>
          {produtos.length === 0 && <Text style={s.empty}>Nenhum produto encontrado.</Text>}
          {produtos.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              style={[s.row, i === produtos.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('DetalheProduto', { produto: p })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.description} — {p.vendorState}</Text>
                <Text style={s.rowSub}>{p.quantity} un · {catLabel(p.category)}</Text>
              </View>
              <Text style={s.price}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
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
  filters: { flexDirection: 'row', gap: 6, padding: 12, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: B.border },
  searchBtn: { backgroundColor: B.accent, borderWidth: 0.5, borderColor: B.accent2, borderRadius: 7, paddingHorizontal: 10, height: 38, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border, gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: '#a8c5aa', marginBottom: 2 },
  rowSub: { fontSize: 11, color: B.accent },
  price: { fontSize: 14, fontWeight: '600', color: B.accent2 },
  empty: { fontSize: 13, color: B.text4, textAlign: 'center', marginTop: 40 },
})
