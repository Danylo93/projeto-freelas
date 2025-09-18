import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMatching } from '@/contexts/UberStyleMatchingContext';
import { useToast } from './Toast';
import { distanceService } from '../../services/distanceService';

interface ProgressStep {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  status: 'completed' | 'current' | 'pending';
  estimatedTime?: string;
}

interface ClientProgressTrackerProps {
  userLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  providerLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const ClientProgressTracker: React.FC<ClientProgressTrackerProps> = ({
  userLocation,
  providerLocation,
}) => {
  const { currentRequest, assignedProvider } = useMatching();
  const { showInfo } = useToast();
  
  const [distance, setDistance] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [progressAnimations] = useState(() => 
    Array.from({ length: 4 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    if (userLocation && providerLocation) {
      updateDistanceAndTime();
    }
  }, [userLocation, providerLocation]);

  useEffect(() => {
    // Animar progresso baseado no status atual
    if (currentRequest) {
      animateProgress();
    }
  }, [currentRequest?.status]);

  const updateDistanceAndTime = async () => {
    if (!userLocation || !providerLocation) return;

    try {
      const distanceInfo = await distanceService.calculateDistance(
        providerLocation,
        userLocation
      );

      setDistance(distanceInfo.distance);
      setEstimatedTime(distanceInfo.duration);
    } catch (error) {
      console.error('❌ [PROGRESS] Erro ao calcular distância:', error);
    }
  };

  const animateProgress = () => {
    const currentStepIndex = getProgressSteps().findIndex(step => step.status === 'current');
    
    progressAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index <= currentStepIndex ? 1 : 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: false,
      }).start();
    });
  };

  const getProgressSteps = (): ProgressStep[] => {
    if (!currentRequest) return [];

    const steps: ProgressStep[] = [
      {
        key: 'accepted',
        title: 'Prestador confirmado',
        subtitle: `${assignedProvider?.name || 'Prestador'} aceitou sua solicitação`,
        icon: 'checkmark-circle',
        color: '#34C759',
        status: 'completed',
      },
      {
        key: 'going',
        title: 'A caminho',
        subtitle: distance ? `${distance} de distância` : 'Prestador se dirigindo ao local',
        icon: 'car',
        color: '#FF9500',
        status: 'pending',
        estimatedTime: estimatedTime,
      },
      {
        key: 'arrived',
        title: 'Chegou no local',
        subtitle: 'Prestador chegou no endereço',
        icon: 'location',
        color: '#007AFF',
        status: 'pending',
      },
      {
        key: 'working',
        title: 'Serviço em andamento',
        subtitle: 'Executando o serviço solicitado',
        icon: 'construct',
        color: '#5856D6',
        status: 'pending',
      },
    ];

    // Atualizar status baseado na solicitação atual
    switch (currentRequest.status) {
      case 'accepted':
        steps[1].status = 'current';
        break;
      case 'arrived':
        steps[1].status = 'completed';
        steps[2].status = 'current';
        break;
      case 'in_progress':
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'current';
        break;
      case 'completed':
        steps.forEach(step => step.status = 'completed');
        break;
    }

    return steps;
  };

  const renderProgressStep = (step: ProgressStep, index: number) => {
    const isCompleted = step.status === 'completed';
    const isCurrent = step.status === 'current';
    const isPending = step.status === 'pending';

    return (
      <View key={step.key} style={styles.stepContainer}>
        <View style={styles.stepIndicator}>
          <Animated.View
            style={[
              styles.stepIcon,
              {
                backgroundColor: progressAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E5E5EA', step.color],
                }),
              },
            ]}
          >
            <Ionicons
              name={isCompleted ? 'checkmark' : step.icon as any}
              size={20}
              color="#FFFFFF"
            />
          </Animated.View>
          
          {index < getProgressSteps().length - 1 && (
            <Animated.View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: progressAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#E5E5EA', step.color],
                  }),
                },
              ]}
            />
          )}
        </View>

        <View style={styles.stepContent}>
          <Text style={[
            styles.stepTitle,
            { color: isCurrent ? step.color : isCompleted ? '#1C1C1E' : '#8E8E93' }
          ]}>
            {step.title}
          </Text>
          <Text style={styles.stepSubtitle}>
            {step.subtitle}
          </Text>
          
          {isCurrent && step.estimatedTime && (
            <Text style={[styles.estimatedTime, { color: step.color }]}>
              Tempo estimado: {step.estimatedTime}
            </Text>
          )}
        </View>

        {isCurrent && (
          <View style={styles.currentIndicator}>
            <Animated.View
              style={[
                styles.pulseIndicator,
                { backgroundColor: step.color },
              ]}
            />
          </View>
        )}
      </View>
    );
  };

  const getStatusMessage = () => {
    if (!currentRequest) return '';

    switch (currentRequest.status) {
      case 'accepted':
        return `${assignedProvider?.name || 'O prestador'} está se dirigindo ao seu endereço`;
      case 'arrived':
        return `${assignedProvider?.name || 'O prestador'} chegou no local`;
      case 'in_progress':
        return 'Serviço sendo executado';
      case 'completed':
        return 'Serviço concluído com sucesso!';
      default:
        return 'Aguardando atualização...';
    }
  };

  const steps = getProgressSteps();

  if (!currentRequest || !assignedProvider) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acompanhe seu serviço</Text>
        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
      </View>

      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => renderProgressStep(step, index))}
      </ScrollView>

      {/* Informações do prestador */}
      <View style={styles.providerInfo}>
        <View style={styles.providerAvatar}>
          <Ionicons name="person" size={24} color="#007AFF" />
        </View>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>{assignedProvider.name}</Text>
          <Text style={styles.providerCategory}>{currentRequest.category}</Text>
        </View>
        <View style={styles.providerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 16,
    color: '#8E8E93',
  },
  stepsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    width: 2,
    height: 30,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  providerCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
  providerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
