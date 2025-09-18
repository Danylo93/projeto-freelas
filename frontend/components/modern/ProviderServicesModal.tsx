import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_CATEGORIES = [
  { id: 'eletricista', name: 'Eletricista', icon: '⚡', color: '#FF6B35' },
  { id: 'encanador', name: 'Encanador', icon: '🔧', color: '#4A90E2' },
  { id: 'pintor', name: 'Pintor', icon: '🎨', color: '#F5A623' },
  { id: 'marceneiro', name: 'Marceneiro', icon: '🔨', color: '#8B4513' },
  { id: 'jardineiro', name: 'Jardineiro', icon: '🌱', color: '#7ED321' },
  { id: 'faxineiro', name: 'Faxineiro', icon: '✨', color: '#9013FE' },
  { id: 'mecanico', name: 'Mecânico', icon: '🚗', color: '#D0021B' },
  { id: 'reformas', name: 'Reformas', icon: '🏗️', color: '#50E3C2' },
];

interface ProviderService {
  category: string;
  basePrice: number;
  enabled: boolean;
}

interface ProviderServicesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (services: ProviderService[]) => void;
  initialServices?: ProviderService[];
}

export const ProviderServicesModal: React.FC<ProviderServicesModalProps> = ({
  visible,
  onClose,
  onSave,
  initialServices = [],
}) => {
  const { user } = useAuth();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadServicesFromCache();
    }
  }, [visible, initialServices]);

  const loadServicesFromCache = async () => {
    try {
      // Primeiro tentar carregar do cache local
      const cachedServices = await AsyncStorage.getItem(`provider_services_${user?.id}`);
      let servicesData = initialServices;

      if (cachedServices) {
        servicesData = JSON.parse(cachedServices);
        console.log('📱 [SERVICES] Serviços carregados do cache');
      }

      // Inicializar com serviços existentes ou criar novos
      const initializedServices = SERVICE_CATEGORIES.map(category => {
        const existing = servicesData.find(s => s.category === category.name);
        return existing || {
          category: category.name,
          basePrice: 50,
          enabled: false,
        };
      });
      setServices(initializedServices);
    } catch (error) {
      console.error('❌ [SERVICES] Erro ao carregar serviços do cache:', error);
      // Fallback para inicialização padrão
      const initializedServices = SERVICE_CATEGORIES.map(category => ({
        category: category.name,
        basePrice: 50,
        enabled: false,
      }));
      setServices(initializedServices);
    }
  };

  const updateService = (categoryName: string, updates: Partial<ProviderService>) => {
    setServices(prev => prev.map(service => 
      service.category === categoryName 
        ? { ...service, ...updates }
        : service
    ));
  };

  const handleSave = async () => {
    const enabledServices = services.filter(s => s.enabled);
    
    if (enabledServices.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um serviço para oferecer.');
      return;
    }

    // Validar preços
    const invalidPrices = enabledServices.filter(s => s.basePrice <= 0);
    if (invalidPrices.length > 0) {
      Alert.alert('Atenção', 'Todos os serviços habilitados devem ter um preço válido.');
      return;
    }

    setLoading(true);
    try {
      // Salvar no cache local primeiro
      await AsyncStorage.setItem(`provider_services_${user?.id}`, JSON.stringify(services));
      console.log('💾 [SERVICES] Serviços salvos no cache local');

      await onSave(enabledServices);
      onClose();
    } catch (error) {
      console.error('❌ Erro no modal ao salvar serviços:', error);
      Alert.alert('Erro', 'Não foi possível salvar os serviços. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Meus Serviços</Text>
      <TouchableOpacity 
        onPress={handleSave} 
        style={styles.saveButton}
        disabled={loading}
      >
        <Text style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderServiceItem = (service: ProviderService) => {
    const category = SERVICE_CATEGORIES.find(c => c.name === service.category);
    if (!category) return null;

    return (
      <View key={service.category} style={styles.serviceItem}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIcon, { backgroundColor: category.color }]}>
              <Text style={styles.serviceEmoji}>{category.icon}</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{category.name}</Text>
              <Text style={styles.serviceDescription}>
                Defina seu preço base para este serviço
              </Text>
            </View>
          </View>
          <Switch
            value={service.enabled}
            onValueChange={(enabled) => updateService(service.category, { enabled })}
            trackColor={{ false: '#E5E5E7', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {service.enabled && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Preço base (R$)</Text>
            <TextInput
              style={styles.priceInput}
              value={service.basePrice.toString()}
              onChangeText={(text) => {
                const price = parseFloat(text) || 0;
                updateService(service.category, { basePrice: price });
              }}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#8E8E93"
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {renderHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Configure seus serviços</Text>
            <Text style={styles.infoDescription}>
              Selecione os serviços que você oferece e defina seus preços base. 
              Você poderá ajustar o preço final para cada solicitação.
            </Text>
          </View>

          <View style={styles.servicesSection}>
            {services.map(renderServiceItem)}
          </View>

          <View style={styles.tipSection}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#F5A623" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Dica</Text>
              <Text style={styles.tipText}>
                O preço base é uma referência. Você poderá negociar o valor final 
                com cada cliente baseado na complexidade do serviço.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  servicesSection: {
    padding: 20,
  },
  serviceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceEmoji: {
    fontSize: 20,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  priceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  tipSection: {
    flexDirection: 'row',
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
});
