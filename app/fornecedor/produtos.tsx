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

// Componentes UI Premium
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Theme e tipos
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';
import { Produto, Categoria } from '../../types';

// Serviços
import { databaseService } from '../../services/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FornecedorProdutos: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // ID do fornecedor logado (em uma implementação real, viria do contexto de auth)
  const fornecedorId = 5; // ID do fornecedor mockado

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
      
      // Carregar produtos do fornecedor
      const produtosData = await databaseService.getProdutosByFornecedor(fornecedorId);
      setProdutos(produtosData);

      // Carregar categorias
      const categoriasData = await databaseService.getCategorias();
      setCategorias(categoriasData);
      
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
    const matchesCategory = selectedCategory === null || produto.categoria_id === selectedCategory;
    const matchesStatus = selectedStatus === 'todos' || 
                         (selectedStatus === 'ativo' && produto.status === 'ativo') ||
                         (selectedStatus === 'inativo' && produto.status !== 'ativo');
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Adicionar estoque
  const adicionarEstoque = async (produto: any) => {
    Alert.prompt(
      'Adicionar Estoque',
      `Quantidade a adicionar para ${produto.nome}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async (quantidade) => {
            if (quantidade && !isNaN(Number(quantidade))) {
              try {
                await databaseService.updateEstoque(
                  produto.id,
                  Number(quantidade),
                  'entrada',
                  'Adição manual via app fornecedor',
                  fornecedorId
                );
                await loadData(); // Recarregar dados
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Sucesso', `${quantidade} unidades adicionadas ao estoque`);
              } catch (error) {
                console.error('Erro ao adicionar estoque:', error);
                Alert.alert('Erro', 'Não foi possível adicionar o estoque');
              }
            } else {
              Alert.alert('Erro', 'Quantidade inválida');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  // Render Produto Card
  const renderProdutoCard = ({ item }: { item: typeof produtos[0] }) => {
    const isLowStock = item.estoque.quantidade_atual <= item.estoque.quantidade_minima;
    const stockPercentage = (item.estoque.quantidade_atual / item.estoque.quantidade_maxima) * 100;

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
            {item.novo && (
              <View style={styles.produtoNovoBadge}>
                <Text style={styles.produtoNovoText}>NOVO</Text>
              </View>
            )}
            {item.preco_promocional && (
              <View style={styles.produtoPromocaoBadge}>
                <Text style={styles.produtoPromocaoText}>PROMO</Text>
              </View>
            )}
          </View>
          
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={2}>
              {item.nome}
            </Text>
            <Text style={styles.produtoSku}>SKU: {item.sku}</Text>
            
            <View style={styles.produtoPrecos}>
              <Text style={styles.precoCusto}>
                Custo: {formatCurrency(item.preco_custo)}
              </Text>
              <Text style={styles.precoVenda}>
                Venda: {formatCurrency(item.preco_venda)}
              </Text>
            </View>
            
            <View style={styles.produtoMargem}>
              <Text style={styles.margemText}>
                Margem: {item.margem_lucro.toFixed(1)}%
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.status === 'ativo' ? colors.success[500] : colors.error[500] }
              ]}>
                <Text style={styles.statusText}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Informações de Estoque */}
        <View style={styles.estoqueContainer}>
          <View style={styles.estoqueHeader}>
            <Text style={styles.estoqueTitle}>Estoque</Text>
            {isLowStock && (
              <View style={styles.alertBadge}>
                <Ionicons name="warning" size={12} color={colors.error[500]} />
                <Text style={styles.alertText}>Baixo</Text>
              </View>
            )}
          </View>
          
          <View style={styles.estoqueInfo}>
            <Text style={styles.estoqueQuantidade}>
              {item.estoque.quantidade_atual} / {item.estoque.quantidade_maxima} un.
            </Text>
            <Text style={styles.estoqueLote}>
              Lote: {item.estoque.lote}
            </Text>
          </View>
          
          <View style={styles.estoqueProgressContainer}>
            <View style={styles.estoqueProgressBar}>
              <View
                style={[
                  styles.estoqueProgress,
                  {
                    width: `${Math.min(stockPercentage, 100)}%`,
                    backgroundColor: isLowStock ? colors.error[500] : colors.success[500],
                  },
                ]}
              />
            </View>
            <Text style={styles.estoquePercentage}>
              {stockPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>
        
        {/* Ações */}
        <View style={styles.produtoActions}>
          <Button
            size="sm"
            variant="tertiary"
            leftIcon="create"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Editar', `Editar produto: ${item.nome}`);
            }}
            style={styles.actionButton}
          >
            Editar
          </Button>
          
          <Button
            size="sm"
            variant="primary"
            leftIcon="add"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              adicionarEstoque(item);
            }}
            style={styles.actionButton}
          >
            +Estoque
          </Button>
        </View>
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
              <Text style={styles.headerTitle}>Meus Produtos</Text>
              <Text style={styles.headerSubtitle}>
                {filteredProducts.length} produtos cadastrados
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Novo Produto', 'Cadastrar novo produto');
                }}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
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
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'todos' && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedStatus('todos');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === 'todos' && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'ativo' && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedStatus('ativo');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === 'ativo' && styles.filterChipTextActive,
                ]}
              >
                Ativos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'inativo' && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedStatus('inativo');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === 'inativo' && styles.filterChipTextActive,
                ]}
              >
                Inativos
              </Text>
            </TouchableOpacity>
            
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria.id}
                style={[
                  styles.filterChip,
                  selectedCategory === categoria.id && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedCategory(selectedCategory === categoria.id ? null : categoria.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === categoria.id && styles.filterChipTextActive,
                  ]}
                >
                  {categoria.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Produtos */}
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
                <Text style={styles.modalSectionTitle}>Informações Básicas</Text>
                <Text style={styles.modalText}>SKU: {selectedProduct.sku}</Text>
                <Text style={styles.modalText}>Descrição: {selectedProduct.descricao}</Text>
                <Text style={styles.modalText}>Peso: {selectedProduct.peso}g</Text>
                {selectedProduct.codigo_barras && (
                  <Text style={styles.modalText}>Código de Barras: {selectedProduct.codigo_barras}</Text>
                )}
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Preços e Margem</Text>
                <Text style={styles.modalText}>Custo: {formatCurrency(selectedProduct.preco_custo)}</Text>
                <Text style={styles.modalText}>Venda: {formatCurrency(selectedProduct.preco_venda)}</Text>
                {selectedProduct.preco_promocional && (
                  <Text style={styles.modalText}>
                    Promocional: {formatCurrency(selectedProduct.preco_promocional)}
                  </Text>
                )}
                <Text style={styles.modalText}>Margem: {selectedProduct.margem_lucro.toFixed(1)}%</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Estoque</Text>
                <Text style={styles.modalText}>
                  Quantidade: {selectedProduct.estoque.quantidade_atual} unidades
                </Text>
                <Text style={styles.modalText}>
                  Mínimo: {selectedProduct.estoque.quantidade_minima} unidades
                </Text>
                <Text style={styles.modalText}>
                  Máximo: {selectedProduct.estoque.quantidade_maxima} unidades
                </Text>
                <Text style={styles.modalText}>Lote: {selectedProduct.estoque.lote}</Text>
                <Text style={styles.modalText}>
                  Localização: {selectedProduct.estoque.localizacao_estoque}
                </Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Performance</Text>
                <Text style={styles.modalText}>
                  Avaliação: {selectedProduct.avaliacao_media}/5 ({selectedProduct.total_avaliacoes} avaliações)
                </Text>
                <Text style={styles.modalText}>Total de Vendas: {selectedProduct.total_vendas}</Text>
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
                    Alert.alert('Editar', `Editar produto: ${selectedProduct.nome}`);
                  }}
                  style={styles.modalActionButton}
                >
                  Editar Produto
                </Button>
              </View>
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
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
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
  produtoNovoBadge: {
    position: 'absolute',
    top: -spacing[1],
    right: -spacing[1],
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  produtoNovoText: {
    color: colors.white,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
  },
  produtoPromocaoBadge: {
    position: 'absolute',
    bottom: -spacing[1],
    right: -spacing[1],
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  produtoPromocaoText: {
    color: colors.white,
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
    marginBottom: spacing[2],
  },
  produtoPrecos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
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
  produtoMargem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  margemText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.primary[500],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
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
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  alertText: {
    fontSize: typography.fontSizes.xs,
    color: colors.error[500],
    marginLeft: spacing[1],
  },
  estoqueInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  estoqueQuantidade: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  estoqueLote: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  estoqueProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  produtoActions: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
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
});

export default FornecedorProdutos; 