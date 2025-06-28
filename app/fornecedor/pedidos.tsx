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

interface PedidoFornecedor {
  id: number;
  numero_pedido: string;
  cliente_nome: string;
  status: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  tipo: 'balcao' | 'delivery' | 'retirada' | 'online';
  total: number;
  data_criacao: string;
  previsao_entrega?: string;
  itens: Array<{
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  observacoes?: string;
}

const FornecedorPedidos: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoFornecedor[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'>('todos');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'balcao' | 'delivery' | 'retirada' | 'online'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoFornecedor | null>(null);
  
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
      
      // Simular pedidos para o fornecedor (na implementação real, viria do backend)
      const pedidosMockados: PedidoFornecedor[] = [
        {
          id: 1,
          numero_pedido: 'PED001',
          cliente_nome: 'Ana Costa',
          status: 'pendente',
          tipo: 'balcao',
          total: 127.50,
          data_criacao: new Date().toISOString(),
          itens: [
            { produto_nome: 'Farinha de Trigo Premium', quantidade: 2, preco_unitario: 8.90, preco_total: 17.80 },
            { produto_nome: 'Açúcar Cristal Especial', quantidade: 5, preco_unitario: 6.50, preco_total: 32.50 },
            { produto_nome: 'Fermento Biológico Seco', quantidade: 3, preco_unitario: 24.90, preco_total: 74.70 },
          ],
          observacoes: 'Entrega urgente para produção de pães'
        },
        {
          id: 2,
          numero_pedido: 'PED002',
          cliente_nome: 'João Santos',
          status: 'confirmado',
          tipo: 'delivery',
          total: 89.30,
          data_criacao: new Date(Date.now() - 3600000).toISOString(),
          previsao_entrega: new Date(Date.now() + 7200000).toISOString(),
          itens: [
            { produto_nome: 'Farinha Integral Orgânica', quantidade: 1, preco_unitario: 12.90, preco_total: 12.90 },
            { produto_nome: 'Açúcar Mascavo Orgânico', quantidade: 2, preco_unitario: 14.90, preco_total: 29.80 },
            { produto_nome: 'Óleo de Girassol Premium', quantidade: 2, preco_unitario: 18.90, preco_total: 37.80 },
          ]
        },
        {
          id: 3,
          numero_pedido: 'PED003',
          cliente_nome: 'Maria Silva',
          status: 'preparando',
          tipo: 'retirada',
          total: 156.70,
          data_criacao: new Date(Date.now() - 7200000).toISOString(),
          previsao_entrega: new Date(Date.now() + 1800000).toISOString(),
          itens: [
            { produto_nome: 'Farinha de Trigo Premium', quantidade: 10, preco_unitario: 8.90, preco_total: 89.00 },
            { produto_nome: 'Fermento Biológico Seco', quantidade: 3, preco_unitario: 24.90, preco_total: 74.70 },
          ],
          observacoes: 'Cliente prefere retirar às 16h'
        },
        {
          id: 4,
          numero_pedido: 'PED004',
          cliente_nome: 'Carlos Oliveira',
          status: 'pronto',
          tipo: 'online',
          total: 67.40,
          data_criacao: new Date(Date.now() - 10800000).toISOString(),
          itens: [
            { produto_nome: 'Açúcar Cristal Especial', quantidade: 8, preco_unitario: 6.50, preco_total: 52.00 },
            { produto_nome: 'Açúcar Mascavo Orgânico', quantidade: 1, preco_unitario: 14.90, preco_total: 14.90 },
          ]
        },
        {
          id: 5,
          numero_pedido: 'PED005',
          cliente_nome: 'Fernanda Lima',
          status: 'entregue',
          tipo: 'delivery',
          total: 198.60,
          data_criacao: new Date(Date.now() - 86400000).toISOString(),
          itens: [
            { produto_nome: 'Farinha de Trigo Premium', quantidade: 15, preco_unitario: 8.90, preco_total: 133.50 },
            { produto_nome: 'Óleo de Girassol Premium', quantidade: 3, preco_unitario: 18.90, preco_total: 56.70 },
          ]
        }
      ];

      setPedidos(pedidosMockados);
      
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
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

  // Filtrar pedidos
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.numero_pedido.toLowerCase().includes(searchText.toLowerCase()) ||
                         pedido.cliente_nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || pedido.status === filterStatus;
    const matchesTipo = filterTipo === 'todos' || pedido.tipo === filterTipo;
    
    return matchesSearch && matchesStatus && matchesTipo;
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
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  // Atualizar status do pedido
  const atualizarStatusPedido = async (pedidoId: number, novoStatus: string) => {
    try {
      // Aqui seria a chamada para o backend
      // await databaseService.updatePedidoStatus(pedidoId, novoStatus);
      
      setPedidos(prevPedidos => 
        prevPedidos.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, status: novoStatus as any }
            : pedido
        )
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', `Pedido atualizado para ${novoStatus}`);
      
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o pedido');
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return colors.warning[500];
      case 'confirmado': return colors.primary[500];
      case 'preparando': return colors.secondary[500];
      case 'pronto': return colors.success[500];
      case 'entregue': return colors.neutral[500];
      case 'cancelado': return colors.error[500];
      default: return colors.neutral[400];
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return 'time';
      case 'confirmado': return 'checkmark-circle';
      case 'preparando': return 'construct';
      case 'pronto': return 'checkmark-done';
      case 'entregue': return 'car';
      case 'cancelado': return 'close-circle';
      default: return 'help-circle';
    }
  };

