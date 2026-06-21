import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { criarOuBuscarChat, buscarContaPorId } from '../../services/api'
import type { OrderResponse } from '../../types'
import { ORDER_STATUS_LABEL } from '../../types'
import { Tag } from '../../components/Tag'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function statusVariant(s: string): 'amber' | 'green' | 'red' {
  if (s === 'PENDING') return 'amber'
  if (s === 'ACCEPTED') return 'green'
  return 'red'
}

export default function ChatCompradorScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()

  const pedido: OrderResponse = route.params?.pedido
  const [nomeVendedor, setNomeVendedor] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (!pedido?.sellerAccountId) return
    buscarContaPorId(pedido.sellerAccountId)
      .then(a => setNomeVendedor(a.name))
      .catch(() => {})
  }, [pedido?.sellerAccountId])

  async function abrirChat() {
    const buyerId = session?.account?.id
    if (!buyerId || !pedido) return
    setChatLoading(true)
    try {
      const chat = await criarOuBuscarChat(buyerId, pedido.sellerAccountId)
      navigation.navigate('ChatDetail', { chatId: chat.id, myAccountId: buyerId, theme: 'comprador' })
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o chat com o vendedor')
    } finally { setChatLoading(false) }
  }

  if (!pedido) return null

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 70 }}>
          <Text style={s.back}>← Pedidos</Text>
        </TouchableOpacity>
        <Text style={s.title}>Detalhe do Pedido</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Cabeçalho */}
        <View style={s.headerCard}>
          <View style={s.headerRow}>
            <Text style={s.orderId}>#{pedido.id.slice(-8).toUpperCase()}</Text>
            <Tag variant={statusVariant(pedido.orderStatus)} label={ORDER_STATUS_LABEL[pedido.orderStatus]} />
          </View>
          {nomeVendedor ? (
            <Text style={s.vendedor}>Vendedor: {nomeVendedor}</Text>
          ) : null}
          <Text style={s.total}>
            Total: R$ {Number(pedido.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Itens */}
        <Text style={s.sectionLabel}>ITENS DO PEDIDO</Text>
        <View style={s.card}>
          {pedido.products.map((item, i) => (
            <View key={i} style={[s.itemRow, i < pedido.products.length - 1 && s.itemBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.description}</Text>
                <Text style={s.itemSub}>{item.quantity} un</Text>
              </View>
              <Text style={s.itemPrice}>
                R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        {/* Chat */}
        <Text style={s.sectionLabel}>COMUNICAÇÃO</Text>
        <TouchableOpacity
          onPress={abrirChat}
          disabled={chatLoading}
          style={[s.chatBtn, chatLoading && { opacity: 0.5 }]}
        >
          {chatLoading
            ? <ActivityIndicator color={B.accent2} size="small" />
            : <Text style={s.chatText}>Abrir chat com o vendedor</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: B.bg },
  topbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  back:         { fontSize: 12, color: B.text2 },
  title:        { fontSize: 14, fontWeight: '600', color: B.text },
  body:         { padding: 16, gap: 10, paddingBottom: 40 },
  headerCard:   { backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 12, padding: 14 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderId:      { fontSize: 12, fontFamily: 'monospace', color: B.text2 },
  vendedor:     { fontSize: 12, color: B.text2, marginBottom: 4 },
  total:        { fontSize: 18, fontWeight: '700', color: B.text },
  sectionLabel: { fontSize: 9, fontWeight: '700', color: B.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  card:         { backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 12, overflow: 'hidden' },
  itemRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  itemBorder:   { borderBottomWidth: 0.5, borderBottomColor: B.border },
  itemName:     { fontSize: 13, fontWeight: '500', color: B.text, marginBottom: 2 },
  itemSub:      { fontSize: 11, color: B.text2 },
  itemPrice:    { fontSize: 13, fontWeight: '600', color: B.accent2 },
  chatBtn:      { borderWidth: 0.5, borderColor: B.accent, borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center' },
  chatText:     { color: B.accent2, fontSize: 14, fontWeight: '600' },
})
