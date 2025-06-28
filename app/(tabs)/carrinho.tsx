import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../../services/database';
import { authService } from '../../services/auth';
import { ItemCarrinho, Carrinho } from '../../types';
import { theme } from '../../utils/theme';

export default function CarrinhoScreen() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCarrinho();
  }, []);

  const loadCarrinho = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      
      if (!user) {
        Alert.alert('Erro', 'Usuário não encontrado');
        return;
      }

      // Carregar itens do carrinho diretamente
      const itensCarrinho = await databaseService.getItensCarrinho(user.id);
      setItens(itensCarrinho || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert('Erro', 'Não foi possível carregar o carrinho');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCarrinho();
    setRefreshing(false);
  };

  const atualizarQuantidade = async (itemId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      await removerItem(itemId);
      return;
    }

    try {
      // Aqui você implementaria a lógica para atualizar a quantidade no banco
      await loadCarrinho();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
    }
  };

  const removerItem = async (itemId: number) => {
    try {
      // Aqui você implementaria a lógica para remover o item do banco
      await loadCarrinho();
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Erro', 'Não foi possível remover o item');
    }
  };

  const calcularSubtotal = () => {
    return itens.reduce((total, item) => total + (item.preco_unitario * item.quantidade), 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const desconto = 0; // Implementar lógica de desconto
    const frete = 5.00; // Implementar lógica de frete
    return subtotal - desconto + frete;
  };

  const finalizarPedido = () => {
    if (itens.length === 0) {
      Alert.alert('Aviso', 'Seu carrinho está vazio');
      return;
    }

    router.push('/checkout');
  };

  const renderItem = ({ item }: { item: ItemCarrinho }) => {
    const produto = item.produto;
    if (!produto) return null;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.produtoImagePlaceholder}>
            <Text style={styles.produtoEmoji}>
              {produto.categoria === 'Pães' ? '🥖' :
               produto.categoria === 'Doces' ? '🍰' :
               produto.categoria === 'Salgados' ? '🥐' :
               produto.categoria === 'Bebidas' ? '☕' :
               produto.categoria === 'Bolos' ? '🎂' : '🍞'}
            </Text>
          </View>
          
          <View style={styles.itemInfo}>
            <Text style={styles.itemNome}>{produto.nome}</Text>
            <Text style={styles.itemDescricao} numberOfLines={2}>
              {produto.descricao}
            </Text>
            <Text style={styles.itemPreco}>R$ {item.preco_unitario.toFixed(2)} cada</Text>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removerItem(item.id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.quantidadeContainer}>
            <TouchableOpacity
              style={styles.quantidadeButton}
              onPress={() => atualizarQuantidade(item.id, item.quantidade - 1)}
            >
              <Ionicons name="remove" size={20} color="#8B4513" />
            </TouchableOpacity>
            
            <Text style={styles.quantidade}>{item.quantidade}</Text>
            
            <TouchableOpacity
              style={styles.quantidadeButton}
              onPress={() => atualizarQuantidade(item.id, item.quantidade + 1)}
            >
              <Ionicons name="add" size={20} color="#8B4513" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtotal}>
            R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
          </Text>
        </View>

        {item.observacoes && (
          <View style={styles.observacoesContainer}>
            <Text style={styles.observacoesLabel}>Observações:</Text>
            <Text style={styles.observacoes}>{item.observacoes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
      <Text style={styles.emptySubtitle}>
        Adicione produtos para começar suas compras
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/(tabs)/produtos')}
      >
        <Text style={styles.shopButtonText}>Começar a comprar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando carrinho...</Text>
      </View>
    );
  }

  if (itens.length === 0) {
    return renderEmpty();
  }

  const subtotal = calcularSubtotal();
  const desconto = 0;
  const frete = 5.00;
  const total = calcularTotal();

  return (
    <View style={styles.container}>
      {/* Lista de itens */}
      <FlatList
        data={itens}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.itemsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Resumo do pedido */}
      <View style={styles.resumoContainer}>
        <View style={styles.resumoHeader}>
          <Text style={styles.resumoTitle}>Resumo do Pedido</Text>
        </View>

        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Subtotal ({itens.length} itens)</Text>
          <Text style={styles.resumoValor}>R$ {subtotal.toFixed(2)}</Text>
        </View>

        {desconto > 0 && (
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Desconto</Text>
            <Text style={[styles.resumoValor, { color: '#27ae60' }]}>
              -R$ {desconto.toFixed(2)}
            </Text>
          </View>
        )}

        {frete > 0 && (
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Frete</Text>
            <Text style={styles.resumoValor}>R$ {frete.toFixed(2)}</Text>
          </View>
        )}

        <View style={[styles.resumoItem, styles.resumoTotal]}>
          <Text style={styles.resumoTotalLabel}>Total</Text>
          <Text style={styles.resumoTotalValor}>R$ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.finalizarButton} onPress={finalizarPedido}>
          <Text style={styles.finalizarButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  itemsList: {
    padding: 16,
    paddingBottom: 200,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  produtoImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  produtoEmoji: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemDescricao: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  quantidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    borderRadius: 8,
    padding: 4,
  },
  quantidadeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  quantidade: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  observacoesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.gray[50],
    borderRadius: 8,
  },
  observacoesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  observacoes: {
    fontSize: 14,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resumoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    padding: 16,
    paddingBottom: 32,
  },
  resumoHeader: {
    marginBottom: 16,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  resumoTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  resumoTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  resumoTotalValor: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary[500],
  },
  finalizarButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizarButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 