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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentService, Transaction } from '@/services/paymentService';

const { width } = Dimensions.get('window');

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTransactions();
    }
  }, [visible]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getTransactions(50, 0);
      setTransactions(data);
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return {
          text: 'Concluído',
          color: '#34C759',
          bgColor: '#E6F7ED',
          icon: 'checkmark-circle'
        };
      case 'processing':
        return {
          text: 'Processando',
          color: '#007AFF',
          bgColor: '#E6F3FF',
          icon: 'time-outline'
        };
      case 'pending':
        return {
          text: 'Pendente',
          color: '#FF9500',
          bgColor: '#FFF4E6',
          icon: 'time-outline'
        };
      case 'failed':
        return {
          text: 'Falhou',
          color: '#FF3B30',
          bgColor: '#FFE6E6',
          icon: 'close-circle'
        };
      case 'canceled':
        return {
          text: 'Cancelado',
          color: '#8E8E93',
          bgColor: '#F2F2F7',
          icon: 'ban-outline'
        };
      case 'refunded':
        return {
          text: 'Reembolsado',
          color: '#8E8E93',
          bgColor: '#F2F2F7',
          icon: 'return-up-back'
        };
      default:
        return {
          text: status,
          color: '#8E8E93',
          bgColor: '#F2F2F7',
          icon: 'help-circle-outline'
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
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

  const getPaymentMethodIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'card':
        return 'card';
      case 'pix':
        return 'flash';
      case 'bank_transfer':
        return 'business';
      default:
        return 'wallet';
    }
  };

  const renderTransaction = (transaction: Transaction, index: number) => {
    const statusInfo = getStatusInfo(transaction.status);

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Ionicons
              name={getPaymentMethodIcon(transaction.payment_method_type)}
              size={24}
              color="#007AFF"
            />
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {transaction.description || `Pagamento #${transaction.id.slice(-6)}`}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(transaction.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.transactionRight}>
            <Text style={styles.transactionAmount}>
              {paymentService.formatCurrency(transaction.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
          <View style={styles.transactionMetadata}>
            {transaction.metadata.provider_name && (
              <Text style={styles.metadataText}>
                Prestador: {transaction.metadata.provider_name}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const calculateTotalSpent = () => {
    return transactions
      .filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateMonthlySpent = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at);
        return (
          t.status === 'succeeded' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

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
          <Text style={styles.title}>Histórico de Pagamentos</Text>
          <View style={styles.placeholder} />
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
              <Text style={styles.loadingText}>Carregando transações...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Nenhuma transação</Text>
              <Text style={styles.emptySubtitle}>
                Suas transações aparecerão aqui após realizar pagamentos
              </Text>
            </View>
          ) : (
            <>
              {/* Resumo */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Gasto</Text>
                    <Text style={styles.summaryValue}>
                      {paymentService.formatCurrency(calculateTotalSpent())}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Este Mês</Text>
                    <Text style={styles.summaryValue}>
                      {paymentService.formatCurrency(calculateMonthlySpent())}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Lista de Transações */}
              <View style={styles.transactionsList}>
                <Text style={styles.sectionTitle}>Transações Recentes</Text>
                {transactions.map(renderTransaction)}
              </View>
            </>
          )}
        </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 32,
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
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E7',
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionMetadata: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metadataText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default TransactionHistoryModal;
