import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { CustomTabBar } from '../components/CustomTabBar'

import HomeCompradorScreen from '../screens/comprador/HomeCompradorScreen'
import BuscarProdutosScreen from '../screens/comprador/BuscarProdutosScreen'
import DetalheProdutoScreen from '../screens/comprador/DetalheProdutoScreen'
import PropostaEnviadaScreen from '../screens/comprador/PropostaEnviadaScreen'
import MeusPedidosScreen from '../screens/comprador/MeusPedidosScreen'
import ChatCompradorScreen from '../screens/comprador/ChatCompradorScreen'
import AvaliacoesScreen from '../screens/comprador/AvaliacoesScreen'
import PerfilCompradorScreen from '../screens/comprador/PerfilCompradorScreen'
import ChatsListScreen from '../screens/shared/ChatsListScreen'
import ChatDetailScreen from '../screens/shared/ChatDetailScreen'

const Tab = createBottomTabNavigator()
const ProdutosStack = createNativeStackNavigator()
const PedidosStack = createNativeStackNavigator()
const ChatStack = createNativeStackNavigator()
const PerfilStack = createNativeStackNavigator()

function ProdutosNav() {
  return (
    <ProdutosStack.Navigator screenOptions={{ headerShown: false }}>
      <ProdutosStack.Screen name="BuscarProdutos" component={BuscarProdutosScreen} />
      <ProdutosStack.Screen name="DetalheProduto" component={DetalheProdutoScreen} />
      <ProdutosStack.Screen name="PropostaEnviada" component={PropostaEnviadaScreen} />
      <ProdutosStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </ProdutosStack.Navigator>
  )
}

function PedidosNav() {
  return (
    <PedidosStack.Navigator screenOptions={{ headerShown: false }}>
      <PedidosStack.Screen name="MeusPedidos" component={MeusPedidosScreen} />
      <PedidosStack.Screen name="ChatComprador" component={ChatCompradorScreen} />
      <PedidosStack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <PedidosStack.Screen name="Avaliacoes" component={AvaliacoesScreen} />
    </PedidosStack.Navigator>
  )
}

function ChatNav() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatsList">
        {() => <ChatsListScreen theme="comprador" />}
      </ChatStack.Screen>
      <ChatStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </ChatStack.Navigator>
  )
}

function PerfilNav() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="PerfilComprador" component={PerfilCompradorScreen} />
    </PerfilStack.Navigator>
  )
}

export default function CompradorTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} theme="comprador" />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeCompradorScreen} />
      <Tab.Screen name="Produtos" component={ProdutosNav} />
      <Tab.Screen name="Pedidos" component={PedidosNav} />
      <Tab.Screen name="Chat" component={ChatNav} />
      <Tab.Screen name="Perfil" component={PerfilNav} />
    </Tab.Navigator>
  )
}
