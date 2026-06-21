import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { CustomTabBar } from '../components/CustomTabBar'

import HomeProdutorScreen from '../screens/produtor/HomeProdutorScreen'
import MeusProdutosScreen from '../screens/produtor/MeusProdutosScreen'
import NovoProdutoScreen from '../screens/produtor/NovoProdutoScreen'
import MinhasVendasScreen from '../screens/produtor/MinhasVendasScreen'
import PropostasRecebidasScreen from '../screens/produtor/PropostasRecebidasScreen'
import PerfilProdutorScreen from '../screens/produtor/PerfilProdutorScreen'
import DetalheVendaScreen from '../screens/produtor/DetalheVendaScreen'
import ChatsListScreen from '../screens/shared/ChatsListScreen'
import ChatDetailScreen from '../screens/shared/ChatDetailScreen'

const Tab = createBottomTabNavigator()
const ProdutosStack = createNativeStackNavigator()
const VendasStack = createNativeStackNavigator()
const ChatStack = createNativeStackNavigator()
const PerfilStack = createNativeStackNavigator()

function ProdutosNav() {
  return (
    <ProdutosStack.Navigator screenOptions={{ headerShown: false }}>
      <ProdutosStack.Screen name="MeusProdutos" component={MeusProdutosScreen} />
      <ProdutosStack.Screen name="NovoProduto" component={NovoProdutoScreen} />
    </ProdutosStack.Navigator>
  )
}

function VendasNav() {
  return (
    <VendasStack.Navigator screenOptions={{ headerShown: false }}>
      <VendasStack.Screen name="MinhasVendas" component={MinhasVendasScreen} />
      <VendasStack.Screen name="PropostasRecebidas" component={PropostasRecebidasScreen} />
      <VendasStack.Screen name="DetalheVenda" component={DetalheVendaScreen} />
      <VendasStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </VendasStack.Navigator>
  )
}

function ChatNav() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatsList">
        {() => <ChatsListScreen theme="produtor" />}
      </ChatStack.Screen>
      <ChatStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </ChatStack.Navigator>
  )
}

function PerfilNav() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="PerfilProdutor" component={PerfilProdutorScreen} />
    </PerfilStack.Navigator>
  )
}

export default function ProdutorTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} theme="produtor" />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeProdutorScreen} />
      <Tab.Screen name="Produtos" component={ProdutosNav} />
      <Tab.Screen name="Vendas" component={VendasNav} />
      <Tab.Screen name="Chat" component={ChatNav} />
      <Tab.Screen name="Perfil" component={PerfilNav} />
    </Tab.Navigator>
  )
}
