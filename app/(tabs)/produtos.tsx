import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../../services/database';
import { Produto, Categoria, FiltrosProdutos } from '../../types';

// Tipo local para filtros com propriedades extras
interface FiltrosProdutoLocal extends FiltrosProdutos {
  categoria?: string;
  promocao?: boolean;
  disponivel?: boolean;
  avaliacao?: number;
  direcao?: 'asc' | 'desc';
  precoMin?: number;
  precoMax?: number;
}

export default function Produtos() {
  const router = useRouter();
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosProdutoLocal>({
    categoria_id: categoria ? parseInt(categoria) : undefined,
    ordenacao: 'nome',
    direcao: 'asc'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categoria) {
      setFiltros(prev => ({ ...prev, categoria }));
    }
  }, [categoria]);

  useEffect(() => {
    aplicarFiltros();
  }, [produtos, searchText, filtros]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [produtosData, categoriasData] = await Promise.all([
        databaseService.getProdutos(),
        databaseService.getCategorias(),
      ]);

      setProdutos(produtosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const aplicarFiltros = () => {
    let produtosFiltrados = [...produtos];

    // Filtro por texto de pesquisa
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.nome.toLowerCase().includes(searchLower) ||
        produto.descricao.toLowerCase().includes(searchLower) ||
        produto.categoria.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoria
    if (filtros.categoria_id) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.categoria_id === filtros.categoria_id
      );
    }

    // Filtro por preço
    if (filtros.preco_min !== undefined) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.preco >= filtros.preco_min!
      );
    }
    if (filtros.preco_max !== undefined) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.preco <= filtros.preco_max!
      );
    }

    // Filtro por promoção
    if (filtros.promocao !== undefined) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.promocao === filtros.promocao
      );
    }

    // Filtro por disponibilidade
    if (filtros.disponivel !== undefined) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        filtros.disponivel ? produto.estoque > 0 : produto.estoque === 0
      );
    }

    // Filtro por avaliação
    if (filtros.avaliacao_min !== undefined) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.avaliacao_media >= filtros.avaliacao_min!
      );
    }

    // Ordenação
    if (filtros.ordenacao) {
      produtosFiltrados.sort((a, b) => {
        let valueA: any, valueB: any;
        
        switch (filtros.ordenacao) {
          case 'nome':
            valueA = a.nome.toLowerCase();
            valueB = b.nome.toLowerCase();
            break;
          case 'preco_asc':
          case 'preco_desc':
            valueA = a.preco;
            valueB = b.preco;
            break;
          case 'avaliacao':
            valueA = a.avaliacao_media;
            valueB = b.avaliacao_media;
            break;
          case 'vendas':
            valueA = a.vendas;
            valueB = b.vendas;
            break;
          default:
            return 0;
        }

        if (filtros.direcao === 'desc') {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        } else {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        }
      });
    }

    setProdutosFiltrados(produtosFiltrados);
  };

  const limparFiltros = () => {
    setFiltros({
      ordenacao: 'nome',
      direcao: 'asc'
    });
    setSearchText('');
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.produtoCard}
      onPress={() => router.push(`/produto/${item.id}`)}
    >
      <View style={styles.produtoHeader}>
        <View style={styles.produtoImagePlaceholder}>
          <Text style={styles.produtoEmoji}>
            {item.categoria === 'Pães' ? '🥖' :
             item.categoria === 'Doces' ? '🍰' :
             item.categoria === 'Salgados' ? '🥐' :
             item.categoria === 'Bebidas' ? '☕' :
             item.categoria === 'Bolos' ? '🎂' : '🍞'}
          </Text>
        </View>
        
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome}>{item.nome}</Text>
          <Text style={styles.produtoDescricao} numberOfLines={2}>
            {item.descricao}
          </Text>
          <Text style={styles.produtoCategoria}>{item.categoria}</Text>
        </View>
      </View>

      <View style={styles.produtoFooter}>
        <View style={styles.precoContainer}>
          {item.promocao && item.preco_promocional ? (
            <>
              <Text style={styles.precoOriginal}>R$ {item.preco.toFixed(2)}</Text>
              <Text style={styles.precoPromocional}>R$ {item.preco_promocional.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.produtoMeta}>
          {item.estoque > 0 ? (
            <Text style={styles.estoque}>Estoque: {item.estoque}</Text>
          ) : (
            <Text style={styles.semEstoque}>Sem estoque</Text>
          )}
          
          {item.avaliacao_media > 0 && (
            <View style={styles.avaliacaoContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.avaliacao}>
                {item.avaliacao_media.toFixed(1)} ({item.total_avaliacoes})
              </Text>
            </View>
          )}
        </View>
      </View>

      {item.promocao && (
        <View style={styles.promocaoBadge}>
          <Text style={styles.promocaoText}>PROMOÇÃO</Text>
        </View>
      )}

      {item.destaque && (
        <View style={styles.destaqueBadge}>
          <Ionicons name="star" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategoria = ({ item }: { item: Categoria }) => (
    <TouchableOpacity
      style={[
        styles.categoriaChip,
        filtros.categoria === item.nome && styles.categoriaChipActive
      ]}
      onPress={() => {
        if (filtros.categoria === item.nome) {
          setFiltros(prev => ({ ...prev, categoria: undefined }));
        } else {
          setFiltros(prev => ({ ...prev, categoria: item.nome }));
        }
      }}
    >
      <Text style={[
        styles.categoriaChipText,
        filtros.categoria === item.nome && styles.categoriaChipTextActive
      ]}>
        {item.nome} ({item.totalProdutos})
      </Text>
    </TouchableOpacity>
  );

  const FiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Filtro de Preço */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Faixa de Preço</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Mín"
                value={filtros.precoMin?.toString() || ''}
                onChangeText={(text) => {
                  const value = parseFloat(text) || undefined;
                  setFiltros(prev => ({ ...prev, precoMin: value }));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>até</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Máx"
                value={filtros.precoMax?.toString() || ''}
                onChangeText={(text) => {
                  const value = parseFloat(text) || undefined;
                  setFiltros(prev => ({ ...prev, precoMax: value }));
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Filtros Booleanos */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtros</Text>
            
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setFiltros(prev => ({ 
                ...prev, 
                promocao: prev.promocao === true ? undefined : true 
              }))}
            >
              <Ionicons 
                name={filtros.promocao === true ? "checkbox" : "checkbox-outline"} 
                size={20} 
                color="#8B4513" 
              />
              <Text style={styles.filterOptionText}>Apenas em promoção</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setFiltros(prev => ({ 
                ...prev, 
                disponivel: prev.disponivel === true ? undefined : true 
              }))}
            >
              <Ionicons 
                name={filtros.disponivel === true ? "checkbox" : "checkbox-outline"} 
                size={20} 
                color="#8B4513" 
              />
              <Text style={styles.filterOptionText}>Apenas disponíveis</Text>
            </TouchableOpacity>
          </View>

          {/* Ordenação */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Ordenar por</Text>
            {[
              { key: 'nome', label: 'Nome' },
              { key: 'preco', label: 'Preço' },
              { key: 'avaliacao', label: 'Avaliação' },
              { key: 'vendas', label: 'Mais vendidos' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterOption}
                onPress={() => setFiltros(prev => ({ 
                  ...prev, 
                  ordenacao: option.key as any 
                }))}
              >
                <Ionicons 
                  name={filtros.ordenacao === option.key ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color="#8B4513" 
                />
                <Text style={styles.filterOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Direção da ordenação */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Direção</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setFiltros(prev => ({ 
                ...prev, 
                direcao: prev.direcao === 'asc' ? 'desc' : 'asc' 
              }))}
            >
              <Ionicons 
                name={filtros.direcao === 'asc' ? "arrow-up" : "arrow-down"} 
                size={20} 
                color="#8B4513" 
              />
              <Text style={styles.filterOptionText}>
                {filtros.direcao === 'asc' ? 'Crescente' : 'Decrescente'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={limparFiltros}>
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header de pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Chips de categorias */}
      <View style={styles.categoriasContainer}>
        <FlatList
          data={categorias}
          renderItem={renderCategoria}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasContent}
        />
      </View>

      {/* Resultados */}
      <View style={styles.resultadosHeader}>
        <Text style={styles.resultadosText}>
          {produtosFiltrados.length} produto(s) encontrado(s)
        </Text>
        {(searchText || Object.keys(filtros).some(key => filtros[key as keyof FiltrosProdutoLocal] !== undefined && key !== 'ordenacao' && key !== 'direcao')) && (
          <TouchableOpacity onPress={limparFiltros}>
            <Text style={styles.limparFiltros}>Limpar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de produtos */}
      <FlatList
        data={produtosFiltrados}
        renderItem={renderProduto}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.produtosList}
        showsVerticalScrollIndicator={false}
      />

      <FiltersModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriasContainer: {
    paddingBottom: 16,
  },
  categoriasContent: {
    paddingHorizontal: 16,
  },
  categoriaChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoriaChipActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  categoriaChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoriaChipTextActive: {
    color: '#fff',
  },
  resultadosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultadosText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  limparFiltros: {
    fontSize: 14,
    color: '#8B4513',
    textDecorationLine: 'underline',
  },
  produtosList: {
    paddingHorizontal: 16,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  produtoHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  produtoImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  produtoEmoji: {
    fontSize: 24,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  produtoDescricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  produtoCategoria: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  produtoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  precoContainer: {
    flex: 1,
  },
  preco: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  precoOriginal: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  precoPromocional: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  produtoMeta: {
    alignItems: 'flex-end',
  },
  estoque: {
    fontSize: 12,
    color: '#27ae60',
    marginBottom: 4,
  },
  semEstoque: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 4,
  },
  avaliacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avaliacao: {
    fontSize: 12,
    color: '#666',
  },
  promocaoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  promocaoText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  destaqueBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f39c12',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#666',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  clearButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 