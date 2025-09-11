import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ProfileScreen from '../profile/index';
import axios from 'axios';

interface Provider {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  category: string;
  price: number;
  description: string;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  total_reviews: number;
  latitude?: number;
  longitude?: number;
}

export default function ClientHome() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // Animações
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const slideAnim = new Animated.Value(50);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

  // Todas as funções dentro do componente
  const fetchProviders = async () => {
    try {
      console.log('🔄 Buscando prestadores...');
      console.log('🔑 Header Authorization:', axios.defaults.headers.common['Authorization']);
      
      const response = await axios.get(`${API_BASE_URL}/providers`);
      console.log('✅ Prestadores carregados:', response.data.length);
      setProviders(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar prestadores:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      Alert.alert('Erro', 'Não foi possível carregar os prestadores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setModalVisible(true);
  };

  const handleConfirmService = async () => {
    if (!selectedProvider || !serviceDescription.trim()) {
      Alert.alert('Erro', 'Por favor, descreva o serviço que você precisa');
      return;
    }

    try {
      const requestData = {
        provider_id: selectedProvider.user_id,
        category: selectedProvider.category,
        description: serviceDescription,
        price: selectedProvider.price,
        client_latitude: -23.5505,
        client_longitude: -46.6333,
      };

      const response = await axios.post(`${API_BASE_URL}/requests`, requestData);
      
      Alert.alert(
        'Solicitação Enviada!',
        'Aguarde o prestador aceitar sua solicitação',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setServiceDescription('');
              setSelectedProvider(null);
              fetchProviders();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao solicitar serviço');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'busy': return '#FF9800';
      case 'offline': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Online';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Desconhecido';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const LoadingAnimation = () => {
    const rotateAnim = new Animated.Value(0);

    React.useEffect(() => {
      const rotate = () => {
        rotateAnim.setValue(0);
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => rotate());
      };
      rotate();
    }, []);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}>
          <Ionicons name="construct" size={48} color="#007AFF" />
        </Animated.View>
        <Text style={styles.loadingText}>Carregando prestadores...</Text>
      </View>
    );
  };

  const renderProvider = ({ item }: { item: Provider }) => (
    <TouchableOpacity style={styles.providerCard} onPress={() => handleProviderSelect(item)}>
      <View style={styles.providerHeader}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.providerCategory}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.providerDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>R$ {item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.detailText}>{item.rating.toFixed(1)} ({item.total_reviews})</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>3.2 km</Text>
        </View>
      </View>
      
      <Text style={styles.providerDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchProviders();
    
    // Animações
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();

    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingAnimation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Encontre o serviço que você precisa</Text>
            <View style={styles.connectionIndicator}>
              <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.connectionText}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchProviders} />}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }], marginBottom: keyboardHeight }]}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>🛠️ Confirmar Solicitação</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>

                    {selectedProvider && (
                      <View style={styles.modalProviderInfo}>
                        <View style={styles.providerAvatar}>
                          <Ionicons name="construct" size={32} color="#007AFF" />
                        </View>
                        <Text style={styles.modalProviderName}>{selectedProvider.name}</Text>
                        <Text style={styles.modalProviderCategory}>🔧 {selectedProvider.category}</Text>
                        <Text style={styles.modalProviderPrice}>💰 R$ {selectedProvider.price.toFixed(2)}</Text>
                      </View>
                    )}

                    <Text style={styles.inputLabel}>✍️ Descreva o serviço:</Text>
                    <TextInput
                      style={styles.textInput}
                      multiline
                      numberOfLines={4}
                      placeholder="Ex: Minha pia quebrou, precisa refazer o encanamento..."
                      value={serviceDescription}
                      onChangeText={setServiceDescription}
                      textAlignVertical="top"
                    />

                    <View style={styles.modalButtons}>
                      <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmService}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingIcon: { marginBottom: 24 },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileButton: { padding: 4 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  logoutButton: { padding: 8 },
  listContainer: { padding: 16 },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  providerCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  providerDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  detailText: { marginLeft: 6, fontSize: 14, color: '#666', fontWeight: '500' },
  providerDescription: { fontSize: 14, color: '#333', lineHeight: 20, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 4 },
  modalProviderInfo: { alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', borderRadius: 16, marginBottom: 20 },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalProviderName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalProviderCategory: { fontSize: 14, color: '#666', marginBottom: 8 },
  modalProviderPrice: { fontSize: 18, fontWeight: '600', color: '#4CAF50', marginBottom: 12 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancelButton: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  confirmButton: { backgroundColor: '#007AFF' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});