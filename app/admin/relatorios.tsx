import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing, typography, radii, shadows } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CategoryChart, ProductChart } from '../../components/ui/Chart';
import { databaseService } from '../../services/database';
import { exportService } from '../../services/exportService';

const { width: screenWidth } = Dimensions.get('window');

interface RelatorioData {
  vendas_periodo: {
    total_vendas: number;
    total_pedidos: number;
    total_itens: number;
  };
  produtos_mais_vendidos: Array<{
    nome: string;
    quantidade_vendida: number;
    receita_total: number;
  }>;
  vendas_por_categoria: Array<{
    categoria: string;
    total_produtos: number;
    total_vendas: number;
    preco_medio: number;
  }>;
  periodo_analise: string;
}

export default function AdminRelatorios() {
  const router = useRouter();
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'semana' | 'mes' | 'trimestre'>('mes');
  
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

  useEffect(() => {
    loadRelatorios();
  }, [selectedPeriod]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      
      // Carregar dados reais do banco
      const dadosRelatorio = await databaseService.getRelatorioVendas(selectedPeriod);
      
      const relatorioFormatado: RelatorioData = {
        vendas_periodo: {
          total_vendas: dadosRelatorio.vendas_periodo.total_vendas,
          total_pedidos: dadosRelatorio.vendas_periodo.total_pedidos,
          total_itens: dadosRelatorio.vendas_periodo.total_itens,
        },
        produtos_mais_vendidos: dadosRelatorio.produtos_mais_vendidos.map((produto: any) => ({
          nome: produto.nome,
          quantidade_vendida: produto.quantidade_vendida,
          receita_total: produto.receita_total,
        })),
        vendas_por_categoria: dadosRelatorio.vendas_por_categoria.map((categoria: any) => ({
          categoria: categoria.categoria,
          total_produtos: categoria.total_produtos,
          total_vendas: categoria.total_vendas,
          preco_medio: categoria.preco_medio,
        })),
        periodo_analise: selectedPeriod,
      };
      
      setRelatorioData(relatorioFormatado);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRelatorios();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const exportRelatorio = async () => {
    if (!relatorioData) {
      Alert.alert('Erro', 'Nenhum relatório disponível para exportar');
      return;
    }

    Alert.alert(
      'Exportar Relatório',
      'Escolha o formato de exportação:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'PDF', 
          onPress: async () => {
            try {
              setExporting(true);
              await exportService.exportToPDF(relatorioData);
              Alert.alert('Sucesso', 'Relatório PDF gerado e compartilhado!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível exportar o relatório');
            } finally {
              setExporting(false);
            }
          }
        },
        { 
          text: 'HTML', 
          onPress: async () => {
            try {
              setExporting(true);
              await exportService.exportToHTML(relatorioData);
              Alert.alert('Sucesso', 'Relatório HTML gerado e compartilhado!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível exportar o relatório');
            } finally {
              setExporting(false);
            }
          }
        },
      ]
    );
  };

  const renderResumoCard = () => (
    <Card variant="elevated" size="lg" style={styles.resumoCard}>
      <View style={styles.resumoHeader}>
        <Text style={styles.resumoTitle}>Resumo do Período</Text>
        <View style={styles.periodoBadge}>
          <Text style={styles.periodoText}>{selectedPeriod.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.resumoGrid}>
        <View style={styles.resumoItem}>
          <View style={[styles.resumoIconContainer, { backgroundColor: colors.success[100] }]}>
            <Ionicons name="trending-up" size={24} color={colors.success[600]} />
          </View>
          <Text style={styles.resumoLabel}>Total de Vendas</Text>
          <Text style={styles.resumoValue}>
            {formatCurrency(relatorioData?.vendas_periodo.total_vendas || 0)}
          </Text>
        </View>

        <View style={styles.resumoItem}>
          <View style={[styles.resumoIconContainer, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="receipt" size={24} color={colors.primary[600]} />
          </View>
          <Text style={styles.resumoLabel}>Total de Pedidos</Text>
          <Text style={styles.resumoValue}>
            {formatNumber(relatorioData?.vendas_periodo.total_pedidos || 0)}
          </Text>
        </View>

        <View style={styles.resumoItem}>
          <View style={[styles.resumoIconContainer, { backgroundColor: colors.secondary[100] }]}>
            <Ionicons name="cube" size={24} color={colors.secondary[600]} />
          </View>
          <Text style={styles.resumoLabel}>Itens Vendidos</Text>
          <Text style={styles.resumoValue}>
            {formatNumber(relatorioData?.vendas_periodo.total_itens || 0)}
          </Text>
        </View>

        <View style={styles.resumoItem}>
          <View style={[styles.resumoIconContainer, { backgroundColor: colors.warning[100] }]}>
            <Ionicons name="calculator" size={24} color={colors.warning[600]} />
          </View>
          <Text style={styles.resumoLabel}>Ticket Médio</Text>
          <Text style={styles.resumoValue}>
            {formatCurrency(
              relatorioData?.vendas_periodo.total_pedidos 
                ? relatorioData.vendas_periodo.total_vendas / relatorioData.vendas_periodo.total_pedidos
                : 0
            )}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderProdutosMaisVendidos = () => (
    <Card variant="elevated" size="md" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
        <Ionicons name="trophy" size={20} color={colors.warning[500]} />
      </View>

      {relatorioData?.produtos_mais_vendidos.map((produto, index) => (
        <View key={index} style={styles.produtoItem}>
          <View style={styles.produtoRanking}>
            <Text style={styles.rankingNumber}>{index + 1}</Text>
          </View>
          
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={1}>
              {produto.nome}
            </Text>
            <Text style={styles.produtoQuantidade}>
              {formatNumber(produto.quantidade_vendida)} unidades
            </Text>
          </View>
          
          <View style={styles.produtoReceita}>
            <Text style={styles.receitaValue}>
              {formatCurrency(produto.receita_total)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );

  const renderVendasPorCategoria = () => (
    <Card variant="elevated" size="md" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vendas por Categoria</Text>
        <Ionicons name="pie-chart" size={20} color={colors.primary[500]} />
      </View>

      {relatorioData?.vendas_por_categoria.map((categoria, index) => (
        <View key={index} style={styles.categoriaItem}>
          <View style={styles.categoriaHeader}>
            <Text style={styles.categoriaNome}>{categoria.categoria}</Text>
            <Text style={styles.categoriaTotal}>
              {formatCurrency(categoria.total_vendas)}
            </Text>
          </View>
          
          <View style={styles.categoriaDetalhes}>
            <Text style={styles.categoriaDetalhe}>
              {categoria.total_produtos} produtos • Média: {formatCurrency(categoria.preco_medio)}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((categoria.total_vendas / 1500) * 100, 100)}%`,
                  backgroundColor: colors.primary[500],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary[500], colors.secondary[500]]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Relatórios</Text>
              <Text style={styles.headerSubtitle}>Análise de vendas e performance</Text>
            </View>
            
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportRelatorio}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="download" size={24} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Conteúdo */}
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
        {/* Filtro de Período */}
        <View style={styles.periodFilter}>
          {(['hoje', 'semana', 'mes', 'trimestre'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => {
                setSelectedPeriod(period);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        {/* Resumo Geral */}
        <View style={styles.section}>
          {renderResumoCard()}
        </View>

        {/* Produtos Mais Vendidos */}
        <View style={styles.section}>
          {renderProdutosMaisVendidos()}
        </View>

        {/* Vendas por Categoria */}
        <View style={styles.section}>
          {renderVendasPorCategoria()}
        </View>

        {/* Gráfico de Categorias */}
        <View style={styles.section}>
          <CategoryChart 
            data={relatorioData?.vendas_por_categoria || []}
            title="Distribuição de Vendas por Categoria"
          />
        </View>

        {/* Gráfico de Produtos */}
        <View style={styles.section}>
          <ProductChart 
            data={relatorioData?.produtos_mais_vendidos || []}
            title="Top 5 Produtos Mais Vendidos"
          />
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Card variant="elevated" size="md" style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Ações Rápidas</Text>
            
            <View style={styles.actionsGrid}>
              <Button
                variant="primary"
                leftIcon="bar-chart"
                onPress={() => Alert.alert('Relatório', 'Gerar relatório detalhado')}
                style={styles.actionButton}
              >
                Relatório Detalhado
              </Button>
              
              <Button
                variant="secondary"
                leftIcon="calendar"
                onPress={() => Alert.alert('Período', 'Selecionar período customizado')}
                style={styles.actionButton}
              >
                Período Customizado
              </Button>
              
              <Button
                variant="tertiary"
                leftIcon="share"
                onPress={() => Alert.alert('Compartilhar', 'Compartilhar relatório')}
                style={styles.actionButton}
              >
                Compartilhar
              </Button>
              
              <Button
                variant="ghost"
                leftIcon="print"
                onPress={() => Alert.alert('Imprimir', 'Imprimir relatório')}
                style={styles.actionButton}
              >
                Imprimir
              </Button>
            </View>
          </Card>
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
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
  backButton: {
    padding: spacing[2],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
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
  exportButton: {
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  periodFilter: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    backgroundColor: colors.white,
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
    backgroundColor: colors.primary[500],
  },
  periodButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[600],
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  section: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  resumoCard: {
    backgroundColor: colors.white,
  },
  resumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  resumoTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  periodoBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  periodoText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[700],
  },
  resumoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resumoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  resumoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  resumoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  resumoValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  produtoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  produtoRanking: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  rankingNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[700],
  },
  produtoInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  produtoNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  produtoQuantidade: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  produtoReceita: {
    alignItems: 'flex-end',
  },
  receitaValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.success[600],
  },
  categoriaItem: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  categoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  categoriaNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
  },
  categoriaTotal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.success[600],
  },
  categoriaDetalhes: {
    marginBottom: spacing[2],
  },
  categoriaDetalhe: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  actionsCard: {
    backgroundColor: colors.white,
  },
  actionsTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: spacing[3],
  },
  bottomSpacing: {
    height: spacing[8],
  },
}); 