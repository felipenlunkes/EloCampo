import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import { criarProduto } from '../../services/api'
import { PRODUCT_CATEGORY, PRODUCT_SCALE } from '../../types'
import type { ProductCategory, ProductScale } from '../../types'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import { G } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function NovoProdutoScreen() {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const vendorId = session?.account?.id

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [scale, setScale] = useState<ProductScale | ''>('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function validar() {
    if (!description) return 'Informe a descrição do produto'
    if (!category) return 'Selecione uma categoria'
    if (!scale) return 'Selecione a escala'
    if (!quantity || Number(quantity) <= 0) return 'Informe uma quantidade válida'
    if (!price || Number(price) <= 0) return 'Informe um preço válido'
    return null
  }

  async function handlePublicar() {
    const erro = validar()
    if (erro) { Alert.alert('Atenção', erro); return }
    if (!vendorId) { Alert.alert('Erro', 'Conta não encontrada'); return }
    setLoading(true)
    try {
      await criarProduto({
        vendorAccountId: vendorId,
        description,
        category: category as ProductCategory,
        scale: scale as ProductScale,
        quantity: Number(quantity),
        price: Number(price),
        availabilityDate: Date.now(),
      })
      setSucesso(true)
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Erro ao publicar produto')
    } finally { setLoading(false) }
  }

  function handleFecharSucesso() {
    setSucesso(false)
    navigation.navigate('MeusProdutos')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Modal visible={sucesso} transparent animationType="fade" onRequestClose={handleFecharSucesso}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalIcon}>✓</Text>
            <Text style={s.modalTitle}>Produto publicado!</Text>
            <Text style={s.modalMsg}>Seu produto foi cadastrado com sucesso e já está visível para compradores.</Text>
            <TouchableOpacity onPress={handleFecharSucesso} style={s.modalBtn}>
              <Text style={s.modalBtnText}>Ver meus produtos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Produtos</Text>
          </TouchableOpacity>
          <Text style={s.title}>Novo Produto</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.lbl}>CATEGORIA</Text>
          <View style={s.chips}>
            {PRODUCT_CATEGORY.map(c => (
              <TouchableOpacity
                key={c.v}
                onPress={() => setCategory(c.v)}
                style={[s.chip, category === c.v && s.chipActive]}
              >
                <Text style={[s.chipText, category === c.v && s.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Soja em grão, safra 2025"
          />

          <Text style={s.lbl}>ESCALA</Text>
          <View style={[s.chips, { marginBottom: 14 }]}>
            {PRODUCT_SCALE.map(sc => (
              <TouchableOpacity
                key={sc.v}
                onPress={() => setScale(sc.v)}
                style={[s.chip, scale === sc.v && s.chipActive]}
              >
                <Text style={[s.chipText, scale === sc.v && s.chipTextActive]}>{sc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Preço (R$)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0,00" />
            </View>
          </View>

          <View style={s.docsBox}>
            <Text style={s.docsTitle}>Documentos necessários</Text>
            <Text style={s.docsSub}>CAR, nota fiscal e laudo técnico</Text>
          </View>

          <Btn label="Publicar produto" onPress={handlePublicar} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: G.border },
  back: { fontSize: 12, color: G.text2, width: 80 },
  title: { fontSize: 15, fontWeight: '600', color: G.text },
  body: { padding: 16 },
  lbl: { fontSize: 9, fontWeight: '600', color: G.text2, letterSpacing: 0.6, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 0.5, borderColor: G.border3, backgroundColor: G.bg2 },
  chipActive: { borderWidth: 1.5, borderColor: G.accent2, backgroundColor: G.border },
  chipText: { fontSize: 11, color: G.accent2 },
  chipTextActive: { color: G.text },
  docsBox:      { backgroundColor: '#2e2410', borderWidth: 0.5, borderColor: '#b8882b', borderRadius: 9, padding: 12, marginTop: 8 },
  docsTitle:    { fontSize: 12, fontWeight: '600', color: '#e8b84b', marginBottom: 4 },
  docsSub:      { fontSize: 11, color: '#c8942b' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBox:     { backgroundColor: G.bg3, borderWidth: 0.5, borderColor: G.accent2, borderRadius: 16, padding: 28, alignItems: 'center', width: '100%' },
  modalIcon:    { fontSize: 40, color: G.accent2, marginBottom: 12 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: G.text, marginBottom: 8, textAlign: 'center' },
  modalMsg:     { fontSize: 13, color: G.text2, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtn:     { backgroundColor: G.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  modalBtnText: { color: '#d4f0d5', fontSize: 14, fontWeight: '600' },
})
