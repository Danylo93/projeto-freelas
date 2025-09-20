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
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseRealtime } from '../../contexts/FirebaseRealtimeContext';
import { useLocation } from '../../contexts/LocationContext';
import { MainAppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';

export default function ProviderHomeScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();
  const { isConnected } = useFirebaseRealtime();
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
        'Você não receberá mais solicitações de serviços. Deseja continuar?',
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
        content="Conectado via Firebase Realtime Database"
        variant="outlined"
        style={[styles.statusCard, { borderColor: theme.colors.success }]}
      />
    );
  };

  const renderLocationStatus = () => {
    if (!location) {
      return (
        <Card
          title="Localização"
          content="Solicitando permissão de localização..."
          variant="outlined"
          style={[styles.statusCard, { borderColor: theme.colors.warning }]}
        />
      );
    }
    return (
      <Card
        title="Localização"
        content={`Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`}
        variant="outlined"
        style={[styles.statusCard, { borderColor: theme.colors.success }]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MainAppBar 
        title="Prestador"
        subtitle="Painel de Controle"
        showBackButton={false}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status de Conexão */}
        {renderConnectionStatus()}
        
        {/* Status de Localização */}
        {renderLocationStatus()}

        {/* Status Online/Offline */}
        <Card
          title="Status de Disponibilidade"
          content={
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.colors.onSurface }]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={handleToggleOnline}
                  trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
                  thumbColor={isOnline ? theme.colors.onPrimary : theme.colors.outline}
                />
              </View>
              <StatusBadge
                status={isOnline ? 'online' : 'offline'}
                text={isOnline ? 'Disponível' : 'Indisponível'}
              />
            </View>
          }
          variant="outlined"
          style={[styles.statusCard, { 
            borderColor: isOnline ? theme.colors.success : theme.colors.outlineVariant 
          }]}
        />

        {/* Estatísticas */}
        <Card
          title="Estatísticas de Hoje"
          content={
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  R$ {todayEarnings.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Ganhos Hoje
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {completedServices}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Serviços Concluídos
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {rating.toFixed(1)} ⭐
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Avaliação
                </Text>
              </View>
            </View>
          }
          variant="outlined"
          style={[styles.statusCard, { borderColor: theme.colors.outlineVariant }]}
        />

        {/* Botões de Ação */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Ver Solicitações"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            style={styles.actionButton}
          />
          <SecondaryButton
            title="Histórico"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
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
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
});