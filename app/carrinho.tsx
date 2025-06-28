import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../utils/theme';
import { BackgroundPattern } from '../components/ui/BackgroundPattern';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface ItemCarrinho {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string;
  observacoes?: string;
}

export default function Carrinho() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarrinho();
  }, []);

  const loadCarrinho = async () => {
    try {
      setLoading(true);
      // Simulando dados do carrinho
      const carrinhoMockado: ItemCarrinho[] = [
        {
          id: 1,
          nome: 'Farinha de Trigo Premium',
          preco: 8.90,
          quantidade: 2,
          imagem: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        },
        {
          id: 2,
          nome: 'Açúcar Cristal Especial',
          preco: 6.50,
          quantidade: 1,
          imagem: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400',
        },
      ];
      
      setTimeout(() => {
        setItens(carrinhoMockado);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularSubtotal = () => {
    return itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const taxaEntrega = 5.00; // Taxa fixa de entrega
    return subtotal + taxaEntrega;
  };

  const atualizarQuantidade = (id: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(id);
      return;
    }

    setItens(prevItens =>
      prevItens.map(item =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item
      )
    );
  };

  const removerItem = (id: number) => {
    Alert.alert(
      'Remover Item',
      'Deseja remover este item do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setItens(prevItens => prevItens.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const finalizarPedido = () => {
    if (itens.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione produtos ao carrinho antes de finalizar o pedido');
      return;
    }

    Alert.alert(
      'Finalizar Pedido',
      `Total: ${formatCurrency(calcularTotal())}\n\nDeseja finalizar o pedido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => {
            Alert.alert('Sucesso', 'Pedido realizado com sucesso!', [
              { text: 'OK', onPress: () => router.push('/(tabs)') }
            ]);
          }
        }
      ]
    );
  };

  const renderItemCarrinho = (item: ItemCarrinho) => (
    <Card key={item.id} variant="elevated" size="md" style={styles.itemCard}>
      <View style={styles.itemContent}>
        {/* Imagem do Produto */}
        <View style={styles.itemImageContainer}>
          {item.imagem ? (
            <Image source={{ uri: item.imagem }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="cube" size={24} color={colors.neutral[400]} />
            </View>
          )}
        </View>

        {/* Informações do Produto */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemNome} numberOfLines={2}>
            {item.nome}
          </Text>
          <Text style={styles.itemPreco}>
            {formatCurrency(item.preco)}
          </Text>
          {item.observacoes && (
            <Text style={styles.itemObservacoes} numberOfLines={1}>
              {item.observacoes}
            </Text>
          )}
        </View>

        {/* Controles de Quantidade */}
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => atualizarQuantidade(item.id, item.quantidade - 1)}
          >
            <Ionicons name="remove" size={16} color={colors.primary[600]} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantidade}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => atualizarQuantidade(item.id, item.quantidade + 1)}
          >
            <Ionicons name="add" size={16} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Botão Remover */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removerItem(item.id)}
        >
          <Ionicons name="trash" size={18} color={colors.error[500]} />
        </TouchableOpacity>
      </View>

      {/* Subtotal do Item */}
      <View style={styles.itemFooter}>
        <Text style={styles.itemSubtotal}>
          Subtotal: {formatCurrency(item.preco * item.quantidade)}
        </Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Carregando carrinho...</Text>
      </View>
    );
  }

  return (
    <BackgroundPattern variant="default" intensity="subtle">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Meu Carrinho</Text>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                'Limpar Carrinho',
                'Deseja remover todos os itens do carrinho?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpar', style: 'destructive', onPress: () => setItens([]) }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error[500]} />
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        {itens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.neutral[400]} />
            <Text style={styles.emptyTitle}>Carrinho Vazio</Text>
            <Text style={styles.emptyMessage}>
              Adicione produtos ao seu carrinho para continuar
            </Text>
            <Button
              variant="primary"
              onPress={() => router.push('/(tabs)')}
              style={styles.shopButton}
            >
              Continuar Comprando
            </Button>
          </View>
        ) : (
          <>
            {/* Lista de Itens */}
            <ScrollView 
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.itemsListContent}
            >
              {itens.map(renderItemCarrinho)}
            </ScrollView>

            {/* Resumo do Pedido */}
            <View style={styles.summary}>
              <Card variant="elevated" size="lg" style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({itens.length} itens)</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(calcularSubtotal())}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxa de entrega</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(5.00)}
                  </Text>
                </View>
                
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>
                    {formatCurrency(calcularTotal())}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={finalizarPedido}
                >
                  <LinearGradient
                    colors={[colors.primary[500], colors.primary[700]]}
                    style={styles.checkoutGradient}
                  >
                    <Ionicons name="card" size={20} color={colors.white} />
                    <Text style={styles.checkoutText}>
                      Finalizar Pedido
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Card>
            </View>
          </>
        )}
      </View>
    </BackgroundPattern>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  clearButton: {
    padding: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyMessage: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  shopButton: {
    minWidth: 200,
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  itemCard: {
    marginBottom: spacing[4],
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  itemImageContainer: {
    marginRight: spacing[3],
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral[100],
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  itemNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  itemPreco: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeights.medium as any,
  },
  itemObservacoes: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radii.lg,
    padding: spacing[1],
    marginRight: spacing[2],
  },
  quantityButton: {
    padding: spacing[1],
    backgroundColor: colors.white,
    borderRadius: radii.md,
  },
  quantityText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginHorizontal: spacing[2],
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: spacing[2],
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing[3],
    alignItems: 'flex-end',
  },
  itemSubtotal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[700],
  },
  summary: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  summaryCard: {
    backgroundColor: colors.neutral[50],
  },
  summaryTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
  },
  summaryValue: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium as any,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[300],
    paddingTop: spacing[3],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  summaryTotalLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  summaryTotalValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[600],
  },
  checkoutButton: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  checkoutText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.white,
  },
}); 