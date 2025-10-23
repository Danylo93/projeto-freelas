import React, { useState } from 'react';
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
import { useAuthStore } from '../src/stores/authStore';

const { width, height } = Dimensions.get('window');

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'switch' | 'button' | 'select';
  value?: boolean;
  icon: string;
  action?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: true,
    autoPayment: false,
    darkMode: false,
    soundEffects: true,
    vibration: true,
    dataSaving: false,
    autoUpdate: true
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Idioma',
      'Selecione o idioma do aplicativo:',
      [
        { text: 'Português (Brasil)', onPress: () => Alert.alert('Sucesso', 'Idioma alterado para Português') },
        { text: 'English', onPress: () => Alert.alert('Sucesso', 'Language changed to English') },
        { text: 'Español', onPress: () => Alert.alert('Sucesso', 'Idioma cambiado a Español') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Tema',
      'Escolha o tema do aplicativo:',
      [
        { text: 'Claro', onPress: () => Alert.alert('Sucesso', 'Tema alterado para Claro') },
        { text: 'Escuro', onPress: () => Alert.alert('Sucesso', 'Tema alterado para Escuro') },
        { text: 'Automático', onPress: () => Alert.alert('Sucesso', 'Tema alterado para Automático') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Configurações de Privacidade',
      'Gerencie suas configurações de privacidade e dados pessoais.',
      [{ text: 'OK' }]
    );
  };

  const handleDataManagement = () => {
    Alert.alert(
      'Gerenciar Dados',
      'Visualize e gerencie os dados armazenados no aplicativo.',
      [{ text: 'OK' }]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar o cache do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', onPress: () => Alert.alert('Sucesso', 'Cache limpo com sucesso') }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o App',
      'Freelas App v1.0.0\n\nDesenvolvido para conectar clientes e prestadores de serviços.\n\n© 2024 Freelas App',
      [{ text: 'OK' }]
    );
  };

  const settingItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Receber notificações sobre serviços',
      type: 'switch',
      value: settings.notifications,
      icon: '🔔'
    },
    {
      id: 'locationTracking',
      title: 'Rastreamento de Localização',
      description: 'Permitir rastreamento para melhor experiência',
      type: 'switch',
      value: settings.locationTracking,
      icon: '📍'
    },
    {
      id: 'autoPayment',
      title: 'Pagamento Automático',
      description: 'Pagar automaticamente após conclusão',
      type: 'switch',
      value: settings.autoPayment,
      icon: '💳'
    },
    {
      id: 'darkMode',
      title: 'Modo Escuro',
      description: 'Usar tema escuro do aplicativo',
      type: 'switch',
      value: settings.darkMode,
      icon: '🌙'
    },
    {
      id: 'soundEffects',
      title: 'Efeitos Sonoros',
      description: 'Reproduzir sons do aplicativo',
      type: 'switch',
      value: settings.soundEffects,
      icon: '🔊'
    },
    {
      id: 'vibration',
      title: 'Vibração',
      description: 'Vibrar para notificações',
      type: 'switch',
      value: settings.vibration,
      icon: '📳'
    },
    {
      id: 'dataSaving',
      title: 'Economia de Dados',
      description: 'Reduzir uso de dados móveis',
      type: 'switch',
      value: settings.dataSaving,
      icon: '📱'
    },
    {
      id: 'autoUpdate',
      title: 'Atualização Automática',
      description: 'Atualizar aplicativo automaticamente',
      type: 'switch',
      value: settings.autoUpdate,
      icon: '🔄'
    }
  ];

  const actionItems: SettingItem[] = [
    {
      id: 'language',
      title: 'Idioma',
      description: 'Português (Brasil)',
      type: 'button',
      icon: '🌍',
      action: handleLanguageChange
    },
    {
      id: 'theme',
      title: 'Tema',
      description: 'Claro',
      type: 'button',
      icon: '🎨',
      action: handleThemeChange
    },
    {
      id: 'privacy',
      title: 'Privacidade',
      description: 'Configurações de privacidade',
      type: 'button',
      icon: '🔒',
      action: handlePrivacySettings
    },
    {
      id: 'data',
      title: 'Gerenciar Dados',
      description: 'Visualizar e gerenciar dados',
      type: 'button',
      icon: '📊',
      action: handleDataManagement
    },
    {
      id: 'cache',
      title: 'Limpar Cache',
      description: 'Liberar espaço de armazenamento',
      type: 'button',
      icon: '🗑️',
      action: handleClearCache
    },
    {
      id: 'about',
      title: 'Sobre',
      description: 'Informações do aplicativo',
      type: 'button',
      icon: 'ℹ️',
      action: handleAbout
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <View key={item.id} style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={(value) => handleSettingChange(item.id, value)}
            trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <TouchableOpacity onPress={item.action}>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Conteúdo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Usuário */}
        <View style={styles.userCard}>
          <Text style={styles.userIcon}>👤</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'usuario@email.com'}</Text>
          </View>
        </View>

        {/* Configurações Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações Gerais</Text>
          <View style={styles.settingsList}>
            {settingItems.map(renderSettingItem)}
          </View>
        </View>

        {/* Configurações Avançadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações Avançadas</Text>
          <View style={styles.settingsList}>
            {actionItems.map(renderSettingItem)}
          </View>
        </View>

        {/* Informações do App */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 Informações do App</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versão:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última atualização:</Text>
            <Text style={styles.infoValue}>15/01/2024</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tamanho do app:</Text>
            <Text style={styles.infoValue}>45.2 MB</Text>
          </View>
        </View>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas</Text>
          <Text style={styles.tipText}>• Ative as notificações para não perder nenhum serviço</Text>
          <Text style={styles.tipText}>• Use o modo escuro para economizar bateria</Text>
          <Text style={styles.tipText}>• Ative a economia de dados para usar menos internet</Text>
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
  userCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  settingRight: {
    marginLeft: 12,
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
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
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});
