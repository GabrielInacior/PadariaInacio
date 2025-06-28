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

const iconesDisponiveis = [
  'nutrition', 'snow', 'water', 'flask', 'egg', 'apple', 'cube', 'leaf',
  'restaurant', 'wine', 'ice-cream', 'pizza', 'cafe', 'fish', 'flower',
  'gift', 'heart', 'home', 'star', 'sunny'
];

const coresDisponiveis = [
  colors.primary[500], colors.secondary[500], colors.tertiary[500],
  colors.success[500], colors.warning[500], colors.error[500],
  colors.info[500], '#8B4513', '#FF6347', '#32CD32', '#FFD700', '#FF69B4'
];

const AdminCategorias: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any | null>(null);
  const [newCategoria, setNewCategoria] = useState({
    nome: '',
    descricao: '',
    icone: 'cube',
    cor_tema: colors.primary[500],
    ordem_exibicao: 0,
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
      
      // Carregar categorias do banco
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

  // Filtrar categorias
  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchText.toLowerCase()) ||
    categoria.descricao.toLowerCase().includes(searchText.toLowerCase())
  );

  // Criar categoria
  const criarCategoria = async () => {
    try {
      if (!newCategoria.nome) {
        Alert.alert('Erro', 'Nome da categoria é obrigatório');
        return;
      }

      // Simular criação (implementar método no databaseService)
      const novaCategoria = {
        id: Date.now(), // Temporário
        ...newCategoria,
        ativo: true,
      };

      setCategorias([...categorias, novaCategoria]);
      setEditModalVisible(false);
      setNewCategoria({
        nome: '',
        descricao: '',
        icone: 'cube',
        cor_tema: colors.primary[500],
        ordem_exibicao: categorias.length + 1,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      Alert.alert('Erro', 'Não foi possível criar a categoria');
    }
  };

  // Editar categoria
  const editarCategoria = async () => {
    if (!selectedCategoria) return;

    try {
      // Simular edição
      const categoriasAtualizadas = categorias.map(cat =>
        cat.id === selectedCategoria.id ? { ...cat, ...newCategoria } : cat
      );

      setCategorias(categoriasAtualizadas);
      setEditModalVisible(false);
      setSelectedCategoria(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Categoria atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao editar categoria:', error);
      Alert.alert('Erro', 'Não foi possível editar a categoria');
    }
  };

  // Deletar categoria
  const deletarCategoria = async (categoria: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a categoria "${categoria.nome}"? Todos os produtos desta categoria serão afetados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Simular exclusão
              const categoriasAtualizadas = categorias.filter(cat => cat.id !== categoria.id);
              setCategorias(categoriasAtualizadas);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao deletar categoria:', error);
              Alert.alert('Erro', 'Não foi possível excluir a categoria');
            }
          }
        }
      ]
    );
  };

  // Alterar status da categoria
  const alterarStatus = async (categoria: any) => {
    const novoStatus = !categoria.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    Alert.alert(
      'Confirmar Ação',
      `Deseja realmente ${acao} a categoria "${categoria.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Simular alteração de status
              const categoriasAtualizadas = categorias.map(cat =>
                cat.id === categoria.id ? { ...cat, ativo: novoStatus } : cat
              );
              setCategorias(categoriasAtualizadas);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', `Categoria ${acao === 'ativar' ? 'ativada' : 'desativada'} com sucesso!`);
            } catch (error) {
              console.error('Erro ao alterar status:', error);
              Alert.alert('Erro', 'Não foi possível alterar o status da categoria');
            }
          }
        }
      ]
    );
  };

  // Abrir modal de edição
  const abrirEdicao = (categoria?: any) => {
    if (categoria) {
      setSelectedCategoria(categoria);
      setNewCategoria({
        nome: categoria.nome,
        descricao: categoria.descricao,
        icone: categoria.icone,
        cor_tema: categoria.cor_tema,
        ordem_exibicao: categoria.ordem_exibicao,
      });
    } else {
      setSelectedCategoria(null);
      setNewCategoria({
        nome: '',
        descricao: '',
        icone: 'cube',
        cor_tema: colors.primary[500],
        ordem_exibicao: categorias.length + 1,
      });
    }
    setEditModalVisible(true);
  };

  // Render Categoria Card
  const renderCategoriaCard = ({ item }: { item: typeof categorias[0] }) => {
    return (
      <Card
        variant="elevated"
        size="md"
        style={styles.categoriaCard}
        onPress={() => {
          setSelectedCategoria(item);
          setModalVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        animateOnPress
      >
        <View style={styles.categoriaHeader}>
          <View style={[styles.categoriaIcon, { backgroundColor: `${item.cor_tema}20` }]}>
            <Ionicons name={item.icone as any} size={32} color={item.cor_tema} />
          </View>
          
          <View style={styles.categoriaInfo}>
            <Text style={styles.categoriaNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.categoriaDescricao} numberOfLines={2}>
              {item.descricao}
            </Text>
            
            <View style={styles.categoriaMeta}>
              <View style={styles.ordemContainer}>
                <Ionicons name="reorder-three" size={16} color={colors.neutral[600]} />
                <Text style={styles.ordemTexto}>Ordem: {item.ordem_exibicao}</Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.ativo ? colors.success[500] : colors.neutral[500] }
              ]}>
                <Text style={styles.statusText}>
                  {item.ativo ? 'ATIVO' : 'INATIVO'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Preview da categoria */}
        <View style={[styles.categoriaPreview, { backgroundColor: `${item.cor_tema}10` }]}>
          <Text style={[styles.previewText, { color: item.cor_tema }]}>
            Preview da categoria com {item.cor_tema} e ícone {item.icone}
          </Text>
        </View>
        
        {/* Ações */}
        <View style={styles.categoriaActions}>
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
          
                     <Button
             size="sm"
             variant={item.ativo ? "secondary" : "success"}
             leftIcon={item.ativo ? "pause" : "play"}
             onPress={() => {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
               alterarStatus(item);
             }}
             style={styles.actionButton}
           >
             {item.ativo ? 'Desativar' : 'Ativar'}
           </Button>
          
          <Button
            size="sm"
            variant="danger"
            leftIcon="trash"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              deletarCategoria(item);
            }}
            style={styles.actionButton}
          >
            Excluir
          </Button>
        </View>
      </Card>
    );
  };

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
                <Text style={styles.headerTitle}>Gestão de Categorias</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredCategorias.length} categorias cadastradas
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                abrirEdicao();
              }}
            >
              <Ionicons name="add" size={24} color={colors.neutral[0]} />
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
            colors={[colors.profiles.admin.primary]}
            tintColor={colors.profiles.admin.primary}
          />
        }
      >
        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{categorias.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>
                {categorias.filter(c => c.ativo).length}
              </Text>
              <Text style={styles.statLabel}>Ativas</Text>
            </Card>
            
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>
                {categorias.filter(c => !c.ativo).length}
              </Text>
              <Text style={styles.statLabel}>Inativas</Text>
            </Card>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categorias..."
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

        {/* Lista de Categorias */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando categorias...</Text>
          </View>
        ) : (
          <View style={styles.categoriasContainer}>
            <FlatList
              data={filteredCategorias}
              renderItem={renderCategoriaCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriasList}
            />
          </View>
        )}

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de Detalhes da Categoria */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedCategoria && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategoria.nome}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Informações da Categoria</Text>
                <Text style={styles.modalText}>Nome: {selectedCategoria.nome}</Text>
                <Text style={styles.modalText}>Descrição: {selectedCategoria.descricao}</Text>
                <Text style={styles.modalText}>Ícone: {selectedCategoria.icone}</Text>
                <Text style={styles.modalText}>Cor do Tema: {selectedCategoria.cor_tema}</Text>
                <Text style={styles.modalText}>Ordem de Exibição: {selectedCategoria.ordem_exibicao}</Text>
                <Text style={styles.modalText}>
                  Status: {selectedCategoria.ativo ? 'Ativo' : 'Inativo'}
                </Text>
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
                    abrirEdicao(selectedCategoria);
                  }}
                  style={styles.modalActionButton}
                >
                  Editar Categoria
                </Button>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Modal de Edição/Criação */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nome *</Text>
              <TextInput
                style={styles.formInput}
                value={newCategoria.nome}
                onChangeText={(text) => setNewCategoria({ ...newCategoria, nome: text })}
                placeholder="Nome da categoria"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Descrição</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newCategoria.descricao}
                onChangeText={(text) => setNewCategoria({ ...newCategoria, descricao: text })}
                placeholder="Descrição da categoria"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Ícone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconSelector}>
                  {iconesDisponiveis.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        newCategoria.icone === icon && styles.iconOptionSelected,
                        { backgroundColor: newCategoria.icone === icon ? newCategoria.cor_tema : colors.neutral[100] }
                      ]}
                      onPress={() => setNewCategoria({ ...newCategoria, icone: icon })}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={24} 
                        color={newCategoria.icone === icon ? colors.neutral[0] : colors.neutral[600]} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Cor do Tema</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorSelector}>
                  {coresDisponiveis.map((cor) => (
                    <TouchableOpacity
                      key={cor}
                      style={[
                        styles.colorOption,
                        { backgroundColor: cor },
                        newCategoria.cor_tema === cor && styles.colorOptionSelected
                      ]}
                      onPress={() => setNewCategoria({ ...newCategoria, cor_tema: cor })}
                    >
                      {newCategoria.cor_tema === cor && (
                        <Ionicons name="checkmark" size={20} color={colors.neutral[0]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Ordem de Exibição</Text>
              <TextInput
                style={styles.formInput}
                value={newCategoria.ordem_exibicao.toString()}
                onChangeText={(text) => setNewCategoria({ 
                  ...newCategoria, 
                  ordem_exibicao: parseInt(text) || 0 
                })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            {/* Preview */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Preview</Text>
              <View style={[styles.previewContainer, { backgroundColor: `${newCategoria.cor_tema}20` }]}>
                <View style={[styles.previewIcon, { backgroundColor: newCategoria.cor_tema }]}>
                  <Ionicons name={newCategoria.icone as any} size={32} color={colors.neutral[0]} />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewNome}>{newCategoria.nome || 'Nome da categoria'}</Text>
                  <Text style={styles.previewDescricao}>
                    {newCategoria.descricao || 'Descrição da categoria'}
                  </Text>
                </View>
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
                onPress={selectedCategoria ? editarCategoria : criarCategoria}
                style={styles.modalActionButton}
              >
                {selectedCategoria ? 'Salvar' : 'Criar'}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  categoriasContainer: {
    paddingHorizontal: spacing[4],
  },
  categoriasList: {
    paddingBottom: spacing[4],
  },
  categoriaCard: {
    marginBottom: spacing[4],
  },
  categoriaHeader: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  categoriaIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  categoriaInfo: {
    flex: 1,
  },
  categoriaNome: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  categoriaDescricao: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  categoriaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ordemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordemTexto: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginLeft: spacing[1],
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
  categoriaPreview: {
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  previewText: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
  },
  categoriaActions: {
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
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
    paddingVertical: spacing[2],
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  colorSelector: {
    flexDirection: 'row',
    paddingVertical: spacing[2],
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    marginRight: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.neutral[0],
  },
  previewContainer: {
    flexDirection: 'row',
    padding: spacing[3],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  previewInfo: {
    flex: 1,
  },
  previewNome: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  previewDescricao: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
});

export default AdminCategorias;
