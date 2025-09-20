import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRealtime } from '@/contexts/ImprovedRealtimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SOCKET_URL } from '@/utils/config';

export const ConnectionDebug: React.FC = () => {
  const { isConnected, connectionState, reconnect } = useRealtime();
  const { user, token } = useAuth();
  const router = useRouter();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return '#34C759';
      case 'connecting': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return 'checkmark-circle';
      case 'connecting': return 'time';
      case 'error': return 'alert-circle';
      default: return 'radio-button-off';
    }
  };

  const getStatusText = () => {
    const baseStatus = connectionState.charAt(0).toUpperCase() + connectionState.slice(1);
    return baseStatus;
  };

  const testConnection = () => {
    console.log('🧪 [DEBUG] Testando conexão...');
    console.log('🧪 [DEBUG] SOCKET_URL:', SOCKET_URL);
    console.log('🧪 [DEBUG] User:', user?.name, user?.id);
    console.log('🧪 [DEBUG] Token:', token ? 'Presente' : 'Ausente');
    console.log('🧪 [DEBUG] Connection State:', connectionState);
    console.log('🧪 [DEBUG] Is Connected:', isConnected);
  };

  const testNotification = () => {
    console.log('🧪 [DEBUG] Função de teste removida - usando notificações reais');

      // Emitir evento para mostrar detalhes
      DeviceEventEmitter.emit('new-request', mockRequest);

      console.log('🧪 [DEBUG] Evento emitido:', mockRequest);

      Alert.alert(
        '🧪 Teste Enviado!',
        'Evento de nova solicitação foi emitido. Vá para /service-flow para ver o modal de detalhes.',
        [
          {
            text: 'Ir para Service Flow',
            onPress: () => {
              // Navegar automaticamente
              console.log('🧪 [DEBUG] Navegando para service-flow...');
              router.push('/service-flow');
            }
          },
          { text: 'OK' }
        ]
      );
    } else {
      console.log('🧪 [DEBUG] Usuário não é prestador, não pode testar notificação');
      Alert.alert(
        '⚠️ Aviso',
        'Você precisa estar logado como prestador para testar notificações.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={getStatusColor()} 
        />
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={reconnect}
          disabled={connectionState === 'connecting'}
        >
          <Ionicons name="refresh" size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.testButton}
          onPress={testConnection}
        >
          <Ionicons name="bug" size={16} color="#FF9500" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testNotification}
        >
          <Ionicons name="notifications" size={16} color="#34C759" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/service-flow')}
        >
          <Ionicons name="map" size={16} color="#FF9500" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#9500FF' }]}
          onPress={() => {
            // Teste direto do modal de detalhes
            console.log('🧪 [DEBUG] Testando modal de detalhes diretamente...');
            router.push('/service-flow');

            // Emitir evento após navegar
            setTimeout(() => {
              const mockRequest = {
                request_id: `test-details-${Date.now()}`,
                client_name: 'Maria Santos',
                category: 'Encanador',
                description: 'Vazamento no banheiro precisa ser consertado urgentemente. A água está vazando muito.',
                price: 200.00,
                distance: 1.8,
                client_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
                client_latitude: -23.5618,
                client_longitude: -46.6565,
              };

              DeviceEventEmitter.emit('new-request', mockRequest);
              console.log('🧪 [DEBUG] Evento de detalhes emitido:', mockRequest);
            }, 1000);
          }}
        >
          <Ionicons name="eye" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.detailText}>
          URL: {SOCKET_URL || 'Not configured'}
        </Text>
        <Text style={styles.detailText}>
          User: {user?.name || 'Not logged in'} (Type: {user?.user_type || 'N/A'})
        </Text>
        <Text style={styles.detailText}>
          Token: {token ? `${token.substring(0, 20)}...` : 'No token'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  reconnectButton: {
    padding: 4,
  },
  testButton: {
    padding: 4,
    marginLeft: 8,
  },
  details: {
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default ConnectionDebug;
