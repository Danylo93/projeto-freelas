import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import { useToast } from './Toast';
import { feedbackService } from '../../services/feedbackService';
import analyticsService from '../../services/analyticsService';

interface StatusStep {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => Promise<void>;
  confirmMessage?: string;
}

interface ProviderStatusUpdaterProps {
  visible: boolean;
  onClose: () => void;
}

export const ProviderStatusUpdater: React.FC<ProviderStatusUpdaterProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentRequest,
    markArrived,
    startService,
    finishService,
  } = useMatching();

  const { showSuccess, showError, showInfo } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const scaleAnimation = new Animated.Value(0);

  useEffect(() => {
    if (visible && currentRequest) {
      // Determinar step atual baseado no status
      switch (currentRequest.status) {
        case 'accepted':
          setCurrentStep('going');
          break;
        case 'arrived':
          setCurrentStep('arrived');
          break;
        case 'in_progress':
          setCurrentStep('working');
          break;
        default:
          setCurrentStep('going');
      }

      // Animar entrada
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnimation.setValue(0);
    }
  }, [visible, currentRequest]);

  const handleStatusUpdate = async (action: () => Promise<void>, stepKey: string, message: string) => {
    setIsUpdating(true);

    try {
      // Feedback háptico
      await feedbackService.selection();

      // Executar ação
      await action();

      // Analytics
      try {
        await analyticsService.trackEvent('provider_status_update', {
          from: currentRequest?.status,
          to: stepKey,
          requestId: currentRequest?.id,
        });
      } catch (error) {
        console.log('⚠️ [ANALYTICS] Erro ao rastrear evento:', error);
      }

      // Feedback de sucesso
      await feedbackService.success();
      showSuccess(message);

      // Fechar modal após sucesso
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ [STATUS] Erro ao atualizar status:', error);
      await feedbackService.error();
      showError('Erro ao atualizar status. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusSteps = (): StatusStep[] => {
    if (!currentRequest) return [];

    const steps: StatusStep[] = [];

    // Step 1: Indo para o cliente
    if (currentRequest.status === 'accepted') {
      steps.push({
        key: 'arrived',
        title: 'Cheguei no local',
        subtitle: 'Marcar que você chegou no endereço do cliente',
        icon: 'location',
        color: '#FF9500',
        action: markArrived,
        confirmMessage: 'Confirmar que chegou no local?',
      });
    }

    // Step 2: Chegou no local
    if (currentRequest.status === 'arrived') {
      steps.push({
        key: 'start',
        title: 'Iniciar serviço',
        subtitle: 'Começar a execução do serviço solicitado',
        icon: 'play-circle',
        color: '#34C759',
        action: startService,
        confirmMessage: 'Iniciar o serviço agora?',
      });
    }

    // Step 3: Serviço em andamento
    if (currentRequest.status === 'in_progress') {
      steps.push({
        key: 'finish',
        title: 'Finalizar serviço',
        subtitle: 'Marcar o serviço como concluído',
        icon: 'checkmark-circle',
        color: '#007AFF',
        action: finishService,
        confirmMessage: 'Confirmar que o serviço foi concluído?',
      });
    }

    return steps;
  };

  const handleStepPress = (step: StatusStep) => {
    if (step.confirmMessage) {
      Alert.alert(
        'Confirmar ação',
        step.confirmMessage,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Confirmar',
            onPress: () => handleStatusUpdate(step.action, step.key, `Status atualizado: ${step.title}`),
          },
        ]
      );
    } else {
      handleStatusUpdate(step.action, step.key, `Status atualizado: ${step.title}`);
    }
  };

  const getCurrentStatusInfo = () => {
    if (!currentRequest) return null;

    switch (currentRequest.status) {
      case 'accepted':
        return {
          title: 'Indo para o cliente',
          subtitle: 'Dirija-se ao endereço informado',
          icon: 'car',
          color: '#FF9500',
        };
      case 'arrived':
        return {
          title: 'No local do cliente',
          subtitle: 'Você chegou no endereço',
          icon: 'location',
          color: '#34C759',
        };
      case 'in_progress':
        return {
          title: 'Serviço em andamento',
          subtitle: 'Executando o serviço solicitado',
          icon: 'construct',
          color: '#007AFF',
        };
      default:
        return null;
    }
  };

  const statusInfo = getCurrentStatusInfo();
  const steps = getStatusSteps();

  if (!currentRequest || !statusInfo) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>

          {/* Status atual */}
          <View style={styles.currentStatusContainer}>
            <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon as any} size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>

          {/* Informações da solicitação */}
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle}>
              {currentRequest.category} • R$ {currentRequest.price?.toFixed(2)}
            </Text>
            <Text style={styles.requestDescription} numberOfLines={2}>
              {currentRequest.description}
            </Text>
          </View>

          {/* Próximas ações */}
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>Próxima ação:</Text>
            
            {steps.map((step) => (
              <TouchableOpacity
                key={step.key}
                style={[styles.actionButton, { borderColor: step.color }]}
                onPress={() => handleStepPress(step)}
                disabled={isUpdating}
              >
                <View style={[styles.actionIcon, { backgroundColor: step.color }]}>
                  <Ionicons name={step.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{step.title}</Text>
                  <Text style={styles.actionSubtitle}>{step.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}

            {steps.length === 0 && (
              <View style={styles.noActionsContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                <Text style={styles.noActionsText}>
                  Todas as etapas foram concluídas!
                </Text>
              </View>
            )}
          </View>

          {/* Ações secundárias */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="call" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Ligar para cliente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="chatbubble" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Enviar mensagem</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  currentStatusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  requestInfo: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noActionsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noActionsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
});
