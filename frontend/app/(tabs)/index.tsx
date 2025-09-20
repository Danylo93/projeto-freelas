import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../utils/config';
import axios from 'axios';

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ServiceRequest {
  id: string;
  client_name: string;
  category: string;
  description: string;
  price: number;
  distance?: number;
  created_at: string;
  status: string;
}

const serviceCategories: ServiceCategory[] = [
  { id: 'eletricista', name: 'Eletricista', icon: 'flash', description: 'Serviços elétricos' },
  { id: 'encanador', name: 'Encanador', icon: 'water', description: 'Serviços hidráulicos' },
  { id: 'pintor', name: 'Pintor', icon: 'brush', description: 'Pintura e decoração' },
  { id: 'marceneiro', name: 'Marceneiro', icon: 'hammer', description: 'Móveis e madeira' },
  { id: 'jardineiro', name: 'Jardineiro', icon: 'leaf', description: 'Jardim e paisagismo' },
  { id: 'faxineiro', name: 'Faxineiro', icon: 'sparkles', description: 'Limpeza geral' },
];

export default function HomeScreen() {
  const { user, isProvider } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isProvider) {
      loadAvailableRequests();
    }
  }, [isProvider]);

  const loadAvailableRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/requests`);
      
      // Filtrar apenas solicitações pendentes
      const availableRequests = response.data.filter((req: any) => 
        req.status === 'pending' || req.status === 'waiting'
      );
      
      setRequests(availableRequests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isProvider) {
      await loadAvailableRequests();
    }
    setRefreshing(false);
  };

  const handleRequestService = (categoryId: string) => {
    Alert.alert(
      'Solicitar Serviço',
      `Deseja solicitar um serviço de ${serviceCategories.find(c => c.id === categoryId)?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar', 
          onPress: () => {
            // TODO: Implementar tela de criação de solicitação
            Alert.alert('Em breve', 'Funcionalidade em desenvolvimento');
          }
        }
      ]
    );
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      Alert.alert(
        'Aceitar Solicitação',
        'Deseja aceitar esta solicitação?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Aceitar',
            onPress: async () => {
              try {
                await axios.post(`${API_BASE_URL}/requests/${requestId}/accept`);
                Alert.alert('Sucesso', 'Solicitação aceita com sucesso!');
                loadAvailableRequests();
              } catch (error) {
                Alert.alert('Erro', 'Não foi possível aceitar a solicitação');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
    }
  };

  if (isProvider) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Olá, {user?.name}!</Text>
          <Text style={styles.subtitleText}>Solicitações disponíveis</Text>
        </View>

        <View style={styles.content}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Nenhuma solicitação disponível no momento
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Novas solicitações aparecerão aqui
              </Text>
            </View>
          ) : (
            requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestCategory}>{request.category}</Text>
                  <Text style={styles.requestPrice}>R$ {request.price}</Text>
                </View>
                
                <Text style={styles.requestClient}>Cliente: {request.client_name}</Text>
                <Text style={styles.requestDescription}>{request.description}</Text>
                
                {request.distance && (
                  <Text style={styles.requestDistance}>
                    📍 {request.distance}km de distância
                  </Text>
                )}
                
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>Aceitar Solicitação</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // Interface para clientes
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, {user?.name}!</Text>
        <Text style={styles.subtitleText}>Que serviço você precisa?</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Categorias de Serviços</Text>
        
        <View style={styles.categoriesGrid}>
          {serviceCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleRequestService(category.id)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon as any} size={32} color="#667eea" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f2ff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  requestPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  requestClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});