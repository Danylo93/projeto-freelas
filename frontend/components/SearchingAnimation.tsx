import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SearchingAnimationProps {
  visible: boolean;
  searchText?: string;
  onComplete?: () => void;
}

export default function SearchingAnimation({ 
  visible, 
  searchText = "Buscando profissionais", 
  onComplete 
}: SearchingAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animação de rotação contínua
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Animação de pulso
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Animação dos pontos
      const dotsAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );

      rotateAnimation.start();
      pulseAnimation.start();
      dotsAnimation.start();

      // Auto complete após 3 segundos
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
        dotsAnimation.stop();
        clearTimeout(timer);
      };
    } else {
      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.3, 1, 0.3, 1],
  });

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Círculos de fundo animados */}
        <Animated.View 
          style={[
            styles.backgroundCircle,
            styles.circle1,
            { transform: [{ scale: pulseAnim }] },
          ]} 
        />
        <Animated.View 
          style={[
            styles.backgroundCircle,
            styles.circle2,
            { transform: [{ scale: pulseAnim }] },
          ]} 
        />
        <Animated.View 
          style={[
            styles.backgroundCircle,
            styles.circle3,
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
          <Ionicons name="search" size={40} color="#007AFF" />
        </Animated.View>

        {/* Texto animado */}
        <Text style={styles.searchText}>
          {searchText}
          <Animated.Text style={{ opacity: dotsOpacity }}>...</Animated.Text>
        </Text>

        {/* Indicador de progresso */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { transform: [{ scaleX: dotsAnim }] },
            ]} 
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  searchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
