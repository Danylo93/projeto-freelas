import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useAuthStore } from '../src/stores/authStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreenComponent() {
  const router = useRouter();
  const { checkAuthStatus, isAuthenticated, isLoading } = useAuthStore();
  
  // Animações
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(50);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Animar progresso
      progressWidth.value = withTiming(100, { duration: 1000 });
      
      // Navegar após animações
      setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/client');
        } else {
          router.replace('/auth');
        }
      }, 2000);
    }
  }, [isLoading, isAuthenticated]);

  const initializeApp = async () => {
    try {
      // Manter splash screen visível
      await ExpoSplashScreen.preventAutoHideAsync();
      
      // Iniciar animações
      startAnimations();
      
      // Verificar status de autenticação
      await checkAuthStatus();
      
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
    } finally {
      // Esconder splash screen nativo
      await ExpoSplashScreen.hideAsync();
    }
  };

  const startAnimations = () => {
    // Animação do logo
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 200 })
    );
    logoOpacity.value = withTiming(1, { duration: 800 });
    
    // Animação do texto
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <LinearGradient
      colors={['#2196F3', '#1976D2', '#0D47A1']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>F</Text>
          </View>
        </Animated.View>

        {/* Texto */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.appName}>FreelasApp</Text>
          <Text style={styles.tagline}>Seu app de serviços</Text>
        </Animated.View>

        {/* Barra de progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    width: width * 0.6,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
