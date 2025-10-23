import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { usePaymentStore } from '../src/stores/paymentStore';
import { useServiceStore } from '../src/stores/serviceStore';
import { PaymentMethod, PaymentMethodType } from '../src/types';

const { width, height } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const { 
    availableMethods, 
    selectedMethod, 
    loadPaymentMethods, 
    selectPaymentMethod,
    processPayment,
    isProcessing,
    error,
    clearError
  } = usePaymentStore();
  const { currentService, updateService } = useServiceStore();
  
  const [showProcessing, setShowProcessing] = useState(false);
  
  // Animações
  const cardScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const processingOpacity = useSharedValue(0);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    selectPaymentMethod(method.id);
    
    // Animação de seleção
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handlePayment = async () => {
    if (!selectedMethod || !currentService) {
      Alert.alert('Erro', 'Selecione um método de pagamento');
      return;
    }

    try {
      setShowProcessing(true);
      processingOpacity.value = withTiming(1, { duration: 300 });
      
      const payment = await processPayment(currentService, currentService.price);
      
      if (payment) {
        // Atualizar status do serviço
        await updateService(currentService.id, {
          status: 'ACCEPTED' as any,
          updatedAt: new Date()
        });
        
        // Navegar para tracking
        router.replace({
          pathname: '/tracking',
          params: { serviceId: currentService.id }
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha no processamento do pagamento');
    } finally {
      setShowProcessing(false);
      processingOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getPaymentMethodIcon = (type: PaymentMethodType): string => {
    switch (type) {
      case PaymentMethodType.PIX:
        return '💳';
      case PaymentMethodType.CREDIT_CARD:
        return '💳';
      case PaymentMethodType.DEBIT_CARD:
        return '💳';
      case PaymentMethodType.CASH:
        return '💰';
      default:
        return '💳';
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedProcessingStyle = useAnimatedStyle(() => ({
    opacity: processingOpacity.value,
  }));

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    handlePayment();
  };

  if (!currentService) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo do serviço */}
        <View style={styles.serviceSummary}>
          <Text style={styles.sectionTitle}>Resumo do Serviço</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Serviço:</Text>
              <Text style={styles.summaryValue}>{currentService.category.displayName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Origem:</Text>
              <Text style={styles.summaryValue}>{currentService.location.address}</Text>
            </View>
            {currentService.destination && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Destino:</Text>
                <Text style={styles.summaryValue}>{currentService.destination.address}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distância:</Text>
              <Text style={styles.summaryValue}>
                {currentService.distance > 0 ? `${currentService.distance.toFixed(1)} km` : 'Calculando...'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tempo estimado:</Text>
              <Text style={styles.summaryValue}>
                {currentService.estimatedTime > 0 ? `${currentService.estimatedTime} min` : 'Calculando...'}
              </Text>
            </View>
            
            {/* Detalhamento do preço */}
            <View style={styles.priceBreakdown}>
              <Text style={styles.breakdownTitle}>Detalhamento do Preço:</Text>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Taxa fixa ({currentService.category.displayName}):</Text>
                <Text style={styles.priceValue}>R$ {currentService.category.basePrice.toFixed(2)}</Text>
              </View>
              {currentService.distance > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Distância ({currentService.distance.toFixed(1)} km × R$ 2,50):</Text>
                  <Text style={styles.priceValue}>R$ {(currentService.distance * 2.50).toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Taxa de serviço:</Text>
                <Text style={styles.priceValue}>R$ 5,00</Text>
              </View>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>R$ {currentService.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Métodos de pagamento */}
        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          {availableMethods.map((method) => (
            <Animated.View key={method.id} style={animatedCardStyle}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedMethod?.id === method.id && styles.paymentMethodCardSelected
                ]}
                onPress={() => handlePaymentMethodSelect(method)}
              >
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodIcon}>
                    {getPaymentMethodIcon(method.type)}
                  </Text>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                  </View>
                  {selectedMethod?.id === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Botão de pagamento */}
      <Animated.View style={[styles.paymentButtonContainer, animatedButtonStyle]}>
        <TouchableOpacity
          style={[styles.paymentButton, isProcessing && styles.paymentButtonDisabled]}
          onPress={handleButtonPress}
          disabled={isProcessing || !selectedMethod}
        >
          <LinearGradient
            colors={selectedMethod ? ['#4CAF50', '#45A049'] : ['#CCCCCC', '#AAAAAA']}
            style={styles.paymentButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.paymentButtonText}>
                {selectedMethod ? 'Confirmar Pagamento' : 'Selecione um método'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de processamento */}
      <Modal
        visible={showProcessing}
        transparent
        animationType="fade"
      >
        <Animated.View style={[styles.processingModal, animatedProcessingStyle]}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.processingTitle}>Processando Pagamento</Text>
            <Text style={styles.processingText}>
              Aguarde enquanto processamos seu pagamento...
            </Text>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serviceSummary: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethods: {
    marginBottom: 100,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodCardSelected: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#666666',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
