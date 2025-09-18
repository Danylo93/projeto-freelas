import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ProviderNavigationAnimationProps {
  visible: boolean;
  clientName?: string;
  category?: string;
  distance?: number;
  onComplete?: () => void;
}

export default function ProviderNavigationAnimation({
  visible,
  clientName = 'Cliente',
  category = 'Serviço',
  distance = 0,
  onComplete,
}: ProviderNavigationAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const messages = [
    'Solicitação aceita!',
    'Calculando melhor rota...',
    `Indo para ${clientName}`,
    'Chegando ao destino'
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Animação inicial de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de rotação contínua do ícone
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Animação de pulso dos círculos
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação da barra de progresso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    // Animação dos textos
    animateMessages();

    // Completar após 4 segundos
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 4000);
  };

  const animateMessages = () => {
    const animateMessage = (index: number) => {
      if (index >= messages.length) return;

      setCurrentMessageIndex(index);
      
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => animateMessage(index + 1), 100);
      });
    };

    animateMessage(0);
  };

  const resetAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    rotateAnim.setValue(0);
    pulseAnim.setValue(1);
    progressAnim.setValue(0);
    textOpacity.setValue(0);
    setCurrentMessageIndex(0);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Círculos de fundo pulsantes */}
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseCircle1,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseCircle2,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseCircle3,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />

          {/* Ícone central rotativo */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Ionicons name="car" size={48} color="#007AFF" />
          </Animated.View>

          {/* Texto animado */}
          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={styles.mainText}>{messages[currentMessageIndex]}</Text>
            {currentMessageIndex === 2 && (
              <Text style={styles.subText}>
                {category} • {distance > 0 ? `${distance.toFixed(1)}km` : 'Próximo'}
              </Text>
            )}
          </Animated.View>

          {/* Barra de progresso */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: progressWidth },
              ]}
            />
          </View>

          {/* Informações do cliente */}
          <View style={styles.clientInfo}>
            <View style={styles.clientIcon}>
              <Ionicons name="person" size={20} color="#007AFF" />
            </View>
            <Text style={styles.clientText}>{clientName}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
    height: height * 0.6,
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  pulseCircle1: {
    width: 200,
    height: 200,
  },
  pulseCircle2: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  pulseCircle3: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0, 122, 255, 0.02)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    width: width * 0.6,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  clientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
