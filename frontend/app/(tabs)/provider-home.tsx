import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContextNew';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeFallbackContext';
import { useLocation } from '../../contexts/LocationContext';
import { MainAppBar } from '../../components/ui/AppBar';
import { ProviderBottomTabNavigation } from '../../components/ui/BottomTabNavigation';
import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';

export default function ProviderHomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isConnected, connectionType } = useRealtime();
  const { location, requestLocationPermission } = useLocation();
  
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [rating, setRating] = useState(4.8);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleToggleOnline = () => {
    if (!isOnline) {
      Alert.alert(
        'Ficar Online',
        'Você ficará disponível para receber solicitações de serviços. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, ficar online', onPress: () => setIsOnline(true) }
        ]
      );
    } else {
      Alert.alert(
        'Ficar Offline',
        'Você não receberá mais solicitações. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, ficar offline', onPress: () => setIsOnline(false) }
        ]
      );
    }
  };

  const renderConnectionStatus = () => {
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
        content={`Conectado via ${connectionType === 'websocket' ? 'WebSocket' : 'Polling'}`}
        variant="outlined"
        style={[styles.statusCard, { borderColor: theme.colors.success }]}
      />
    );
  };

  const renderStatusToggle = () => {
    return (
      <Card
        title="Status de Disponibilidade"
        style={styles.statusToggleCard}
      >
        <View style={styles.statusToggleContent}>
          <View style={styles.statusInfo}>
            <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
              {isOnline ? 'Recebendo solicitações' : 'Não recebendo solicitações'}
            </Text>
          </View>
          
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ 
              false: theme.colors.outline, 
              true: theme.colors.primary 
            }}
            thumbColor={isOnline ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>
        
        <StatusBadge
          status={isOnline ? 'online' : 'offline'}
          style={styles.statusBadge}
        />
      </Card>
    );
  };

  const renderEarnings = () => {
    return (
      <Card
        title="Ganhos"
        style={styles.earningsCard}
      >
        <View style={styles.earningsContent}>
          <View style={styles.earningsItem}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.primary }]}>
              R$ {todayEarnings.toFixed(2)}
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
              Hoje
            </Text>
          </View>
          
          <View style={styles.earningsItem}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.primary }]}>
              R$ {weeklyEarnings.toFixed(2)}
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
              Esta semana
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderStats = () => {
    return (
      <Card
        title="Estatísticas"
        style={styles.statsCard}
      >
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text style={[theme.typography.headlineSmall, { color: theme.colors.onSurface }]}>
              {completedServices}
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
              Serviços concluídos
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[theme.typography.headlineSmall, { color: theme.colors.onSurface }]}>
              {rating.toFixed(1)}
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
              Avaliação média
            </Text>
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

  const renderQuickActions = () => {
    return (
      <Card
        title="Ações Rápidas"
        style={styles.quickActionsCard}
      >
        <View style={styles.quickActionsContent}>
          <PrimaryButton
            title="Ver Solicitações"
            onPress={() => {}}
            style={styles.quickActionButton}
          />
          
          <SecondaryButton
            title="Histórico"
            onPress={() => {}}
            style={styles.quickActionButton}
          />
        </View>
      </Card>
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
        {renderStatusToggle()}
        {renderEarnings()}
        {renderStats()}
        {renderQuickActions()}
      </ScrollView>
      
      <ProviderBottomTabNavigation
        activeTab="home"
        onTabPress={(tabId) => {
          // Handle tab navigation
          console.log('Navigate to:', tabId);
        }}
        requestsCount={0}
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
  statusCard: {
    marginBottom: 16,
  },
  statusToggleCard: {
    marginBottom: 16,
  },
  statusToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  earningsCard: {
    marginBottom: 16,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  earningsItem: {
    alignItems: 'center',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsContent: {
    gap: 12,
  },
  quickActionButton: {
    width: '100%',
  },
});
