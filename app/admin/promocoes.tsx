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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Promocao {
  id: number;
  titulo: string;
  descricao: string;
  desconto: number;
  tipo: 'percentual' | 'valor';
  dataInicio: string;
  dataFim: string;
  status: 'ativa' | 'inativa' | 'expirada';
  produtos: string[];
}

export default function AdminPromocoes() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPromocoes();
  }, []);

  const loadPromocoes = async () => {
    try {
      setLoading(true);
      // Simulando dados de promoções
      const promocoesMockadas: Promocao[] = [
        {
          id: 1,
          titulo: 'Promoção de Farinha',
          descricao: 'Desconto especial em farinhas premium',
          desconto: 15,
          tipo: 'percentual',
          dataInicio: '2024-06-01',
          dataFim: '2024-06-30',
          status: 'ativa',
          produtos: ['Farinha de Trigo Premium', 'Farinha Integral']
        },
        {
          id: 2,
          titulo: 'Combo Açúcar',
          descricao: 'R$ 5,00 off em açúcares',
          desconto: 5,
          tipo: 'valor',
          dataInicio: '2024-06-15',
          dataFim: '2024-07-15',
          status: 'ativa',
          produtos: ['Açúcar Cristal', 'Açúcar Mascavo']
        },
        {
          id: 3,
          titulo: 'Black Friday Padaria',
          descricao: 'Mega desconto em todos os produtos',
          desconto: 30,
          tipo: 'percentual',
          dataInicio: '2024-11-24',
          dataFim: '2024-11-26',
          status: 'inativa',
          produtos: ['Todos os produtos']
        }
      ];
      
      setTimeout(() => {
        setPromocoes(promocoesMockadas);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromocoes();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return colors.success[500];
      case 'inativa':
        return colors.warning[500];
      case 'expirada':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'ATIVA';
      case 'inativa':
        return 'INATIVA';
      case 'expirada':
        return 'EXPIRADA';
      default:
        return status.toUpperCase();
    }
  };

  const togglePromocaoStatus = (id: number) => {
    Alert.alert(
      'Alterar Status',
      'Deseja alterar o status desta promoção?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setPromocoes(prev =>
              prev.map(promocao =>
                promocao.id === id
                  ? {
                      ...promocao,
                      status: promocao.status === 'ativa' ? 'inativa' : 'ativa'
                    }
                  : promocao
              )
            );
          }
        }
      ]
    );
  };

  const deletePromocao = (id: number) => {
    Alert.alert(
      'Excluir Promoção',
      'Tem certeza que deseja excluir esta promoção?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setPromocoes(prev => prev.filter(promocao => promocao.id !== id));
          }
        }
      ]
    );
  };

  const renderPromocaoCard = (promocao: Promocao) => (
    <Card key={promocao.id} variant="elevated" size="md" style={styles.promocaoCard}>
      <View style={styles.promocaoHeader}>
        <View style={styles.promocaoTitleContainer}>
          <Text style={styles.promocaoTitulo}>{promocao.titulo}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(promocao.status) }]}>
            <Text style={styles.statusText}>{getStatusText(promocao.status)}</Text>
          </View>
        </View>
        
        <View style={styles.descontoContainer}>
          <Text style={styles.descontoValor}>
                            {promocao.tipo === 'percentual' ? `${promocao.desconto}%` : `R$ ${(promocao.desconto || 0).toFixed(2)}`}
          </Text>
          <Text style={styles.descontoTipo}>
            {promocao.tipo === 'percentual' ? 'desconto' : 'off'}
          </Text>
        </View>
      </View>

      <Text style={styles.promocaoDescricao}>{promocao.descricao}</Text>

      <View style={styles.promocaoDatas}>
        <View style={styles.dataContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.neutral[500]} />
          <Text style={styles.dataText}>
            {formatDate(promocao.dataInicio)} - {formatDate(promocao.dataFim)}
          </Text>
        </View>
      </View>

      <View style={styles.produtosContainer}>
        <Text style={styles.produtosLabel}>Produtos:</Text>
        <Text style={styles.produtosText} numberOfLines={2}>
          {promocao.produtos.join(', ')}
        </Text>
      </View>

      <View style={styles.promocaoActions}>
        <Button
          size="sm"
          variant="tertiary"
          leftIcon="create"
          onPress={() => Alert.alert('Editar', `Editar promoção: ${promocao.titulo}`)}
          style={styles.actionButton}
        >
          Editar
        </Button>

        <Button
          size="sm"
          variant={promocao.status === 'ativa' ? 'secondary' : 'success'}
          leftIcon={promocao.status === 'ativa' ? 'pause' : 'play'}
          onPress={() => togglePromocaoStatus(promocao.id)}
          style={styles.actionButton}
        >
          {promocao.status === 'ativa' ? 'Pausar' : 'Ativar'}
        </Button>

        <Button
          size="sm"
          variant="danger"
          leftIcon="trash"
          onPress={() => deletePromocao(promocao.id)}
          style={styles.actionButton}
        >
          Excluir
        </Button>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Carregando promoções...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary[500], colors.secondary[500]]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Promoções</Text>
        <Text style={styles.headerSubtitle}>
          {promocoes.filter(p => p.status === 'ativa').length} promoções ativas
        </Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Nova Promoção', 'Criar nova promoção')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Conteúdo */}
      <ScrollView
        style={styles.content}
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
        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {promocoes.filter(p => p.status === 'ativa').length}
            </Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {promocoes.filter(p => p.status === 'inativa').length}
            </Text>
            <Text style={styles.statLabel}>Inativas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {promocoes.filter(p => p.status === 'expirada').length}
            </Text>
            <Text style={styles.statLabel}>Expiradas</Text>
          </View>
        </View>

        {/* Lista de Promoções */}
        <View style={styles.promocoesList}>
          {promocoes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={64} color={colors.neutral[400]} />
              <Text style={styles.emptyTitle}>Nenhuma promoção encontrada</Text>
              <Text style={styles.emptyMessage}>
                Crie sua primeira promoção para atrair mais clientes
              </Text>
              <Button
                variant="primary"
                onPress={() => Alert.alert('Nova Promoção', 'Criar nova promoção')}
                style={styles.createButton}
              >
                Criar Promoção
              </Button>
            </View>
          ) : (
            promocoes.map(renderPromocaoCard)
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingTop: 50,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
    position: 'relative',
  },
  headerTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[100],
  },
  addButton: {
    position: 'absolute',
    top: 50,
    right: spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.full,
    padding: spacing[2],
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  promocoesList: {
    paddingHorizontal: spacing[4],
  },
  promocaoCard: {
    marginBottom: spacing[4],
  },
  promocaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  promocaoTitleContainer: {
    flex: 1,
    marginRight: spacing[3],
  },
  promocaoTitulo: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
  },
  descontoContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  descontoValor: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[600],
  },
  descontoTipo: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary[500],
    textTransform: 'uppercase',
  },
  promocaoDescricao: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  promocaoDatas: {
    marginBottom: spacing[3],
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginLeft: spacing[2],
  },
  produtosContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  produtosLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  produtosText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  promocaoActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
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
    paddingHorizontal: spacing[4],
  },
  createButton: {
    minWidth: 200,
  },
  bottomSpacing: {
    height: spacing[8],
  },
});
