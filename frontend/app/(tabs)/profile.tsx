import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, isProvider } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const profileOptions = [
    {
      id: 'edit',
      title: 'Editar Perfil',
      icon: 'person-outline',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      id: 'payment',
      title: isProvider ? 'Dados Bancários' : 'Métodos de Pagamento',
      icon: 'card-outline',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      id: 'support',
      title: 'Suporte',
      icon: 'help-circle-outline',
      action: () => Alert.alert('Suporte', 'Entre em contato: suporte@servicoapp.com'),
    },
    {
      id: 'about',
      title: 'Sobre',
      icon: 'information-circle-outline',
      action: () => Alert.alert('ServiçoApp', 'Versão 1.0.0\nConectando você aos melhores profissionais'),
    },
  ];

  const getUserTypeLabel = () => {
    return isProvider ? 'Prestador de Serviços' : 'Cliente';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.userTypeBadge}>
          <Text style={styles.userTypeText}>{getUserTypeLabel()}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#667eea" />
              <Text style={styles.settingText}>Notificações</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e1e5e9', true: '#667eea' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={24} color="#667eea" />
              <Text style={styles.settingText}>Localização</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#e1e5e9', true: '#667eea' }}
              thumbColor={locationEnabled ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.action}
            >
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={24} color="#667eea" />
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {isProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prestador</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="star-outline" size={24} color="#667eea" />
                <Text style={styles.optionText}>Minhas Avaliações</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="business-outline" size={24} color="#667eea" />
                <Text style={styles.optionText}>Categorias de Serviço</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="analytics-outline" size={24} color="#667eea" />
                <Text style={styles.optionText}>Estatísticas</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#dc3545" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#667eea',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginLeft: 8,
  },
});