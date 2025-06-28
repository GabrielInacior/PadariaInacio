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

const tipoConfig = {
  admin: { color: colors.error[500], icon: 'shield', label: 'Administrador' },
  gerente: { color: colors.warning[500], icon: 'person-circle', label: 'Gerente' },
  funcionario: { color: colors.info[500], icon: 'person', label: 'Funcionário' },
  cliente: { color: colors.success[500], icon: 'people', label: 'Cliente' },
  fornecedor: { color: colors.primary[500], icon: 'storefront', label: 'Fornecedor' },
};

const statusConfig = {
  ativo: { color: colors.success[500], icon: 'checkmark-circle', label: 'Ativo' },
  inativo: { color: colors.neutral[500], icon: 'pause-circle', label: 'Inativo' },
  suspenso: { color: colors.error[500], icon: 'ban', label: 'Suspenso' },
  pendente: { color: colors.warning[500], icon: 'time', label: 'Pendente' },
};

const AdminUsuarios: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState({
    nome: '',
    email: '',
    telefone: '',
    status: 'ativo',
  });
  
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
      
      // Carregar usuários do banco
      const usuariosData = await databaseService.getUsuarios();
      setUsuarios(usuariosData);
      
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

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesTipo = selectedTipo === 'todos' || usuario.tipo === selectedTipo;
    const matchesStatus = selectedStatus === 'todos' || usuario.status === selectedStatus;
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Atualizar usuário
  const atualizarUsuario = async () => {
    if (!selectedUser) return;

    try {
      await databaseService.updateUser(selectedUser.id, {
        ...editUser,
        status: editUser.status as "ativo" | "inativo" | "suspenso"
      });
      setEditModalVisible(false);
      setSelectedUser(null);
      await loadData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o usuário');
    }
  };

  // Suspender/Ativar usuário
  const alterarStatusUsuario = async (usuario: any, novoStatus: string) => {
    const acao = novoStatus === 'ativo' ? 'ativar' : 'suspender';
    
    Alert.alert(
      'Confirmar Ação',
      `Deseja realmente ${acao} o usuário "${usuario.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await databaseService.updateUser(usuario.id, { ...usuario, status: novoStatus });
              await loadData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', `Usuário ${acao === 'ativar' ? 'ativado' : 'suspenso'} com sucesso!`);
            } catch (error) {
              console.error('Erro ao alterar status:', error);
              Alert.alert('Erro', 'Não foi possível alterar o status do usuário');
            }
          }
        }
      ]
    );
  };

  // Excluir usuário
  const excluirUsuario = async (usuario: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteUser(usuario.id);
              await loadData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir usuário:', error);
              Alert.alert('Erro', 'Não foi possível excluir o usuário');
            }
          }
        }
      ]
    );
  };

  // Abrir modal de edição
  const abrirEdicao = (usuario: any) => {
    setSelectedUser(usuario);
    setEditUser({
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || '',
      status: usuario.status,
    });
    setEditModalVisible(true);
  };

  // Render Usuário Card
  const renderUsuarioCard = ({ item }: { item: typeof usuarios[0] }) => {
    const tipo = tipoConfig[item.tipo as keyof typeof tipoConfig];
    const status = statusConfig[item.status as keyof typeof statusConfig];

    return (
      <Card
        variant="elevated"
        size="md"
        style={styles.usuarioCard}
        onPress={() => {
          setSelectedUser(item);
          setModalVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        animateOnPress
      >
        <View style={styles.usuarioHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: tipo.color }]}>
              <Ionicons name={tipo.icon as any} size={24} color={colors.neutral[0]} />
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
          </View>
          
          <View style={styles.usuarioInfo}>
            <Text style={styles.usuarioNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.usuarioEmail} numberOfLines={1}>
              {item.email}
            </Text>
            
            <View style={styles.usuarioMeta}>
              <View style={[styles.tipoBadge, { backgroundColor: `${tipo.color}20` }]}>
                <Text style={[styles.tipoText, { color: tipo.color }]}>
                  {tipo.label}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Informações Adicionais */}
        <View style={styles.usuarioDetalhes}>
          {item.telefone && (
            <View style={styles.detalheItem}>
              <Ionicons name="call" size={16} color={colors.neutral[600]} />
              <Text style={styles.detalheTexto}>{item.telefone}</Text>
            </View>
          )}
          
          <View style={styles.detalheItem}>
            <Ionicons name="calendar" size={16} color={colors.neutral[600]} />
            <Text style={styles.detalheTexto}>
              Criado em {formatDate(item.data_criacao)}
            </Text>
          </View>
          
          {item.ultimo_acesso && (
            <View style={styles.detalheItem}>
              <Ionicons name="time" size={16} color={colors.neutral[600]} />
              <Text style={styles.detalheTexto}>
                Último acesso: {formatDate(item.ultimo_acesso)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Informações Específicas por Tipo */}
        {item.tipo === 'fornecedor' && (
          <View style={styles.fornecedorInfo}>
            <Text style={styles.fornecedorLabel}>Fornecedor</Text>
            {item.razao_social && (
              <Text style={styles.fornecedorTexto}>
                Razão Social: {item.razao_social}
              </Text>
            )}
            {item.cnpj && (
              <Text style={styles.fornecedorTexto}>CNPJ: {item.cnpj}</Text>
            )}
            {item.categoria_fornecedor && (
              <Text style={styles.fornecedorTexto}>
                Categoria: {item.categoria_fornecedor}
              </Text>
            )}
            {item.avaliacao_media > 0 && (
              <View style={styles.avaliacaoContainer}>
                <Ionicons name="star" size={16} color={colors.warning[500]} />
                              <Text style={styles.avaliacaoTexto}>
                {(item.avaliacao_media || 0).toFixed(1)}/5
              </Text>
              </View>
            )}
          </View>
        )}
        
        {item.tipo === 'cliente' && item.pontos_fidelidade > 0 && (
          <View style={styles.clienteInfo}>
            <View style={styles.pontosContainer}>
              <Ionicons name="gift" size={16} color={colors.success[500]} />
              <Text style={styles.pontosTexto}>
                {item.pontos_fidelidade} pontos de fidelidade
              </Text>
            </View>
          </View>
        )}
        
        {(item.tipo === 'funcionario' || item.tipo === 'gerente') && (
          <View style={styles.funcionarioInfo}>
            {item.cargo && (
              <Text style={styles.cargoTexto}>Cargo: {item.cargo}</Text>
            )}
            {item.dataAdmissao && (
              <Text style={styles.admissaoTexto}>
                Admissão: {formatDate(item.dataAdmissao)}
              </Text>
            )}
          </View>
        )}
        
        {/* Ações */}
        <View style={styles.usuarioActions}>
          <Button
            size="sm"
            variant="tertiary"
            leftIcon="create"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              abrirEdicao(item);
            }}
            style={styles.actionButton}
          >
            Editar
          </Button>
          
          {item.status === 'ativo' ? (
            <Button
              size="sm"
              variant="secondary"
              leftIcon="pause"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                alterarStatusUsuario(item, 'suspenso');
              }}
              style={styles.actionButton}
            >
              Suspender
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              leftIcon="play"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                alterarStatusUsuario(item, 'ativo');
              }}
              style={styles.actionButton}
            >
              Ativar
            </Button>
          )}
          
          <Button
            size="sm"
            variant="danger"
            leftIcon="trash"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              excluirUsuario(item);
            }}
            style={styles.actionButton}
          >
            Excluir
          </Button>
        </View>
      </Card>
    );
  };

  // Estatísticas rápidas
  const getEstatisticas = () => {
    const total = usuarios.length;
    const ativos = usuarios.filter(u => u.status === 'ativo').length;
    const clientes = usuarios.filter(u => u.tipo === 'cliente').length;
    const fornecedores = usuarios.filter(u => u.tipo === 'fornecedor').length;
    const funcionarios = usuarios.filter(u => u.tipo === 'funcionario' || u.tipo === 'gerente').length;

    return { total, ativos, clientes, fornecedores, funcionarios };
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
                <Text style={styles.headerTitle}>Gestão de Usuários</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredUsuarios.length} usuários • {stats.ativos} ativos
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
              <Text style={styles.statValue}>{stats.clientes}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.fornecedores}</Text>
              <Text style={styles.statLabel}>Fornecedores</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.funcionarios}</Text>
              <Text style={styles.statLabel}>Funcionários</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{stats.ativos}</Text>
              <Text style={styles.statLabel}>Ativos</Text>
            </Card>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar usuários..."
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
            {/* Filtro por Tipo */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTipo === 'todos' && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedTipo('todos');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedTipo === 'todos' && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            
            {Object.entries(tipoConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  selectedTipo === key && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedTipo(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedTipo === key && styles.filterChipTextActive,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Usuários */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando usuários...</Text>
          </View>
        ) : (
          <View style={styles.usuariosContainer}>
            <FlatList
              data={filteredUsuarios}
              renderItem={renderUsuarioCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.usuariosList}
            />
          </View>
        )}

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de Detalhes do Usuário */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser.nome}</Text>
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
                <Text style={styles.modalText}>Nome: {selectedUser.nome}</Text>
                <Text style={styles.modalText}>Email: {selectedUser.email}</Text>
                <Text style={styles.modalText}>
                  Tipo: {tipoConfig[selectedUser.tipo as keyof typeof tipoConfig].label}
                </Text>
                <Text style={styles.modalText}>
                  Status: {statusConfig[selectedUser.status as keyof typeof statusConfig].label}
                </Text>
                {selectedUser.telefone && (
                  <Text style={styles.modalText}>Telefone: {selectedUser.telefone}</Text>
                )}
                <Text style={styles.modalText}>
                  Data de Criação: {formatDate(selectedUser.data_criacao)}
                </Text>
                {selectedUser.ultimo_acesso && (
                  <Text style={styles.modalText}>
                    Último Acesso: {formatDate(selectedUser.ultimo_acesso)}
                  </Text>
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
                    abrirEdicao(selectedUser);
                  }}
                  style={styles.modalActionButton}
                >
                  Editar Usuário
                </Button>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Modal de Edição */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nome</Text>
              <TextInput
                style={styles.formInput}
                value={editUser.nome}
                onChangeText={(text) => setEditUser({ ...editUser, nome: text })}
                placeholder="Nome do usuário"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={editUser.email}
                onChangeText={(text) => setEditUser({ ...editUser, email: text })}
                placeholder="email@exemplo.com"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Telefone</Text>
              <TextInput
                style={styles.formInput}
                value={editUser.telefone}
                onChangeText={(text) => setEditUser({ ...editUser, telefone: text })}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.statusButton,
                      editUser.status === key && styles.statusButtonActive,
                      { borderColor: config.color }
                    ]}
                    onPress={() => setEditUser({ ...editUser, status: key })}
                  >
                    <Ionicons 
                      name={config.icon as any} 
                      size={16} 
                      color={editUser.status === key ? colors.neutral[0] : config.color} 
                    />
                    <Text 
                      style={[
                        styles.statusButtonText,
                        { color: editUser.status === key ? colors.neutral[0] : config.color }
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                variant="tertiary"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalActionButton}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onPress={atualizarUsuario}
                style={styles.modalActionButton}
              >
                Salvar
              </Button>
            </View>
          </ScrollView>
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
  usuariosContainer: {
    paddingHorizontal: spacing[4],
  },
  usuariosList: {
    paddingBottom: spacing[4],
  },
  usuarioCard: {
    marginBottom: spacing[4],
  },
  usuarioHeader: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.neutral[0],
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNome: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  usuarioEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  usuarioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    marginRight: spacing[2],
  },
  tipoText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium as any,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[0],
  },
  usuarioDetalhes: {
    backgroundColor: colors.neutral[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  detalheTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
    marginLeft: spacing[2],
  },
  fornecedorInfo: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  fornecedorLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.primary[700],
    marginBottom: spacing[2],
  },
  fornecedorTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  avaliacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  avaliacaoTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.warning[600],
    marginLeft: spacing[1],
  },
  clienteInfo: {
    backgroundColor: colors.success[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  pontosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pontosTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.success[600],
    marginLeft: spacing[1],
  },
  funcionarioInfo: {
    backgroundColor: colors.info[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  cargoTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.info[600],
    marginBottom: spacing[1],
  },
  admissaoTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.info[600],
  },
  usuarioActions: {
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
  formSection: {
    marginVertical: spacing[3],
  },
  formLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: colors.profiles.admin.primary,
    borderColor: colors.profiles.admin.primary,
  },
  statusButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    marginLeft: spacing[1],
  },
});

export default AdminUsuarios; 