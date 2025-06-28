import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
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
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native-gesture-handler';

// Componentes UI Premium
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { NotificationMenu } from '../../components/notifications/NotificationMenu';

// Theme e tipos
import { theme } from '../../utils/theme';
import { Produto, Usuario, DashboardKPI, Categoria } from '../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Dados mockados premium com nova temática de padaria
const bannersPremium = [
  {
    id: 1,
    titulo: 'Super Combo Família',
    subtitulo: 'Economize 40% no combo completo',
    imagem: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    gradiente: [theme.colors.primary[400], theme.colors.primary[600]], // Tons de dourado
    promocao: '40% OFF',
  },
  {
    id: 2,
    titulo: 'Pães Artesanais',
    subtitulo: 'Fresquinhos todos os dias',
    imagem: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
    gradiente: [theme.colors.bread, theme.colors.crust], // Cores do pão
    promocao: 'NOVO',
  },
  {
    id: 3,
    titulo: 'Delivery Grátis',
    subtitulo: 'Em pedidos acima de R$ 50',
    imagem: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
    gradiente: [theme.colors.success[400], theme.colors.success[600]], // Verde fresco
    promocao: 'GRÁTIS',
  },
];

const categoriasPremium = [
  { id: 1, nome: 'Pães', icone: 'restaurant', cor: theme.colors.bread, total: 25 },
  { id: 2, nome: 'Doces', icone: 'ice-cream', cor: theme.colors.honey, total: 18 },
  { id: 3, nome: 'Salgados', icone: 'pizza', cor: theme.colors.crust, total: 32 },
  { id: 4, nome: 'Bebidas', icone: 'wine', cor: theme.colors.secondary[500], total: 15 },
  { id: 5, nome: 'Combos', icone: 'gift', cor: theme.colors.wheat, total: 8 },
  { id: 6, nome: 'Especiais', icone: 'star', cor: theme.colors.primary[500], total: 12 },
];

