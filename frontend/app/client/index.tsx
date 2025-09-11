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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user, logout } = useAuth();

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

  const fetchProviders = async () => {
    try {
      console.log('🔄 [SIMPLE] Buscando prestadores...');
      const response = await axios.get(`${API_BASE_URL}/providers`);
      console.log('✅ [SIMPLE] Prestadores carregados:', response.data.length);
      setProviders(response.data);
    } catch (error: any) {
      console.error('❌ [SIMPLE] Erro:', error);
      Alert.alert('Erro', 'Não foi possível carregar os prestadores');
    } finally {
      console.log('🏁 [SIMPLE] Finalizando carregamento...');
      setIsLoading(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    console.log('🎯 Prestador selecionado:', provider.name);
    setSelectedProvider(provider);
    setModalVisible(true);
  };

  const handleConfirmService = async () => {
    if (!selectedProvider || !serviceDescription.trim()) {
      Alert.alert('Erro', 'Por favor, descreva o serviço que você precisa');
      return;
    }

    try {
      console.log('🚀 Enviando solicitação...');
      const requestData = {
        provider_id: selectedProvider.user_id,
        category: selectedProvider.category,
        description: serviceDescription,
        price: selectedProvider.price,
        client_latitude: -23.5505,
        client_longitude: -46.6333,
      };

      await axios.post(`${API_BASE_URL}/requests`, requestData);
      
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
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro na solicitação:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao solicitar serviço');
    }
  };

  useEffect(() => {
    console.log('🚀 [SIMPLE] Iniciando ClientHome...');
    fetchProviders();
  }, []);

  const renderProvider = ({ item }: { item: Provider }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => handleProviderSelect(item)}
    >
      <Text style={styles.providerName}>{item.name}</Text>
      <Text style={styles.providerCategory}>{item.category}</Text>
      <Text style={styles.providerPrice}>R$ {item.price.toFixed(2)}</Text>
      <Text style={styles.providerDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.providerRating}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>
          {item.rating.toFixed(1)} ({item.total_reviews} avaliações)
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    console.log('🔄 [SIMPLE] Mostrando loading...');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando prestadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎯 [SIMPLE] Renderizando lista com', providers.length, 'prestadores');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cliente - {user?.name}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={providers}
        renderItem={renderProvider}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchProviders} />}
      />

      {/* Modal de Confirmação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🛠️ Confirmar Solicitação</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedProvider && (
                <View style={styles.modalProviderInfo}>
                  <Text style={styles.modalProviderName}>{selectedProvider.name}</Text>
                  <Text style={styles.modalProviderCategory}>{selectedProvider.category}</Text>
                  <Text style={styles.modalProviderPrice}>
                    R$ {selectedProvider.price.toFixed(2)}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Descreva o serviço:</Text>
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
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmService}
                >
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  providerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  providerCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  providerPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});