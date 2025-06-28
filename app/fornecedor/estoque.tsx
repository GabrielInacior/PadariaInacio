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

interface EstoqueProduto {
  id: number;
  nome: string;
  sku: string;
  categoria_nome: string;
  quantidade_atual: number;
  quantidade_minima: number;
  quantidade_maxima: number;
  localizacao_estoque: string;
  lote: string;
  data_validade: string;
  status_estoque: 'baixo' | 'normal' | 'alto';
  preco_custo: number;
  valor_total: number;
}

interface MovimentacaoEstoque {
  id: number;
  produto_nome: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  data_movimentacao: string;
  usuario_nome: string;
}

const FornecedorEstoque: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'baixo' | 'normal' | 'alto'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EstoqueProduto | null>(null);
  const [movimentacaoModal, setMovimentacaoModal] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [motivoMovimentacao, setMotivoMovimentacao] = useState('');
  
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

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar produtos com estoque
      const produtosData = await databaseService.getProdutosByFornecedor(fornecedorId);
      
      // Processar dados de estoque
      const produtosComEstoque: EstoqueProduto[] = produtosData.map(produto => {
        const valorTotal = produto.preco_custo * produto.estoque.quantidade_atual;
        let statusEstoque: 'baixo' | 'normal' | 'alto' = 'normal';
        
        if (produto.estoque.quantidade_atual <= produto.estoque.quantidade_minima) {
          statusEstoque = 'baixo';
        } else if (produto.estoque.quantidade_atual >= produto.estoque.quantidade_maxima * 0.8) {
          statusEstoque = 'alto';
        }

        return {
          id: produto.id,
          nome: produto.nome,
          sku: produto.sku,
          categoria_nome: produto.categoria || 'Sem categoria',
          quantidade_atual: produto.estoque.quantidade_atual,
          quantidade_minima: produto.estoque.quantidade_minima,
          quantidade_maxima: produto.estoque.quantidade_maxima,
          localizacao_estoque: produto.estoque.localizacao_estoque || 'N/A',
          lote: produto.estoque.lote || 'N/A',
          data_validade: produto.estoque.data_validade || 'N/A',
          status_estoque: statusEstoque,
          preco_custo: produto.preco_custo,
          valor_total: valorTotal,
        };
      });

      setProdutos(produtosComEstoque);

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
    const matchesFilter = filterStatus === 'todos' || produto.status_estoque === filterStatus;
    
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
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // Executar movimentação de estoque
  const executarMovimentacao = async () => {
    if (!selectedProduct || !quantidadeMovimentacao || !motivoMovimentacao) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const quantidade = parseInt(quantidadeMovimentacao);
      if (isNaN(quantidade) || quantidade <= 0) {
        Alert.alert('Erro', 'Quantidade deve ser um número positivo');
        return;
      }

      // Converter 'ajuste' para 'entrada' ou 'saida' baseado na diferença
      let tipoFinal = tipoMovimentacao;
      if (tipoMovimentacao === 'ajuste') {
        const diferenca = quantidade - selectedProduct.quantidade_atual;
        tipoFinal = diferenca >= 0 ? 'entrada' : 'saida';
      }

      await databaseService.updateEstoque(
        selectedProduct.id,
        quantidade,
        tipoFinal as 'entrada' | 'saida',
        motivoMovimentacao,
        fornecedorId
      );

      setMovimentacaoModal(false);
      setQuantidadeMovimentacao('');
      setMotivoMovimentacao('');
      await loadData();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Movimentação registrada com sucesso');
      
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      Alert.alert('Erro', 'Não foi possível registrar a movimentação');
    }
  };

  // Render Produto Card
  const renderProdutoCard = ({ item }: { item: EstoqueProduto }) => {
    const statusColor = item.status_estoque === 'baixo' ? colors.error[500] :
                       item.status_estoque === 'alto' ? colors.warning[500] :
                       colors.success[500];

    const progressPercentage = (item.quantidade_atual / item.quantidade_maxima) * 100;

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
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={2}>{item.nome}</Text>
            <Text style={styles.produtoSku}>SKU: {item.sku}</Text>
            <Text style={styles.produtoCategoria}>{item.categoria_nome}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {item.status_estoque.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.estoqueInfo}>
          <View style={styles.quantidadeContainer}>
            <Text style={styles.quantidadeAtual}>{item.quantidade_atual}</Text>
            <Text style={styles.quantidadeLabel}>em estoque</Text>
          </View>
          
          <View style={styles.limites}>
            <Text style={styles.limiteText}>Min: {item.quantidade_minima}</Text>
            <Text style={styles.limiteText}>Max: {item.quantidade_maxima}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progress,
                {
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage.toFixed(0)}%</Text>
        </View>

        <View style={styles.produtoFooter}>
          <View style={styles.valorInfo}>
            <Text style={styles.valorLabel}>Valor Total</Text>
            <Text style={styles.valorTotal}>{formatCurrency(item.valor_total)}</Text>
          </View>
          
          <Button
            size="sm"
            variant="primary"
            leftIcon="swap-horizontal"
            onPress={() => {
              setSelectedProduct(item);
              setMovimentacaoModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            Movimentar
          </Button>
        </View>
      </Card>
    );
  };

  // Render Movimentação Item
  const renderMovimentacaoItem = ({ item }: { item: MovimentacaoEstoque }) => {
    const tipoIcon = item.tipo === 'entrada' ? 'arrow-down' : 
                    item.tipo === 'saida' ? 'arrow-up' : 'swap-horizontal';
    const tipoColor = item.tipo === 'entrada' ? colors.success[500] : 
                     item.tipo === 'saida' ? colors.error[500] : colors.warning[500];

    return (
      <View style={styles.movimentacaoItem}>
        <View style={[styles.movimentacaoIcon, { backgroundColor: tipoColor + '20' }]}>
          <Ionicons name={tipoIcon} size={20} color={tipoColor} />
        </View>
        
        <View style={styles.movimentacaoInfo}>
          <Text style={styles.movimentacaoProduto} numberOfLines={1}>
            {item.produto_nome}
          </Text>
          <Text style={styles.movimentacaoDetalhes}>
            {item.tipo.toUpperCase()} - {item.quantidade} un.
          </Text>
          <Text style={styles.movimentacaoMotivo} numberOfLines={1}>
            {item.motivo}
          </Text>
        </View>
        
        <View style={styles.movimentacaoData}>
          <Text style={styles.dataText}>
            {formatDate(item.data_movimentacao)}
          </Text>
          <Text style={styles.usuarioText}>
            {item.usuario_nome}
          </Text>
        </View>
      </View>
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
              <Text style={styles.headerTitle}>Controle de Estoque</Text>
              <Text style={styles.headerSubtitle}>
                {filteredProducts.length} produtos
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Relatório', 'Gerar relatório de estoque');
              }}
            >
              <Ionicons name="document-text" size={24} color={colors.white} />
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
        {/* Resumo do Estoque */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          
          <View style={styles.resumoGrid}>
            <Card variant="elevated" size="sm" style={styles.resumoCard}>
              <Text style={styles.resumoValue}>
                {produtos.filter(p => p.status_estoque === 'baixo').length}
              </Text>
              <Text style={styles.resumoLabel}>Estoque Baixo</Text>
              <Ionicons name="warning" size={24} color={colors.error[500]} />
            </Card>
            
            <Card variant="elevated" size="sm" style={styles.resumoCard}>
              <Text style={styles.resumoValue}>
                {formatCurrency(produtos.reduce((sum, p) => sum + p.valor_total, 0))}
              </Text>
              <Text style={styles.resumoLabel}>Valor Total</Text>
              <Ionicons name="cash" size={24} color={colors.success[500]} />
            </Card>
          </View>
        </View>

        {/* Barra de Pesquisa e Filtros */}
        <View style={styles.section}>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {['todos', 'baixo', 'normal', 'alto'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive,
                ]}
                onPress={() => {
                  setFilterStatus(status as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Produtos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos em Estoque</Text>
          
          <FlatList
            data={filteredProducts}
            renderItem={renderProdutoCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.produtosList}
          />
        </View>

        {/* Movimentações Recentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movimentações Recentes</Text>
          
          <Card variant="elevated" size="md" style={styles.movimentacoesCard}>
            {movimentacoes.length > 0 ? (
              <FlatList
                data={movimentacoes.slice(0, 10)}
                renderItem={renderMovimentacaoItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="swap-horizontal" size={48} color={colors.neutral[400]} />
                <Text style={styles.emptyText}>Nenhuma movimentação encontrada</Text>
              </View>
            )}
          </Card>
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
                <Text style={styles.modalText}>SKU: {selectedProduct.sku}</Text>
                <Text style={styles.modalText}>Categoria: {selectedProduct.categoria_nome}</Text>
                <Text style={styles.modalText}>Localização: {selectedProduct.localizacao_estoque}</Text>
                <Text style={styles.modalText}>Lote: {selectedProduct.lote}</Text>
                <Text style={styles.modalText}>Validade: {formatDate(selectedProduct.data_validade)}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Quantidades</Text>
                <Text style={styles.modalText}>Atual: {selectedProduct.quantidade_atual} unidades</Text>
                <Text style={styles.modalText}>Mínimo: {selectedProduct.quantidade_minima} unidades</Text>
                <Text style={styles.modalText}>Máximo: {selectedProduct.quantidade_maxima} unidades</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Valores</Text>
                <Text style={styles.modalText}>Custo Unitário: {formatCurrency(selectedProduct.preco_custo)}</Text>
                <Text style={styles.modalText}>Valor Total: {formatCurrency(selectedProduct.valor_total)}</Text>
              </View>
            </ScrollView>
            
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
                  setMovimentacaoModal(true);
                }}
                style={styles.modalActionButton}
              >
                Movimentar Estoque
              </Button>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de Movimentação */}
      <Modal
        visible={movimentacaoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMovimentacaoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Movimentar Estoque</Text>
            <TouchableOpacity
              onPress={() => setMovimentacaoModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Produto</Text>
                  <Text style={styles.modalText}>{selectedProduct.nome}</Text>
                  <Text style={styles.modalText}>Estoque Atual: {selectedProduct.quantidade_atual} unidades</Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Tipo de Movimentação</Text>
                  <View style={styles.tipoMovimentacaoContainer}>
                    {['entrada', 'saida', 'ajuste'].map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.tipoButton,
                          tipoMovimentacao === tipo && styles.tipoButtonActive,
                        ]}
                        onPress={() => setTipoMovimentacao(tipo as any)}
                      >
                        <Text
                          style={[
                            styles.tipoButtonText,
                            tipoMovimentacao === tipo && styles.tipoButtonTextActive,
                          ]}
                        >
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Quantidade</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Digite a quantidade"
                    value={quantidadeMovimentacao}
                    onChangeText={setQuantidadeMovimentacao}
                    keyboardType="numeric"
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Motivo</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="Descreva o motivo da movimentação"
                    value={motivoMovimentacao}
                    onChangeText={setMotivoMovimentacao}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              variant="tertiary"
              onPress={() => setMovimentacaoModal(false)}
              style={styles.modalActionButton}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onPress={executarMovimentacao}
              style={styles.modalActionButton}
            >
              Confirmar
            </Button>
          </View>
        </View>
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
  resumoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumoCard: {
    flex: 1,
    marginHorizontal: spacing[1],
    alignItems: 'center',
    padding: spacing[4],
  },
  resumoValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  resumoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: spacing[3],
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
  produtosList: {
    paddingBottom: spacing[4],
  },
  produtoCard: {
    marginBottom: spacing[4],
  },
  produtoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  produtoInfo: {
    flex: 1,
    marginRight: spacing[3],
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
    color: colors.neutral[500],
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
  estoqueInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  quantidadeContainer: {
    alignItems: 'center',
  },
  quantidadeAtual: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  quantidadeLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
  },
  limites: {
    alignItems: 'flex-end',
  },
  limiteText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: radii.sm,
    marginRight: spacing[2],
  },
  progress: {
    height: '100%',
    borderRadius: radii.sm,
  },
  progressText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    minWidth: 40,
  },
  produtoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valorInfo: {
    flex: 1,
  },
  valorLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  valorTotal: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.success[600],
  },
  movimentacoesCard: {
    padding: spacing[4],
  },
  movimentacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  movimentacaoIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  movimentacaoInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  movimentacaoProduto: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  movimentacaoDetalhes: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  movimentacaoMotivo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  movimentacaoData: {
    alignItems: 'flex-end',
  },
  dataText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  usuarioText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
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
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipoMovimentacaoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginHorizontal: spacing[1],
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tipoButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  tipoButtonTextActive: {
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
});

export default FornecedorEstoque;