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
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
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

const statusConfig = {
  pendente: { color: colors.warning[500], icon: 'time', label: 'Pendente' },
  confirmado: { color: colors.info[500], icon: 'checkmark-circle', label: 'Confirmado' },
  preparando: { color: colors.primary[500], icon: 'restaurant', label: 'Preparando' },
  pronto: { color: colors.success[500], icon: 'checkmark-done', label: 'Pronto' },
  entregue: { color: colors.success[700], icon: 'car', label: 'Entregue' },
  cancelado: { color: colors.error[500], icon: 'close-circle', label: 'Cancelado' },
};

const tipoConfig = {
  balcao: { color: colors.tertiary[500], icon: 'storefront', label: 'Balcão' },
  delivery: { color: colors.info[500], icon: 'bicycle', label: 'Delivery' },
  retirada: { color: colors.warning[500], icon: 'bag', label: 'Retirada' },
  online: { color: colors.primary[500], icon: 'globe', label: 'Online' },
};

const AdminPedidos: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  
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

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Simular dados de pedidos (já que não temos uma query específica ainda)
      const pedidosSimulados = [
        {
          id: 1,
          numero_pedido: 'PED001',
          cliente_nome: 'Ana Costa',
          status: 'pendente',
          tipo: 'balcao',
          total: 45.50,
          data_criacao: new Date().toISOString(),
          forma_pagamento: 'dinheiro',
          itens: 3,
        },
        {
          id: 2,
          numero_pedido: 'PED002',
          cliente_nome: 'João Silva',
          status: 'confirmado',
          tipo: 'delivery',
          total: 83.30,
          data_criacao: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          forma_pagamento: 'cartao',
          endereco_entrega: 'Rua das Flores, 123',
          itens: 5,
        },
        {
          id: 3,
          numero_pedido: 'PED003',
          cliente_nome: 'Maria Santos',
          status: 'preparando',
          tipo: 'retirada',
          total: 127.80,
          data_criacao: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          forma_pagamento: 'pix',
          itens: 8,
        },
        {
          id: 4,
          numero_pedido: 'PED004',
          cliente_nome: 'Carlos Oliveira',
          status: 'pronto',
          tipo: 'balcao',
          total: 67.20,
          data_criacao: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          forma_pagamento: 'cartao',
          itens: 4,
        },
        {
          id: 5,
          numero_pedido: 'PED005',
          cliente_nome: 'Lucia Ferreira',
          status: 'entregue',
          tipo: 'delivery',
          total: 95.40,
          data_criacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          forma_pagamento: 'pix',
          endereco_entrega: 'Av. Central, 456',
          itens: 6,
        },
      ];
      
      setPedidos(pedidosSimulados);
      
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

  // Filtrar pedidos
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.numero_pedido.toLowerCase().includes(searchText.toLowerCase()) ||
                         pedido.cliente_nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = selectedStatus === 'todos' || pedido.status === selectedStatus;
    const matchesTipo = selectedTipo === 'todos' || pedido.tipo === selectedTipo;
    
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Atualizar status do pedido
  const atualizarStatus = async (pedido: any, novoStatus: string) => {
    Alert.alert(
      'Confirmar Alteração',
      `Alterar status do pedido ${pedido.numero_pedido} para "${statusConfig[novoStatus as keyof typeof statusConfig].label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Atualizar localmente por enquanto
              const pedidosAtualizados = pedidos.map(p => 
                p.id === pedido.id ? { ...p, status: novoStatus } : p
              );
              setPedidos(pedidosAtualizados);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', 'Status atualizado com sucesso!');
            } catch (error) {
              console.error('Erro ao atualizar status:', error);
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            }
          }
        }
      ]
    );
  };

  // Render Pedido Card
  const renderPedidoCard = ({ item }: { item: typeof pedidos[0] }) => {
    const status = statusConfig[item.status as keyof typeof statusConfig];
    const tipo = tipoConfig[item.tipo as keyof typeof tipoConfig];

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
            <Text style={styles.pedidoNumero}>{item.numero_pedido}</Text>
            <Text style={styles.clienteNome}>{item.cliente_nome}</Text>
            <Text style={styles.pedidoData}>{formatDate(item.data_criacao)}</Text>
          </View>
          
          <View style={styles.pedidoStatus}>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Ionicons name={status.icon as any} size={16} color={colors.neutral[0]} />
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
            <Text style={styles.pedidoTotal}>{formatCurrency(item.total)}</Text>
          </View>
        </View>
        
        <View style={styles.pedidoDetalhes}>
          <View style={styles.detalheItem}>
            <View style={[styles.tipoIcon, { backgroundColor: `${tipo.color}20` }]}>
              <Ionicons name={tipo.icon as any} size={16} color={tipo.color} />
            </View>
            <Text style={styles.detalheTexto}>{tipo.label}</Text>
          </View>
          
          <View style={styles.detalheItem}>
            <Ionicons name="card" size={16} color={colors.neutral[600]} />
            <Text style={styles.detalheTexto}>{item.forma_pagamento.toUpperCase()}</Text>
          </View>
          
          <View style={styles.detalheItem}>
            <Ionicons name="list" size={16} color={colors.neutral[600]} />
            <Text style={styles.detalheTexto}>{item.itens} itens</Text>
          </View>
        </View>
        
        {item.endereco_entrega && (
          <View style={styles.enderecoContainer}>
            <Ionicons name="location" size={16} color={colors.info[500]} />
            <Text style={styles.enderecoTexto} numberOfLines={1}>
              {item.endereco_entrega}
            </Text>
          </View>
        )}
        
        {/* Ações Rápidas */}
        <View style={styles.pedidoActions}>
          {item.status === 'pendente' && (
            <>
              <Button
                size="sm"
                variant="success"
                leftIcon="checkmark"
                onPress={() => atualizarStatus(item, 'confirmado')}
                style={styles.actionButton}
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="danger"
                leftIcon="close"
                onPress={() => atualizarStatus(item, 'cancelado')}
                style={styles.actionButton}
              >
                Cancelar
              </Button>
            </>
          )}
          
          {item.status === 'confirmado' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon="restaurant"
              onPress={() => atualizarStatus(item, 'preparando')}
              style={styles.actionButtonFull}
            >
              Iniciar Preparo
            </Button>
          )}
          
          {item.status === 'preparando' && (
            <Button
              size="sm"
              variant="success"
              leftIcon="checkmark-done"
              onPress={() => atualizarStatus(item, 'pronto')}
              style={styles.actionButtonFull}
            >
              Marcar como Pronto
            </Button>
          )}
          
          {item.status === 'pronto' && (
            <Button
              size="sm"
              variant="success"
              leftIcon="car"
              onPress={() => atualizarStatus(item, 'entregue')}
              style={styles.actionButtonFull}
            >
              Marcar como Entregue
            </Button>
          )}
        </View>
      </Card>
    );
  };

  // Estatísticas rápidas
  const getEstatisticas = () => {
    const total = pedidos.length;
    const pendentes = pedidos.filter(p => p.status === 'pendente').length;
    const preparando = pedidos.filter(p => p.status === 'preparando').length;
    const entregues = pedidos.filter(p => p.status === 'entregue').length;
    const faturamento = pedidos
      .filter(p => p.status === 'entregue')
      .reduce((sum, p) => sum + p.total, 0);

    return { total, pendentes, preparando, entregues, faturamento };
  };

  const stats = getEstatisticas();

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
                <Text style={styles.headerTitle}>Gestão de Pedidos</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredPedidos.length} pedidos • {stats.pendentes} pendentes
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
        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendentes}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.preparando}</Text>
              <Text style={styles.statLabel}>Preparando</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.entregues}</Text>
              <Text style={styles.statLabel}>Entregues</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={[styles.statValue, { fontSize: typography.fontSizes.lg }]}>
                {formatCurrency(stats.faturamento)}
              </Text>
              <Text style={styles.statLabel}>Faturamento</Text>
            </Card>
          </View>
        </View>

        {/* Barra de Pesquisa */}
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

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Filtro por Status */}
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
            
            {Object.entries(statusConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  selectedStatus === key && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === key && styles.filterChipTextActive,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Pedidos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : (
          <View style={styles.pedidosContainer}>
            <FlatList
              data={filteredPedidos}
              renderItem={renderPedidoCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pedidosList}
            />
          </View>
        )}

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
                <Text style={styles.modalText}>
                  Status: {statusConfig[selectedPedido.status as keyof typeof statusConfig].label}
                </Text>
                <Text style={styles.modalText}>
                  Tipo: {tipoConfig[selectedPedido.tipo as keyof typeof tipoConfig].label}
                </Text>
                <Text style={styles.modalText}>Total: {formatCurrency(selectedPedido.total)}</Text>
                <Text style={styles.modalText}>
                  Pagamento: {selectedPedido.forma_pagamento.toUpperCase()}
                </Text>
                <Text style={styles.modalText}>
                  Data: {new Date(selectedPedido.data_criacao).toLocaleString('pt-BR')}
                </Text>
                {selectedPedido.endereco_entrega && (
                  <Text style={styles.modalText}>Endereço: {selectedPedido.endereco_entrega}</Text>
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
                    // Implementar ação específica
                  }}
                  style={styles.modalActionButton}
                >
                  Imprimir
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
  statsContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing[1],
    padding: spacing[3],
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
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
  pedidosContainer: {
    paddingHorizontal: spacing[4],
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
  pedidoNumero: {
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
  pedidoData: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  pedidoStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[0],
    marginLeft: spacing[1],
  },
  pedidoTotal: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.success[600],
  },
  pedidoDetalhes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoIcon: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  detalheTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
    marginLeft: spacing[1],
  },
  enderecoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info[50],
    padding: spacing[2],
    borderRadius: radii.md,
    marginBottom: spacing[3],
  },
  enderecoTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.info[700],
    marginLeft: spacing[2],
    flex: 1,
  },
  pedidoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  actionButtonFull: {
    flex: 1,
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
});

export default AdminPedidos; 