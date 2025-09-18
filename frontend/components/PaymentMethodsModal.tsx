import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentService, PaymentMethod } from '@/services/paymentService';

const { width } = Dimensions.get('window');

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPaymentMethod?: (paymentMethod: PaymentMethod) => void;
  allowSelection?: boolean;
  selectedPaymentMethodId?: string;
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  visible,
  onClose,
  onSelectPaymentMethod,
  allowSelection = false,
  selectedPaymentMethodId,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
    }
  }, [visible]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao carregar métodos de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os métodos de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    setActionLoading(paymentMethodId);
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods(); // Recarregar lista
      Alert.alert('✅ Sucesso', 'Método de pagamento padrão atualizado.');
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao definir método padrão:', error);
      Alert.alert('❌ Erro', 'Não foi possível definir como método padrão.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    Alert.alert(
      'Remover Método de Pagamento',
      'Tem certeza que deseja remover este método de pagamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(paymentMethodId);
            try {
              await paymentService.removePaymentMethod(paymentMethodId);
              await loadPaymentMethods(); // Recarregar lista
              Alert.alert('✅ Sucesso', 'Método de pagamento removido.');
            } catch (error) {
              console.error('❌ [PAYMENT] Erro ao remover método:', error);
              Alert.alert('❌ Erro', 'Não foi possível remover o método de pagamento.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Adicionar Método de Pagamento',
      'Esta funcionalidade será implementada com o Stripe Elements.',
      [{ text: 'OK' }]
    );
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
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

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = selectedPaymentMethodId === method.id;
    const isLoading = actionLoading === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => {
          if (allowSelection && onSelectPaymentMethod) {
            onSelectPaymentMethod(method);
          }
        }}
        disabled={isLoading}
      >
        <View style={styles.paymentMethodHeader}>
          <View style={styles.paymentMethodInfo}>
            <Ionicons
              name={getPaymentMethodIcon(method.type)}
              size={24}
              color="#007AFF"
            />
            <View style={styles.paymentMethodDetails}>
              {method.type === 'card' && method.card ? (
                <>
                  <Text style={styles.paymentMethodTitle}>
                    {method.card.brand.toUpperCase()} •••• {method.card.last4}
                  </Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Expira em {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.paymentMethodTitle}>
                    {method.type === 'pix' ? 'PIX' : 'Transferência Bancária'}
                  </Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Método de pagamento instantâneo
                  </Text>
                </>
              )}
            </View>
          </View>

          {method.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Padrão</Text>
            </View>
          )}

          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          )}
        </View>

        {!allowSelection && (
          <View style={styles.paymentMethodActions}>
            {!method.is_default && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSetDefault(method.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="star-outline" size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Definir como Padrão</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemove(method.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>
                    Remover
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
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
          <Text style={styles.title}>
            {allowSelection ? 'Selecionar Método de Pagamento' : 'Métodos de Pagamento'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando métodos de pagamento...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Nenhum método de pagamento</Text>
              <Text style={styles.emptySubtitle}>
                Adicione um cartão ou configure o PIX para realizar pagamentos
              </Text>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map(renderPaymentMethod)}
            </View>
          )}

          {/* Add Payment Method Button */}
          {!allowSelection && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPaymentMethod}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.addButtonText}>Adicionar Método de Pagamento</Text>
            </TouchableOpacity>
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
  methodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  selectedPaymentMethod: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FFE6E6',
  },
  removeButtonText: {
    color: '#FF3B30',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default PaymentMethodsModal;
