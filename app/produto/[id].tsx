import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../../services/database';
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';
import { Produto } from '../../types';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { Button } from '../../components/ui/Button';

const { width: screenWidth } = Dimensions.get('window');

export default function ProdutoDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    loadProduto();
  }, [id]);

  const loadProduto = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const produtoData = await databaseService.getProdutoById(parseInt(id));
      setProduto(produtoData);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      Alert.alert('Erro', 'Não foi possível carregar o produto');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarCarrinho = async () => {
    if (!produto) return;

    try {
      // Aqui você implementaria a lógica de adicionar ao carrinho
      // Por enquanto, apenas mostrar um alerta
      Alert.alert(
        'Produto Adicionado',
        `${produto.nome} foi adicionado ao carrinho!\n\nQuantidade: ${quantidade}`,
        [
          { text: 'Continuar Comprando', style: 'cancel' },
          { text: 'Ver Carrinho', onPress: () => router.push('/carrinho') }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o produto ao carrinho');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error[500]} />
        <Text style={styles.errorTitle}>Produto não encontrado</Text>
        <Text style={styles.errorMessage}>O produto que você está procurando não existe</Text>
        <Button
          variant="primary"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Voltar
        </Button>
      </View>
    );
  }

  const precoFinal = produto.preco_promocional || produto.preco_venda;
  const temDesconto = produto.preco_promocional && produto.preco_promocional < produto.preco_venda;

  return (
    <BackgroundPattern variant="default" intensity="subtle">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Imagem do Produto */}
        <View style={styles.imageContainer}>
          {produto.imagens ? (
            <Image
              source={{ uri: JSON.parse(produto.imagens)[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={64} color={colors.neutral[400]} />
            </View>
          )}
          
          {produto.novo && (
            <View style={styles.novoBadge}>
              <Text style={styles.novoText}>NOVO</Text>
            </View>
          )}
          
          {temDesconto && (
            <View style={styles.descontoBadge}>
              <Text style={styles.descontoText}>OFERTA</Text>
            </View>
          )}
        </View>

        {/* Informações do Produto */}
        <View style={styles.content}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{produto.nome}</Text>
            <Text style={styles.productSku}>SKU: {produto.sku}</Text>
            
            <View style={styles.priceContainer}>
              {temDesconto && (
                <Text style={styles.originalPrice}>
                  {formatCurrency(produto.preco_venda)}
                </Text>
              )}
              <Text style={styles.currentPrice}>
                {formatCurrency(precoFinal)}
              </Text>
            </View>

            {produto.avaliacao_media > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= produto.avaliacao_media ? "star" : "star-outline"}
                      size={16}
                      color={colors.secondary[500]}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {produto.avaliacao_media.toFixed(1)} ({produto.total_avaliacoes} avaliações)
                </Text>
              </View>
            )}
          </View>

          {/* Descrição */}
          {produto.descricao && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.sectionContent}>{produto.descricao}</Text>
            </View>
          )}

          {/* Ingredientes */}
          {produto.ingredientes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <Text style={styles.sectionContent}>{produto.ingredientes}</Text>
            </View>
          )}

          {/* Informações Nutricionais */}
          {produto.informacoes_nutricionais && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Nutricionais</Text>
              <Text style={styles.sectionContent}>
                {typeof produto.informacoes_nutricionais === 'string' 
                  ? produto.informacoes_nutricionais 
                  : JSON.stringify(produto.informacoes_nutricionais)
                }
              </Text>
            </View>
          )}

          {/* Alérgenos */}
          {produto.alergenos && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alérgenos</Text>
              <Text style={[styles.sectionContent, styles.allergenText]}>
                ⚠️ {produto.alergenos}
              </Text>
            </View>
          )}

          {/* Peso */}
          {produto.peso && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Peso</Text>
              <Text style={styles.sectionContent}>{produto.peso}g</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Fixo */}
      <View style={styles.footer}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
          >
            <Ionicons name="remove" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantidade}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantidade(quantidade + 1)}
          >
            <Ionicons name="add" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAdicionarCarrinho}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            style={styles.addToCartGradient}
          >
            <Ionicons name="cart" size={20} color={colors.white} />
            <Text style={styles.addToCartText}>
              Adicionar • {formatCurrency(precoFinal * quantidade)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
  },
  errorTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: 60,
    paddingBottom: spacing[4],
  },
  backButton: {
    padding: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.full,
    ...shadows.sm,
  },
  favoriteButton: {
    padding: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.full,
    ...shadows.sm,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing[6],
  },
  productImage: {
    width: screenWidth,
    height: 300,
    backgroundColor: colors.neutral[100],
  },
  placeholderImage: {
    width: screenWidth,
    height: 300,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  novoBadge: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  novoText: {
    color: colors.white,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
  },
  descontoBadge: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    backgroundColor: colors.error[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  descontoText: {
    color: colors.white,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120, // Espaço para o footer fixo
  },
  productInfo: {
    marginBottom: spacing[6],
  },
  productName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  productSku: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  originalPrice: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
    marginRight: spacing[2],
  },
  currentPrice: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary[600],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: spacing[2],
  },
  ratingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  sectionContent: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  allergenText: {
    color: colors.error[600],
    fontWeight: typography.fontWeights.medium as any,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radii.lg,
    padding: spacing[1],
    marginRight: spacing[3],
  },
  quantityButton: {
    padding: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.md,
  },
  quantityText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginHorizontal: spacing[4],
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  addToCartText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.white,
  },
}); 