import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import AuthStack from './AuthStack'
import ProdutorTabs from './ProdutorTabs'
import CompradorTabs from './CompradorTabs'
import AdminTabs from './AdminTabs'

export default function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1a0e', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6dbf74" size="large" />
      </View>
    )
  }

  if (!session)                          return <AuthStack />
  if (session.isAdmin)                   return <AdminTabs />
  if (session.account?.role === 'VENDOR') return <ProdutorTabs />
  if (session.account?.role === 'BUYER')  return <CompradorTabs />
  return <AuthStack />
}
