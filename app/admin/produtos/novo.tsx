import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

// Componentes UI
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

// Serviços e tipos
import { databaseService } from '../../../services/database';
import { authService } from '../../../services/auth';
import { Categoria, FormularioProduto } from '../../../types';

// Theme
import { colors, spacing, typography, radii, shadows } from '../../../utils/theme';

export default function NovoProduto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagens, setImagens] = useState<string[]>([]);

  // Formulário
  const [formulario, setFormulario] = useState<FormularioProduto>({
    nome: '',
    descricao: '',
    categoria_id: 0,
    preco_venda: 0,
    preco_custo: 0,
    sku: '',
    peso: undefined,
    ingredientes: '',
    imagens: [],
    status: 'ativo',
  });

  // Estados para controle da UI
  const [showIngredientes, setShowIngredientes] = useState(false);
  const [showPeso, setShowPeso] = useState(false);

  // Validação de campos
  const [erros, setErros] = useState<{[key: string]: string}>({});

  useEffect(() => {
    checkPermissions();
    loadCategorias();
    gerarSKU();
  }, []);

  const checkPermissions = async () => {
    const user = await authService.getCurrentUser();
    if (!user || user.tipo !== 'admin') {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área');
      router.replace('/(tabs)');
      return;
    }
  };

  const loadCategorias = async () => {
    try {
      const categoriasData = await databaseService.getCategorias();
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    }
  };

  const gerarSKU = () => {
    const timestamp = Date.now().toString();
    const sku = `PROD-${timestamp.slice(-6)}`;
    setFormulario(prev => ({ ...prev, sku }));
  };

  const validarFormulario = (): boolean => {
    const novosErros: {[key: string]: string} = {};

    if (!formulario.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formulario.descricao.trim()) {
      novosErros.descricao = 'Descrição é obrigatória';
    }

    if (formulario.categoria_id === 0) {
      novosErros.categoria_id = 'Categoria é obrigatória';
    }

    if (formulario.preco_venda <= 0) {
      novosErros.preco_venda = 'Preço de venda deve ser maior que zero';
    }

    if (formulario.preco_custo <= 0) {
      novosErros.preco_custo = 'Preço de custo deve ser maior que zero';
    }

    if (formulario.preco_custo >= formulario.preco_venda) {
      novosErros.preco_venda = 'Preço de venda deve ser maior que o preço de custo';
    }

    if (!formulario.sku.trim()) {
      novosErros.sku = 'SKU é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);
      
      const produtoData = {
        ...formulario,
        imagens: JSON.stringify(imagens),
        margem_lucro: ((formulario.preco_venda - formulario.preco_custo) / formulario.preco_custo) * 100,
      };

      const resultado = await databaseService.createProduto(produtoData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sucesso!',
        'Produto criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível criar o produto');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarImagem = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const novaImagem = result.assets[0].uri;
        setImagens(prev => [...prev, novaImagem]);
        setFormulario(prev => ({ ...prev, imagens: [...prev.imagens, novaImagem] }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleRemoverImagem = (index: number) => {
    const novasImagens = imagens.filter((_, i) => i !== index);
    setImagens(novasImagens);
    setFormulario(prev => ({ ...prev, imagens: novasImagens }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const calcularMargemLucro = () => {
    if (formulario.preco_custo > 0 && formulario.preco_venda > 0) {
      return ((formulario.preco_venda - formulario.preco_custo) / formulario.preco_custo) * 100;
    }
    return 0;
  };

  const renderInput = (
    label: string,
    value: string | number,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'email-address';
      multiline?: boolean;
      numberOfLines?: number;
      error?: string;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.inputMultiline,
          options?.error && styles.inputError,
        ]}
        value={value?.toString() || ''}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        keyboardType={options?.keyboardType}
        multiline={options?.multiline}
        numberOfLines={options?.numberOfLines}
        placeholderTextColor={colors.neutral[400]}
      />
      {options?.error && (
        <Text style={styles.errorText}>{options.error}</Text>
      )}
    </View>
  );

  const renderCategoriaSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Categoria *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasList}
      >
        {categorias.map((categoria) => (
          <TouchableOpacity
            key={categoria.id}
            style={[
              styles.categoriaChip,
              formulario.categoria_id === categoria.id && styles.categoriaChipActive,
            ]}
            onPress={() => {
              setFormulario(prev => ({ ...prev, categoria_id: categoria.id }));
              setErros(prev => ({ ...prev, categoria_id: '' }));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.categoriaChipText,
                formulario.categoria_id === categoria.id && styles.categoriaChipTextActive,
              ]}
            >
              {categoria.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {erros.categoria_id && (
        <Text style={styles.errorText}>{erros.categoria_id}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Produto</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informações Básicas */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Informações Básicas</Text>
          
          {renderInput(
            'Nome do Produto *',
            formulario.nome,
            (text) => {
              setFormulario(prev => ({ ...prev, nome: text }));
              setErros(prev => ({ ...prev, nome: '' }));
            },
            {
              placeholder: 'Ex: Pão Francês Premium',
              error: erros.nome,
            }
          )}

          {renderInput(
            'Descrição *',
            formulario.descricao,
            (text) => {
              setFormulario(prev => ({ ...prev, descricao: text }));
              setErros(prev => ({ ...prev, descricao: '' }));
            },
            {
              placeholder: 'Descreva o produto detalhadamente...',
              multiline: true,
              numberOfLines: 4,
              error: erros.descricao,
            }
          )}

          {renderCategoriaSelector()}

          {renderInput(
            'SKU *',
            formulario.sku,
            (text) => {
              setFormulario(prev => ({ ...prev, sku: text }));
              setErros(prev => ({ ...prev, sku: '' }));
            },
            {
              placeholder: 'Código único do produto',
              error: erros.sku,
            }
          )}
        </Card>

        {/* Preços */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Preços</Text>
          
          <View style={styles.precoRow}>
            <View style={styles.precoContainer}>
              {renderInput(
                'Preço de Custo *',
                formulario.preco_custo?.toString() || '0',
                (text) => {
                  const valor = parseFloat(text.replace(',', '.')) || 0;
                  setFormulario(prev => ({ ...prev, preco_custo: valor }));
                  setErros(prev => ({ ...prev, preco_custo: '' }));
                },
                {
                  placeholder: '0,00',
                  keyboardType: 'numeric',
                  error: erros.preco_custo,
                }
              )}
            </View>
            
            <View style={styles.precoContainer}>
              {renderInput(
                'Preço de Venda *',
                formulario.preco_venda?.toString() || '0',
                (text) => {
                  const valor = parseFloat(text.replace(',', '.')) || 0;
                  setFormulario(prev => ({ ...prev, preco_venda: valor }));
                  setErros(prev => ({ ...prev, preco_venda: '' }));
                },
                {
                  placeholder: '0,00',
                  keyboardType: 'numeric',
                  error: erros.preco_venda,
                }
              )}
            </View>
          </View>

          {formulario.preco_custo > 0 && formulario.preco_venda > 0 && (
            <View style={styles.margemContainer}>
              <Text style={styles.margemLabel}>Margem de Lucro:</Text>
              <Text style={[
                styles.margemValue,
                { color: calcularMargemLucro() > 0 ? colors.success[500] : colors.error[500] }
              ]}>
                {(calcularMargemLucro() || 0).toFixed(1)}%
              </Text>
            </View>
          )}
        </Card>

        {/* Imagens */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Imagens do Produto</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagensList}
          >
            {/* Botão para adicionar imagem */}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleSelecionarImagem}
            >
              <Ionicons name="camera" size={32} color={colors.neutral[400]} />
              <Text style={styles.addImageText}>Adicionar Foto</Text>
            </TouchableOpacity>

            {/* Imagens existentes */}
            {imagens.map((imagem, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imagem }} style={styles.produtoImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoverImagem(index)}
                >
                  <Ionicons name="close" size={16} color={colors.neutral[0]} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          <Text style={styles.imageHint}>
            Adicione até 5 fotos do produto. A primeira será a imagem principal.
          </Text>
        </Card>

        {/* Informações Adicionais */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Informações Adicionais</Text>
          
          {/* Toggle Peso */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Especificar peso do produto</Text>
            <Switch
              value={showPeso}
              onValueChange={(value) => {
                setShowPeso(value);
                if (!value) {
                  setFormulario(prev => ({ ...prev, peso: undefined }));
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
              thumbColor={showPeso ? colors.primary[500] : colors.neutral[100]}
            />
          </View>

          {showPeso && renderInput(
            'Peso (em gramas)',
            formulario.peso?.toString() || '0',
            (text) => {
              const valor = parseInt(text) || undefined;
              setFormulario(prev => ({ ...prev, peso: valor }));
            },
            {
              placeholder: 'Ex: 500',
              keyboardType: 'numeric',
            }
          )}

          {/* Toggle Ingredientes */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Adicionar lista de ingredientes</Text>
            <Switch
              value={showIngredientes}
              onValueChange={(value) => {
                setShowIngredientes(value);
                if (!value) {
                  setFormulario(prev => ({ ...prev, ingredientes: '' }));
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
              thumbColor={showIngredientes ? colors.primary[500] : colors.neutral[100]}
            />
          </View>

          {showIngredientes && renderInput(
            'Ingredientes',
            formulario.ingredientes || '',
            (text) => setFormulario(prev => ({ ...prev, ingredientes: text })),
            {
              placeholder: 'Farinha de trigo, água, sal, fermento...',
              multiline: true,
              numberOfLines: 3,
            }
          )}

          {/* Status do produto */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Produto ativo</Text>
            <Switch
              value={formulario.status === 'ativo'}
              onValueChange={(value) => {
                setFormulario(prev => ({ 
                  ...prev, 
                  status: value ? 'ativo' : 'inativo' 
                }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.neutral[300], true: colors.success[200] }}
              thumbColor={formulario.status === 'ativo' ? colors.success[500] : colors.neutral[100]}
            />
          </View>
        </Card>

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            onPress={handleSalvar}
            isLoading={loading}
            style={styles.saveButton}
          >
            Criar Produto
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.profiles.admin.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    ...shadows.sm,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[0],
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing[4],
    marginBottom: spacing[2],
    padding: spacing[4],
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[0],
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.error[500],
    marginTop: spacing[1],
  },
  categoriasList: {
    marginTop: spacing[2],
  },
  categoriaChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.neutral[100],
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  categoriaChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoriaChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
  },
  categoriaChipTextActive: {
    color: colors.neutral[0],
  },
  precoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  precoContainer: {
    flex: 1,
  },
  margemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    borderRadius: radii.lg,
    marginTop: spacing[2],
  },
  margemLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  margemValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
  },
  imagensList: {
    marginBottom: spacing[2],
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
    backgroundColor: colors.neutral[50],
  },
  addImageText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  produtoImage: {
    width: 120,
    height: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral[100],
  },
  removeImageButton: {
    position: 'absolute',
    top: -spacing[1],
    right: -spacing[1],
    backgroundColor: colors.error[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingVertical: spacing[2],
  },
  toggleLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[700],
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  bottomSpacing: {
    height: spacing[6],
  },
}); 