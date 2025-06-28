import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../utils/theme';

export default function FornecedorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false, // Deixar cada tela controlar seu próprio header
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard Fornecedor'
        }} 
      />
      <Stack.Screen 
        name="produtos" 
        options={{ 
          title: 'Meus Produtos'
        }} 
      />
      <Stack.Screen 
        name="estoque" 
        options={{ 
          title: 'Controle de Estoque'
        }} 
      />
      <Stack.Screen 
        name="pedidos" 
        options={{ 
          title: 'Pedidos'
        }} 
      />
      <Stack.Screen 
        name="relatorios" 
        options={{ 
          title: 'Relatórios'
        }} 
      />
      <Stack.Screen 
        name="perfil" 
        options={{ 
          title: 'Meu Perfil'
        }} 
      />
    </Stack>
  );
} 