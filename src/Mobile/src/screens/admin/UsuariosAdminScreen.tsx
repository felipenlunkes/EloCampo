import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { buscarTodosUsuarios, ativarUsuario, desativarUsuario } from '../../services/api'
import type { UserResponse } from '../../types'
import { A } from '../../theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function UsuariosAdminScreen() {
  const insets = useSafeAreaInsets()
  const [usuarios, setUsuarios] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarTodosUsuarios().then(setUsuarios).finally(() => setLoading(false))
  }, [])

  async function handleAcao(u: UserResponse, acao: 'ativar' | 'desativar') {
    const label = acao === 'ativar' ? 'Ativar' : 'Desativar'
    Alert.alert(label, `${label} a conta de ${u.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: label, style: acao === 'desativar' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (acao === 'ativar') await ativarUsuario(u.id)
            else await desativarUsuario(u.id)
          } catch {
            Alert.alert('Erro', `Não foi possível ${acao} o usuário`)
          }
        },
      },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topbar}>
        <Text style={s.title}>Usuários</Text>
        <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent2} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {usuarios.length === 0 && <Text style={s.empty}>Nenhum usuário encontrado.</Text>}
          {usuarios.map((u, i) => (
            <View key={u.id} style={[s.row, i === usuarios.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.email}>{u.email}</Text>
                <Text style={s.date}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[s.badge, u.isAdmin ? s.badgeAdmin : s.badgeUser]}>
                  <Text style={[s.badgeText, u.isAdmin ? s.badgeTextAdmin : s.badgeTextUser]}>
                    {u.isAdmin ? 'Admin' : 'Usuário'}
                  </Text>
                </View>
                {!u.isAdmin && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleAcao(u, 'desativar')} style={s.btnDanger}>
                      <Text style={s.btnDangerText}>Desativar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAcao(u, 'ativar')} style={s.btnSuccess}>
                      <Text style={s.btnSuccessText}>Ativar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: A.bg },
  topbar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: A.border },
  title:         { fontSize: 16, fontWeight: '600', color: A.accent2 },
  adminBadge:    { backgroundColor: '#e8b84b', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText:{ fontSize: 9, fontWeight: '700', color: '#1a1000' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#2e2a1a', gap: 10 },
  email:         { fontSize: 12, fontWeight: '500', color: '#e8f5e9', marginBottom: 2 },
  date:          { fontSize: 10, color: A.text3 },
  badge:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 0.5 },
  badgeAdmin:    { backgroundColor: '#2e2410', borderColor: '#b8882b' },
  badgeUser:     { backgroundColor: '#122114', borderColor: '#264d29' },
  badgeText:     { fontSize: 10, fontWeight: '600' },
  badgeTextAdmin:{ color: '#e8b84b' },
  badgeTextUser: { color: '#6dbf74' },
  btnDanger:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: '#7a2020', backgroundColor: '#3a1010' },
  btnDangerText: { fontSize: 9, color: '#e07070' },
  btnSuccess:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: '#264d29', backgroundColor: '#122114' },
  btnSuccessText:{ fontSize: 9, color: '#6dbf74' },
  empty:         { fontSize: 13, color: A.text3, textAlign: 'center', marginTop: 40 },
})
