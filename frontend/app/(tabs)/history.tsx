import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../utils/config';
import axios from 'axios';

interface HistoryItem {
  id: string;
  category: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  client_name?: string;
  provider_name?: string;
}

const statusLabels: { [key: string]: string } = {
  pending: 'Pendente',
  accepted: 'Aceito',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors: { [key: string]: string } = {
  pending: '#ffc107',
  accepted: '#17a2b8',
  in_progress: '#007bff',
  completed: '#28a745',
  cancelled: '#dc3545',
};

export default function HistoryScreen() {
  const { user, isProvider } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/requests`);
      
      // Filtrar baseado no tipo de usuário
      let filteredHistory = response.data;
      if (isProvider) {
        // Para prestadores, mostrar solicitações aceitas por eles
        filteredHistory = response.data.filter((item: any) => 
          item.provider_id === user?.id
        );
      } else {
        // Para clientes, mostrar suas próprias solicitações
        filteredHistory = response.data.filter((item: any) => 
          item.client_id === user?.id
        );
      }
      
      // Ordenar por data mais recente
      filteredHistory.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setHistory(filteredHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
        <Text style={styles.headerSubtitle}>
          {isProvider ? 'Seus serviços prestados' : 'Seus serviços solicitados'}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Nenhum histórico encontrado</Text>
            <Text style={styles.emptyStateSubtext}>
              {isProvider 
                ? 'Aceite solicitações para ver seu histórico'
                : 'Faça sua primeira solicitação de serviço'
              }
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleRow}>
                  <Text style={styles.historyCategory}>{item.category}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[item.status] || '#6c757d' }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(item.status) as any} 
                      size={12} 
                      color="#ffffff" 
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                      {statusLabels[item.status] || item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyPrice}>R$ {item.price.toFixed(2)}</Text>
              </View>

              <Text style={styles.historyDescription}>{item.description}</Text>

              <View style={styles.historyDetails}>
                {isProvider && item.client_name && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Cliente: </Text>
                    {item.client_name}
                  </Text>
                )}
                
                {!isProvider && item.provider_name && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Prestador: </Text>
                    {item.provider_name}
                  </Text>
                )}

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Data: </Text>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              {(item.status === 'completed' || item.status === 'cancelled') && (
                <TouchableOpacity style={styles.detailButton}>
                  <Text style={styles.detailButtonText}>Ver Detalhes</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="#667eea" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyHeader: {
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  historyDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 8,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});