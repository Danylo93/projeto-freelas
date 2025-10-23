import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../src/stores/authStore';
import { useLocationStore } from '../src/stores/locationStore';

const { width, height } = Dimensions.get('window');

export default function ProviderHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentLocation, getCurrentLocation, requestPermission } = useLocationStore();
  
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  });
  
  // Animações
  const mapOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const toggleScale = useSharedValue(1);

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      mapOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [currentLocation]);

  const initializeScreen = async () => {
    try {
      await Promise.all([
        requestPermission(),
        getCurrentLocation()
      ]);
      
      // Animar entrada dos cards
      cardTranslateY.value = withSpring(0, { damping: 15 });
      
      // Mock de ganhos
      setEarnings({
        today: 85.50,
        thisWeek: 420.75,
        thisMonth: 1850.30,
        total: 12500.80
      });
    } catch (error) {
      console.error('Erro ao inicializar tela:', error);
    }
  };

  const handleToggleOnline = () => {
    toggleScale.value = withSpring(0.95, { damping: 15 }, () => {
      toggleScale.value = withSpring(1, { damping: 15 });
    });
    
    setIsOnline(!isOnline);
    
    if (!isOnline) {
      Alert.alert(
        'Você está online!',
        'Agora você pode receber solicitações de serviços.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Você está offline',
        'Você não receberá mais solicitações.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const animatedMapStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedToggleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toggleScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name}</Text>
            <Text style={styles.subtitle}>
              {isOnline ? 'Você está online' : 'Você está offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Mapa */}
      <Animated.View style={[styles.mapContainer, animatedMapStyle]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: currentLocation?.latitude || -23.5505,
            longitude: currentLocation?.longitude || -46.6333,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Sua localização"
              pinColor={isOnline ? "#4CAF50" : "#F44336"}
            />
          )}
        </MapView>
      </Animated.View>

      {/* Toggle Online/Offline */}
      <Animated.View style={[styles.toggleContainer, animatedCardStyle, animatedToggleStyle]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isOnline && styles.toggleButtonOnline
          ]}
          onPress={handleToggleOnline}
        >
          <LinearGradient
            colors={isOnline ? ['#4CAF50', '#45A049'] : ['#F44336', '#D32F2F']}
            style={styles.toggleButtonGradient}
          >
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Cards de ganhos */}
      <ScrollView 
        style={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.earningsCard, animatedCardStyle]}>
          <Text style={styles.earningsTitle}>Seus Ganhos</Text>
          
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Hoje</Text>
              <Text style={styles.earningsValue}>R$ {earnings.today.toFixed(2)}</Text>
            </View>
            
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Esta Semana</Text>
              <Text style={styles.earningsValue}>R$ {earnings.thisWeek.toFixed(2)}</Text>
            </View>
            
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Este Mês</Text>
              <Text style={styles.earningsValue}>R$ {earnings.thisMonth.toFixed(2)}</Text>
            </View>
            
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Total</Text>
              <Text style={styles.earningsValue}>R$ {earnings.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Card de estatísticas */}
        <Animated.View style={[styles.statsCard, animatedCardStyle]}>
          <Text style={styles.statsTitle}>Estatísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Avaliação</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>127</Text>
              <Text style={styles.statLabel}>Corridas</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Taxa de Aceitação</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.5</Text>
              <Text style={styles.statLabel}>Tempo Médio (min)</Text>
            </View>
          </View>
        </Animated.View>

        {/* Card de informações do veículo */}
        <Animated.View style={[styles.vehicleCard, animatedCardStyle]}>
          <Text style={styles.vehicleTitle}>Meu Veículo</Text>
          
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Modelo</Text>
              <Text style={styles.vehicleValue}>Honda Civic</Text>
            </View>
            
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Placa</Text>
              <Text style={styles.vehicleValue}>ABC-1234</Text>
            </View>
            
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Cor</Text>
              <Text style={styles.vehicleValue}>Branco</Text>
            </View>
            
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Capacidade</Text>
              <Text style={styles.vehicleValue}>4 passageiros</Text>
            </View>
          </View>
        </Animated.View>

        {/* Card de horários */}
        <Animated.View style={[styles.scheduleCard, animatedCardStyle]}>
          <Text style={styles.scheduleTitle}>Horários de Trabalho</Text>
          
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleText}>
              Segunda a Sexta: 08:00 - 18:00
            </Text>
            <Text style={styles.scheduleText}>
              Sábado: 09:00 - 16:00
            </Text>
            <Text style={styles.scheduleText}>
              Domingo: Descanso
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    height: height * 0.3,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  toggleButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButtonOnline: {
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  earningsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  earningsItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  vehicleInfo: {
    gap: 12,
  },
  vehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#666666',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  scheduleInfo: {
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
