import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../../services/database';
import { authService } from '../../services/auth';
import { Produto, Categoria } from '../../types';

export default function AdminProdutos() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'preco' | 'estoque' | 'vendas'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    checkPermissions();
    loadData();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [produtos, searchText, selectedCategory, sortBy, sortOrder]);

  const checkPermissions = async () => {
    const user = await authService.getCurrentUser();
    if (!user || user.tipo !== 'admin') {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área');
      router.replace('/(tabs)');
      return;
    }
  };

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
      console.error('Error loading data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
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

    // Filtro por texto
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.nome.toLowerCase().includes(searchLower) ||
        produto.descricao.toLowerCase().includes(searchLower) ||
        produto.categoria.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoria
    if (selectedCategory) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.categoria === selectedCategory
      );
    }

    // Ordenação
    produtosFiltrados.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'nome':
          valueA = a.nome.toLowerCase();
          valueB = b.nome.toLowerCase();
          break;
        case 'preco':
          valueA = a.preco;
          valueB = b.preco;
          break;
        case 'estoque':
          valueA = a.estoque;
          valueB = b.estoque;
          break;
        case 'vendas':
          valueA = a.vendas || 0;
          valueB = b.vendas || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    setProdutosFiltrados(produtosFiltrados);
  };

  const toggleProdutoStatus = async (produtoId: number, novoStatus: boolean) => {
    try {
      // Aqui você implementaria a lógica para ativar/desativar produto
      Alert.alert('Sucesso', `Produto ${novoStatus ? 'ativado' : 'desativado'} com sucesso`);
      await loadData();
    } catch (error) {
      console.error('Error toggling product status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status do produto');
    }
  };

  const deleteProduto = async (produtoId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Aqui você implementaria a lógica para excluir produto
              Alert.alert('Sucesso', 'Produto excluído com sucesso');
              await loadData();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Erro', 'Não foi possível excluir o produto');
            }
          },
        },
      ]
    );
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.produtoCard}>
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
          <View style={styles.produtoTitleRow}>
            <Text style={styles.produtoNome}>{item.nome}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.ativo ? '#27ae60' : '#e74c3c' }
            ]}>
              <Text style={styles.statusText}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.produtoDescricao} numberOfLines={2}>
            {item.descricao}
          </Text>
          
          <View style={styles.produtoMeta}>
            <Text style={styles.produtoCategoria}>{item.categoria}</Text>
            <Text style={styles.produtoSku}>SKU: {item.sku || `PROD-${item.id}`}</Text>
          </View>
        </View>
      </View>

      <View style={styles.produtoStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>R$ {(item.preco || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Preço</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: item.estoque <= (item.estoqueMinimo || 5) ? '#e74c3c' : '#27ae60' }
          ]}>
            {item.estoque}
          </Text>
          <Text style={styles.statLabel}>Estoque</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.vendas || 0}</Text>
          <Text style={styles.statLabel}>Vendas</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.statValue}>{(item.avaliacao_media || 0).toFixed(1)}</Text>
          </View>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
      </View>

      <View style={styles.produtoActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/admin/produtos/${item.id}`)}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.ativo ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleProdutoStatus(item.id, !item.ativo)}
        >
          <Ionicons 
            name={item.ativo ? 'pause' : 'play'} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>
            {item.ativo ? 'Desativar' : 'Ativar'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteProduto(item.id)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
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
    </View>
  );

  const FiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros e Ordenação</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Categoria */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Categoria</Text>
            <TouchableOpacity
              style={[
                styles.filterOption,
                !selectedCategory && styles.filterOptionActive
              ]}
              onPress={() => setSelectedCategory('')}
            >
              <Ionicons 
                name={!selectedCategory ? "radio-button-on" : "radio-button-off"} 
                size={20} 
                color="#8B4513" 
              />
              <Text style={styles.filterOptionText}>Todas</Text>
            </TouchableOpacity>
            
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria.id}
                style={[
                  styles.filterOption,
                  selectedCategory === categoria.nome && styles.filterOptionActive
                ]}
                onPress={() => setSelectedCategory(categoria.nome)}
              >
                <Ionicons 
                  name={selectedCategory === categoria.nome ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color="#8B4513" 
                />
                <Text style={styles.filterOptionText}>
                  {categoria.nome} ({categoria.totalProdutos || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ordenação */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Ordenar por</Text>
            {[
              { key: 'nome', label: 'Nome' },
              { key: 'preco', label: 'Preço' },
              { key: 'estoque', label: 'Estoque' },
              { key: 'vendas', label: 'Vendas' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterOption}
                onPress={() => setSortBy(option.key as any)}
              >
                <Ionicons 
                  name={sortBy === option.key ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color="#8B4513" 
                />
                <Text style={styles.filterOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Direção */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Direção</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Ionicons 
                name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} 
                size={20} 
                color="#8B4513" 
              />
              <Text style={styles.filterOptionText}>
                {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalFooter}>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Produtos</Text>
        <TouchableOpacity onPress={() => router.push('/admin/produtos/novo')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Busca e filtros */}
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

      {/* Resumo */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {produtosFiltrados.length} produto(s) encontrado(s)
        </Text>
        <View style={styles.summaryStats}>
          <Text style={styles.summaryStatText}>
            Ativos: {produtosFiltrados.filter(p => p.ativo).length}
          </Text>
          <Text style={styles.summaryStatText}>
            Baixo estoque: {produtosFiltrados.filter(p => p.estoque <= (p.estoqueMinimo || 5)).length}
          </Text>
        </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  summaryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryStatText: {
    fontSize: 14,
    color: '#666',
  },
  produtosList: {
    padding: 16,
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
  produtoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  produtoDescricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  produtoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  produtoCategoria: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  produtoSku: {
    fontSize: 12,
    color: '#999',
  },
  produtoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  produtoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  activateButton: {
    backgroundColor: '#27ae60',
  },
  deactivateButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
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
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
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
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  applyButton: {
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