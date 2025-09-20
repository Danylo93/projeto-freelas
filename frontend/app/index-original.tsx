import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './auth/index';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  
  console.log('🔍 [INDEX] Estado atual:', { 
    isLoading, 
    isAuthenticated, 
    hasUser: !!user, 
    userType: user?.user_type 
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Se não está carregando e já temos dados de auth, esconder splash
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000); // 2 segundos de splash
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (showSplash) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, showSplash]);

  // Hook para navegação - deve estar antes de qualquer return
  useEffect(() => {
    if (isAuthenticated && user && !showSplash && !isLoading) {
      console.log('➡️ [INDEX] Redirecionando para UberStyleApp');
      console.log('🏠 [INDEX] Navegando para telas de home');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user, showSplash, isLoading, router]);

  const SplashScreen = () => {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="construct" size={80} color="#007AFF" />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>ServiçoApp</Text>
          <Text style={styles.tagline}>🔧 Conectando você aos melhores profissionais</Text>
        </Animated.View>
      </View>
    );
  };

  // Mostrar splash screen enquanto está carregando ou durante animação
  if (isLoading || showSplash) {
    console.log('🔄 [INDEX] Mostrando splash screen');
    return <SplashScreen />;
  }

  if (!isAuthenticated || !user) {
    console.log('❌ [INDEX] Usuário não autenticado, mostrando AuthScreen');
    return <AuthScreen />;
  }

  console.log('✅ [INDEX] Usuário autenticado:', user.name, 'Tipo:', user.user_type);

  // Show loading while navigating
  return <SplashScreen />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});