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
import { DashboardKPI, RelatorioVendas } from '../../types';

// Serviços
import { databaseService } from '../../services/database';
import { notificationService } from '../../services/notifications/NotificationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const quickActions = [
  {
    id: 1,
    titulo: 'Novo Produto',
    icone: 'add-circle',
    cor: colors.primary[500],
    rota: '/admin/produtos',
  },
  {
    id: 2,
    titulo: 'Pedidos',
    icone: 'receipt',
    cor: colors.secondary[500],
    rota: '/admin/pedidos',
  },
  {
    id: 3,
    titulo: 'Estoque',
    icone: 'cube',
    cor: colors.tertiary[500],
    rota: '/admin/estoque',
  },
  {
    id: 4,
    titulo: 'Relatórios',
    icone: 'analytics',
    cor: colors.info[500],
    rota: '/admin/relatorios',
  },
  {
    id: 5,
    titulo: 'Categorias',
    icone: 'grid',
    cor: colors.warning[500],
    rota: '/admin/categorias',
  },
  {
    id: 6,
    titulo: 'Usuários',
    icone: 'people',
    cor: colors.success[500],
    rota: '/admin/usuarios',
  },
  {
    id: 7,
    titulo: 'Testar Notificações',
    icone: 'notifications',
    cor: colors.error[500],
    rota: 'test-notifications',
  },
];

const alertasRecentes = [
  {
    id: 1,
    tipo: 'warning',
    titulo: 'Estoque Baixo',
    descricao: '8 produtos com estoque abaixo do mínimo',
    tempo: '2 min atrás',
  },
  {
    id: 2,
    tipo: 'info',
    titulo: 'Novo Pedido',
    descricao: 'Pedido #1547 recebido - R$ 127,50',
    tempo: '5 min atrás',
  },
  {
    id: 3,
    tipo: 'success',
    titulo: 'Meta Atingida',
    descricao: 'Meta de vendas do dia foi atingida!',
    tempo: '1 hora atrás',
  },
];

const AdminDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje');
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

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
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await databaseService.getDashboardAdmin(selectedPeriod);
      setKpis(dashboardData);
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

  // Navegação para telas
  const handleNavigation = (rota: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Verificar se a rota existe e navegar ou mostrar alerta
    switch (rota) {
      case '/admin/categorias':
        router.push('/admin/categorias');
        break;
      case '/admin/produtos':
        router.push('/admin/produtos');
        break;
      case '/admin/pedidos':
        router.push('/admin/pedidos');
        break;
      case '/admin/estoque':
        router.push('/admin/estoque');
        break;
      case '/admin/relatorios':
        router.push('/admin/relatorios');
        break;
      case '/admin/usuarios':
        router.push('/admin/usuarios');
        break;
      case 'test-notifications':
        createSampleNotifications();
        break;
      default:
        Alert.alert('Navegação', `Ir para: ${rota}`);
    }
  };

  // Mudança de período com atualização de dados
  const handlePeriodChange = async (period: 'hoje' | 'semana' | 'mes') => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Os dados serão recarregados pelo useEffect
    }
  };

  // Criar notificações de exemplo para testar o sistema
  const createSampleNotifications = async () => {
    try {
      // Notificações para Admin
      await notificationService.createNotification(
        1,
        'pedido',
        'Novo Pedido Recebido',
        'Pedido #1234 no valor de R$ 87,50 aguarda confirmação.',
        { pedido_id: 1234, valor: 87.50, action: 'view_order' }
      );

      await notificationService.createNotification(
        1,
        'estoque',
        'Estoque Baixo',
        'Pão Francês está com apenas 15 unidades em estoque.',
        { produto: 'Pão Francês', quantidade: 15, action: 'view_stock' }
      );

      await notificationService.createNotification(
        1,
        'usuario',
        'Novo Cliente Cadastrado',
        'Maria Silva se cadastrou na plataforma.',
        { user_type: 'cliente', nome: 'Maria Silva' }
      );

      // Notificações para Cliente (ID 2)
      await notificationService.createNotification(
        2,
        'promocao',
        'Nova Promoção!',
        'Desconto de 20% em todos os pães artesanais até domingo!',
        { desconto: 20, categoria: 'paes' }
      );

      await notificationService.createNotification(
        2,
        'pedido',
        'Pedido Pronto!',
        'Seu pedido #1235 está pronto para retirada.',
        { pedido_id: 1235, status: 'pronto' }
      );

      // Notificações para Fornecedor (ID 5)
      await notificationService.createNotification(
        5,
        'pagamento',
        'Pagamento Recebido',
        'Você recebeu o pagamento de R$ 1.250,00.',
        { valor: 1250.00, tipo: 'recebido' }
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Notificações de exemplo criadas com sucesso!');
    } catch (error) {
      console.error('Erro ao criar notificações:', error);
      Alert.alert('Erro', 'Não foi possível criar as notificações de exemplo');
    }
  };

  // Render KPI Card - Melhorado para cards menos estreitas
  const renderKPICard = (
    titulo: string,
    valor: string | number,
    icone: string,
    cor: string,
    tendencia?: { valor: number; tipo: 'up' | 'down' },
    subtitulo?: string,
    fullWidth?: boolean
  ) => (
    <Card
      variant="elevated"
      size="md"
      style={fullWidth ? { ...styles.kpiCard, ...styles.kpiCardFull } : styles.kpiCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      animateOnPress
    >
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIconContainer, { backgroundColor: `${cor}20` }]}>
          <Ionicons name={icone as any} size={24} color={cor} />
        </View>
        {tendencia && (
          <View style={styles.tendenciaContainer}>
            <Ionicons
              name={tendencia.tipo === 'up' ? 'trending-up' : 'trending-down'}
              size={16}
              color={tendencia.tipo === 'up' ? colors.success[500] : colors.error[500]}
            />
            <Text
              style={[
                styles.tendenciaText,
                {
                  color: tendencia.tipo === 'up' ? colors.success[500] : colors.error[500],
                },
              ]}
            >
              {(tendencia.valor || 0).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.kpiTitulo}>{titulo}</Text>
      <Text style={styles.kpiValor}>{valor}</Text>
      {subtitulo && <Text style={styles.kpiSubtitulo}>{subtitulo}</Text>}
    </Card>
  );

  // Render Quick Action - Melhorado
  const renderQuickAction = (action: any) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionItem}
      onPress={() => handleNavigation(action.rota)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[action.cor, `${action.cor}CC`] as any}
        style={styles.quickActionGradient}
      >
        <Ionicons name={action.icone} size={28} color={colors.white} />
        <Text style={styles.quickActionText}>{action.titulo}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render Alerta
  const renderAlerta = (alerta: any) => {
    const getAlertaColor = (tipo: string) => {
      switch (tipo) {
        case 'warning': return colors.warning[500];
        case 'error': return colors.error[500];
        case 'success': return colors.success[500];
        default: return colors.info[500];
      }
    };

    const getAlertaIcon = (tipo: string) => {
      switch (tipo) {
        case 'warning': return 'warning';
        case 'error': return 'alert-circle';
        case 'success': return 'checkmark-circle';
        default: return 'information-circle';
      }
    };

    return (
      <TouchableOpacity
        key={alerta.id}
        style={styles.alertaItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.alertaIconContainer, { backgroundColor: `${getAlertaColor(alerta.tipo)}20` }]}>
          <Ionicons
            name={getAlertaIcon(alerta.tipo) as any}
            size={20}
            color={getAlertaColor(alerta.tipo)}
          />
        </View>
        
        <View style={styles.alertaContent}>
          <Text style={styles.alertaTitulo}>{alerta.titulo}</Text>
          <Text style={styles.alertaDescricao}>{alerta.descricao}</Text>
          <Text style={styles.alertaTempo}>{alerta.tempo}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.profiles.admin.primary} />
      
      {/* Header Premium */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.profiles.admin.primary, colors.profiles.admin.secondary] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Dashboard Admin</Text>
              <Text style={styles.headerSubtitle}>Visão geral do negócio</Text>
            </View>
            
            <View style={styles.headerRight}>
              <NotificationMenu 
                userType="admin"
                onNotificationPress={(notification) => {
                  console.log('Notificação pressionada:', notification);
                  // Aqui você pode implementar navegação específica
                }}
              />
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/admin/configuracoes');
                }}
              >
                <Ionicons name="settings" size={24} color={colors.neutral[0]} />
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
            colors={[colors.profiles.admin.primary]}
            tintColor={colors.profiles.admin.primary}
          />
        }
      >
        {/* Filtro de Período */}
        <View style={styles.periodFilter}>
          {(['hoje', 'semana', 'mes'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => {
                handlePeriodChange(period);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPIs Principais */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : kpis ? (
          <View style={styles.kpisContainer}>
            {/* Primeira linha - KPIs principais mais largos */}
            <View style={styles.kpisRow}>
              {renderKPICard(
                'Vendas Hoje',
                formatCurrency(kpis.vendas_hoje),
                'trending-up',
                colors.success[500],
                { valor: 12.5, tipo: 'up' }
              )}
              {renderKPICard(
                'Pedidos Pendentes',
                kpis.pedidos_pendentes.toString(),
                'time',
                colors.warning[500],
                { valor: 5.2, tipo: 'down' }
              )}
            </View>
            
            {/* Segunda linha */}
            <View style={styles.kpisRow}>
              {renderKPICard(
                'Clientes Ativos',
                kpis.clientes_ativos.toLocaleString(),
                'people',
                colors.info[500],
                { valor: 8.3, tipo: 'up' }
              )}
              {renderKPICard(
                'Ticket Médio',
                formatCurrency(kpis.ticket_medio),
                'card',
                colors.primary[500],
                { valor: 3.1, tipo: 'up' }
              )}
            </View>

            {/* Terceira linha - KPIs adicionais */}
            <View style={styles.kpisRow}>
              {renderKPICard(
                'Produtos em Falta',
                kpis.produtos_estoque_baixo.toString(),
                'alert-circle',
                colors.error[500],
                { valor: 2.1, tipo: 'down' }
              )}
              {renderKPICard(
                'Avaliação Média',
                `${(kpis.avaliacoes_media || 0).toFixed(1)}/5`,
                'star',
                colors.warning[500],
                { valor: 0.3, tipo: 'up' },
                'Baseado em avaliações'
              )}
            </View>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erro ao carregar dados</Text>
            <Button onPress={loadDashboardData} size="sm" variant="primary">
              Tentar Novamente
            </Button>
          </View>
        )}

        {/* KPIs Secundários */}
        {kpis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas Avançadas</Text>
            
            <View style={styles.kpisContainer}>
              <View style={styles.kpisRow}>
                {renderKPICard(
                  'Taxa de Conversão',
                  `${(kpis.taxa_conversao || 0).toFixed(1)}%`,
                  'analytics',
                  colors.tertiary[500],
                  undefined,
                  'Visitantes que compraram'
                )}
                {renderKPICard(
                  'Entregas no Prazo',
                  `${(kpis.entregas_tempo || 0).toFixed(1)}%`,
                  'checkmark-circle',
                  colors.success[500],
                  undefined,
                  'Eficiência das entregas'
                )}
              </View>
              <View style={styles.kpisRow}>
                {renderKPICard(
                  'Avaliação Média',
                  `${(kpis.avaliacoes_media || 0).toFixed(1)}/5`,
                  'star',
                  colors.secondary[500],
                  undefined,
                  'Satisfação dos clientes'
                )}
                {renderKPICard(
                  'Estoque Baixo',
                  kpis.produtos_estoque_baixo || 0,
                  'warning',
                  colors.error[500],
                  undefined,
                  'Produtos para repor'
                )}
              </View>
            </View>
          </View>
        )}

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Alertas Recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertas Recentes</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <Card variant="default" style={styles.alertasCard}>
            {alertasRecentes.map(renderAlerta)}
          </Card>
        </View>

        {/* Gráfico de Vendas Simulado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendas dos Últimos 7 Dias</Text>
          
          <Card variant="elevated" style={styles.chartCard}>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {[65, 85, 45, 92, 78, 88, 95].map((height, index) => (
                  <View key={index} style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${height}%`,
                          backgroundColor: index === 6 ? colors.primary[500] : colors.neutral[300],
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendColor, { backgroundColor: colors.primary[500] }]} />
                <Text style={styles.chartLegendText}>Hoje</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendColor, { backgroundColor: colors.neutral[300] }]} />
                <Text style={styles.chartLegendText}>Dias anteriores</Text>
              </View>
            </View>
          </Card>
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
    backgroundColor: colors.profiles.admin.background,
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
    color: colors.neutral[0],
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.secondary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: colors.neutral[0],
    fontSize: 12,
    fontWeight: typography.fontWeights.bold as any,
  },
  scrollView: {
    flex: 1,
  },
  periodFilter: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    backgroundColor: colors.neutral[0],
    borderRadius: radii.lg,
    padding: spacing[1],
    ...shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.profiles.admin.primary,
  },
  periodButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[600],
  },
  periodButtonTextActive: {
    color: colors.neutral[0],
  },
  kpisContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  kpisRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: spacing[2],
    minHeight: 140,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
  kpiCardFull: {
    flex: 2,
    minHeight: 160,
    marginHorizontal: spacing[2],
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tendenciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tendenciaText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    marginLeft: spacing[1],
  },
  kpiTitulo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[2],
    lineHeight: 18,
    textAlign: 'center',
  },
  kpiValor: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  kpiSubtitulo: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionLink: {
    fontSize: typography.fontSizes.sm,
    color: colors.profiles.admin.primary,
    fontWeight: typography.fontWeights.semibold as any,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[2],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: (screenWidth - spacing[8] - spacing[4]) / 3,
    marginBottom: spacing[3],
    marginHorizontal: spacing[1],
  },
  quickActionGradient: {
    height: 80,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  quickActionText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[0],
    marginTop: spacing[2],
  },
  alertasCard: {
    marginHorizontal: spacing[4],
  },
  alertaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  alertaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  alertaContent: {
    flex: 1,
  },
  alertaTitulo: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  alertaDescricao: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  alertaTempo: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  chartCard: {
    marginHorizontal: spacing[4],
    padding: spacing[4],
  },
  chartContainer: {
    height: 200,
    marginBottom: spacing[4],
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBar: {
    width: 20,
    backgroundColor: colors.neutral[300],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
  },
  chartLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
  },
  chartLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[1],
  },
  chartLegendText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  errorContainer: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.fontSizes.lg,
    color: colors.error[500],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
});

export default AdminDashboard; 