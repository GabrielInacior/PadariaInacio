import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  BounceInLeft,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { authService } from '../../services/auth';
import { theme } from '../../utils/theme';
import { BackgroundPattern } from '../../components/ui/BackgroundPattern';
import { TipoUsuario } from '../../types';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('cliente');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const buttonScale = useSharedValue(1);

  // Verificar se há sessão ativa ao carregar a tela
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        
        if (user) {
          console.log('Sessão ativa encontrada, redirecionando...');
          
          // Redirecionar baseado no tipo do usuário
          if (user.tipo === 'admin' || user.tipo === 'gerente') {
            router.replace('/admin/dashboard');
          } else if (user.tipo === 'fornecedor') {
            router.replace('/fornecedor/dashboard');
          } else {
            router.replace('/(tabs)');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      // Em caso de erro, limpar sessão e continuar no login
      await authService.logout();
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login({
        email: email.trim().toLowerCase(),
        senha,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Redirecionar baseado no tipo real do usuário retornado
      if (user.tipo === 'admin' || user.tipo === 'gerente') {
        router.replace('/admin/dashboard');
      } else if (user.tipo === 'fornecedor') {
        router.replace('/fornecedor/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (tipo: TipoUsuario) => {
    const credentials: Record<TipoUsuario, { email: string; senha: string }> = {
      cliente: { email: 'cliente@padariainacio.com', senha: 'cliente123' },
      fornecedor: { email: 'fornecedor@padariainacio.com', senha: 'fornecedor123' },
      admin: { email: 'admin@padariainacio.com', senha: 'admin123' },
      funcionario: { email: 'funcionario@padariainacio.com', senha: 'funcionario123' },
      gerente: { email: 'gerente@padariainacio.com', senha: 'gerente123' },
    };

    const cred = credentials[tipo];
    setEmail(cred.email);
    setSenha(cred.senha);
    setTipoUsuario(tipo);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Auto login após um pequeno delay para mostrar os dados preenchidos
    setTimeout(() => {
      handleLogin();
    }, 500);
  };

  const goToRegister = () => {
    router.push('/auth/register');
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPress = () => {
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
    handleLogin();
  };

  // Mostrar loading enquanto verifica sessão
  if (checkingSession) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>
          Verificando sessão...
        </Text>
      </View>
    );
  }

  return (
    <BackgroundPattern variant="warm" intensity="subtle">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com Logo */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                style={styles.logoBackground}
              >
                <Text style={styles.logoIcon}>🥖</Text>
              </LinearGradient>
              <Text style={styles.logoText}>Padaria Inácio</Text>
              <Text style={styles.logoSubtext}>Tradição em cada pão</Text>
            </View>
          </Animated.View>

          {/* Card de Login */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.loginCard}>
            <BlurView intensity={20} tint="light" style={styles.blurContainer}>
              <View style={styles.cardContent}>
                <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
                <Text style={styles.subtitleText}>Entre na sua conta para continuar</Text>

                {/* Seletor de Tipo de Usuário */}
                <View style={styles.userTypeContainer}>
                  {(['cliente', 'fornecedor', 'admin'] as TipoUsuario[]).map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      style={[
                        styles.userTypeButton,
                        tipoUsuario === tipo && styles.userTypeButtonActive,
                      ]}
                      onPress={() => {
                        setTipoUsuario(tipo);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons 
                        name={
                          tipo === 'cliente' ? 'person' : 
                          tipo === 'fornecedor' ? 'business' : 
                          'shield-checkmark'
                        } 
                        size={16} 
                        color={tipoUsuario === tipo ? theme.colors.white : theme.colors.primary[600]} 
                      />
                      <Text style={[
                        styles.userTypeText,
                        tipoUsuario === tipo && styles.userTypeTextActive,
                      ]}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Campo Email */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail" size={20} color={theme.colors.primary[500]} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Digite seu email"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Campo Senha */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={20} color={theme.colors.primary[500]} />
                    <TextInput
                      style={styles.input}
                      value={senha}
                      onChangeText={setSenha}
                      placeholder="Digite sua senha"
                      placeholderTextColor={theme.colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={theme.colors.primary[500]} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botão de Login */}
                <Animated.View style={animatedButtonStyle}>
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleButtonPress}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                      style={styles.loginButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color={theme.colors.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Entrar</Text>
                          <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Link para Registro */}
                <TouchableOpacity style={styles.registerButton} onPress={goToRegister}>
                  <Text style={styles.registerButtonText}>
                    Não tem conta? <Text style={styles.registerLink}>Cadastre-se aqui</Text>
                  </Text>
                </TouchableOpacity>

                {/* Divisor */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Botão para mostrar Login Rápido */}
                <TouchableOpacity
                  style={styles.quickLoginToggle}
                  onPress={() => {
                    setShowQuickLogin(!showQuickLogin);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="flash" size={16} color={theme.colors.primary[600]} />
                  <Text style={styles.quickLoginToggleText}>Login Rápido (Demo)</Text>
                  <Ionicons 
                    name={showQuickLogin ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={theme.colors.primary[600]} 
                  />
                </TouchableOpacity>

                {/* Botões de Login Rápido */}
                {showQuickLogin && (
                  <Animated.View entering={FadeInDown.delay(100)} style={styles.quickLoginContainer}>
                    {(['cliente', 'fornecedor', 'admin'] as TipoUsuario[]).map((tipo, index) => (
                      <Animated.View key={tipo} entering={BounceInLeft.delay(index * 100)}>
                        <TouchableOpacity
                          style={styles.quickLoginButton}
                          onPress={() => quickLogin(tipo)}
                        >
                          <Ionicons 
                            name={
                              tipo === 'cliente' ? 'person-circle' : 
                              tipo === 'fornecedor' ? 'business-outline' : 
                              'shield-checkmark-outline'
                            } 
                            size={20} 
                            color={theme.colors.primary[600]} 
                          />
                          <Text style={styles.quickLoginButtonText}>
                            Entrar como {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </Animated.View>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* Rodapé */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
            <Text style={styles.footerText}>
              Feito com ❤️ para a melhor padaria da cidade
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundPattern>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  logoIcon: {
    fontSize: 36,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary[700],
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loginCard: {
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  blurContainer: {
    borderRadius: theme.radii.xl,
  },
  cardContent: {
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radii.lg,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  userTypeButtonActive: {
    backgroundColor: theme.colors.primary[500],
    ...theme.shadows.sm,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  userTypeTextActive: {
    color: theme.colors.white,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  registerButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  quickLoginToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    gap: 8,
  },
  quickLoginToggleText: {
    fontSize: 14,
    color: theme.colors.primary[600],
    fontWeight: '500',
  },
  quickLoginContainer: {
    marginTop: theme.spacing.md,
    gap: 8,
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    gap: 12,
  },
  quickLoginButtonText: {
    fontSize: 14,
    color: theme.colors.primary[700],
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 