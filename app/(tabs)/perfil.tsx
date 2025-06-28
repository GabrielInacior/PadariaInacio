import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { User } from '../../types';

export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

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
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
  };

  const MenuOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    color = '#8B4513',
    badge,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    color?: string;
    badge?: string;
  }) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  const getUserTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'cliente': return 'Cliente';
      case 'fornecedor': return 'Fornecedor';
      case 'admin': return 'Administrador';
      case 'funcionario': return 'Funcionário';
      case 'gerente': return 'Gerente';
      default: return 'Usuário';
    }
  };

  const getUserTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'admin': return '#e74c3c';
      case 'gerente': return '#9b59b6';
      case 'funcionario': return '#3498db';
      case 'fornecedor': return '#f39c12';
      default: return '#27ae60';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text>Erro ao carregar perfil</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header do perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={() => router.push('/perfil/editar')}
          >
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user.nome}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={[
            styles.userTypeBadge,
            { backgroundColor: getUserTypeColor(user.tipo) }
          ]}>
            <Text style={styles.userTypeText}>
              {getUserTypeLabel(user.tipo)}
            </Text>
          </View>
        </View>
      </View>

      {/* Estatísticas rápidas (apenas para clientes) */}
      {user.tipo === 'cliente' && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>R$ 350</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⭐ 4.8</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🥇 Ouro</Text>
            <Text style={styles.statLabel}>Nível</Text>
          </View>
        </View>
      )}

      {/* Menu principal */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Minha Conta</Text>
        
        <MenuOption
          icon="person"
          title="Editar Perfil"
          subtitle="Alterar dados pessoais"
          onPress={() => router.push('/perfil/editar')}
          color="#3498db"
        />
        
        <MenuOption
          icon="location"
          title="Endereços"
          subtitle="Gerenciar endereços de entrega"
          onPress={() => router.push('/perfil/endereco')}
          color="#27ae60"
        />
        
        <MenuOption
          icon="lock-closed"
          title="Segurança"
          subtitle="Alterar senha e configurações"
          onPress={() => router.push('/perfil/seguranca')}
          color="#e74c3c"
        />
      </View>

      {/* Menu de pedidos (para clientes) */}
      {user.tipo === 'cliente' && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Pedidos</Text>
          
          <MenuOption
            icon="receipt"
            title="Meus Pedidos"
            subtitle="Histórico de compras"
            onPress={() => router.push('/perfil/pedidos')}
            color="#f39c12"
            badge="3"
          />
          
          <MenuOption
            icon="star"
            title="Avaliações"
            subtitle="Produtos avaliados por você"
            onPress={() => router.push('/perfil/avaliacoes')}
            color="#9b59b6"
          />
          
          <MenuOption
            icon="gift"
            title="Programa de Fidelidade"
            subtitle="Pontos e recompensas"
            onPress={() => router.push('/perfil/fidelidade')}
            color="#e67e22"
            badge="1.250 pts"
          />
        </View>
      )}

      {/* Menu administrativo */}
      {(user.tipo === 'admin' || user.tipo === 'gerente') && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Administração</Text>
          
          <MenuOption
            icon="analytics"
            title="Dashboard"
            subtitle="Visão geral do negócio"
            onPress={() => router.push('/admin/dashboard')}
            color="#8B4513"
          />
          
          <MenuOption
            icon="cube"
            title="Produtos"
            subtitle="Gerenciar catálogo"
            onPress={() => router.push('/admin/produtos')}
            color="#3498db"
          />
          
          <MenuOption
            icon="people"
            title="Usuários"
            subtitle="Clientes e funcionários"
            onPress={() => router.push('/admin/usuarios')}
            color="#9b59b6"
          />
          
          <MenuOption
            icon="list"
            title="Pedidos"
            subtitle="Gerenciar pedidos"
            onPress={() => router.push('/admin/pedidos')}
            color="#f39c12"
            badge="8"
          />
          
          <MenuOption
            icon="archive"
            title="Estoque"
            subtitle="Controle de inventário"
            onPress={() => router.push('/admin/estoque')}
            color="#27ae60"
          />
          
          <MenuOption
            icon="bar-chart"
            title="Relatórios"
            subtitle="Análises e métricas"
            onPress={() => router.push('/admin/relatorios')}
            color="#e74c3c"
          />
        </View>
      )}

      {/* Menu de suporte */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Suporte</Text>
        
        <MenuOption
          icon="notifications"
          title="Notificações"
          subtitle="Configurar alertas"
          onPress={() => router.push('/notificacoes')}
          color="#f39c12"
        />
        
        <MenuOption
          icon="help-circle"
          title="Ajuda"
          subtitle="Central de ajuda e FAQ"
          onPress={() => router.push('/suporte')}
          color="#3498db"
        />
        
        <MenuOption
          icon="information-circle"
          title="Sobre"
          subtitle="Versão e informações do app"
          onPress={() => router.push('/sobre')}
          color="#95a5a6"
        />
      </View>

      {/* Ações finais */}
      <View style={styles.menuSection}>
        <MenuOption
          icon="log-out"
          title="Sair"
          subtitle="Fazer logout da conta"
          onPress={handleLogout}
          color="#e74c3c"
          showArrow={false}
        />
      </View>

      {/* Informações da versão */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          Padaria Inácio v1.0.0
        </Text>
        <Text style={styles.versionSubtext}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    backgroundColor: '#8B4513',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#FFF8DC',
    marginBottom: 8,
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#999',
  },
}); 