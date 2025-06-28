import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../utils/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.profiles.admin.primary,
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
          title: 'Dashboard Admin'
        }} 
      />
      <Stack.Screen 
        name="produtos" 
        options={{ 
          title: 'Gestão de Produtos'
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
          title: 'Gestão de Pedidos'
        }} 
      />
      <Stack.Screen 
        name="usuarios" 
        options={{ 
          title: 'Gestão de Usuários'
        }} 
      />
      <Stack.Screen 
        name="categorias" 
        options={{ 
          title: 'Gestão de Categorias'
        }} 
      />
      <Stack.Screen 
        name="configuracoes" 
        options={{ 
          title: 'Configurações'
        }} 
      />
    </Stack>
  );
} 