import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buscarChatPorId, enviarMensagem } from '../../services/api'
import { Input } from '../../components/Input'
import type { MessageResponse } from '../../types'

interface RouteParams {
  chatId: string
  myAccountId: string
  theme: 'produtor' | 'comprador'
}

const THEME = {
  produtor: {
    bg: '#0d1a0e', border: '#1b341d', topbarBg: '#0b1f0c',
    text: '#a8dca9', text2: '#4a7a4c',
    meBg: '#2f6433', meBorder: '#4a9050', meText: '#d4f0d5',
    outroBg: '#0b1f0c', outroBorder: '#1b341d', outroText: '#a8dca9',
    sendBg: '#2f6433', sendBorder: '#4a9050', sendText: '#d4f0d5',
    inputBg: '#111f12', inputBorder: '#2a4a2c', inputText: '#a8dca9',
  },
  comprador: {
    bg: '#050d14', border: '#1a3050', topbarBg: '#08101c',
    text: '#70aadd', text2: '#4a7090',
    meBg: '#1a4060', meBorder: '#2a6b8a', meText: '#cce4f5',
    outroBg: '#0a1828', outroBorder: '#1a3050', outroText: '#70aadd',
    sendBg: '#1a4060', sendBorder: '#2a6b8a', sendText: '#cce4f5',
    inputBg: '#0a1828', inputBorder: '#1a3050', inputText: '#70aadd',
  },
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatDetailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const { chatId, myAccountId, theme = 'produtor' } = route.params as RouteParams
  const T = THEME[theme]

  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const scrollRef = useRef<ScrollView>(null)

  const carregar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const chat = await buscarChatPorId(chatId)
      const sorted = [...(chat.messages ?? [])].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      setMessages(prev => {
        if (sorted.length > prev.length) {
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
        }
        return sorted
      })
    } catch {}
    finally { if (!silent) setLoading(false) }
  }, [chatId])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const id = setInterval(() => carregar(true), 5000)
    return () => clearInterval(id)
  }, [carregar])

  async function handleEnviar() {
    const txt = texto.trim()
    if (!txt || enviando) return
    setTexto('')
    setEnviando(true)
    try {
      const msg = await enviarMensagem(chatId, { accountId: myAccountId, content: txt })
      setMessages(prev => [...prev, msg])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    } catch { setTexto(txt) }
    finally { setEnviando(false) }
  }

  const isMinha = (msg: MessageResponse) => msg.senderAccountId === myAccountId

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[s.root, { backgroundColor: T.bg, paddingTop: insets.top }]}>
        <View style={[s.topbar, { backgroundColor: T.topbarBg, borderBottomColor: T.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 60 }}>
            <Text style={[s.back, { color: T.text2 }]}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={[s.topbarTitle, { color: T.text }]}>Chat</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={T.sendBg} size="large" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.msgs}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(true); setRefreshing(false) }} tintColor={T.sendBg} colors={[T.sendBg]} />}
          >
            {messages.length === 0 && (
              <Text style={[s.emptyMsg, { color: T.text2 }]}>
                Nenhuma mensagem ainda. Inicie a conversa!
              </Text>
            )}
            {messages.map(msg => {
              const minha = isMinha(msg)
              return (
                <View key={msg.id} style={[s.bubbleWrap, minha ? s.wrapRight : s.wrapLeft]}>
                  <View style={[
                    s.bubble,
                    minha
                      ? { backgroundColor: T.meBg, borderColor: T.meBorder }
                      : { backgroundColor: T.outroBg, borderColor: T.outroBorder },
                  ]}>
                    <Text style={[s.bubbleText, { color: minha ? T.meText : T.outroText }]}>
                      {msg.content}
                    </Text>
                    <Text style={[s.bubbleTime, { color: minha ? T.meText + '99' : T.text2 }]}>
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        )}

        <View style={[s.inputRow, { borderTopColor: T.border, paddingBottom: insets.bottom + 8 }]}>
          <View style={{ flex: 1 }}>
            <Input
              value={texto}
              onChangeText={setTexto}
              placeholder="Mensagem..."
              bg={T.inputBg}
              border={T.inputBorder}
              textColor={T.inputText}
              style={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            onPress={handleEnviar}
            disabled={enviando || !texto.trim()}
            style={[
              s.sendBtn,
              { backgroundColor: T.sendBg, borderColor: T.sendBorder },
              (enviando || !texto.trim()) && { opacity: 0.45 },
            ]}
          >
            <Text style={[s.sendText, { color: T.sendText }]}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  topbar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  back:       { fontSize: 12 },
  topbarTitle:{ fontSize: 14, fontWeight: '600' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgs:       { padding: 16, gap: 8, flexGrow: 1 },
  emptyMsg:   { fontSize: 13, textAlign: 'center', marginTop: 32, lineHeight: 20 },
  bubbleWrap: { flexDirection: 'row' },
  wrapLeft:   { justifyContent: 'flex-start' },
  wrapRight:  { justifyContent: 'flex-end' },
  bubble:     { maxWidth: '78%', borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 8, borderBottomRightRadius: 3 },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  bubbleTime: { fontSize: 9, marginTop: 4, textAlign: 'right' },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 0.5 },
  sendBtn:    { borderWidth: 0.5, borderRadius: 8, paddingHorizontal: 14, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendText:   { fontSize: 13, fontWeight: '600' },
})
