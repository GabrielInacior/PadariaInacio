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
  Switch,
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
import { authService } from '../../services/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FornecedorProfile {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  categoria_fornecedor: string;
  avaliacao_media: number;
  endereco?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  horario_funcionamento?: string;
  observacoes?: string;
}

const FornecedorPerfil: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FornecedorProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedProfile, setEditedProfile] = useState<FornecedorProfile | null>(null);
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);
  
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

  // Carregar dados do perfil
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do fornecedor
      const user = await databaseService.getUserById(fornecedorId);
      
      if (user) {
        const profileData: FornecedorProfile = {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone || '',
          cnpj: (user as any).cnpj || '',
          razao_social: (user as any).razao_social || '',
          nome_fantasia: (user as any).nome_fantasia || '',
          categoria_fornecedor: (user as any).categoria_fornecedor || '',
          avaliacao_media: (user as any).avaliacao_media || 0,
          endereco: 'Rua das Flores, 123 - São Paulo/SP',
          website: 'www.distribuidorapaoecia.com.br',
          instagram: '@paoecia_oficial',
          whatsapp: '+55 11 98765-4321',
          horario_funcionamento: 'Segunda a Sexta: 07:00 - 18:00\nSábado: 07:00 - 12:00',
          observacoes: 'Especializada em produtos de panificação premium'
        };
        
        setProfile(profileData);
        setEditedProfile(profileData);
      }
      
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Salvar alterações do perfil
  const salvarPerfil = async () => {
    if (!editedProfile) return;

    try {
      await databaseService.updateUser(fornecedorId, {
        nome: editedProfile.nome,
        email: editedProfile.email,
        telefone: editedProfile.telefone,
        status: 'ativo'
      });

      setProfile(editedProfile);
      setEditModalVisible(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/auth/login');
            } catch (error) {
              console.error('Erro no logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          }
        }
      ]
    );
  };

  // Render Item de Menu
  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    showArrow: boolean = true
  ) => {
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIcon}>
          <Ionicons name={icon as any} size={24} color={colors.primary[500]} />
        </View>
        
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        
        {rightElement || (showArrow && (
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        ))}
      </TouchableOpacity>
    );
  };

  if (!profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

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
              <Text style={styles.headerTitle}>Perfil da Empresa</Text>
              <Text style={styles.headerSubtitle}>
                {profile.nome_fantasia}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setEditModalVisible(true);
              }}
            >
              <Ionicons name="create" size={24} color={colors.white} />
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
        {/* Informações da Empresa */}
        <View style={styles.section}>
          <Card variant="elevated" size="lg" style={styles.profileCard}>
            <LinearGradient
              colors={[colors.primary[500], colors.secondary[500]] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {profile.nome_fantasia.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.profileName}>{profile.nome_fantasia}</Text>
              <Text style={styles.profileRazaoSocial}>{profile.razao_social}</Text>
              
              <View style={styles.profileRating}>
                <Ionicons name="star" size={16} color={colors.warning[400]} />
                <Text style={styles.profileRatingText}>
                  {profile.avaliacao_media.toFixed(1)} avaliação
                </Text>
              </View>
            </LinearGradient>
          </Card>
        </View>

        {/* Informações de Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Contato</Text>
          
          <Card variant="elevated" size="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{profile.telefone}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={20} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CNPJ</Text>
                <Text style={styles.infoValue}>{profile.cnpj}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Endereço</Text>
                <Text style={styles.infoValue}>{profile.endereco}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <Card variant="elevated" size="md" style={styles.menuCard}>
            {renderMenuItem(
              'notifications',
              'Notificações Push',
              'Receber notificações no dispositivo',
              () => {},
              <Switch
                value={notificacoesPush}
                onValueChange={setNotificacoesPush}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor={colors.white}
              />,
              false
            )}
            
            {renderMenuItem(
              'mail',
              'Notificações por E-mail',
              'Receber notificações por e-mail',
              () => {},
              <Switch
                value={notificacoesEmail}
                onValueChange={setNotificacoesEmail}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor={colors.white}
              />,
              false
            )}
            
            {renderMenuItem(
              'moon',
              'Modo Escuro',
              'Tema escuro para o aplicativo',
              () => {},
              <Switch
                value={modoEscuro}
                onValueChange={setModoEscuro}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor={colors.white}
              />,
              false
            )}
          </Card>
        </View>

        {/* Gestão de Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestão de Conta</Text>
          
          <Card variant="elevated" size="md" style={styles.menuCard}>
            {renderMenuItem(
              'analytics',
              'Relatórios e Analytics',
              'Ver relatórios de vendas e performance',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/fornecedor/relatorios');
              }
            )}
            
            {renderMenuItem(
              'shield-checkmark',
              'Segurança',
              'Alterar senha e configurações de segurança',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Segurança', 'Funcionalidade em desenvolvimento');
              }
            )}
            
            {renderMenuItem(
              'card',
              'Planos e Pagamento',
              'Gerenciar plano e métodos de pagamento',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Planos', 'Funcionalidade em desenvolvimento');
              }
            )}
          </Card>
        </View>

        {/* Suporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          
          <Card variant="elevated" size="md" style={styles.menuCard}>
            {renderMenuItem(
              'help-circle',
              'Central de Ajuda',
              'Perguntas frequentes e tutoriais',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Ajuda', 'Abrindo central de ajuda...');
              }
            )}
            
            {renderMenuItem(
              'chatbubble',
              'Falar com Suporte',
              'Entre em contato conosco',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Suporte', 'Redirecionando para o WhatsApp...');
              }
            )}
            
            {renderMenuItem(
              'star',
              'Avaliar App',
              'Avalie nossa experiência na loja',
              () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Avaliação', 'Obrigado pelo feedback!');
              }
            )}
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            variant="tertiary"
            leftIcon="log-out"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Sair da Conta
          </Button>
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de Edição */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {editedProfile && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Nome Fantasia</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editedProfile.nome_fantasia}
                    onChangeText={(text) => setEditedProfile({
                      ...editedProfile,
                      nome_fantasia: text
                    })}
                    placeholder="Nome fantasia da empresa"
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>E-mail</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editedProfile.email}
                    onChangeText={(text) => setEditedProfile({
                      ...editedProfile,
                      email: text
                    })}
                    placeholder="E-mail de contato"
                    keyboardType="email-address"
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Telefone</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editedProfile.telefone}
                    onChangeText={(text) => setEditedProfile({
                      ...editedProfile,
                      telefone: text
                    })}
                    placeholder="Telefone de contato"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={editedProfile.endereco}
                    onChangeText={(text) => setEditedProfile({
                      ...editedProfile,
                      endereco: text
                    })}
                    placeholder="Endereço completo"
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Observações</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={editedProfile.observacoes}
                    onChangeText={(text) => setEditedProfile({
                      ...editedProfile,
                      observacoes: text
                    })}
                    placeholder="Informações adicionais sobre a empresa"
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.neutral[500]}
                  />
                </View>
              </>
            )}
          </ScrollView>
          
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
              onPress={salvarPerfil}
              style={styles.modalActionButton}
            >
              Salvar
            </Button>
          </View>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  profileCard: {
    overflow: 'hidden',
    marginTop: -spacing[8],
  },
  profileGradient: {
    padding: spacing[6],
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  profileAvatarText: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
  },
  profileName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  profileRazaoSocial: {
    fontSize: typography.fontSizes.base,
    color: colors.white + 'CC',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileRatingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.white,
    marginLeft: spacing[1],
  },
  infoCard: {
    padding: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium as any,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  menuSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  logoutButton: {
    marginTop: spacing[4],
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
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSizes.base,
    color: colors.neutral[900],
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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

export default FornecedorPerfil;