import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { historyService, ServiceHistoryItem } from '@/services/historyService';

interface ClientHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyItems, setHistoryItems] = useState<ServiceHistoryItem[]>([]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await historyService.getServiceHistory({
        status: 'all',
        sort_by: 'date',
        sort_order: 'desc',
      });
      
      // Filtrar apenas solicitações do cliente atual
      const clientHistory = response.items.filter(item => 
        item.client_id === user.id
      );
      
      setHistoryItems(clientHistory);
    } catch (error) {
      console.error('❌ [CLIENT-HISTORY] Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      case 'in_progress':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'in_progress':
        return 'Em andamento';
      case 'accepted':
        return 'Aceito';
      case 'offered':
        return 'Ofertado';
      default:
        return status;
    }
  };

  const renderHistoryItem = ({ item }: { item: ServiceHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceCategory}>{item.category}</Text>
          <Text style={styles.serviceDate}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.serviceDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.itemFooter}>
        <Text style={styles.servicePrice}>R$ {item.price?.toFixed(2) || '0.00'}</Text>
        {item.provider_name && (
          <Text style={styles.providerName}>
            Prestador: {item.provider_name}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Nenhum serviço encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Você ainda não solicitou nenhum serviço.
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Minhas Solicitações</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando histórico...</Text>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#007AFF']}
                  tintColor="#007AFF"
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  listContainer: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  providerName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ClientHistoryModal;
