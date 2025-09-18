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
import { paymentService, PaymentMethod, PaymentIntent } from '@/services/paymentService';
import { PaymentMethodsModal } from './PaymentMethodsModal';

const { width } = Dimensions.get('window');

interface PaymentCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  amount: number;
  description: string;
  providerName: string;
  onPaymentSuccess: (paymentIntent: PaymentIntent) => void;
  onPaymentError: (error: any) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  visible,
  onClose,
  requestId,
  amount,
  description,
  providerName,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
      createPaymentIntent();
    }
  }, [visible, requestId, amount]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
      // Selecionar método padrão automaticamente
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao carregar métodos de pagamento:', error);
    }
  };

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      const intent = await paymentService.createPaymentIntent({
        request_id: requestId,
        amount: paymentService.toCents(amount),
        currency: 'brl',
        metadata: {
          provider_name: providerName,
          description,
        },
      });
      setPaymentIntent(intent);
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao criar Payment Intent:', error);
      Alert.alert('Erro', 'Não foi possível inicializar o pagamento.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent || !selectedPaymentMethod) {
      Alert.alert('Erro', 'Selecione um método de pagamento.');
      return;
    }

    setProcessingPayment(true);
    try {
      const confirmedPayment = await paymentService.confirmPayment({
        payment_intent_id: paymentIntent.id,
        payment_method_id: selectedPaymentMethod.id,
      });

      if (confirmedPayment.status === 'succeeded') {
        Alert.alert(
          '✅ Pagamento Realizado!',
          'Seu pagamento foi processado com sucesso.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess(confirmedPayment);
                onClose();
              },
            },
          ]
        );
      } else if (confirmedPayment.status === 'requires_action') {
        // Aqui seria necessário lidar com 3D Secure ou outras ações
        Alert.alert(
          'Ação Necessária',
          'Seu banco requer autenticação adicional. Esta funcionalidade será implementada em breve.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(`Status inesperado: ${confirmedPayment.status}`);
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao processar pagamento:', error);
      Alert.alert('❌ Erro no Pagamento', 'Não foi possível processar o pagamento. Tente novamente.');
      onPaymentError(error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Pagamento',
      'Tem certeza que deseja cancelar o pagamento?',
      [
        { text: 'Continuar Pagamento', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: onClose,
        },
      ]
    );
  };

  const renderPaymentMethodSelector = () => {
    if (paymentMethods.length === 0) {
      return (
        <View style={styles.noPaymentMethodsContainer}>
          <Ionicons name="card-outline" size={48} color="#E0E0E0" />
          <Text style={styles.noPaymentMethodsTitle}>Nenhum método de pagamento</Text>
          <Text style={styles.noPaymentMethodsSubtitle}>
            Adicione um cartão ou configure o PIX para continuar
          </Text>
          <TouchableOpacity
            style={styles.addPaymentMethodButton}
            onPress={() => setShowPaymentMethods(true)}
          >
            <Text style={styles.addPaymentMethodButtonText}>Adicionar Método</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.paymentMethodSection}>
        <Text style={styles.sectionTitle}>Método de Pagamento</Text>
        
        <TouchableOpacity
          style={styles.selectedPaymentMethod}
          onPress={() => setShowPaymentMethods(true)}
        >
          <View style={styles.paymentMethodInfo}>
            <Ionicons
              name={selectedPaymentMethod?.type === 'card' ? 'card' : 'flash'}
              size={24}
              color="#007AFF"
            />
            <View style={styles.paymentMethodDetails}>
              {selectedPaymentMethod?.type === 'card' && selectedPaymentMethod.card ? (
                <>
                  <Text style={styles.paymentMethodTitle}>
                    {selectedPaymentMethod.card.brand.toUpperCase()} •••• {selectedPaymentMethod.card.last4}
                  </Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Expira em {selectedPaymentMethod.card.exp_month.toString().padStart(2, '0')}/{selectedPaymentMethod.card.exp_year}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.paymentMethodTitle}>PIX</Text>
                  <Text style={styles.paymentMethodSubtitle}>Pagamento instantâneo</Text>
                </>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pagamento</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Preparando pagamento...</Text>
              </View>
            ) : (
              <>
                {/* Resumo do Pagamento */}
                <View style={styles.summarySection}>
                  <Text style={styles.sectionTitle}>Resumo do Pagamento</Text>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Prestador:</Text>
                      <Text style={styles.summaryValue}>{providerName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Serviço:</Text>
                      <Text style={styles.summaryValue}>{description}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalValue}>
                        {paymentService.formatCurrency(paymentService.toCents(amount))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Método de Pagamento */}
                {renderPaymentMethodSelector()}

                {/* Botão de Pagamento */}
                {selectedPaymentMethod && (
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      processingPayment && styles.payButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <View style={styles.payButtonLoading}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.payButtonText}>Processando...</Text>
                      </View>
                    ) : (
                      <Text style={styles.payButtonText}>
                        Pagar {paymentService.formatCurrency(paymentService.toCents(amount))}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Informações de Segurança */}
                <View style={styles.securityInfo}>
                  <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                  <Text style={styles.securityText}>
                    Pagamento seguro processado pelo Stripe
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Seleção de Método de Pagamento */}
      <PaymentMethodsModal
        visible={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
        allowSelection={true}
        selectedPaymentMethodId={selectedPaymentMethod?.id}
        onSelectPaymentMethod={(method) => {
          setSelectedPaymentMethod(method);
          setShowPaymentMethods(false);
        }}
      />
    </>
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
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 60,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  selectedPaymentMethod: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  noPaymentMethodsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  noPaymentMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  noPaymentMethodsSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  addPaymentMethodButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPaymentMethodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  payButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default PaymentCheckoutModal;
