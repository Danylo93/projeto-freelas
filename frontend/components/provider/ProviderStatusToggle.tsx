import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { PROVIDERS_API_URL } from '../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface ProviderStatusToggleProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const ProviderStatusToggle: React.FC<ProviderStatusToggleProps> = ({ onStatusChange }) => {
  const { user, token } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Carregar status atual do prestador
  useEffect(() => {
    loadProviderStatus();
  }, [user]);

  // Carregar status do AsyncStorage primeiro
  useEffect(() => {
    loadCachedStatus();
  }, [user]);

  const loadCachedStatus = async () => {
    if (!user) return;

    try {
      const cachedStatus = await AsyncStorage.getItem(`provider_status_${user.id}`);
      if (cachedStatus !== null) {
        const isOnlineCache = JSON.parse(cachedStatus);
        setIsOnline(isOnlineCache);
        console.log('📱 [PROVIDER-STATUS] Status carregado do cache:', isOnlineCache ? 'ONLINE' : 'OFFLINE');
      }
    } catch (error) {
      console.error('❌ [PROVIDER-STATUS] Erro ao carregar status do cache:', error);
    }
  };

  const loadProviderStatus = async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      console.log('🔄 [PROVIDER-STATUS] Carregando status do prestador...');

      const response = await axios.get(
        `${PROVIDERS_API_URL}/${user.id}/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
          timeout: 10000,
        }
      );

      if (response.data.status === 'success') {
        const currentStatus = response.data.is_online || false;
        setIsOnline(currentStatus);
        // Salvar no cache
        await AsyncStorage.setItem(`provider_status_${user.id}`, JSON.stringify(currentStatus));
        console.log('✅ [PROVIDER-STATUS] Status carregado:', currentStatus ? 'ONLINE' : 'OFFLINE');
      } else {
        console.log('⚠️ [PROVIDER-STATUS] Prestador não encontrado, definindo como offline');
        setIsOnline(false);
        await AsyncStorage.setItem(`provider_status_${user.id}`, JSON.stringify(false));
      }
    } catch (error) {
      console.error('❌ [PROVIDER-STATUS] Erro ao carregar status:', error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderStatus = async (newStatus: boolean) => {
    if (!user || !token) return;

    try {
      setIsUpdating(true);
      console.log('🔄 [PROVIDER-STATUS] Atualizando status para:', newStatus ? 'ONLINE' : 'OFFLINE');

      const response = await axios.post(
        `${PROVIDERS_API_URL}/${user.id}/status`,
        {
          is_online: newStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
          timeout: 10000,
        }
      );

      if (response.data.status === 'success') {
        setIsOnline(newStatus);
        onStatusChange?.(newStatus);

        // Salvar no cache
        await AsyncStorage.setItem(`provider_status_${user.id}`, JSON.stringify(newStatus));

        console.log('✅ [PROVIDER-STATUS] Status atualizado com sucesso');
        console.log('✅ [PROVIDER-STATUS] Serviços atualizados:', response.data.services_updated);

        // Mostrar feedback para o usuário
        Alert.alert(
          'Status Atualizado',
          `Você está agora ${newStatus ? 'ONLINE' : 'OFFLINE'}.\n${newStatus ? 'Você receberá notificações de novas solicitações.' : 'Você não receberá notificações até ficar online novamente.'}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ [PROVIDER-STATUS] Erro ao atualizar status:', error);
      
      // Reverter o switch em caso de erro
      setIsOnline(!newStatus);
      
      Alert.alert(
        'Erro',
        'Não foi possível atualizar seu status. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = (value: boolean) => {
    if (isUpdating) return;
    
    // Atualizar imediatamente para feedback visual
    setIsOnline(value);
    
    // Atualizar no servidor
    updateProviderStatus(value);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Status do Prestador</Text>
          <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#FF5722' }]}>
            {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
          </Text>
          <Text style={styles.statusDescription}>
            {isOnline 
              ? 'Você receberá notificações de novas solicitações'
              : 'Você não receberá notificações até ficar online'
            }
          </Text>
        </View>
        
        <View style={styles.switchContainer}>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={isUpdating}
            trackColor={{ false: '#FF5722', true: '#4CAF50' }}
            thumbColor={isOnline ? '#ffffff' : '#ffffff'}
            ios_backgroundColor="#FF5722"
          />
          {isUpdating && (
            <ActivityIndicator 
              size="small" 
              color="#007AFF" 
              style={styles.updatingIndicator}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  switchContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  updatingIndicator: {
    position: 'absolute',
    top: -25,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
});
