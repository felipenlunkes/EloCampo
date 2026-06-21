import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { buscarChatsPorConta, buscarContaPorId } from '../../services/api'
import type { ChatResponse } from '../../types'

interface Props {
  theme: 'produtor' | 'comprador'
}

const THEME = {
  produtor: {
    bg: '#0d1a0e', border: '#1b341d', text: '#a8dca9', text2: '#4a7a4c',
    accent: '#4a9050', card: '#0b1f0c', cardBorder: '#1b341d',
  },
  comprador: {
    bg: '#050d14', border: '#1a3050', text: '#70aadd', text2: '#4a7090',
    accent: '#2a6b8a', card: '#0a1828', cardBorder: '#1a3050',
  },
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function ChatsListScreen({ theme }: Props) {
  const T = THEME[theme]
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()

  const [chats, setChats] = useState<ChatResponse[]>([])
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [erro, setErro] = useState(false)

  const myAccountId = session?.account?.id ?? ''

  async function carregar() {
    if (!myAccountId) return
    setLoading(true)
    setErro(false)
    try {
      const lista = await buscarChatsPorConta(myAccountId)
      lista.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      setChats(lista)

      const ids = [...new Set(lista.map(c => c.senderAccountId === myAccountId ? c.receiverAccountId : c.senderAccountId))]
      const resultados = await Promise.allSettled(ids.map(id => buscarContaPorId(id).then(a => [id, a.name] as [string, string])))
      const mapa: Record<string, string> = {}
      resultados.forEach(r => { if (r.status === 'fulfilled') mapa[r.value[0]] = r.value[1] })
      setNomes(mapa)
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { carregar() }, [myAccountId]))

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  function outroId(chat: ChatResponse) {
    return chat.senderAccountId === myAccountId ? chat.receiverAccountId : chat.senderAccountId
  }

  function ultimaMensagem(chat: ChatResponse) {
    const msgs = chat.messages ?? []
    if (msgs.length === 0) return 'Nenhuma mensagem ainda'
    const sorted = [...msgs].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    const txt = sorted[0].content ?? ''
    return txt.length > 48 ? txt.slice(0, 48) + '…' : txt
  }

  function abrirChat(chat: ChatResponse) {
    navigation.navigate('ChatDetail', { chatId: chat.id, myAccountId, theme })
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg, paddingTop: insets.top }]}>
      <View style={[s.topbar, { borderBottomColor: T.border }]}>
        <Text style={[s.title, { color: T.text }]}>Conversas</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={T.accent} size="large" />
        </View>
      ) : erro ? (
        <View style={s.center}>
          <Text style={[s.empty, { color: T.text2 }]}>Não foi possível carregar as conversas.</Text>
          <TouchableOpacity onPress={carregar} style={[s.retryBtn, { borderColor: T.accent }]}>
            <Text style={{ color: T.accent, fontSize: 13 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : chats.length === 0 ? (
        <View style={s.center}>
          <Text style={[s.empty, { color: T.text2 }]}>Nenhuma conversa encontrada.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} colors={[T.accent]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
              activeOpacity={0.8}
              onPress={() => abrirChat(item)}
            >
              <View style={[s.avatar, { backgroundColor: T.accent + '33' }]}>
                <Text style={[s.avatarText, { color: T.text }]}>
                  {(nomes[outroId(item)] ?? outroId(item)).slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.cardRow}>
                  <Text style={[s.cardName, { color: T.text }]} numberOfLines={1}>
                    {nomes[outroId(item)]?.split(' ')[0] ?? `ID …${outroId(item).slice(-8)}`}
                  </Text>
                  <Text style={[s.cardTime, { color: T.text2 }]}>
                    {formatTime(item.updatedAt)}
                  </Text>
                </View>
                <Text style={[s.cardPreview, { color: T.text2 }]} numberOfLines={1}>
                  {ultimaMensagem(item)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  topbar:      { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  title:       { fontSize: 17, fontWeight: '700' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty:       { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  retryBtn:    { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 0.5 },
  card:        { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 0.5, padding: 12 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:  { fontSize: 14, fontWeight: '700' },
  cardRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  cardName:    { fontSize: 13, fontWeight: '600', flex: 1 },
  cardTime:    { fontSize: 10, flexShrink: 0, marginLeft: 8 },
  cardPreview: { fontSize: 12 },
})
