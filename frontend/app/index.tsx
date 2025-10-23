import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Pequeno delay para garantir que a autenticação seja verificada
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Redirecionar baseado no tipo de usuário
        if (user.userType === 'CLIENT') {
          router.replace('/client');
        } else if (user.userType === 'PROVIDER') {
          router.replace('/provider');
        } else {
          router.replace('/auth');
        }
      } else {
        router.replace('/auth');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
