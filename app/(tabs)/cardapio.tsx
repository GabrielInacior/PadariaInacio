import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  RefreshControl,
  Dimensions,
  Alert,
  StyleSheet,
  StatusBar,
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
  useAnimatedScrollHandler,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { Produto, Categoria, FiltrosProdutos } from '../../types';
import { databaseService } from '../../services/database';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

const CardapioScreen = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProdutos>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [categoriaAtiva, busca, filtros, produtos]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const [produtosData, categoriasData] = await Promise.all([
        databaseService.getProdutos(),
        databaseService.getCategorias(),
      ]);
      
      console.log('Produtos carregados:', produtosData.length);
      console.log('Categorias carregadas:', categoriasData.length);
      
      setProdutos(produtosData);
      
      // Contar produtos por categoria
      const categoriasComContador = categoriasData.map(categoria => {
        const totalProdutos = produtosData.filter(p => p.categoria_id === categoria.id && p.status === 'ativo').length;
        return { ...categoria, totalProdutos };
      });
      
      setCategorias([
        { 
          id: 0, 
          nome: 'Todos', 
          ativo: true, 
          ordem_exibicao: 0,
          totalProdutos: produtosData.filter(p => p.status === 'ativo').length
        } as Categoria & { totalProdutos: number },
        ...categoriasComContador
      ]);
      
      // Definir categoria inicial como "Todos"
      setCategoriaAtiva(0);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar o cardápio');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    try {
      let produtosFiltrados = produtos.filter(p => p.status === 'ativo');
      
      // Filtrar por categoria
      if (categoriaAtiva && categoriaAtiva !== 0) {
        produtosFiltrados = produtosFiltrados.filter(p => p.categoria_id === categoriaAtiva);
      }
      
      // Filtrar por busca
      if (busca.trim()) {
        const termoBusca = busca.toLowerCase();
        produtosFiltrados = produtosFiltrados.filter(p => 
          p.nome.toLowerCase().includes(termoBusca) ||
          p.descricao.toLowerCase().includes(termoBusca) ||
          (p.tags && p.tags.toLowerCase().includes(termoBusca))
        );
      }
      
      // Aplicar outros filtros
      if (filtros.preco_min) {
        produtosFiltrados = produtosFiltrados.filter(p => {
          const preco = p.preco_promocional && p.preco_promocional > 0 ? p.preco_promocional : p.preco_venda;
          return preco >= filtros.preco_min!;
        });
      }
      
      if (filtros.preco_max) {
        produtosFiltrados = produtosFiltrados.filter(p => {
          const preco = p.preco_promocional && p.preco_promocional > 0 ? p.preco_promocional : p.preco_venda;
          return preco <= filtros.preco_max!;
        });
      }
      
      if (filtros.apenas_promocao) {
        produtosFiltrados = produtosFiltrados.filter(p => p.preco_promocional && p.preco_promocional > 0);
      }
      
      if (filtros.apenas_destaque) {
        produtosFiltrados = produtosFiltrados.filter(p => p.destaque);
      }
      
      if (filtros.apenas_novos) {
        produtosFiltrados = produtosFiltrados.filter(p => p.novo);
      }
      
      // Ordenação
      switch (filtros.ordenacao) {
        case 'nome':
          produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
          break;
        case 'preco_asc':
          produtosFiltrados.sort((a, b) => {
            const precoA = a.preco_promocional && a.preco_promocional > 0 ? a.preco_promocional : a.preco_venda;
            const precoB = b.preco_promocional && b.preco_promocional > 0 ? b.preco_promocional : b.preco_venda;
            return precoA - precoB;
          });
          break;
        case 'preco_desc':
          produtosFiltrados.sort((a, b) => {
            const precoA = a.preco_promocional && a.preco_promocional > 0 ? a.preco_promocional : a.preco_venda;
            const precoB = b.preco_promocional && b.preco_promocional > 0 ? b.preco_promocional : b.preco_venda;
            return precoB - precoA;
          });
          break;
        case 'avaliacao':
          produtosFiltrados.sort((a, b) => (b.avaliacao_media || 0) - (a.avaliacao_media || 0));
          break;
        case 'vendas':
          produtosFiltrados.sort((a, b) => (b.total_vendas || 0) - (a.total_vendas || 0));
          break;
        default:
          produtosFiltrados.sort((a, b) => {
            if (a.destaque && !b.destaque) return -1;
            if (!a.destaque && b.destaque) return 1;
            if (a.novo && !b.novo) return -1;
            if (!a.novo && b.novo) return 1;
            return a.nome.localeCompare(b.nome);
          });
      }
      
      console.log(`Filtros aplicados: ${produtosFiltrados.length} produtos encontrados`);
      setProdutosFiltrados(produtosFiltrados);
      
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      setProdutosFiltrados([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selecionarCategoria = (categoriaId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoriaAtiva(categoriaId);
    console.log('Categoria selecionada:', categoriaId);
  };

  const adicionarAoCarrinho = async (produto: Produto) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', `${produto.nome} adicionado ao carrinho!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar ao carrinho');
    }
  };

  const toggleFiltroRapido = (filtro: keyof FiltrosProdutos) => {
    setFiltros(prev => ({
      ...prev,
      [filtro]: !prev[filtro]
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderCategoria = ({ item: categoria, index }: { item: Categoria & { totalProdutos?: number }; index: number }) => {
    const isActive = categoriaAtiva === categoria.id;
    
    return (
      <Animated.View entering={FadeInRight.delay(index * 100)}>
        <TouchableOpacity
          onPress={() => selecionarCategoria(categoria.id)}
          style={[
            styles.categoriaButton,
            isActive && styles.categoriaButtonActive
          ]}
        >
          <Text style={[
            styles.categoriaText,
            isActive && styles.categoriaTextActive
          ]}>
            {categoria.nome}
          </Text>
          {categoria.totalProdutos !== undefined && (
            <Text style={[
              styles.categoriaCount,
              isActive && styles.categoriaCountActive
            ]}>
              ({categoria.totalProdutos})
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProdutoGrid = ({ item: produto, index }: { item: Produto; index: number }) => {
    const temPromocao = produto.preco_promocional && produto.preco_promocional > 0;
    const desconto = temPromocao ? 
      Math.round(((produto.preco_venda - produto.preco_promocional!) / produto.preco_venda) * 100) : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.gridItem}>
        <TouchableOpacity
          style={styles.produtoCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Produto', `Você clicou em: ${produto.nome}`);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.produtoImageContainer}>
            <Image
              source={{ uri: produto.imagens ? JSON.parse(produto.imagens)[0] : 'https://via.placeholder.com/200' }}
              style={styles.produtoImage}
              resizeMode="cover"
            />
            
            {/* Badges */}
            <View style={styles.badgesContainer}>
              {produto.novo && (
                <View style={[styles.badge, styles.badgeNovo]}>
                  <Text style={styles.badgeText}>NOVO</Text>
                </View>
              )}
              {temPromocao && (
                <View style={[styles.badge, styles.badgeDesconto]}>
                  <Text style={styles.badgeText}>-{desconto}%</Text>
                </View>
              )}
            </View>

            {/* Favoritar */}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="heart-outline" size={16} color={theme.colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.produtoContent}>
            <Text style={styles.produtoNome} numberOfLines={2}>
              {produto.nome}
            </Text>
            
            <Text style={styles.produtoDescricao} numberOfLines={2}>
              {produto.descricao}
            </Text>

            {/* Avaliação */}
            <View style={styles.avaliacaoContainer}>
              <Ionicons name="star" size={12} color={theme.colors.warning[500]} />
              <Text style={styles.avaliacaoText}>
                {produto.avaliacao_media.toFixed(1)} ({produto.total_avaliacoes})
              </Text>
            </View>

            {/* Preços */}
            <View style={styles.precoContainer}>
              <View style={styles.precoInfo}>
                {temPromocao && (
                  <Text style={styles.precoOriginal}>
                    R$ {produto.preco_venda.toFixed(2)}
                  </Text>
                )}
                <Text style={[
                  styles.precoAtual,
                  temPromocao ? styles.precoPromocional : undefined
                ]}>
                  R$ {(temPromocao ? produto.preco_promocional! : produto.preco_venda).toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => adicionarAoCarrinho(produto)}
                style={styles.addButton}
              >
                <Ionicons name="add" size={16} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderProdutoList = ({ item: produto, index }: { item: Produto; index: number }) => {
    const temPromocao = produto.preco_promocional && produto.preco_promocional > 0;
    const desconto = temPromocao ? 
      Math.round(((produto.preco_venda - produto.preco_promocional!) / produto.preco_venda) * 100) : 0;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.listItem}>
        <TouchableOpacity
          style={styles.produtoListCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Produto', `Você clicou em: ${produto.nome}`);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.produtoListContent}>
            <Image
              source={{ uri: produto.imagens ? JSON.parse(produto.imagens)[0] : 'https://via.placeholder.com/200' }}
              style={styles.produtoListImage}
              resizeMode="cover"
            />
            
            <View style={styles.produtoListInfo}>
              <View style={styles.produtoListHeader}>
                <Text style={styles.produtoListNome} numberOfLines={1}>
                  {produto.nome}
                </Text>
                
                {/* Badges pequenas */}
                <View style={styles.listBadgesContainer}>
                  {produto.novo && (
                    <View style={[styles.smallBadge, styles.badgeNovo]}>
                      <Text style={styles.smallBadgeText}>NOVO</Text>
                    </View>
                  )}
                  {temPromocao && (
                    <View style={[styles.smallBadge, styles.badgeDesconto]}>
                      <Text style={styles.smallBadgeText}>-{desconto}%</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={styles.produtoListDescricao} numberOfLines={2}>
                {produto.descricao}
              </Text>

              <View style={styles.produtoListFooter}>
                <View style={styles.avaliacaoListContainer}>
                  <Ionicons name="star" size={12} color={theme.colors.warning[500]} />
                  <Text style={styles.avaliacaoListText}>
                    {produto.avaliacao_media.toFixed(1)} ({produto.total_avaliacoes})
                  </Text>
                </View>

                <View style={styles.precoListContainer}>
                  {temPromocao && (
                    <Text style={styles.precoListOriginal}>
                      R$ {produto.preco_venda.toFixed(2)}
                    </Text>
                  )}
                  <Text style={[
                    styles.precoListAtual,
                    temPromocao ? styles.precoListPromocional : undefined
                  ]}>
                    R$ {(temPromocao ? produto.preco_promocional! : produto.preco_venda).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => adicionarAoCarrinho(produto)}
                  style={styles.addListButton}
                >
                  <Ionicons name="add" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando cardápio...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />
      
      {/* Header Premium */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.secondary[500]] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Cardápio</Text>
              <Text style={styles.headerSubtitle}>
                {produtosFiltrados.length} produtos disponíveis
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={styles.headerButton}
              >
                <Ionicons 
                  name={viewMode === 'grid' ? 'list' : 'grid'} 
                  size={24} 
                  color={theme.colors.white} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de busca */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              placeholderTextColor={theme.colors.gray[400]}
              value={busca}
              onChangeText={setBusca}
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.gray[400]} />
              </TouchableOpacity>
            )}
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
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {/* Categorias */}
        <View style={styles.categoriasSection}>
          <FlatList
            data={categorias}
            renderItem={renderCategoria}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasList}
          />
        </View>

        {/* Filtros Rápidos */}
        <View style={styles.filtrosSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => toggleFiltroRapido('apenas_promocao')}
              style={[
                styles.filtroButton,
                filtros.apenas_promocao && styles.filtroButtonActive
              ]}
            >
              <Ionicons 
                name="pricetag" 
                size={16} 
                color={filtros.apenas_promocao ? theme.colors.white : theme.colors.red[500]} 
              />
              <Text style={[
                styles.filtroText,
                filtros.apenas_promocao && styles.filtroTextActive
              ]}>
                Promoções
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFiltroRapido('apenas_novos')}
              style={[
                styles.filtroButton,
                filtros.apenas_novos && styles.filtroButtonActive
              ]}
            >
              <Ionicons 
                name="sparkles" 
                size={16} 
                color={filtros.apenas_novos ? theme.colors.white : theme.colors.success[500]} 
              />
              <Text style={[
                styles.filtroText,
                filtros.apenas_novos && styles.filtroTextActive
              ]}>
                Novidades
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFiltroRapido('apenas_destaque')}
              style={[
                styles.filtroButton,
                filtros.apenas_destaque && styles.filtroButtonActive
              ]}
            >
              <Ionicons 
                name="star" 
                size={16} 
                color={filtros.apenas_destaque ? theme.colors.white : theme.colors.warning[500]} 
              />
              <Text style={[
                styles.filtroText,
                filtros.apenas_destaque && styles.filtroTextActive
              ]}>
                Destaques
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Estatísticas dos Resultados */}
        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            {produtosFiltrados.length === 0 ? 'Nenhum produto encontrado' : 
             produtosFiltrados.length === 1 ? '1 produto encontrado' :
             `${produtosFiltrados.length} produtos encontrados`}
          </Text>
          {categoriaAtiva && categoriaAtiva !== 0 && (
            <Text style={styles.statsSubtext}>
              na categoria {categorias.find(c => c.id === categoriaAtiva)?.nome}
            </Text>
          )}
        </View>

        {/* Produtos */}
        <View style={styles.produtosContainer}>
          <FlatList
            data={produtosFiltrados}
            renderItem={viewMode === 'grid' ? renderProdutoGrid : renderProdutoList}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.produtosList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="search" 
                  size={64} 
                  color={theme.colors.gray[300]} 
                />
                <Text style={styles.emptyTitle}>
                  Nenhum produto encontrado
                </Text>
                <Text style={styles.emptySubtitle}>
                  {busca.trim() ? 
                    `Não encontramos produtos com "${busca}"` :
                    'Tente ajustar os filtros ou escolher outra categoria'
                  }
                </Text>
                {(busca.trim() || categoriaAtiva !== 0 || Object.values(filtros).some(Boolean)) && (
                  <TouchableOpacity
                    onPress={() => {
                      setBusca('');
                      setCategoriaAtiva(0);
                      setFiltros({});
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>
                      Limpar filtros
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white + '80',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: theme.colors.white + '20',
    borderRadius: 20,
    padding: 8,
    marginLeft: 12,
  },
  searchContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  categoriasSection: {
    paddingVertical: 16,
  },
  categoriasList: {
    paddingHorizontal: 20,
  },
  categoriaButton: {
    marginRight: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  categoriaButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  categoriaText: {
    color: theme.colors.text,
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'center',
  },
  categoriaTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  categoriaCount: {
    color: theme.colors.gray[500],
    fontSize: 12,
    marginTop: 2,
  },
  categoriaCountActive: {
    color: theme.colors.white,
  },
  filtrosSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filtroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
  },
  filtroButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  filtroText: {
    marginLeft: 6,
    color: theme.colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  filtroTextActive: {
    color: theme.colors.white,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statsSubtext: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  produtosContainer: {
    paddingHorizontal: 20,
  },
  produtosList: {
    paddingBottom: 20,
  },
  
  // Grid styles
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    marginRight: 8,
  },
  produtoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  produtoImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  produtoImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  badgeNovo: {
    backgroundColor: theme.colors.success[500],
  },
  badgeDesconto: {
    backgroundColor: theme.colors.red[500],
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 6,
  },
  produtoContent: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  produtoDescricao: {
    fontSize: 12,
    color: theme.colors.gray[600],
    marginBottom: 8,
  },
  avaliacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avaliacaoText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    marginLeft: 4,
  },
  precoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  precoInfo: {
    flex: 1,
  },
  precoOriginal: {
    fontSize: 12,
    color: theme.colors.gray[500],
    textDecorationLine: 'line-through',
  },
  precoAtual: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  precoPromocional: {
    color: theme.colors.red[500],
  },
  addButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 20,
    padding: 8,
  },

  // List styles
  listItem: {
    marginBottom: 12,
  },
  produtoListCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  produtoListContent: {
    flexDirection: 'row',
  },
  produtoListImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
  },
  produtoListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  produtoListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  produtoListNome: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  listBadgesContainer: {
    flexDirection: 'row',
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  smallBadgeText: {
    color: theme.colors.white,
    fontSize: 8,
    fontWeight: '600',
  },
  produtoListDescricao: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 8,
  },
  produtoListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avaliacaoListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avaliacaoListText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    marginLeft: 4,
  },
  precoListContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  precoListOriginal: {
    fontSize: 12,
    color: theme.colors.gray[500],
    textDecorationLine: 'line-through',
  },
  precoListAtual: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  precoListPromocional: {
    color: theme.colors.red[500],
  },
  addListButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 20,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[500],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.gray[400],
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 25,
  },
  clearButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default CardapioScreen; 