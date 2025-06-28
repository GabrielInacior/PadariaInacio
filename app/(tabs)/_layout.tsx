import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          backgroundColor: colors.neutral[0],
          borderTopColor: colors.neutral[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          elevation: 8,
          shadowColor: colors.neutral[900],
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // Usando headers customizados nas telas
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cardapio"
        options={{
          title: 'Cardápio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="promocoes"
        options={{
          title: 'Promoções',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fidelidade"
        options={{
          title: 'Fidelidade',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      
      {/* Telas ocultas das tabs mas acessíveis via navegação */}
      <Tabs.Screen
        name="produtos"
        options={{
          href: null, // Remove da tab bar
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          href: null, // Remove da tab bar
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          href: null, // Remove da tab bar
        }}
      />
      <Tabs.Screen
        name="enderecos"
        options={{
          href: null, // Remove da tab bar
        }}
      />
      <Tabs.Screen
        name="avaliacoes"
        options={{
          href: null, // Remove da tab bar
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          href: null, // Remove da tab bar
        }}
      />
    </Tabs>
  );
} 