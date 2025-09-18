import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, NotificationData } from '@/services/notificationService';

const { width } = Dimensions.get('window');

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: NotificationData) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (visible) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(50, 0);
      setNotifications(data);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ [NOTIFICATION] Erro ao carregar contagem:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadUnreadCount()]);
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    // Marcar como lida se não estiver lida
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Atualizar badge
      await notificationService.updateBadge();
    }

    // Chamar callback personalizado
    if (onNotificationPress) {
      onNotificationPress(notification);
    }

    // Fechar modal
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await notificationService.clearBadge();
      Alert.alert('✅ Sucesso', 'Todas as notificações foram marcadas como lidas.');
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível marcar as notificações como lidas.');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request':
        return 'briefcase';
      case 'payment':
        return 'card';
      case 'rating':
        return 'star';
      case 'chat':
        return 'chatbubble';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request':
        return '#007AFF';
      case 'payment':
        return '#34C759';
      case 'rating':
        return '#FFD700';
      case 'chat':
        return '#FF9500';
      case 'system':
        return '#8E8E93';
      default:
        return '#007AFF';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'Agora';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}min atrás`;
      } else if (diffHours < 24) {
        return `${diffHours}h atrás`;
      } else if (diffDays === 1) {
        return 'Ontem';
      } else if (diffDays < 7) {
        return `${diffDays} dias atrás`;
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        });
      }
    } catch (error) {
      return 'Data inválida';
    }
  };

  const renderNotification = (notification: NotificationData, index: number) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadText
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {notification.body}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(notification.created_at)}
            </Text>
          </View>

          {!notification.read && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
      <Text style={styles.emptySubtitle}>
        Suas notificações aparecerão aqui quando você receber atualizações
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Notificações</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllButtonText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando notificações...</Text>
            </View>
          ) : notifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map(renderNotification)}
            </View>
          )}
        </ScrollView>

        {/* Test Notification Button (apenas para desenvolvimento) */}
        {__DEV__ && (
          <View style={styles.testContainer}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                notificationService.sendLocalNotification(
                  'Teste de Notificação',
                  'Esta é uma notificação de teste para verificar o funcionamento.',
                  { type: 'system', test: true }
                );
              }}
            >
              <Text style={styles.testButtonText}>Enviar Notificação de Teste</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  markAllButton: {
    padding: 4,
  },
  markAllButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  unreadNotification: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  testContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: '#fff',
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NotificationCenter;
