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
  TextInput,
  Modal,
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
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';

// Componentes UI Premium
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Theme e tipos
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';

// Serviços
import { databaseService } from '../../services/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AdminEstoque: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'baixo' | 'alto' | 'normal'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [movimentacaoModalVisible, setMovimentacaoModalVisible] = useState(false);
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // ID do admin logado (em uma implementação real, viria do contexto de auth)
  const adminId = 1;

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

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar produtos com estoque
      const produtosData = await databaseService.getProdutosComEstoque();
      setProdutos(produtosData);

      // Carregar produtos com estoque baixo
      const estoqueBaixoData = await databaseService.getProdutosEstoqueBaixo();
      setProdutosEstoqueBaixo(estoqueBaixoData);

      // Carregar movimentações recentes
      const movimentacoesData = await databaseService.getMovimentacoesEstoqueRecentes(20);
      setMovimentacoes(movimentacoesData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Filtrar produtos
  const filteredProducts = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                         produto.sku.toLowerCase().includes(searchText.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'baixo') {
      matchesFilter = produto.status_estoque === 'baixo';
    } else if (selectedFilter === 'alto') {
      matchesFilter = produto.status_estoque === 'alto';
    } else if (selectedFilter === 'normal') {
      matchesFilter = produto.status_estoque === 'normal';
    }
    
    return matchesSearch && matchesFilter;
  });

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Ajustar estoque
  const ajustarEstoque = async (produto: any) => {
    Alert.prompt(
      'Ajustar Estoque',
      `Quantidade atual: ${produto.quantidade_atual}\nNova quantidade:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ajustar',
          onPress: async (quantidade) => {
            if (quantidade && !isNaN(Number(quantidade))) {
              try {
                const novaQuantidade = Number(quantidade);
                const quantidadeAtual = produto.quantidade_atual;
                const diferenca = novaQuantidade - quantidadeAtual;
                const tipoMovimento = diferenca > 0 ? 'entrada' : 'saida';
                const quantidadeMovimento = Math.abs(diferenca);
                
                if (diferenca !== 0) {
                  await databaseService.updateEstoque(
                    produto.id,
                    quantidadeMovimento,
                    tipoMovimento,
                    `Ajuste manual via admin (${quantidadeAtual} → ${novaQuantidade})`,
                    adminId
                  );
                  await loadData(); // Recarregar dados
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Sucesso', 'Estoque ajustado com sucesso');
                } else {
                  Alert.alert('Info', 'Nenhuma alteração necessária');
                }
              } catch (error) {
                console.error('Erro ao ajustar estoque:', error);
                Alert.alert('Erro', 'Não foi possível ajustar o estoque');
              }
            } else {
              Alert.alert('Erro', 'Quantidade inválida');
            }
          }
        }
      ],
      'plain-text',
      produto.quantidade_atual.toString(),
      'numeric'
    );
  };

  // Render Produto Card
  const renderProdutoCard = ({ item }: { item: typeof produtos[0] }) => {
    const isLowStock = item.status_estoque === 'baixo';
    const isHighStock = item.status_estoque === 'alto';
    const stockPercentage = (item.quantidade_atual / item.quantidade_maxima) * 100;

    let statusColor = colors.success[500];
    let statusText = 'Normal';
    
    if (isLowStock) {
      statusColor = colors.error[500];
      statusText = 'Baixo';
    } else if (isHighStock) {
      statusColor = colors.warning[500];
      statusText = 'Alto';
    }

    return (
      <Card
        variant="elevated"
        size="md"
        style={styles.produtoCard}
        onPress={() => {
          setSelectedProduct(item);
          setModalVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        animateOnPress
      >
        <View style={styles.produtoHeader}>
          <View style={styles.produtoImageContainer}>
            <View style={styles.produtoImagePlaceholder}>
              <Ionicons name="cube" size={32} color={colors.neutral[400]} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={2}>
              {item.nome}
            </Text>
            <Text style={styles.produtoSku}>SKU: {item.sku}</Text>
            <Text style={styles.produtoCategoria}>{item.categoria_nome}</Text>
            
            <View style={styles.produtoPrecos}>
              <Text style={styles.precoCusto}>
                Custo: {formatCurrency(item.preco_custo)}
              </Text>
              <Text style={styles.precoVenda}>
                Venda: {formatCurrency(item.preco_venda)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Informações de Estoque */}
        <View style={styles.estoqueContainer}>
          <View style={styles.estoqueHeader}>
            <Text style={styles.estoqueTitle}>Estoque</Text>
            <Text style={styles.estoqueQuantidade}>
              {item.quantidade_atual} / {item.quantidade_maxima} un.
            </Text>
          </View>
          
          <View style={styles.estoqueProgressContainer}>
            <View style={styles.estoqueProgressBar}>
              <View
                style={[
                  styles.estoqueProgress,
                  {
                    width: `${Math.min(stockPercentage, 100)}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.estoquePercentage}>
                                {(stockPercentage || 0).toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.estoqueDetalhes}>
            <Text style={styles.estoqueDetalhe}>
              Mín: {item.quantidade_minima} | Lote: {item.lote}
            </Text>
            <Text style={styles.estoqueDetalhe}>
              Local: {item.localizacao_estoque}
            </Text>
          </View>
        </View>
        
        {/* Ações */}
        <View style={styles.produtoActions}>
          <Button
            size="sm"
            variant="tertiary"
            leftIcon="analytics"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedProduct(item);
              setMovimentacaoModalVisible(true);
            }}
            style={styles.actionButton}
          >
            Histórico
          </Button>
          
          <Button
            size="sm"
            variant="primary"
            leftIcon="create"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              ajustarEstoque(item);
            }}
            style={styles.actionButton}
          >
            Ajustar
          </Button>
        </View>
      </Card>
    );
  };

  // Render Movimentação Card
  const renderMovimentacaoCard = ({ item }: { item: typeof movimentacoes[0] }) => {
    const getTipoIcon = (tipo: string) => {
      switch (tipo) {
        case 'entrada': return 'arrow-up';
        case 'saida': return 'arrow-down';
        case 'ajuste': return 'create';
        default: return 'swap-horizontal';
      }
    };

    const getTipoColor = (tipo: string) => {
      switch (tipo) {
        case 'entrada': return colors.success[500];
        case 'saida': return colors.error[500];
        case 'ajuste': return colors.warning[500];
        default: return colors.info[500];
      }
    };

    return (
      <Card
        variant="default"
        size="sm"
        style={styles.movimentacaoCard}
      >
        <View style={styles.movimentacaoHeader}>
          <View style={[styles.tipoIconContainer, { backgroundColor: `${getTipoColor(item.tipo)}20` }]}>
            <Ionicons
              name={getTipoIcon(item.tipo) as any}
              size={16}
              color={getTipoColor(item.tipo)}
            />
          </View>
          <View style={styles.movimentacaoInfo}>
            <Text style={styles.movimentacaoTipo}>
              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
            </Text>
            <Text style={styles.movimentacaoData}>
              {formatDate(item.data_movimentacao)}
            </Text>
          </View>
          <Text style={[styles.movimentacaoQuantidade, { color: getTipoColor(item.tipo) }]}>
            {item.tipo === 'saida' ? '-' : '+'}{item.quantidade}
          </Text>
        </View>
        
        <Text style={styles.movimentacaoProduto}>{item.produto_nome}</Text>
        <Text style={styles.movimentacaoMotivo}>{item.motivo}</Text>
        <Text style={styles.movimentacaoUsuario}>Por: {item.usuario_nome}</Text>
      </Card>
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
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.neutral[0]} />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Gestão de Estoque</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredProducts.length} produtos • {produtosEstoqueBaixo.length} com estoque baixo
                </Text>
              </View>
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
        {/* Resumo de Estoque */}
        <View style={styles.resumoContainer}>
          <View style={styles.resumoRow}>
            <Card variant="elevated" style={styles.resumoCard}>
              <Text style={styles.resumoTitulo}>Total de Produtos</Text>
              <Text style={styles.resumoValor}>{produtos.length}</Text>
            </Card>
            
            <Card variant="elevated" style={styles.resumoCard}>
              <Text style={styles.resumoTitulo}>Estoque Baixo</Text>
              <Text style={[styles.resumoValor, { color: colors.error[500] }]}>
                {produtosEstoqueBaixo.length}
              </Text>
            </Card>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors.neutral[500]}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'baixo', label: 'Estoque Baixo' },
              { key: 'normal', label: 'Normal' },
              { key: 'alto', label: 'Estoque Alto' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedFilter(filter.key as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Produtos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando produtos...</Text>
          </View>
        ) : (
          <View style={styles.produtosContainer}>
            <FlatList
              data={filteredProducts}
              renderItem={renderProdutoCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.produtosList}
            />
          </View>
        )}

        {/* Movimentações Recentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movimentações Recentes</Text>
          
          <FlatList
            data={movimentacoes.slice(0, 10)}
            renderItem={renderMovimentacaoCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de Detalhes do Produto */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct.nome}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Informações do Estoque</Text>
                <Text style={styles.modalText}>Quantidade Atual: {selectedProduct.quantidade_atual} unidades</Text>
                <Text style={styles.modalText}>Quantidade Mínima: {selectedProduct.quantidade_minima} unidades</Text>
                <Text style={styles.modalText}>Quantidade Máxima: {selectedProduct.quantidade_maxima} unidades</Text>
                <Text style={styles.modalText}>Quantidade Reservada: {selectedProduct.quantidade_reservada} unidades</Text>
                <Text style={styles.modalText}>Localização: {selectedProduct.localizacao_estoque}</Text>
                <Text style={styles.modalText}>Lote: {selectedProduct.lote}</Text>
                {selectedProduct.data_fabricacao && (
                  <Text style={styles.modalText}>Data de Fabricação: {formatDate(selectedProduct.data_fabricacao)}</Text>
                )}
                {selectedProduct.data_validade && (
                  <Text style={styles.modalText}>Data de Validade: {formatDate(selectedProduct.data_validade)}</Text>
                )}
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  variant="tertiary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalActionButton}
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    setModalVisible(false);
                    ajustarEstoque(selectedProduct);
                  }}
                  style={styles.modalActionButton}
                >
                  Ajustar Estoque
                </Button>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Modal de Movimentações */}
      <Modal
        visible={movimentacaoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMovimentacaoModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Histórico - {selectedProduct.nome}</Text>
              <TouchableOpacity
                onPress={() => setMovimentacaoModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSectionTitle}>Movimentações do Produto</Text>
              {movimentacoes
                .filter(mov => mov.produto_id === selectedProduct.id)
                .map((item, index) => (
                  <View key={index} style={styles.movimentacaoModalItem}>
                    {renderMovimentacaoCard({ item })}
                  </View>
                ))}
              
              <Button
                variant="tertiary"
                onPress={() => setMovimentacaoModalVisible(false)}
                style={styles.modalActionButton}
              >
                Fechar
              </Button>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing[3],
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
  scrollView: {
    flex: 1,
  },
  resumoContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumoCard: {
    flex: 1,
    marginHorizontal: spacing[1],
    padding: spacing[4],
    alignItems: 'center',
  },
  resumoTitulo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  resumoValor: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    marginLeft: spacing[2],
  },
  filtersContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.neutral[0],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: colors.profiles.admin.primary,
    borderColor: colors.profiles.admin.primary,
  },
  filterChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  filterChipTextActive: {
    color: colors.neutral[0],
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
  produtosContainer: {
    paddingHorizontal: spacing[4],
  },
  produtosList: {
    paddingBottom: spacing[4],
  },
  produtoCard: {
    marginBottom: spacing[4],
  },
  produtoHeader: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  produtoImageContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  produtoImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -spacing[1],
    right: -spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  statusText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  produtoSku: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  produtoCategoria: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  produtoPrecos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  precoCusto: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },
  precoVenda: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.success[600],
  },
  estoqueContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  estoqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  estoqueTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
  },
  estoqueQuantidade: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  estoqueProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  estoqueProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: radii.sm,
    marginRight: spacing[2],
  },
  estoqueProgress: {
    height: '100%',
    borderRadius: radii.sm,
  },
  estoquePercentage: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    minWidth: 35,
  },
  estoqueDetalhes: {
    gap: spacing[1],
  },
  estoqueDetalhe: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
  },
  produtoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing[1],
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
  movimentacaoCard: {
    marginBottom: spacing[2],
  },
  movimentacaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  tipoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  movimentacaoInfo: {
    flex: 1,
  },
  movimentacaoTipo: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
  },
  movimentacaoData: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
  },
  movimentacaoQuantidade: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
  },
  movimentacaoProduto: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  movimentacaoMotivo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  movimentacaoUsuario: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  bottomSpacing: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing[1],
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  modalSection: {
    marginVertical: spacing[3],
  },
  modalSectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  modalActions: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  movimentacaoModalItem: {
    marginBottom: spacing[2],
  },
});

export default AdminEstoque; 