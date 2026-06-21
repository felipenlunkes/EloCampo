import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarStatusPedido, criarOuBuscarChat, buscarContaPorId } from '../../services/api'
import type { OrderResponse } from '../../types'
import { OrderStatusEnum, ORDER_STATUS_LABEL } from '../../types'
import { Tag } from '../../components/Tag'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function statusVariant(s: string): 'amber' | 'green' | 'red' {
  if (s === 'PENDING') return 'amber'
  if (s === 'ACCEPTED') return 'green'
  return 'red'
}

export default function DetalheVendaScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()

  const [pedido, setPedido] = useState<OrderResponse>(route.params?.pedido)
  const [nomeComprador, setNomeComprador] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [confirmRecusarVisible, setConfirmRecusarVisible] = useState(false)

  useEffect(() => {
    if (!pedido?.buyerAccountId) return
    buscarContaPorId(pedido.buyerAccountId)
      .then(a => setNomeComprador(a.name))
      .catch(() => {})
  }, [pedido?.buyerAccountId])

  async function handleAceitar() {
    setActionLoading(true)
    try {
      const atualizado = await atualizarStatusPedido(pedido.id, { status: OrderStatusEnum.ACCEPTED })
      setPedido(atualizado)
    } catch {
      Alert.alert('Erro', 'Não foi possível aceitar o pedido')
    } finally { setActionLoading(false) }
  }

  async function confirmarRecusa() {
    setActionLoading(true)
    try {
      const atualizado = await atualizarStatusPedido(pedido.id, { status: OrderStatusEnum.CANCELLED })
      setPedido(atualizado)
      setConfirmRecusarVisible(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível recusar a proposta')
    } finally { setActionLoading(false) }
  }

  async function handleFinalizar() {
    Alert.alert('Finalizar venda', 'Confirmar finalização desta venda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar', onPress: async () => {
          setActionLoading(true)
          try {
            const atualizado = await atualizarStatusPedido(pedido.id, { status: OrderStatusEnum.COMPLETED })
            setPedido(atualizado)
          } catch {
            Alert.alert('Erro', 'Não foi possível finalizar a venda')
          } finally { setActionLoading(false) }
        },
      },
    ])
  }

  async function abrirChat() {
    const sellerId = session?.account?.id
    if (!sellerId) return
    setChatLoading(true)
    try {
      const chat = await criarOuBuscarChat(sellerId, pedido.buyerAccountId)
      navigation.navigate('ChatDetail', { chatId: chat.id, myAccountId: sellerId, theme: 'produtor' })
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o chat')
    } finally { setChatLoading(false) }
  }

  if (!pedido) return null

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Modal
        visible={confirmRecusarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRecusarVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Recusar proposta</Text>
            <Text style={s.modalMsg}>
              Tem certeza que deseja recusar esta proposta? Essa ação não pode ser desfeita.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmRecusarVisible(false)}
                disabled={actionLoading}
                style={[s.modalBtnGhost, actionLoading && { opacity: 0.5 }]}
              >
                <Text style={s.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarRecusa}
                disabled={actionLoading}
                style={[s.modalBtnDanger, actionLoading && { opacity: 0.5 }]}
              >
                {actionLoading
                  ? <ActivityIndicator color="#e07070" size="small" />
                  : <Text style={s.modalBtnDangerText}>Recusar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={s.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 70 }}>
          <Text style={s.back}>← Vendas</Text>
        </TouchableOpacity>
        <Text style={s.title}>Detalhe da Venda</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Cabeçalho */}
        <View style={s.headerCard}>
          <View style={s.headerRow}>
            <Text style={s.orderId}>#{pedido.id.slice(-8).toUpperCase()}</Text>
            <Tag variant={statusVariant(pedido.orderStatus)} label={ORDER_STATUS_LABEL[pedido.orderStatus]} />
          </View>
          {nomeComprador ? (
            <Text style={s.comprador}>Comprador: {nomeComprador}</Text>
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

        {/* Ações por status */}
        {pedido.orderStatus === 'PENDING' && (
          <>
            <Text style={s.sectionLabel}>AÇÕES</Text>
            <TouchableOpacity
              onPress={handleAceitar}
              disabled={actionLoading}
              style={[s.acceptBtn, actionLoading && { opacity: 0.5 }]}
            >
              {actionLoading
                ? <ActivityIndicator color="#d4f0d5" size="small" />
                : <Text style={s.acceptText}>Aceitar proposta</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmRecusarVisible(true)}
              disabled={actionLoading}
              style={[s.rejectBtn, actionLoading && { opacity: 0.5 }]}
            >
              <Text style={s.rejectText}>Recusar proposta</Text>
            </TouchableOpacity>
          </>
        )}

        {pedido.orderStatus === 'ACCEPTED' && (
          <>
            <Text style={s.sectionLabel}>AÇÕES</Text>
            <TouchableOpacity
              onPress={handleFinalizar}
              disabled={actionLoading}
              style={[s.finalizeBtn, actionLoading && { opacity: 0.5 }]}
            >
              {actionLoading
                ? <ActivityIndicator color="#cce4f5" size="small" />
                : <Text style={s.finalizeText}>Finalizar venda</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Chat */}
        <Text style={s.sectionLabel}>COMUNICAÇÃO</Text>
        <TouchableOpacity
          onPress={abrirChat}
          disabled={chatLoading}
          style={[s.chatBtn, chatLoading && { opacity: 0.5 }]}
        >
          {chatLoading
            ? <ActivityIndicator color={G.accent2} size="small" />
            : <Text style={s.chatText}>Abrir chat com comprador</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: G.bg },
  topbar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border },
  back:               { fontSize: 12, color: G.text2 },
  title:              { fontSize: 14, fontWeight: '600', color: G.text },
  body:               { padding: 16, gap: 10, paddingBottom: 40 },
  headerCard:         { backgroundColor: G.bg3, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14 },
  headerRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderId:            { fontSize: 12, fontFamily: 'monospace', color: G.text2 },
  comprador:          { fontSize: 12, color: G.text2, marginBottom: 4 },
  total:              { fontSize: 18, fontWeight: '700', color: G.text },
  sectionLabel:       { fontSize: 9, fontWeight: '700', color: G.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  card:               { backgroundColor: G.bg3, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, overflow: 'hidden' },
  itemRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  itemBorder:         { borderBottomWidth: 0.5, borderBottomColor: G.border },
  itemName:           { fontSize: 13, fontWeight: '500', color: G.text, marginBottom: 2 },
  itemSub:            { fontSize: 11, color: G.text2 },
  itemPrice:          { fontSize: 13, fontWeight: '600', color: G.accent2 },
  acceptBtn:          { backgroundColor: '#2f6433', borderWidth: 0.5, borderColor: '#4a9050', borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center' },
  acceptText:         { color: '#d4f0d5', fontSize: 14, fontWeight: '600' },
  finalizeBtn:        { backgroundColor: '#1a4060', borderWidth: 0.5, borderColor: '#2a6b8a', borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center' },
  finalizeText:       { color: '#cce4f5', fontSize: 14, fontWeight: '600' },
  rejectBtn:          { backgroundColor: '#3a1010', borderWidth: 0.5, borderColor: '#7a2020', borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  rejectText:         { color: '#e07070', fontSize: 14, fontWeight: '600' },
  chatBtn:            { borderWidth: 0.5, borderColor: G.accent, borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center' },
  chatText:           { color: G.accent2, fontSize: 14, fontWeight: '600' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox:           { backgroundColor: G.bg3, borderWidth: 0.5, borderColor: '#7a2020', borderRadius: 16, padding: 24, width: '100%' },
  modalTitle:         { fontSize: 16, fontWeight: '700', color: G.text, marginBottom: 10 },
  modalMsg:           { fontSize: 13, color: G.text2, lineHeight: 20, marginBottom: 24 },
  modalActions:       { flexDirection: 'row', gap: 10 },
  modalBtnGhost:      { flex: 1, height: 42, borderRadius: 10, borderWidth: 0.5, borderColor: G.border2, alignItems: 'center', justifyContent: 'center' },
  modalBtnGhostText:  { color: G.text2, fontSize: 14, fontWeight: '600' },
  modalBtnDanger:     { flex: 1, height: 42, borderRadius: 10, borderWidth: 0.5, borderColor: '#7a2020', backgroundColor: '#3a1010', alignItems: 'center', justifyContent: 'center' },
  modalBtnDangerText: { color: '#e07070', fontSize: 14, fontWeight: '600' },
})
