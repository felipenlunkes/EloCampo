import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Image, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../contexts/AuthContext'
import {
  buscarContaPorUsuario, atualizarConta, buscarArquivosPorEntidade,
  uploadArquivo, deletarArquivo,
} from '../../services/api'
import { Input } from '../../components/Input'
import { Btn } from '../../components/Btn'
import { B } from '../../theme/colors'
import { maskCpf, maskCnpj, maskCep, unmask } from '../../utils/masks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { AccountResponse, FileUploadResponse } from '../../types'

export default function PerfilCompradorScreen() {
  const { session, setSession, logout } = useAuth()
  const insets = useSafeAreaInsets()

  const [conta, setConta] = useState<AccountResponse | null>(null)
  const [fotoPerfil, setFotoPerfil] = useState<FileUploadResponse | null>(null)
  const [form, setForm] = useState({
    name: '', businessName: '', cpf: '', cnpj: '',
    ddi: '55', ddd: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingFoto, setLoadingFoto] = useState(false)

  useEffect(() => {
    if (!session?.userId) return
    buscarContaPorUsuario(session.userId).then(c => {
      setConta(c)
      buscarArquivosPorEntidade('PROFILE', c.id)
        .then(imgs => setFotoPerfil(imgs[0] ?? null))
        .catch(() => {})
      setForm({
        name:         c.name ?? '',
        businessName: c.businessName ?? '',
        cpf:          maskCpf(c.cpf ?? ''),
        cnpj:         maskCnpj(c.cnpj ?? ''),
        ddi:          String(c.phone?.countryCode ?? '55'),
        ddd:          String(c.phone?.stateCode ?? ''),
        telefone:     c.phone?.number ?? '',
        cep:          maskCep(c.address?.postalCode ?? ''),
        rua:          c.address?.street ?? '',
        numero:       c.address?.number ?? '',
        complemento:  c.address?.complement ?? '',
        bairro:       c.address?.district ?? '',
        cidade:       c.address?.city ?? '',
        estado:       c.address?.state ?? '',
      })
    }).catch(() => {})
  }, [session?.userId])

  const initials = (form.name || session?.email || '?')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  function set(key: keyof typeof form) {
    return (v: string) => setForm(f => ({ ...f, [key]: v }))
  }

  async function handleTrocarFoto() {
    if (!conta) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto de perfil.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setLoadingFoto(true)
    try {
      if (fotoPerfil) await deletarArquivo(fotoPerfil.id).catch(() => {})
      const uploaded = await uploadArquivo('PROFILE', conta.id, {
        uri: asset.uri,
        name: asset.fileName ?? 'foto.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      })
      setFotoPerfil(uploaded)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Não foi possível enviar a foto.'
      Alert.alert('Erro ao enviar foto', msg)
    } finally {
      setLoadingFoto(false)
    }
  }

  async function handleSalvar() {
    if (!conta || !session?.userId) return
    setLoading(true)
    try {
      const atualizada = await atualizarConta(conta.id, {
        userId:       session.userId,
        name:         form.name,
        businessName: form.businessName || undefined,
        cpf:          unmask(form.cpf) || undefined,
        cnpj:         unmask(form.cnpj) || undefined,
        birthdayDate: conta.birthdayDate,
        phone:   { countryCode: parseInt(form.ddi) || 55, stateCode: parseInt(form.ddd) || 0, number: form.telefone },
        address: { postalCode: unmask(form.cep), street: form.rua, number: form.numero, complement: form.complemento, district: form.bairro, city: form.cidade, state: form.estado },
        role:    conta.role,
      })
      setConta(atualizada)
      if (session) await setSession({ ...session, account: atualizada })
      Alert.alert('Sucesso', 'Perfil atualizado!')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message ?? 'Não foi possível salvar')
    } finally { setLoading(false) }
  }


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topbar}>
          <Text style={s.title}>Perfil do comprador</Text>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={s.avatarRow}>
            <TouchableOpacity onPress={handleTrocarFoto} testID="avatar-btn" style={s.avatarWrap} activeOpacity={0.75}>
              {loadingFoto ? (
                <View style={s.avatar}><ActivityIndicator color="#cce4f5" /></View>
              ) : fotoPerfil ? (
                <Image source={{ uri: fotoPerfil.secureUrl }} style={s.avatarImg} />
              ) : (
                <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
              )}
              <View style={s.avatarBadge}>
                <Ionicons name="camera" size={10} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{form.name || session?.email}</Text>
              {conta?.businessName ? <Text style={s.userBiz}>{conta.businessName}</Text> : null}
              <Text style={s.userRole}>Comprador(a)</Text>
            </View>
          </View>

          {/* Dados do comprodor */}
          <Text style={s.sectionTitle}>Dados do comprador</Text>
          <Input label="Nome / Responsável" value={form.name} onChangeText={set('name')} autoCapitalize="words"
            bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
          <Input label="Razão social" value={form.businessName} onChangeText={set('businessName')} autoCapitalize="words"
            bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
          {(() => {
            const cpfPreenchido = unmask(form.cpf).length > 0
            const cnpjPreenchido = unmask(form.cnpj).length > 0
            return (
              <View style={s.row}>
                <View style={{ flex: 1, opacity: cnpjPreenchido ? 0.35 : 1 }}>
                  <Input
                    label="CPF"
                    value={form.cpf}
                    onChangeText={v => setForm(f => ({ ...f, cpf: maskCpf(v) }))}
                    keyboardType="numeric"
                    placeholder="000.000.000-00"
                    editable={!cnpjPreenchido}
                    bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2}
                  />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1, opacity: cpfPreenchido ? 0.35 : 1 }}>
                  <Input
                    label="CNPJ"
                    value={form.cnpj}
                    onChangeText={v => setForm(f => ({ ...f, cnpj: maskCnpj(v) }))}
                    keyboardType="numeric"
                    placeholder="00.000.000/0001-00"
                    editable={!cpfPreenchido}
                    bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2}
                  />
                </View>
              </View>
            )
          })()}
          <Input label="E-mail" value={session?.email ?? ''} onChangeText={() => {}} editable={false}
            bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />

          <Text style={s.fieldGroupLabel}>TELEFONE</Text>
          <View style={s.row}>
            <View style={{ width: 52 }}>
              <Input label="" value={form.ddi} onChangeText={set('ddi')} keyboardType="numeric" placeholder="+55"
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
            <View style={{ width: 8 }} />
            <View style={{ width: 60 }}>
              <Input label="" value={form.ddd} onChangeText={set('ddd')} keyboardType="numeric" placeholder="DDD"
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
            <View style={{ width: 8 }} />
            <View style={{ flex: 1 }}>
              <Input label="" value={form.telefone} onChangeText={set('telefone')} keyboardType="phone-pad" placeholder="99999-9999"
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
          </View>

          {/* Endereço */}
          <Text style={s.sectionTitle}>Endereço</Text>
          <View style={s.row}>
            <View style={{ width: 100 }}>
              <Input label="CEP" value={form.cep} onChangeText={v => setForm(f => ({ ...f, cep: maskCep(v) }))} keyboardType="numeric" placeholder="00000-000"
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
            <View style={{ width: 8 }} />
            <View style={{ flex: 1 }}>
              <Input label="Rua" value={form.rua} onChangeText={set('rua')}
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
          </View>
          <View style={s.row}>
            <View style={{ width: 80 }}>
              <Input label="Número" value={form.numero} onChangeText={set('numero')}
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
            <View style={{ width: 8 }} />
            <View style={{ flex: 1 }}>
              <Input label="Complemento" value={form.complemento} onChangeText={set('complemento')}
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Input label="Bairro" value={form.bairro} onChangeText={set('bairro')}
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
            <View style={{ width: 8 }} />
            <View style={{ flex: 1 }}>
              <Input label="Cidade" value={form.cidade} onChangeText={set('cidade')}
                bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />
            </View>
          </View>
          <Input label="Estado (UF)" value={form.estado} onChangeText={set('estado')} autoCapitalize="characters" placeholder="SP"
            bg={B.bg3} border={B.border} textColor={B.accent2} labelColor={B.text2} />

          <Btn label="Salvar alterações" onPress={handleSalvar} loading={loading}
            bg={B.accent} border={B.accent2} color="#cce4f5" style={{ marginTop: 8, marginBottom: 8 }} />

          <View style={s.divider} />

          <Btn label="Sair da conta" onPress={logout} variant="danger" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: B.bg },
  topbar:          { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: B.border },
  title:           { fontSize: 16, fontWeight: '600', color: B.text },
  body:            { padding: 16, paddingBottom: 40 },
  avatarRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: B.bg3, borderWidth: 0.5, borderColor: B.border, borderRadius: 10, padding: 12, marginBottom: 20 },
  avatarWrap:      { width: 52, height: 52 },
  avatarImg:       { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: B.accent },
  avatar:          { width: 52, height: 52, borderRadius: 26, backgroundColor: B.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: 18, fontWeight: '700', color: '#cce4f5' },
  avatarBadge:     { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: B.accent2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: B.bg },
  userName:        { fontSize: 14, fontWeight: '600', color: B.text },
  userBiz:         { fontSize: 11, color: B.text2, marginTop: 1 },
  userRole:        { fontSize: 11, color: B.accent, marginTop: 2 },
  sectionTitle:    { fontSize: 10, fontWeight: '700', color: B.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 10 },
  fieldGroupLabel: { fontSize: 9, fontWeight: '600', color: B.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  row:             { flexDirection: 'row', alignItems: 'flex-start' },
  divider:         { height: 0.5, backgroundColor: B.border, marginVertical: 16 },
})
