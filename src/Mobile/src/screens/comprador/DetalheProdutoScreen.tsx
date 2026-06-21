import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { criarPedido, criarOuBuscarChat } from '../../services/api'
import type { ProductResponse } from '../../types'
import { PRODUCT_SCALE } from '../../types'
import { Input } from '../../components/Input'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DetalheProdutoScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const produto: ProductResponse = route.params?.produto

  const [quantidade, setQuantidade] = useState('')
  const [oferta, setOferta] = useState(String(produto?.price ?? ''))
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  const scaleLabel = (v: string) => PRODUCT_SCALE.find(s => s.v === v)?.label ?? v

  async function handleEnviar() {
    const buyerId = session?.account?.id
    if (!buyerId || !produto) return
    const qty = Number(quantidade)
    if (!qty || qty <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida')
      return
    }
    if (qty > produto.quantity) {
      Alert.alert('Atenção', `Quantidade máxima disponível: ${produto.quantity}`)
      return
    }
    setLoading(true)
    try {
      const pedido = await criarPedido({
        buyerAccountId: buyerId,
        sellerAccountId: produto.vendorAccountId,
        productsIds: [{ productId: produto.id, description: produto.description, quantity: qty, price: Number(oferta) }],
      })
      navigation.navigate('PropostaEnviada', { produto, pedido, oferta })
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Erro ao enviar proposta')
    } finally { setLoading(false) }
  }

  async function handleAbrirChat() {
    const buyerId = session?.account?.id
    if (!buyerId || !produto) return
    setChatLoading(true)
    try {
      const chat = await criarOuBuscarChat(buyerId, produto.vendorAccountId)
      navigation.navigate('ChatDetail', { chatId: chat.id, myAccountId: buyerId, theme: 'comprador' })
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o chat com o vendedor')
    } finally { setChatLoading(false) }
  }

  if (!produto) return null

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Produtos</Text>
          </TouchableOpacity>
          <Text style={s.title}>{produto.description}</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.location}>{produto.vendorCity} — {produto.vendorState}</Text>

          <View style={s.grid}>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Quantidade</Text>
              <Text style={s.gridVal}>{produto.quantity} un</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Preço mín.</Text>
              <Text style={s.gridVal}>R$ {Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Escala</Text>
              <Text style={[s.gridVal, { fontSize: 13 }]}>{scaleLabel(produto.scale)}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Disponível</Text>
              <Text style={[s.gridVal, { fontSize: 13 }]}>{new Date(produto.availabilityDate).toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <Input
            label={`Quantidade (máx. ${produto.quantity})`}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            bg={B.bg3}
            border={B.border}
            textColor={B.accent2}
            labelColor={B.text2}
            placeholder="Ex: 100"
          />
          <Input
            label="Oferta (R$/un)"
            value={oferta}
            onChangeText={setOferta}
            keyboardType="numeric"
            bg={B.bg3}
            border={B.border}
            textColor={B.accent2}
            labelColor={B.text2}
            placeholder="0,00"
          />
          <Input
            label="Mensagem (opcional)"
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            numberOfLines={3}
            bg={B.bg3}
            border={B.border}
            textColor={B.accent2}
            labelColor={B.text2}
            placeholder="Pagamento à vista, entrega imediata..."
          />

          <TouchableOpacity onPress={handleEnviar} disabled={loading} style={s.sendBtn}>
            <Text style={s.sendText}>{loading ? 'Enviando...' : 'Enviar proposta'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAbrirChat} disabled={chatLoading} style={[s.chatBtn, chatLoading && { opacity: 0.5 }]}>
            <Text style={s.chatText}>{chatLoading ? 'Abrindo...' : 'Falar com o vendedor'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  back: { fontSize: 12, color: B.text2, width: 70 },
  title: { fontSize: 14, fontWeight: '600', color: B.text, flex: 1, textAlign: 'center' },
  body: { padding: 16 },
  location: { fontSize: 12, color: B.text2, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  gridItem: { width: '47%', backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 9, padding: 10 },
  gridLabel: { fontSize: 11, color: B.text2, marginBottom: 4 },
  gridVal: { fontSize: 17, fontWeight: '600', color: B.accent2 },
  divider: { height: 0.5, backgroundColor: B.border, marginBottom: 16 },
  sendBtn: { backgroundColor: B.accent, borderWidth: 0.5, borderColor: B.accent2, borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sendText: { color: '#cce4f5', fontSize: 14, fontWeight: '600' },
  chatBtn: { borderWidth: 0.5, borderColor: B.accent, borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  chatText: { color: B.accent2, fontSize: 14, fontWeight: '600' },
})