const produtosDestaque = [
  {
    id: 1,
    nome: 'Pão Francês Premium',
    preco_venda: 0.75,
    preco_promocional: 0.60,
    imagens: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    avaliacao_media: 4.8,
    total_vendas: 1250,
    novo: false,
    destaque: true,
    categoria_id: 1,
  },
  {
    id: 2,
    nome: 'Croissant Artesanal',
    preco_venda: 8.90,
    preco_promocional: 6.90,
    imagens: 'https://images.unsplash.com/photo-1555507036-ab794f4ade6a?w=400',
    avaliacao_media: 4.9,
    total_vendas: 890,
    novo: true,
    destaque: true,
    categoria_id: 1,
  },
  {
    id: 3,
    nome: 'Brigadeiro Gourmet',
    preco_venda: 4.50,
    imagens: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    avaliacao_media: 4.7,
    total_vendas: 2100,
    novo: false,
    destaque: true,
    categoria_id: 2,
  },
];

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  
  const scrollY = useSharedValue(0);
  const bannerScrollX = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // Refs
  const bannerFlatListRef = useRef<FlatList>(null);

  // Animações do scroll com useCallback para compatibilidade React 19
  const scrollHandler = useCallback(
    useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
        const opacity = interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.9],
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
          [0, -10],
          'clamp'
        ),
      },
    ],
  }));

  // Auto-scroll dos banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => {
        const next = (prev + 1) % bannersPremium.length;
        bannerFlatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Render Banner Item
  const renderBannerItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.bannerItem}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Promoção', `Você clicou em: ${item.titulo}`);
      }}
    >
      <LinearGradient
        colors={item.gradiente as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        <Image source={{ uri: item.imagem }} style={styles.bannerImage} />
        <BlurView intensity={20} style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>{item.promocao}</Text>
            </View>
            <Text style={styles.bannerTitle}>{item.titulo}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitulo}</Text>
          </View>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render Categoria Item
  const renderCategoriaItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.categoriaItem, { borderColor: item.cor }]}
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Categoria', `Você clicou em: ${item.nome}`);
      }}
    >
      <LinearGradient
        colors={[item.cor + '20', item.cor + '10']}
        style={styles.categoriaGradient}
      >
        <Ionicons name={item.icone as any} size={32} color={item.cor} />
        <Text style={[styles.categoriaNome, { color: item.cor }]}>{item.nome}</Text>
        <Text style={styles.categoriaTotal}>{item.total} itens</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render Produto Destaque
  const renderProdutoDestaque = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.produtoItem}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Produto', `Você clicou em: ${item.nome}`);
      }}
    >
      <Card variant="elevated">
        <View style={styles.produtoImageContainer}>
          <Image source={{ uri: item.imagens }} style={styles.produtoImage} />
          {item.novo && (
            <View style={styles.produtoNovoBadge}>
              <Text style={styles.produtoNovoText}>NOVO</Text>
            </View>
          )}
          {item.preco_promocional && (
            <View style={styles.produtoPromocaoBadge}>
              <Text style={styles.produtoPromocaoText}>
                {Math.round(((item.preco_venda - item.preco_promocional) / item.preco_venda) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.produtoContent}>
          <Text style={styles.produtoNome} numberOfLines={2}>{item.nome}</Text>
          
          <View style={styles.produtoAvaliacaoContainer}>
            <Ionicons name="star" size={14} color={theme.colors.warning[500]} />
            <Text style={styles.produtoAvaliacao}>{item.avaliacao_media}</Text>
            <Text style={styles.produtoVendas}>({item.total_vendas})</Text>
          </View>

          <View style={styles.produtoPrecoContainer}>
            {item.preco_promocional ? (
              <>
                <Text style={styles.produtoPrecoOriginal}>
                  R$ {item.preco_venda.toFixed(2)}
                </Text>
                <Text style={styles.produtoPrecoPromocional}>
                  R$ {item.preco_promocional.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.produtoPreco}>
                R$ {item.preco_venda.toFixed(2)}
              </Text>
            )}
          </View>

          <Button size="sm" variant="primary" style={styles.produtoButton}>
            Adicionar
          </Button>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <BackgroundPattern variant="warm" intensity="subtle">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Olá! 👋</Text>
              <Text style={styles.headerTitle}>Padaria Inácio</Text>
            </View>
            <View style={styles.headerActions}>
              <NotificationMenu 
                userType="cliente"
                onNotificationPress={(notification) => {
                  console.log('Notificação cliente pressionada:', notification);
                  // Aqui você pode implementar navegação específica para cliente
                }}
              />
              
              <TouchableOpacity
                style={styles.headerProfileButton}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <LinearGradient
                  colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                  style={styles.headerProfileGradient}
                >
                  <Ionicons name="person" size={24} color={theme.colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Banners Promocionais */}
        <View style={styles.bannersSection}>
          <FlatList
            ref={bannerFlatListRef}
            data={bannersPremium}
            renderItem={renderBannerItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={screenWidth - 40}
            decelerationRate="fast"
            contentContainerStyle={styles.bannersContainer}
          />
          
          {/* Indicadores dos banners */}
          <View style={styles.bannerIndicators}>
            {bannersPremium.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerIndicator,
                  {
                    backgroundColor: currentBanner === index 
                      ? theme.colors.primary[500] 
                      : theme.colors.gray[300],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Categorias */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.sectionViewAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categoriasPremium}
            renderItem={renderCategoriaItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasContainer}
          />
        </View>

        {/* Produtos em Destaque */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos em Destaque</Text>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.sectionViewAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={produtosDestaque}
            renderItem={renderProdutoDestaque}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.produtosContainer}
          />
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </BackgroundPattern>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerGreeting: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.primary[700],
  },
  headerProfileButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  headerProfileGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Banners
  bannersSection: {
    marginBottom: theme.spacing.xl,
  },
  bannersContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  bannerItem: {
    width: screenWidth - 40,
    height: 180,
    marginRight: theme.spacing.md,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  bannerGradient: {
    flex: 1,
    position: 'relative',
  },
  bannerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerBadge: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    marginBottom: theme.spacing.sm,
  },
  bannerBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  bannerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: 8,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Seções
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionViewAll: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  
  // Categorias
  categoriasContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoriaItem: {
    width: 100,
    height: 100,
    marginRight: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  categoriaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  categoriaNome: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  categoriaTotal: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  
  // Produtos
  produtosContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  produtoItem: {
    width: 200,
    marginRight: theme.spacing.md,
  },
  produtoImageContainer: {
    position: 'relative',
    height: 120,
  },
  produtoImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    resizeMode: 'cover',
  },
  produtoNovoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.colors.success[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  produtoNovoText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.white,
  },
  produtoPromocaoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  produtoPromocaoText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.white,
  },
  produtoContent: {
    padding: theme.spacing.md,
  },
  produtoNome: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  produtoAvaliacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  produtoAvaliacao: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  produtoVendas: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  produtoPrecoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  produtoPreco: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  produtoPrecoOriginal: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  produtoPrecoPromocional: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.error[500],
  },
  produtoButton: {
    marginTop: 'auto',
  },
  
  // Espaçamento
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen; 