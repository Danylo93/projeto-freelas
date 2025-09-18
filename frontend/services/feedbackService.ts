import * as Haptics from 'expo-haptics';
import { Animated, Vibration, Platform } from 'react-native';

interface FeedbackOptions {
  haptic?: boolean;
  visual?: boolean;
  sound?: boolean;
  duration?: number;
}

class FeedbackService {
  private static instance: FeedbackService;

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  // Feedback para sucesso
  async success(options: FeedbackOptions = {}): Promise<void> {
    const { haptic = true, visual = true } = options;

    if (haptic) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Fallback para vibração simples
        Vibration.vibrate(100);
      }
    }

    console.log('✅ [FEEDBACK] Success feedback triggered');
  }

  // Feedback para erro
  async error(options: FeedbackOptions = {}): Promise<void> {
    const { haptic = true } = options;

    if (haptic) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        // Fallback para vibração dupla
        Vibration.vibrate([100, 50, 100]);
      }
    }

    console.log('❌ [FEEDBACK] Error feedback triggered');
  }

  // Feedback para aviso
  async warning(options: FeedbackOptions = {}): Promise<void> {
    const { haptic = true } = options;

    if (haptic) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        // Fallback para vibração longa
        Vibration.vibrate(200);
      }
    }

    console.log('⚠️ [FEEDBACK] Warning feedback triggered');
  }

  // Feedback para seleção/toque
  async selection(options: FeedbackOptions = {}): Promise<void> {
    const { haptic = true } = options;

    if (haptic) {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        // Fallback para vibração curta
        Vibration.vibrate(50);
      }
    }
  }

  // Feedback para impacto leve
  async lightImpact(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Vibration.vibrate(30);
    }
  }

  // Feedback para impacto médio
  async mediumImpact(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      Vibration.vibrate(60);
    }
  }

  // Feedback para impacto forte
  async heavyImpact(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      Vibration.vibrate(100);
    }
  }

  // Animação de pulso para elementos visuais
  createPulseAnimation(animatedValue: Animated.Value, options: {
    toValue?: number;
    duration?: number;
    useNativeDriver?: boolean;
  } = {}): Animated.CompositeAnimation {
    const { toValue = 1.1, duration = 150, useNativeDriver = true } = options;

    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue,
        duration,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver,
      }),
    ]);
  }

  // Animação de shake para erros
  createShakeAnimation(animatedValue: Animated.Value, options: {
    intensity?: number;
    duration?: number;
  } = {}): Animated.CompositeAnimation {
    const { intensity = 10, duration = 50 } = options;

    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: intensity / 2,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]);
  }

  // Feedback combinado para ações específicas
  async buttonPress(): Promise<void> {
    await this.selection();
  }

  async serviceAccepted(): Promise<void> {
    await this.success();
  }

  async serviceRejected(): Promise<void> {
    await this.mediumImpact();
  }

  async newNotification(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Padrão de vibração personalizado para notificações
      if (Platform.OS === 'android') {
        Vibration.vibrate([100, 50, 100, 50, 200]);
      }
    } catch (error) {
      Vibration.vibrate([100, 50, 100]);
    }
  }

  async locationFound(): Promise<void> {
    await this.lightImpact();
  }

  async connectionEstablished(): Promise<void> {
    await this.success();
  }

  async connectionLost(): Promise<void> {
    await this.error();
  }

  async serviceCompleted(): Promise<void> {
    // Feedback especial para conclusão de serviço
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
    } catch (error) {
      Vibration.vibrate([200, 100, 200]);
    }
  }

  // Feedback para navegação
  async pageTransition(): Promise<void> {
    await this.lightImpact();
  }

  async modalOpen(): Promise<void> {
    await this.lightImpact();
  }

  async modalClose(): Promise<void> {
    await this.selection();
  }

  // Feedback para formulários
  async formFieldFocus(): Promise<void> {
    await this.selection();
  }

  async formSubmitSuccess(): Promise<void> {
    await this.success();
  }

  async formSubmitError(): Promise<void> {
    await this.error();
  }

  // Feedback para mapas
  async markerTap(): Promise<void> {
    await this.lightImpact();
  }

  async routeCalculated(): Promise<void> {
    await this.selection();
  }

  // Feedback para chat
  async messageSent(): Promise<void> {
    await this.lightImpact();
  }

  async messageReceived(): Promise<void> {
    await this.selection();
  }

  // Feedback para rating
  async starRating(): Promise<void> {
    await this.selection();
  }

  // Feedback customizado com padrão de vibração
  async customVibration(pattern: number[]): Promise<void> {
    try {
      Vibration.vibrate(pattern);
    } catch (error) {
      console.warn('⚠️ [FEEDBACK] Vibração customizada não suportada:', error);
    }
  }

  // Verificar se haptics está disponível
  async isHapticsAvailable(): Promise<boolean> {
    try {
      // Tentar executar um haptic simples
      await Haptics.selectionAsync();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Configurações de feedback baseadas nas preferências do usuário
  private shouldProvideFeedback(type: 'haptic' | 'visual' | 'sound'): boolean {
    // TODO: Implementar verificação de preferências do usuário
    // Por enquanto, sempre retorna true
    return true;
  }
}

export const feedbackService = FeedbackService.getInstance();
export default feedbackService;
