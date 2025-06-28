import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { databaseService } from '../services/database';
import { authService } from '../services/auth';
import { colors } from '../utils/theme';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Inicializando aplicativo...');
      
      // Inicializar banco de dados primeiro
      console.log('Inicializando banco de dados...');
      await databaseService.init();
      console.log('Banco de dados inicializado com sucesso!');
      
      // Depois inicializar serviço de autenticação
      console.log('Inicializando serviço de autenticação...');
      await authService.init();
      console.log('Serviço de autenticação inicializado com sucesso!');
      
      setIsInitialized(true);
      console.log('Aplicativo inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar o app:', error);
      setError('Erro ao inicializar o aplicativo');
    }
  };

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.error[500], fontSize: 16, textAlign: 'center', marginHorizontal: 20 }}>
          {error}
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, textAlign: 'center', marginTop: 10 }}>
          Tente reiniciar o aplicativo
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={{ color: colors.text, fontSize: 16, marginTop: 20 }}>
          Inicializando Padaria Inácio...
        </Text>
        <Text style={{ color: colors.neutral[600], fontSize: 14, marginTop: 10 }}>
          Preparando banco de dados e autenticação
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#8B4513', // Cor marrom da padaria
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Padaria Inácio',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            title: 'Login',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            title: 'Cadastro',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="admin" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="fornecedor" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="produto/[id]" 
          options={{ 
            title: 'Detalhes do Produto'
          }} 
        />
        <Stack.Screen 
          name="carrinho" 
          options={{ 
            title: 'Carrinho de Compras'
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 