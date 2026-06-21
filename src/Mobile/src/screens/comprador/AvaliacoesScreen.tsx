import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { criarAvaliacaoProduto, criarAvaliacaoConta } from '../../services/api'
import type { OrderResponse } from '../../types'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import { B } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={{ fontSize: 28, color: n <= value ? '#e8b84b' : B.border }}>{n <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function AvaliacoesScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const pedido: OrderResponse = route.params?.pedido

  const [starsProduto, setStarsProduto] = useState(5)
  const [comentarioProduto, setComentarioProduto] = useState('')
  const [starsVendedor, setStarsVendedor] = useState(5)
  const [comentarioVendedor, setComentarioVendedor] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEnviar() {
    const accountId = session?.account?.id
    if (!accountId || !pedido) return
    setLoading(true)
    try {
      const promises = [] as Promise<unknown>[]
      if (pedido.products[0]) {
        promises.push(criarAvaliacaoProduto(pedido.products[0].productId, {
          stars: starsProduto,
          content: comentarioProduto,
          reviewerAccountId: accountId,
        }))
      }
      promises.push(criarAvaliacaoConta(pedido.sellerAccountId, {
        id: '',
        stars: starsVendedor,
        content: comentarioVendedor,
        reviewerAccountId: accountId,
        productId: pedido.products[0]?.productId ?? '',
      }))

      await Promise.all(promises)
      navigation.navigate('AvaliacaoEnviada')
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar as avaliações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Pedidos</Text>
        </TouchableOpacity>
        <Text style={s.title}>Avaliar</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Avaliar produto</Text>
          <Stars value={starsProduto} onChange={setStarsProduto} />
          <Input
            value={comentarioProduto}
            onChangeText={setComentarioProduto}
            placeholder="Deixe seu comentário..."
            multiline
            bg={B.bg3}
            border={B.border}
            textColor={B.accent2}
            labelColor={B.text2}
          />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Avaliar vendedor</Text>
          <Stars value={starsVendedor} onChange={setStarsVendedor} />
          <Input
            value={comentarioVendedor}
            onChangeText={setComentarioVendedor}
            placeholder="Deixe seu comentário..."
            multiline
            bg={B.bg3}
            border={B.border}
            textColor={B.accent2}
            labelColor={B.text2}
          />
        </View>

        <Btn
          label="Enviar avaliações"
          onPress={handleEnviar}
          loading={loading}
          bg={B.accent}
          border={B.accent2}
          color="#cce4f5"
        />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  back: { fontSize: 12, color: B.text2, width: 70 },
  title: { fontSize: 15, fontWeight: '600', color: B.text },
  body: { padding: 16 },
  card: { backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 10, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: B.accent2, marginBottom: 10 },
})
