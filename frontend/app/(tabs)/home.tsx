import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseRealtime } from '../../contexts/FirebaseRealtimeContext';
import { useLocation } from '../../contexts/LocationContext';
import { MainAppBar } from '../../components/ui/AppBar';
import { AppBottomTabNavigation } from '../../components/ui/BottomTabNavigation';
import { MapOverlay, ServiceRequestOverlay } from '../../components/ui/MapOverlay';
import { CategoryChip } from '../../components/ui/Chip';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const categories = [
  { id: 'plumbing', name: 'Encanamento', icon: '🔧', description: 'Reparos e instalações' },
  { id: 'electrical', name: 'Elétrica', icon: '⚡', description: 'Instalações elétricas' },
  { id: 'cleaning', name: 'Limpeza', icon: '🧹', description: 'Serviços de limpeza' },
  { id: 'gardening', name: 'Jardinagem', icon: '🌱', description: 'Cuidados com plantas' },
  { id: 'painting', name: 'Pintura', icon: '🎨', description: 'Pintura e acabamentos' },
  { id: 'carpentry', name: 'Marcenaria', icon: '🔨', description: 'Móveis e madeira' },
];

export default function HomeScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();
  const { isConnected } = useFirebaseRealtime();
  const { location, requestLocationPermission } = useLocation();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleRequestService = () => {
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria de serviço');
      return;
    }

    if (!serviceDescription.trim()) {
      Alert.alert('Erro', 'Descreva o serviço necessário');
      return;
    }

    if (!serviceAddress.trim()) {
      Alert.alert('Erro', 'Informe o endereço do serviço');
      return;
    }

    setIsRequestingService(true);
    
    // Simular envio da solicitação
    setTimeout(() => {
      Alert.alert(
        'Solicitação Enviada!',
        'Sua solicitação foi enviada. Aguarde os prestadores próximos.',
        [{ text: 'OK', onPress: () => setIsRequestingService(false) }]
      );
    }, 2000);
  };

  const renderConnectionStatus = () => {
    console.log('🔍 [HOME] Renderizando status de conexão, isConnected:', isConnected);
    if (!isConnected) {
      return (
        <Card
          title="Conexão"
          content="Conectando ao servidor..."
          variant="outlined"
          style={[styles.statusCard, { borderColor: theme.colors.warning }]}
        />
      );
    }

    return (
      <Card
        title="Conexão"
        content="Conectado via Firebase Realtime Database"
        variant="outlined"
        style={[styles.statusCard, { borderColor: theme.colors.success }]}
      />
    );
  };

  const renderCategorySelection = () => {
    return (
      <View style={styles.section}>
        <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}>
          O que você precisa?
        </Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              selected={selectedCategory === category.id}
              onSelect={handleCategorySelect}
              style={styles.categoryChip}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderServiceRequest = () => {
    if (!selectedCategory) return null;

    const category = categories.find(c => c.id === selectedCategory);
    
    return (
      <Card
        title={`Solicitar ${category?.name}`}
        style={styles.serviceRequestCard}
      >
        <View style={styles.serviceRequestContent}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md }]}>
            Descreva o serviço que você precisa:
          </Text>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.surfaceContainer,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            }]}
            placeholder="Ex: Preciso consertar uma torneira que está vazando"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={serviceDescription}
            onChangeText={setServiceDescription}
            multiline
            numberOfLines={3}
          />
          
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }]}>
            Endereço do serviço:
          </Text>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.surfaceContainer,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            }]}
            placeholder="Rua, número, bairro, cidade"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={serviceAddress}
            onChangeText={setServiceAddress}
          />
          
          <View style={styles.actionButtons}>
            <SecondaryButton
              title="Cancelar"
              onPress={() => setSelectedCategory(null)}
              style={styles.actionButton}
            />
            
            <PrimaryButton
              title="Solicitar Serviço"
              onPress={handleRequestService}
              loading={isRequestingService}
              style={styles.actionButton}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderLocationInfo = () => {
    if (!location) {
      return (
        <Card
          title="Localização"
          content="Permitindo acesso à localização..."
          variant="outlined"
          style={styles.statusCard}
        />
      );
    }

    return (
      <Card
        title="Localização"
        content={`Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`}
        variant="outlined"
        style={styles.statusCard}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MainAppBar
        user={user ? { name: user.name } : undefined}
        notifications={{ count: 0, onPress: () => {} }}
        onProfilePress={() => {}}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderConnectionStatus()}
        {renderLocationInfo()}
        {renderCategorySelection()}
        {renderServiceRequest()}
      </ScrollView>
      
      <AppBottomTabNavigation
        activeTab="home"
        onTabPress={(tabId) => {
          // Handle tab navigation
          console.log('Navigate to:', tabId);
        }}
        notificationsCount={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  serviceRequestCard: {
    marginTop: 16,
  },
  serviceRequestContent: {
    gap: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  statusCard: {
    marginBottom: 16,
  },
});
