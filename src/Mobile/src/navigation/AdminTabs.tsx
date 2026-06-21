import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { CustomTabBar } from '../components/CustomTabBar'

import AdminHomeScreen from '../screens/admin/AdminHomeScreen'
import UsuariosAdminScreen from '../screens/admin/UsuariosAdminScreen'
import ProdutosAdminScreen from '../screens/admin/ProdutosAdminScreen'
import PedidosAdminScreen from '../screens/admin/PedidosAdminScreen'

const Tab = createBottomTabNavigator()

export default function AdminTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} theme="admin" />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Resumo"   component={AdminHomeScreen} />
      <Tab.Screen name="Usuários" component={UsuariosAdminScreen} />
      <Tab.Screen name="Produtos" component={ProdutosAdminScreen} />
      <Tab.Screen name="Pedidos"  component={PedidosAdminScreen} />
    </Tab.Navigator>
  )
}
