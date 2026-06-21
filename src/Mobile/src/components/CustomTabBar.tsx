import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

interface TabConfig {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

const PRODUTOR_TABS: TabConfig[] = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'cube-outline', label: 'Produtos' },
  { icon: 'document-text-outline', label: 'Vendas' },
  { icon: 'chatbubbles-outline', label: 'Chat' },
  { icon: 'person-outline', label: 'Perfil' },
]

const COMPRADOR_TABS: TabConfig[] = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'search-outline', label: 'Produtos' },
  { icon: 'list-outline', label: 'Pedidos' },
  { icon: 'chatbubbles-outline', label: 'Chat' },
  { icon: 'person-outline', label: 'Perfil' },
]

const ADMIN_TABS: TabConfig[] = [
  { icon: 'grid-outline', label: 'Resumo' },
  { icon: 'people-outline', label: 'Usuários' },
  { icon: 'cube-outline', label: 'Lotes' },
  { icon: 'handshake-outline' as any, label: 'Propostas' },
]

interface CustomTabBarProps extends BottomTabBarProps {
  theme: 'produtor' | 'comprador' | 'admin'
}

const THEME_STYLES = {
  produtor: {
    navBg: '#0b1f0c', navBorder: '#1b341d',
    strip: '#162818', stripBorder: '#264d29',
    actBg: '#1b341d', actBorder: '#2f6433', actColor: '#a8dca9',
    inactColor: '#2a4a2c',
    hiColor: '#264d29',
  },
  comprador: {
    navBg: '#050d14', navBorder: '#1a3050',
    strip: '#0a1828', stripBorder: '#1a3050',
    actBg: '#0d1f2e', actBorder: '#2a6b8a', actColor: '#70aadd',
    inactColor: '#1a3050',
    hiColor: '#1a3050',
  },
  admin: {
    navBg: '#080a08', navBorder: '#b8882b',
    strip: '#14100a', stripBorder: '#b8882b',
    actBg: '#2e2410', actBorder: '#b8882b', actColor: '#e8b84b',
    inactColor: '#5a3a10',
    hiColor: '#b8882b',
  },
}

export function CustomTabBar({ state, navigation, theme }: CustomTabBarProps) {
  const insets = useSafeAreaInsets()
  const T = THEME_STYLES[theme]
  const tabs = theme === 'produtor' ? PRODUTOR_TABS : theme === 'comprador' ? COMPRADOR_TABS : ADMIN_TABS

  return (
    <View style={[s.container, { backgroundColor: T.navBg, borderTopColor: T.navBorder, paddingBottom: insets.bottom }]}>
      <View style={[s.strip, { backgroundColor: T.strip, borderColor: T.stripBorder }]}>
        {state.routes.map((route, i) => {
          const active = state.index === i
          const tab = tabs[i] ?? { icon: 'ellipse-outline', label: route.name }
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
              style={[
                s.tab,
                active && { backgroundColor: T.actBg, borderWidth: 0.5, borderColor: T.actBorder },
              ]}
            >
              <Ionicons name={tab.icon} size={18} color={active ? T.actColor : T.inactColor} />
              <Text style={[s.label, { color: active ? T.actColor : T.inactColor }]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={s.hi}>
        <View style={[s.hiBar, { backgroundColor: T.hiColor }]} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
  },
  strip: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    gap: 2,
    borderWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  label: { fontSize: 8, fontWeight: '500' },
  hi: { alignItems: 'center', paddingTop: 5, paddingBottom: 2 },
  hiBar: { width: 36, height: 3, borderRadius: 2 },
})