  // Obter ícone do tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'balcao': return 'storefront';
      case 'delivery': return 'bicycle';
      case 'retirada': return 'walk';
      case 'online': return 'globe';
      default: return 'help-circle';
    }
  };

  // Render Pedido Card
  const renderPedidoCard = ({ item }: { item: PedidoFornecedor }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const tipoIcon = getTipoIcon(item.tipo);

    return (
      <Card
        variant="elevated"
        size="md"
        style={styles.pedidoCard}
        onPress={() => {
          setSelectedPedido(item);
          setModalVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        animateOnPress
      >
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <Text style={styles.numeroPedido}>{item.numero_pedido}</Text>
            <Text style={styles.clienteNome}>{item.cliente_nome}</Text>
            <Text style={styles.dataPedido}>{formatDate(item.data_criacao)}</Text>
          </View>
          
          <View style={styles.pedidoIcons}>
            <View style={[styles.tipoIcon, { backgroundColor: colors.neutral[100] }]}>
              <Ionicons name={tipoIcon as any} size={16} color={colors.neutral[600]} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon as any} size={16} color={colors.white} />
              <Text style={styles.statusText}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pedidoItens}>
          <Text style={styles.itensTitle}>Itens ({item.itens.length})</Text>
          {item.itens.slice(0, 2).map((item_pedido, index) => (
            <Text key={index} style={styles.itemText}>
              {item_pedido.quantidade}x {item_pedido.produto_nome}
            </Text>
          ))}
          {item.itens.length > 2 && (
            <Text style={styles.maisItens}>
              +{item.itens.length - 2} itens...
            </Text>
          )}
        </View>

        {item.previsao_entrega && (
          <View style={styles.previsaoContainer}>
            <Ionicons name="time" size={16} color={colors.primary[500]} />
            <Text style={styles.previsaoText}>
              Previsão: {formatDate(item.previsao_entrega)}
            </Text>
          </View>
        )}

        <View style={styles.pedidoFooter}>
          <View style={styles.valorContainer}>
            <Text style={styles.valorLabel}>Total</Text>
            <Text style={styles.valorTotal}>{formatCurrency(item.total)}</Text>
          </View>
          
          <View style={styles.acoesPedido}>
            {item.status === 'pendente' && (
              <>
                <Button
                  size="sm"
                  variant="tertiary"
                  leftIcon="close"
                  onPress={() => {
                    Alert.alert(
                      'Cancelar Pedido',
                      'Tem certeza que deseja cancelar este pedido?',
                      [
                        { text: 'Não', style: 'cancel' },
                        { 
                          text: 'Sim', 
                          style: 'destructive',
                          onPress: () => atualizarStatusPedido(item.id, 'cancelado')
                        }
                      ]
                    );
                  }}
                  style={styles.actionButton}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon="checkmark"
                  onPress={() => atualizarStatusPedido(item.id, 'confirmado')}
                  style={styles.actionButton}
                >
                  Confirmar
                </Button>
              </>
            )}
            
            {item.status === 'confirmado' && (
              <Button
                size="sm"
                variant="primary"
                leftIcon="construct"
                onPress={() => atualizarStatusPedido(item.id, 'preparando')}
                style={styles.actionButton}
              >
                Iniciar Preparo
              </Button>
            )}
            
            {item.status === 'preparando' && (
              <Button
                size="sm"
                variant="success"
                leftIcon="checkmark-done"
                onPress={() => atualizarStatusPedido(item.id, 'pronto')}
                style={styles.actionButton}
              >
                Finalizar
              </Button>
            )}
            
            {item.status === 'pronto' && item.tipo === 'delivery' && (
              <Button
                size="sm"
                variant="success"
                leftIcon="car"
                onPress={() => atualizarStatusPedido(item.id, 'entregue')}
                style={styles.actionButton}
              >
                Entregar
              </Button>
            )}
          </View>
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
              <Text style={styles.headerTitle}>Pedidos Recebidos</Text>
              <Text style={styles.headerSubtitle}>
                {filteredPedidos.length} pedidos
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Filtros', 'Filtros avançados');
              }}
            >
              <Ionicons name="filter" size={24} color={colors.white} />
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
        {/* Resumo dos Pedidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          
          <View style={styles.resumoGrid}>
            <Card variant="elevated" size="sm" style={styles.resumoCard}>
              <Text style={styles.resumoValue}>
                {pedidos.filter(p => p.status === 'pendente').length}
              </Text>
              <Text style={styles.resumoLabel}>Pendentes</Text>
              <Ionicons name="time" size={24} color={colors.warning[500]} />
            </Card>
            
            <Card variant="elevated" size="sm" style={styles.resumoCard}>
              <Text style={styles.resumoValue}>
                {pedidos.filter(p => ['confirmado', 'preparando'].includes(p.status)).length}
              </Text>
              <Text style={styles.resumoLabel}>Em Andamento</Text>
              <Ionicons name="construct" size={24} color={colors.primary[500]} />
            </Card>
            
            <Card variant="elevated" size="sm" style={styles.resumoCard}>
              <Text style={styles.resumoValue}>
                {pedidos.filter(p => p.status === 'pronto').length}
              </Text>
              <Text style={styles.resumoLabel}>Prontos</Text>
              <Ionicons name="checkmark-done" size={24} color={colors.success[500]} />
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
                placeholder="Buscar pedidos..."
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
            {['todos', 'pendente', 'confirmado', 'preparando', 'pronto', 'entregue'].map((status) => (
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

        {/* Lista de Pedidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos</Text>
          
          <FlatList
            data={filteredPedidos}
            renderItem={renderPedidoCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pedidosList}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="receipt" size={48} color={colors.neutral[400]} />
                <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
              </View>
            )}
          />
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de Detalhes do Pedido */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedPedido && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pedido {selectedPedido.numero_pedido}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Informações do Pedido</Text>
                <Text style={styles.modalText}>Cliente: {selectedPedido.cliente_nome}</Text>
                <Text style={styles.modalText}>Data: {formatDate(selectedPedido.data_criacao)}</Text>
                <Text style={styles.modalText}>Tipo: {selectedPedido.tipo}</Text>
                <Text style={styles.modalText}>Status: {selectedPedido.status}</Text>
                {selectedPedido.previsao_entrega && (
                  <Text style={styles.modalText}>
                    Previsão: {formatDate(selectedPedido.previsao_entrega)}
                  </Text>
                )}
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Itens do Pedido</Text>
                {selectedPedido.itens.map((item, index) => (
                  <View key={index} style={styles.itemPedido}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemNome}>{item.produto_nome}</Text>
                      <Text style={styles.itemDetalhes}>
                        {item.quantidade}x {formatCurrency(item.preco_unitario)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.preco_total)}
                    </Text>
                  </View>
                ))}
                
                <View style={styles.totalPedido}>
                  <Text style={styles.totalLabel}>Total do Pedido</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(selectedPedido.total)}
                  </Text>
                </View>
              </View>
              
              {selectedPedido.observacoes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Observações</Text>
                  <Text style={styles.modalText}>{selectedPedido.observacoes}</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Button
                variant="tertiary"
                onPress={() => setModalVisible(false)}
                style={styles.modalActionButton}
              >
                Fechar
              </Button>
              
              {selectedPedido.status === 'pendente' && (
                <Button
                  variant="primary"
                  onPress={() => {
                    setModalVisible(false);
                    atualizarStatusPedido(selectedPedido.id, 'confirmado');
                  }}
                  style={styles.modalActionButton}
                >
                  Confirmar Pedido
                </Button>
              )}
            </View>
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
    padding: spacing[3],
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
  pedidosList: {
    paddingBottom: spacing[4],
  },
  pedidoCard: {
    marginBottom: spacing[4],
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  pedidoInfo: {
    flex: 1,
  },
  numeroPedido: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  clienteNome: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  dataPedido: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  pedidoIcons: {
    alignItems: 'flex-end',
  },
  tipoIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
    marginLeft: spacing[1],
  },
  pedidoItens: {
    marginBottom: spacing[3],
  },
  itensTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  itemText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  maisItens: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[500],
    fontStyle: 'italic',
  },
  previsaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: radii.md,
  },
  previsaoText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[700],
    marginLeft: spacing[2],
  },
  pedidoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valorContainer: {
    flex: 1,
  },
  valorLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  valorTotal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.success[600],
  },
  acoesPedido: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
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
  itemPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  itemDetalhes: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  itemTotal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
  },
  totalPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    marginTop: spacing[3],
    borderTopWidth: 2,
    borderTopColor: colors.neutral[200],
  },
  totalLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
  },
  totalValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.success[600],
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

export default FornecedorPedidos;