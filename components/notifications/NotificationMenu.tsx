import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// Componentes UI
import { Card } from '../ui/Card';

// Serviços e tipos
import { notificationService } from '../../services/notifications/NotificationService';
import { authService } from '../../services/auth';
import { Notificacao } from '../../types';

// Theme
import { colors, spacing, typography, radii } from '../../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

interface NotificationMenuProps {
  userType: 'admin' | 'cliente' | 'fornecedor';
  onNotificationPress?: (notification: Notificacao) => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ 
  userType, 
  onNotificationPress 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const badgeScale = useSharedValue(1);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        const userNotifications = await notificationService.getNotificationsByUser(user.id);
        setNotifications(userNotifications);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
        
        // Animar badge se houver novas notificações
        if (count > 0) {
          badgeScale.value = withSpring(1.2, {}, () => {
            badgeScale.value = withSpring(1);
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  };

  const handleOpenModal = () => {
    setIsVisible(true);
    modalOpacity.value = withTiming(1, { duration: 300 });
    loadNotifications();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCloseModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setIsVisible(false), 200);
  };

  const handleNotificationPress = async (notification: Notificacao) => {
    try {
      if (!notification.lida) {
        await notificationService.markAsRead(notification.id);
        await loadUnreadCount();
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, lida: true } : n)
        );
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (onNotificationPress) {
        onNotificationPress(notification);
      }

      // Ações baseadas no tipo de notificação
      const dadosExtras = notification.dados_extras ? JSON.parse(notification.dados_extras) : {};
      
      if (dadosExtras.action) {
        console.log('Action:', dadosExtras.action, 'Data:', dadosExtras);
      }
    } catch (error) {
      console.error('Erro ao processar notificação:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        await notificationService.markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
        setUnreadCount(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      Alert.alert('Erro', 'Não foi possível marcar todas as notificações como lidas');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Excluir Notificação',
      'Tem certeza que deseja excluir esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);
              setNotifications(prev => prev.filter(n => n.id !== notificationId));
              await loadUnreadCount();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Erro ao excluir notificação:', error);
              Alert.alert('Erro', 'Não foi possível excluir a notificação');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadUnreadCount()]);
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (tipo: string) => {
    const config = notificationService.getNotificationConfig(userType, tipo);
    return config.icone;
  };

  const getNotificationColor = (tipo: string) => {
    const config = notificationService.getNotificationConfig(userType, tipo);
    return config.cor;
  };

  const renderNotification = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.lida && styles.notificationItemUnread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: `${getNotificationColor(item.tipo)}20` }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.tipo) as any} 
            size={20} 
            color={getNotificationColor(item.tipo)} 
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text style={[
              styles.notificationTitle,
              !item.lida && styles.notificationTitleUnread
            ]}>
              {item.titulo}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.data_criacao)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.mensagem}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>

      {!item.lida && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  // Estilos animados
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      {
        translateY: interpolate(
          modalOpacity.value,
          [0, 1],
          [50, 0]
        ),
      },
    ],
  }));

  return (
    <>
      {/* Botão de Notificações */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications" size={24} color={colors.neutral[0]} />
        {unreadCount > 0 && (
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Modal de Notificações */}
      <Modal
        visible={isVisible}
        animationType="none"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
            <Card variant="elevated" style={styles.modalCard}>
              <>
                {/* Header do Modal */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Notificações</Text>
                  <View style={styles.modalHeaderActions}>
                    {unreadCount > 0 && (
                      <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                      >
                        <Text style={styles.markAllText}>Marcar todas como lidas</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleCloseModal}
                    >
                      <Ionicons name="close" size={24} color={colors.neutral[600]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lista de Notificações */}
                <FlatList
                  data={notifications}
                  renderItem={renderNotification}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.notificationsList}
                  contentContainerStyle={styles.notificationsContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[colors.primary[500]]}
                      tintColor={colors.primary[500]}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons 
                        name="notifications-off" 
                        size={48} 
                        color={colors.neutral[300]} 
                      />
                      <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                      <Text style={styles.emptySubtitle}>
                        Você não tem notificações no momento
                      </Text>
                    </View>
                  }
                />
              </>
            </Card>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    position: 'relative',
    padding: spacing[2],
  },
  badge: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    backgroundColor: colors.error[500],
    borderRadius: radii.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[0],
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalCard: {
    margin: 0,
    overflow: 'hidden',
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
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.neutral[900],
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  markAllButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  markAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeights.medium as any,
  },
  closeButton: {
    padding: spacing[1],
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationsContent: {
    paddingBottom: spacing[2],
  },
  notificationItem: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: colors.primary[50],
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  notificationTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.neutral[700],
    flex: 1,
    marginRight: spacing[2],
  },
  notificationTitleUnread: {
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.semibold as any,
  },
  notificationTime: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  notificationMessage: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  deleteButton: {
    padding: spacing[1],
    marginLeft: spacing[2],
  },
  unreadIndicator: {
    position: 'absolute',
    left: spacing[2],
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.neutral[600],
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
}); 