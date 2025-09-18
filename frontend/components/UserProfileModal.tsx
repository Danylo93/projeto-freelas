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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    category: user?.category || '',
    hourly_rate: user?.hourly_rate?.toString() || '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image || null);

  useEffect(() => {
    if (visible && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        category: user.category || '',
        hourly_rate: user.hourly_rate?.toString() || '',
      });
      setProfileImage(user.profile_image || null);
    }
  }, [visible, user]);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório.');
      return;
    }

    if (!profileData.email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...profileData,
        hourly_rate: profileData.hourly_rate ? parseFloat(profileData.hourly_rate) : undefined,
        profile_image: profileImage,
      };

      const updatedUser = await userService.updateProfile(updateData);
      
      // Atualizar contexto de autenticação
      updateUser(updatedUser);
      
      Alert.alert('✅ Sucesso', 'Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('❌ [PROFILE] Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              onClose();
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair da conta');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Meu Perfil</Text>

      <TouchableOpacity 
        onPress={handleSave} 
        style={styles.saveButton}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProfileImage = () => (
    <View style={styles.imageSection}>
      <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person" size={40} color="#8E8E93" />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <Ionicons name="camera" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={styles.imageHint}>Toque para alterar foto</Text>
    </View>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default',
    multiline: boolean = false,
    editable: boolean = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        placeholderTextColor="#8E8E93"
      />
    </View>
  );

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
          {renderProfileImage()}
          
          <View style={styles.formSection}>
            {renderFormField(
              'Nome *',
              profileData.name,
              (text) => setProfileData({ ...profileData, name: text }),
              'Seu nome completo'
            )}

            {renderFormField(
              'Email *',
              profileData.email,
              (text) => setProfileData({ ...profileData, email: text }),
              'seu@email.com',
              'email-address',
              false,
              false // Email não editável por segurança
            )}

            {renderFormField(
              'Telefone',
              profileData.phone,
              (text) => setProfileData({ ...profileData, phone: text }),
              '(11) 99999-9999',
              'phone-pad'
            )}

            {user?.user_type === 1 && (
              <>
                {renderFormField(
                  'Categoria',
                  profileData.category,
                  (text) => setProfileData({ ...profileData, category: text }),
                  'Ex: Limpeza, Jardinagem, Pintura...'
                )}

                {renderFormField(
                  'Valor por Hora (R$)',
                  profileData.hourly_rate,
                  (text) => setProfileData({ ...profileData, hourly_rate: text }),
                  '0.00',
                  'numeric'
                )}

                {renderFormField(
                  'Sobre Você',
                  profileData.bio,
                  (text) => setProfileData({ ...profileData, bio: text }),
                  'Conte um pouco sobre sua experiência e serviços...',
                  'default',
                  true
                )}
              </>
            )}
          </View>

          <View style={styles.accountSection}>
            <Text style={styles.sectionTitle}>Configurações da Conta</Text>
            
            <TouchableOpacity style={styles.accountOption}>
              <Ionicons name="lock-closed" size={20} color="#007AFF" />
              <Text style={styles.accountOptionText}>Alterar Senha</Text>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountOption}>
              <Ionicons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.accountOptionText}>Notificações</Text>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountOption}>
              <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
              <Text style={styles.accountOptionText}>Privacidade</Text>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountOption}>
              <Ionicons name="help-circle" size={20} color="#007AFF" />
              <Text style={styles.accountOptionText}>Ajuda e Suporte</Text>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.dangerSection}>
            <TouchableOpacity
              style={styles.dangerOption}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#FF3B30" />
              <Text style={styles.dangerOptionText}>Sair da Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerOption}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={styles.dangerOptionText}>Excluir Conta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
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
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  imageHint: {
    fontSize: 14,
    color: '#8E8E93',
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F8F9FA',
    color: '#8E8E93',
  },
  accountSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  accountOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  dangerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  dangerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  dangerOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default UserProfileModal;
