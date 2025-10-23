import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useAuthStore } from '../src/stores/authStore';
import { UserType } from '../src/types';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>(UserType.CLIENT);
  
  // Animações
  const formTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    // Animar entrada do formulário
    formTranslateY.value = withSpring(0, { damping: 15 });
    formOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const request = { email, password, userType };
      const response = isLogin ? await login(request) : await register(request);
      
      if (response.success) {
        // Navegar para a tela apropriada
        if (userType === UserType.CLIENT) {
          router.replace('/client');
        } else {
          router.replace('/provider');
        }
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
    }
  };

  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    handleAuth();
  };

  return (
    <LinearGradient
      colors={['#2196F3', '#1976D2', '#0D47A1']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>FreelasApp</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </Text>
          </View>

          {/* Formulário */}
          <Animated.View style={[styles.form, animatedFormStyle]}>
            {/* Toggle Login/Register */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Entrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Cadastrar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tipo de usuário */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>Tipo de usuário:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === UserType.CLIENT && styles.userTypeButtonActive
                  ]}
                  onPress={() => setUserType(UserType.CLIENT)}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    userType === UserType.CLIENT && styles.userTypeButtonTextActive
                  ]}>
                    Cliente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === UserType.PROVIDER && styles.userTypeButtonActive
                  ]}
                  onPress={() => setUserType(UserType.PROVIDER)}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    userType === UserType.PROVIDER && styles.userTypeButtonTextActive
                  ]}>
                    Prestador
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Instruções de login */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Como fazer login:</Text>
              <Text style={styles.instructionsText}>
                • Para CLIENTE: use email com "cliente" (ex: cliente@test.com)
              </Text>
              <Text style={styles.instructionsText}>
                • Para PRESTADOR: use email com "prestador" ou nomes como "joao", "maria", "carlos", "pedro", "ana"
              </Text>
            </View>

            {/* Campos de entrada */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email (ex: cliente@test.com ou joao@test.com)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Senha (qualquer senha)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Botão de ação */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={[styles.authButton, isLoading && styles.authButtonDisabled]}
                onPress={handleButtonPress}
                disabled={isLoading}
              >
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Link para trocar modo */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchModeText}>
                {isLogin 
                  ? 'Não tem conta? Cadastre-se' 
                  : 'Já tem conta? Entre aqui'
                }
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  userTypeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  authButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  authButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  authButtonText: {
    color: '#2196F3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchModeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
