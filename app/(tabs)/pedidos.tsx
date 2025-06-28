import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pedido, ItemPedido } from '../../types';

const { width } = Dimensions.get('window');

const PedidosScreen = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollY = useSharedValue(0);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setIsLoading(true);
      
      // Simulando dados de pedidos
      const pedidosData: Pedido[] = [
        {
          id: 1,
          numero_pedido: 'PED-2024-001',
          cliente_id: 1,
          status: 'entregue',
          tipo: 'delivery',
          subtotal: 45.50,
          desconto: 5.00,
          taxa_entrega: 8.00,
          total: 48.50,
          forma_pagamento: 'Cartão de Crédito',
          status_pagamento: 'aprovado',
          endereco_entrega_id: 1,
          previsao_entrega: '2024-01-15T19:30:00',
          tempo_preparo_estimado: 25,
          observacoes: 'Sem cebola no hambúrguer',
          cupom_desconto_id: 1,
          pontos_utilizados: 0,
          pontos_ganhos: 48,
          avaliacao_cliente: 5,
          comentario_avaliacao: 'Excelente!',
          data_criacao: '2024-01-15T18:45:00',
          data_atualizacao: '2024-01-15T19:35:00',
          entregador_id: 1,
          comissao_entregador: 4.80,
        },
        {
          id: 2,
          numero_pedido: 'PED-2024-002',
          cliente_id: 1,
          status: 'preparando',
          tipo: 'delivery',
          subtotal: 32.00,
          desconto: 0,
          taxa_entrega: 6.00,
          total: 38.00,
          forma_pagamento: 'PIX',
          status_pagamento: 'aprovado',
          endereco_entrega_id: 1,
          previsao_entrega: '2024-01-16T12:45:00',
          tempo_preparo_estimado: 20,
          observacoes: '',
          cupom_desconto_id: undefined,
          pontos_utilizados: 0,
          pontos_ganhos: 38,
          avaliacao_cliente: undefined,
          comentario_avaliacao: undefined,
          data_criacao: '2024-01-16T12:05:00',
          data_atualizacao: '2024-01-16T12:15:00',
          entregador_id: 2,
          comissao_entregador: 3.80,
        },
      ];

      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarPedidos();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return colors.warning[500];
      case 'confirmado':
        return colors.info[500];
      case 'preparando':
        return colors.primary[500];
      case 'pronto':
        return colors.tertiary[500];
      case 'entregue':
        return colors.success[500];
      case 'cancelado':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'confirmado':
        return 'Confirmado';
      case 'preparando':
        return 'Preparando';
      case 'pronto':
        return 'Pronto';
      case 'entregue':
        return 'Entregue';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const renderPedido = ({ item: pedido, index }: { item: Pedido; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <Card style={{ marginBottom: spacing[4] }}>
          <View style={{ padding: spacing[6] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
              <View>
                <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: '700', color: colors.neutral[900] }}>
                  {pedido.numero_pedido}
                </Text>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.neutral[600] }}>
                  {new Date(pedido.data_criacao).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              
              <View style={{ backgroundColor: getStatusColor(pedido.status) + '20', borderRadius: 20, paddingHorizontal: spacing[4], paddingVertical: spacing[2] }}>
                <Text style={{ color: getStatusColor(pedido.status), fontSize: typography.fontSizes.sm, fontWeight: '600' }}>
                  {getStatusText(pedido.status)}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.neutral[50], borderRadius: 12, padding: spacing[4], marginBottom: spacing[4] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.fontSizes.base, fontWeight: '600', color: colors.neutral[900] }}>
                  Total do Pedido
                </Text>
                <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: '700', color: colors.primary[500] }}>
                  R$ {pedido.total.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button variant="secondary" style={{ flex: 1, marginRight: spacing[3] }}>Ver Detalhes</Button>
              <Button variant="secondary" style={{ flex: 1 }}>Repetir</Button>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.neutral[600] }}>Carregando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <LinearGradient colors={[colors.primary[500], colors.secondary[500]]} style={{ paddingHorizontal: spacing[6], paddingBottom: spacing[6] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
          <View>
            <Text style={{ fontSize: typography.fontSizes['3xl'], fontWeight: '700', color: colors.neutral[0] }}>
              Meus Pedidos
            </Text>
            <Text style={{ fontSize: typography.fontSizes.base, color: colors.neutral[0] + 'CC', marginTop: 4 }}>
              Acompanhe seus pedidos
            </Text>
          </View>
          
          <View style={{ backgroundColor: colors.neutral[0] + '20', borderRadius: 20, padding: spacing[4] }}>
            <Ionicons name="receipt" size={24} color={colors.neutral[0]} />
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: spacing[6], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary[500]]} tintColor={colors.primary[500]} />}
      />
    </SafeAreaView>
  );
};

export default PedidosScreen;
