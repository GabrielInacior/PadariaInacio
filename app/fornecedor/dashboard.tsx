import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Componentes UI Premium
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NotificationMenu } from '../../components/notifications/NotificationMenu';

// Theme e tipos
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';

// Serviços
import { databaseService } from '../../services/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DashboardData {
  totalProdutos: number;
  estoqueBaixo: number;
  valorEstoque: number;
  maisVendidos: Array<{ nome: string; total_vendas: number }>;
  vendasMes: number;
  pedidosPendentes: number;
  avaliacaoMedia: number;
  produtosAtivos: number;
}

const FornecedorDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProdutos: 0,
    estoqueBaixo: 0,
    valorEstoque: 0,
    maisVendidos: [],
    vendasMes: 0,
    pedidosPendentes: 0,
    avaliacaoMedia: 0,
    produtosAtivos: 0,
  });
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // ID do fornecedor logado (em uma implementação real, viria do contexto de auth)
  const fornecedorId = 5;

  // Animações do scroll com useCallback para compatibilidade React 19
  const scrollHandler = useCallback(
    useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
        const opacity = interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.95],
          'clamp'
        );
        headerOpacity.value = withTiming(opacity, { duration: 200 });
      },
    }),
    []
  );

  // Estilo animado do header
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -5],
          'clamp'
        ),
      },
    ],
  }));

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do fornecedor
      const data = await databaseService.getDashboardFornecedor(fornecedorId);
      
      // Simular dados adicionais que não estão no método atual
      const dadosAdicionais = {
        vendasMes: 45670.80,
        pedidosPendentes: 12,
        avaliacaoMedia: 4.7,
        produtosAtivos: data.totalProdutos,
      };

      setDashboardData({
        ...data,
        ...dadosAdicionais,
      });
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Render KPI Card
  const renderKPICard = (title: string, value: string, subtitle: string, icon: string, color: string, onPress?: () => void) => {
    return (
      <Card
        variant="elevated"
        size="md"
        style={StyleSheet.flatten([styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }])}
        onPress={onPress}
        animateOnPress={!!onPress}
      >
        <View style={styles.kpiContent}>
          <View style={styles.kpiLeft}>
            <Text style={styles.kpiTitle}>{title}</Text>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiSubtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon as any} size={28} color={color} />
          </View>
        </View>
      </Card>
    );
  };

  // Render Action Card
  const renderActionCard = (title: string, description: string, icon: string, color: string, onPress: () => void) => {
    return (
      <Card
        variant="elevated"
        size="sm"
        style={styles.actionCard}
        onPress={onPress}
        animateOnPress
      >
        <LinearGradient
          colors={[color + '10', color + '05']}
          style={styles.actionGradient}
        >
          <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <Ionicons name={icon as any} size={24} color={colors.white} />
          </View>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </LinearGradient>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />
      
      {/* Header Premium */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary[500], colors.secondary[500]] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Dashboard Fornecedor</Text>
              <Text style={styles.headerSubtitle}>
                Bem-vindo, Distribuidora Pão & Cia
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <NotificationMenu 
                userType="fornecedor"
                onNotificationPress={(notification) => {
                  console.log('Notificação fornecedor pressionada:', notification);
                  // Aqui você pode implementar navegação específica para fornecedor
                }}
              />
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/fornecedor/perfil');
                }}
              >
                <Ionicons name="person-circle" size={32} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Conteúdo Principal */}
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* KPIs Principais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          
          <View style={styles.kpiGrid}>
            {renderKPICard(
              'Produtos Cadastrados',
              dashboardData.totalProdutos.toString(),
              'produtos ativos',
              'cube',
              colors.primary[500],
              () => router.push('/fornecedor/produtos')
            )}
            
            {renderKPICard(
              'Estoque Baixo',
              dashboardData.estoqueBaixo.toString(),
              'produtos em falta',
              'warning',
              colors.error[500],
              () => router.push('/fornecedor/estoque')
            )}
            
            {renderKPICard(
              'Valor em Estoque',
              formatCurrency(dashboardData.valorEstoque),
              'valor total',
              'cash',
              colors.success[500]
            )}
            
            {renderKPICard(
              'Vendas do Mês',
              formatCurrency(dashboardData.vendasMes),
              'faturamento mensal',
              'trending-up',
              colors.secondary[500]
            )}
            
            {renderKPICard(
              'Pedidos Pendentes',
              dashboardData.pedidosPendentes.toString(),
              'aguardando processamento',
              'time',
              colors.warning[500],
              () => router.push('/fornecedor/pedidos')
            )}
            
            {renderKPICard(
              'Avaliação Média',
              dashboardData.avaliacaoMedia.toFixed(1),
              'de 5.0 estrelas',
              'star',
              colors.tertiary[500]
            )}
          </View>
        </View>

        {/* Produtos Mais Vendidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
          
          <Card variant="elevated" size="md" style={styles.chartCard}>
            {dashboardData.maisVendidos.length > 0 ? (
              dashboardData.maisVendidos.map((produto, index) => (
                <View key={index} style={styles.produtoVendido}>
                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome}>{produto.nome}</Text>
                    <Text style={styles.produtoVendas}>{produto.total_vendas} vendas</Text>
                  </View>
                  <View style={styles.produtoProgress}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progress,
                          {
                            width: `${(produto.total_vendas / Math.max(...dashboardData.maisVendidos.map(p => p.total_vendas))) * 100}%`,
                            backgroundColor: colors.primary[500],
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart" size={48} color={colors.neutral[400]} />
                <Text style={styles.emptyText}>Nenhum dado de vendas disponível</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            {renderActionCard(
              'Novo Produto',
              'Cadastrar produto',
              'add-circle',
              colors.primary[500],
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Novo Produto', 'Funcionalidade em desenvolvimento');
              }
            )}
            
            {renderActionCard(
              'Gerenciar Estoque',
              'Controlar estoque',
              'archive',
              colors.secondary[500],
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/fornecedor/estoque');
              }
            )}
            
            {renderActionCard(
              'Ver Pedidos',
              'Pedidos recebidos',
              'receipt',
              colors.tertiary[500],
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/fornecedor/pedidos');
              }
            )}
            
            {renderActionCard(
              'Relatórios',
              'Análises e relatórios',
              'analytics',
              colors.warning[500],
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/fornecedor/relatorios');
              }
            )}
          </View>
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[100],
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: spacing[3],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: (screenWidth - spacing[4] * 3) / 2,
    marginBottom: spacing[3],
    minHeight: 120,
  },
  kpiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  kpiLeft: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  kpiValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  kpiSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    padding: spacing[4],
  },
  produtoVendido: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  produtoInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  produtoNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  produtoVendas: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  produtoProgress: {
    width: 80,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: radii.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (screenWidth - spacing[4] * 3) / 2,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  actionGradient: {
    padding: spacing[4],
    alignItems: 'center',
    minHeight: 120,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  actionDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default FornecedorDashboard;