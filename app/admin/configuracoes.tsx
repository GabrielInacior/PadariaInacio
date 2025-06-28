import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Componentes UI Premium
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Serviços
import { authService } from '../../services/auth';

// Theme
import { colors, spacing, typography, radii, shadows } from '../../utils/theme';

const AdminConfiguracoes: React.FC = () => {
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
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
          },
        },
      ]
    );
  };

  const handleChangeProfile = (perfil: string) => {
    Alert.alert(
      'Trocar Perfil',
      `Deseja fazer login como ${perfil}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (perfil === 'Cliente') {
              router.replace('/(tabs)');
            } else if (perfil === 'Fornecedor') {
              router.replace('/fornecedor/produtos');
            }
          },
        },
      ]
    );
  };

  const renderConfigItem = (
    icone: string,
    titulo: string,
    subtitulo?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    cor?: string
  ) => (
    <TouchableOpacity
      style={styles.configItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.configItemLeft}>
        <View style={[styles.configIcon, { backgroundColor: `${cor || colors.primary[500]}20` }]}>
          <Ionicons name={icone as any} size={24} color={cor || colors.primary[500]} />
        </View>
        <View style={styles.configText}>
          <Text style={styles.configTitulo}>{titulo}</Text>
          {subtitulo && <Text style={styles.configSubtitulo}>{subtitulo}</Text>}
        </View>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.profiles.admin.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.profiles.admin.primary, colors.profiles.admin.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Perfil do Usuário */}
        <Card style={styles.perfilCard}>
          <View style={styles.perfilContent}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.white} />
            </View>
            <View style={styles.perfilInfo}>
              <Text style={styles.perfilNome}>Administrador Geral</Text>
              <Text style={styles.perfilEmail}>admin@padariainacio.com</Text>
              <Text style={styles.perfilTipo}>Administrador</Text>
            </View>
          </View>
        </Card>

        {/* Trocar Perfil */}
        <Text style={styles.sectionTitle}>Trocar Perfil</Text>
        <Card style={styles.sectionCard}>
          {renderConfigItem(
            'storefront',
            'Entrar como Cliente',
            'Acessar área do cliente',
            () => handleChangeProfile('Cliente'),
            undefined,
            colors.info[500]
          )}
          {renderConfigItem(
            'business',
            'Entrar como Fornecedor',
            'Acessar área do fornecedor',
            () => handleChangeProfile('Fornecedor'),
            undefined,
            colors.secondary[500]
          )}
        </Card>

        {/* Notificações */}
        <Text style={styles.sectionTitle}>Notificações</Text>
        <Card style={styles.sectionCard}>
          {renderConfigItem(
            'notifications',
            'Notificações Push',
            'Receber notificações no dispositivo',
            undefined,
            <Switch
              value={notificacoesPush}
              onValueChange={setNotificacoesPush}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
            />,
            colors.warning[500]
          )}
          {renderConfigItem(
            'mail',
            'Notificações por Email',
            'Receber notificações por email',
            undefined,
            <Switch
              value={notificacoesEmail}
              onValueChange={setNotificacoesEmail}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
            />,
            colors.info[500]
          )}
        </Card>

        {/* Aparência */}
        <Text style={styles.sectionTitle}>Aparência</Text>
        <Card style={styles.sectionCard}>
          {renderConfigItem(
            'moon',
            'Modo Escuro',
            'Ativar tema escuro',
            undefined,
            <Switch
              value={modoEscuro}
              onValueChange={setModoEscuro}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
            />,
            colors.gray[600]
          )}
        </Card>

        {/* Sistema */}
        <Text style={styles.sectionTitle}>Sistema</Text>
        <Card style={styles.sectionCard}>
          {renderConfigItem(
            'refresh',
            'Limpar Cache',
            'Limpar dados temporários',
            () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Cache Limpo', 'Dados temporários foram removidos');
            },
            undefined,
            colors.tertiary[500]
          )}
          {renderConfigItem(
            'download',
            'Backup de Dados',
            'Fazer backup dos dados',
            () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Backup', 'Funcionalidade em desenvolvimento');
            },
            undefined,
            colors.success[500]
          )}
          {renderConfigItem(
            'information-circle',
            'Sobre o App',
            'Versão 1.0.0',
            () => {
              Alert.alert('Padaria Inácio', 'Versão 1.0.0\nDesenvolvido com React Native');
            },
            undefined,
            colors.info[500]
          )}
        </Card>

        {/* Logout */}
        <Button
          variant="secondary"
          size="lg"
          leftIcon="log-out"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Sair da Conta
        </Button>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as any,
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  perfilCard: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  perfilContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  perfilInfo: {
    flex: 1,
  },
  perfilNome: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  perfilEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  perfilTipo: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeights.medium as any,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  sectionCard: {
    marginBottom: spacing[4],
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  configItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  configText: {
    flex: 1,
  },
  configTitulo: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  configSubtitulo: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  logoutButton: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  bottomSpacing: {
    height: 50,
  },
});

export default AdminConfiguracoes; 