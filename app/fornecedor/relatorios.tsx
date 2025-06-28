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
  FlatList,
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

// Theme e tipos
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';

// Serviços
import { databaseService } from '../../services/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RelatorioData {
  vendas_mes: number;
  vendas_mes_anterior: number;
  produtos_vendidos: number;
  ticket_medio: number;
  margem_lucro: number;
  produtos_mais_vendidos: Array<{
    nome: string;
    quantidade: number;
    receita: number;
  }>;
  vendas_por_categoria: Array<{
    categoria: string;
    quantidade: number;
    receita: number;
  }>;
  evolucao_vendas: Array<{
    mes: string;
    vendas: number;
  }>;
  estoque_critico: Array<{
    nome: string;
    quantidade_atual: number;
    quantidade_minima: number;
  }>;
}

interface MetricaCard {
  titulo: string;
  valor: string;
  variacao: number;
  icone: string;
  cor: string;
}

const FornecedorRelatorios: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre' | 'ano'>('mes');
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null);
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // ID do fornecedor logado
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

  // Carregar dados dos relatórios
  useEffect(() => {
    loadRelatorios();
  }, [periodo]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      
      // Simular dados de relatório (na implementação real, viria do backend)
      const dadosSimulados: RelatorioData = {
        vendas_mes: 45670.80,
        vendas_mes_anterior: 38920.50,
        produtos_vendidos: 2847,
        ticket_medio: 16.05,
        margem_lucro: 32.8,
        produtos_mais_vendidos: [
          { nome: 'Farinha de Trigo Premium', quantidade: 890, receita: 7921.00 },
          { nome: 'Fermento Biológico Seco', quantidade: 567, receita: 14117.30 },
          { nome: 'Açúcar Cristal Especial', quantidade: 734, receita: 4771.00 },
          { nome: 'Óleo de Girassol Premium', quantidade: 298, receita: 5632.20 },
          { nome: 'Açúcar Mascavo Orgânico', quantidade: 189, receita: 2816.10 },
        ],
        vendas_por_categoria: [
          { categoria: 'Farinhas', quantidade: 1234, receita: 12450.80 },
          { categoria: 'Fermentos', quantidade: 678, receita: 16890.50 },
          { categoria: 'Açúcares', quantidade: 923, receita: 7587.00 },
          { categoria: 'Óleos', quantidade: 298, receita: 5632.20 },
          { categoria: 'Especiarias', quantidade: 156, receita: 3110.30 },
        ],
        evolucao_vendas: [
          { mes: 'Jan', vendas: 32450 },
          { mes: 'Fev', vendas: 28930 },
          { mes: 'Mar', vendas: 35670 },
          { mes: 'Abr', vendas: 38920 },
          { mes: 'Mai', vendas: 45670 },
          { mes: 'Jun', vendas: 42180 },
        ],
        estoque_critico: [
          { nome: 'Açúcar Mascavo Orgânico', quantidade_atual: 8, quantidade_minima: 10 },
          { nome: 'Açúcar Cristal Especial', quantidade_atual: 15, quantidade_minima: 30 },
          { nome: 'Farinha Integral Orgânica', quantidade_atual: 25, quantidade_minima: 20 },
        ]
      };

      setRelatorioData(dadosSimulados);
      
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRelatorios();
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

  // Calcular variação percentual
  const calcularVariacao = (atual: number, anterior: number) => {
    return ((atual - anterior) / anterior) * 100;
  };

  // Gerar métricas cards
  const getMetricas = (): MetricaCard[] => {
    if (!relatorioData) return [];

    const variacaoVendas = calcularVariacao(relatorioData.vendas_mes, relatorioData.vendas_mes_anterior);

    return [
      {
        titulo: 'Vendas do Mês',
        valor: formatCurrency(relatorioData.vendas_mes),
        variacao: variacaoVendas,
        icone: 'trending-up',
        cor: colors.success[500],
      },
      {
        titulo: 'Produtos Vendidos',
        valor: relatorioData.produtos_vendidos.toLocaleString('pt-BR'),
        variacao: 12.5,
        icone: 'cube',
        cor: colors.primary[500],
      },
      {
        titulo: 'Ticket Médio',
        valor: formatCurrency(relatorioData.ticket_medio),
        variacao: 8.3,
        icone: 'receipt',
        cor: colors.secondary[500],
      },
      {
        titulo: 'Margem de Lucro',
        valor: `${relatorioData.margem_lucro.toFixed(1)}%`,
        variacao: 2.1,
        icone: 'analytics',
        cor: colors.tertiary[500],
      },
    ];
  };

  // Render Métrica Card
  const renderMetricaCard = (metrica: MetricaCard) => {
    const isPositive = metrica.variacao >= 0;
    const variacaoColor = isPositive ? colors.success[500] : colors.error[500];
    const variacaoIcon = isPositive ? 'arrow-up' : 'arrow-down';

    return (
      <Card
        key={metrica.titulo}
        variant="elevated"
        size="md"
        style={styles.metricaCard}
      >
        <View style={styles.metricaHeader}>
          <View style={[styles.metricaIcon, { backgroundColor: metrica.cor + '20' }]}>
            <Ionicons name={metrica.icone as any} size={24} color={metrica.cor} />
          </View>
          
          <View style={styles.metricaVariacao}>
            <Ionicons name={variacaoIcon} size={16} color={variacaoColor} />
            <Text style={[styles.variacaoText, { color: variacaoColor }]}>
              {Math.abs(metrica.variacao).toFixed(1)}%
            </Text>
          </View>
        </View>
        
        <Text style={styles.metricaValor}>{metrica.valor}</Text>
        <Text style={styles.metricaTitulo}>{metrica.titulo}</Text>
      </Card>
    );
  };

  // Render Produto Mais Vendido
  const renderProdutoMaisVendido = ({ item, index }: { item: any; index: number }) => {
    const posicaoColors = [colors.warning[500], colors.neutral[400], colors.warning[300]];
    const posicaoColor = posicaoColors[index] || colors.neutral[300];

    return (
      <View style={styles.produtoItem}>
        <View style={[styles.posicaoNumber, { backgroundColor: posicaoColor }]}>
          <Text style={styles.posicaoText}>{index + 1}</Text>
        </View>
        
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={styles.produtoQuantidade}>
            {item.quantidade} vendidos
          </Text>
        </View>
        
        <Text style={styles.produtoReceita}>
          {formatCurrency(item.receita)}
        </Text>
      </View>
    );
  };

  // Render Categoria Vendas
  const renderCategoriaVendas = ({ item }: { item: any }) => {
    const maxReceita = Math.max(...(relatorioData?.vendas_por_categoria.map(c => c.receita) || [0]));
    const porcentagem = (item.receita / maxReceita) * 100;

    return (
      <View style={styles.categoriaItem}>
        <View style={styles.categoriaInfo}>
          <Text style={styles.categoriaNome}>{item.categoria}</Text>
          <Text style={styles.categoriaQuantidade}>
            {item.quantidade} produtos
          </Text>
        </View>
        
        <View style={styles.categoriaProgressContainer}>
          <View style={styles.categoriaProgressBar}>
            <View
              style={[
                styles.categoriaProgress,
                {
                  width: `${porcentagem}%`,
                  backgroundColor: colors.primary[500],
                },
              ]}
            />
          </View>
          <Text style={styles.categoriaReceita}>
            {formatCurrency(item.receita)}
          </Text>
        </View>
      </View>
    );
  };

  // Render Estoque Crítico
  const renderEstoqueCritico = ({ item }: { item: any }) => {
    const criticidade = item.quantidade_atual <= item.quantidade_minima;
    const statusColor = criticidade ? colors.error[500] : colors.warning[500];

    return (
      <View style={styles.estoqueItem}>
        <View style={[styles.estoqueStatus, { backgroundColor: statusColor }]} />
        
        <View style={styles.estoqueInfo}>
          <Text style={styles.estoqueNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={styles.estoqueQuantidades}>
            {item.quantidade_atual} / {item.quantidade_minima} mín.
          </Text>
        </View>
        
        <View style={styles.estoqueAlert}>
          <Ionicons name="warning" size={20} color={statusColor} />
        </View>
      </View>
    );
  };

  if (!relatorioData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Carregando relatórios...</Text>
      </View>
    );
  }

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Relatórios & Analytics</Text>
              <Text style={styles.headerSubtitle}>
                Análise de performance
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Exportar', 'Exportar relatório em PDF');
              }}
            >
              <Ionicons name="download" size={24} color={colors.white} />
            </TouchableOpacity>
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
        {/* Filtros de Período */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {['semana', 'mes', 'trimestre', 'ano'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.filterChip,
                  periodo === p && styles.filterChipActive,
                ]}
                onPress={() => {
                  setPeriodo(p as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    periodo === p && styles.filterChipTextActive,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Métricas Principais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Principais</Text>
          
          <View style={styles.metricasGrid}>
            {getMetricas().map(renderMetricaCard)}
          </View>
        </View>

        {/* Produtos Mais Vendidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
          
          <Card variant="elevated" size="md" style={styles.listCard}>
            <FlatList
              data={relatorioData.produtos_mais_vendidos}
              renderItem={renderProdutoMaisVendido}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>
        </View>

        {/* Vendas por Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendas por Categoria</Text>
          
          <Card variant="elevated" size="md" style={styles.listCard}>
            <FlatList
              data={relatorioData.vendas_por_categoria}
              renderItem={renderCategoriaVendas}
              keyExtractor={(item) => item.categoria}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>
        </View>

        {/* Evolução de Vendas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolução de Vendas</Text>
          
          <Card variant="elevated" size="md" style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {relatorioData.evolucao_vendas.map((item, index) => {
                const maxVendas = Math.max(...relatorioData.evolucao_vendas.map(v => v.vendas));
                const altura = (item.vendas / maxVendas) * 120;
                
                return (
                  <View key={item.mes} style={styles.chartBar}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: altura,
                          backgroundColor: colors.primary[500],
                        },
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>{item.mes}</Text>
                  </View>
                );
              })}
            </View>
            
            <Text style={styles.chartDescription}>
              Vendas mensais em milhares (R$)
            </Text>
          </Card>
        </View>

        {/* Estoque Crítico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estoque Crítico</Text>
          
          <Card variant="elevated" size="md" style={styles.listCard}>
            {relatorioData.estoque_critico.length > 0 ? (
              <FlatList
                data={relatorioData.estoque_critico}
                renderItem={renderEstoqueCritico}
                keyExtractor={(item) => item.nome}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success[500]} />
                <Text style={styles.emptyText}>Todos os produtos com estoque adequado</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            <Button
              variant="primary"
              leftIcon="document-text"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Relatório', 'Gerando relatório detalhado...');
              }}
              style={styles.actionButton}
            >
              Relatório Detalhado
            </Button>
            
            <Button
              variant="secondary"
              leftIcon="share"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Compartilhar', 'Compartilhar relatório');
              }}
              style={styles.actionButton}
            >
              Compartilhar
            </Button>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing[3],
  },
  headerCenter: {
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
  headerButton: {
    marginLeft: spacing[3],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  filtersContainer: {
    marginBottom: spacing[3],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.white,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  filterChipTextActive: {
    color: colors.white,
  },
  metricasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricaCard: {
    width: (screenWidth - spacing[4] * 3) / 2,
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  metricaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  metricaIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricaVariacao: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variacaoText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    marginLeft: spacing[1],
  },
  metricaValor: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  metricaTitulo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  listCard: {
    padding: spacing[4],
  },
  produtoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  posicaoNumber: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  posicaoText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
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
  produtoQuantidade: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  produtoReceita: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.success[600],
  },
  categoriaItem: {
    paddingVertical: spacing[3],
  },
  categoriaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  categoriaNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
  },
  categoriaQuantidade: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  categoriaProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriaProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: radii.sm,
    marginRight: spacing[3],
  },
  categoriaProgress: {
    height: '100%',
    borderRadius: radii.sm,
  },
  categoriaReceita: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    minWidth: 80,
  },
  chartCard: {
    padding: spacing[4],
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: spacing[3],
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing[1],
  },
  chartBarFill: {
    width: '80%',
    borderRadius: radii.sm,
    marginBottom: spacing[2],
  },
  chartBarLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  chartDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  estoqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  estoqueStatus: {
    width: 4,
    height: 40,
    borderRadius: radii.sm,
    marginRight: spacing[3],
  },
  estoqueInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  estoqueNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  estoqueQuantidades: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  estoqueAlert: {
    padding: spacing[1],
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  bottomSpacing: {
    height: 100,
  },
});

export default FornecedorRelatorios; 