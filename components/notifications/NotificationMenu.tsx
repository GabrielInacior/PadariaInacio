import React, { useState, useEffect, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

// Serviços e tipos
import { notificationService } from '../../services/notifications/NotificationService';
import { authService } from '../../services/auth';
import { Notificacao } from '../../types';

// Theme
import { theme } from '../../utils/theme';

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
  const modalTranslateY = useSharedValue(50);

  // Scroll handler com useCallback para compatibilidade React 19
  const scrollHandler = useCallback(
    useAnimatedScrollHandler({
      onScroll: (event) => {
        // Scroll handling pode ser adicionado aqui se necessário
      },
    }),
    []
  );

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
    modalTranslateY.value = withTiming(0, { duration: 300 });
    loadNotifications();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCloseModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalTranslateY.value = withTiming(50, { duration: 200 });
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
          <Ionicons name="close" size={16} color={theme.colors.gray[400]} />
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
    transform: [{ translateY: modalTranslateY.value }],
  }));

  return (
    <>
      {/* Botão de Notificações */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications" size={24} color={theme.colors.white} />
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
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
            <View style={styles.modalCard}>
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
                    <Ionicons name="close" size={24} color={theme.colors.gray[600]} />
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
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary[500]]}
                    tintColor={theme.colors.primary[500]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons 
                      name="notifications-off" 
                      size={48} 
                      color={theme.colors.gray[300]} 
                    />
                    <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                    <Text style={styles.emptySubtitle}>
                      Você não tem notificações no momento
                    </Text>
                  </View>
                }
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.red[500],
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationsContent: {
    paddingBottom: 8,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    position: 'relative',
    backgroundColor: theme.colors.white,
  },
  notificationItemUnread: {
    backgroundColor: theme.colors.primary[50],
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[700],
    flex: 1,
    marginRight: 8,
  },
  notificationTitleUnread: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 18,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[500],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
}); 