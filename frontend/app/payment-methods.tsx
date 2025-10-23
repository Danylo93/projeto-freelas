import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
  isActive: boolean;
  icon: string;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dados simulados de métodos de pagamento
    const mockMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'card',
        name: 'Cartão de Crédito',
        details: '**** **** **** 1234',
        isDefault: true,
        isActive: true,
        icon: '💳'
      },
      {
        id: '2',
        type: 'pix',
        name: 'PIX',
        details: 'joao@email.com',
        isDefault: false,
        isActive: true,
        icon: '⚡'
      },
      {
        id: '3',
        type: 'card',
        name: 'Cartão de Débito',
        details: '**** **** **** 5678',
        isDefault: false,
        isActive: false,
        icon: '💳'
      },
      {
        id: '4',
        type: 'cash',
        name: 'Dinheiro',
        details: 'Pagamento na entrega',
        isDefault: false,
        isActive: true,
        icon: '💵'
      }
    ];
    
    setPaymentMethods(mockMethods);
    setIsLoading(false);
  };

  const handleToggleMethod = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, isActive: !method.isActive }
          : method
      )
    );
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleAddMethod = () => {
    Alert.alert(
      'Adicionar Método',
      'Escolha o tipo de pagamento:',
      [
        { text: 'Cartão', onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve') },
        { text: 'PIX', onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleRemoveMethod = (method: PaymentMethod) => {
    Alert.alert(
      'Remover Método',
      `Tem certeza que deseja remover ${method.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
            Alert.alert('Sucesso', 'Método de pagamento removido');
          }
        }
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodInfo}>
          <Text style={styles.methodIcon}>{method.icon}</Text>
          <View style={styles.methodDetails}>
            <Text style={styles.methodName}>{method.name}</Text>
            <Text style={styles.methodDetailsText}>{method.details}</Text>
          </View>
        </View>
        
        <View style={styles.methodActions}>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Padrão</Text>
            </View>
          )}
          
          <Switch
            value={method.isActive}
            onValueChange={() => handleToggleMethod(method.id)}
            trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
            thumbColor={method.isActive ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>
      
      <View style={styles.methodFooter}>
        {!method.isDefault && (
          <TouchableOpacity 
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(method.id)}
          >
            <Text style={styles.setDefaultText}>Definir como Padrão</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveMethod(method)}
        >
          <Text style={styles.removeText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Métodos de Pagamento</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Conteúdo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Informações</Text>
          <Text style={styles.infoText}>
            Gerencie seus métodos de pagamento. O método padrão será usado automaticamente para novos serviços.
          </Text>
        </View>

        {/* Métodos de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus Métodos</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando métodos...</Text>
            </View>
          ) : (
            <>
              {paymentMethods.map(renderPaymentMethod)}
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMethod}
              >
                <Text style={styles.addButtonIcon}>+</Text>
                <Text style={styles.addButtonText}>Adicionar Método</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Dicas de Segurança */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🔒 Dicas de Segurança</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Nunca compartilhe dados do cartão</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Use apenas em redes seguras</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Monitore seus extratos regularmente</Text>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  methodDetailsText: {
    fontSize: 14,
    color: '#666',
  },
  methodActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  defaultText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  methodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setDefaultButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setDefaultText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#2196F3',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
