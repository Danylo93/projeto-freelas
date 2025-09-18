import axios from 'axios';
import { API_URL } from '@/utils/config';
import * as FileSystem from 'expo-file-system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  category?: string;
  hourly_rate?: number;
  profile_image?: string;
  user_type: number;
  rating?: number;
  total_services?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  bio?: string;
  category?: string;
  hourly_rate?: number;
  profile_image?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface NotificationSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  service_updates: boolean;
  promotional_messages: boolean;
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private';
  location_sharing: boolean;
  contact_info_visible: boolean;
  rating_visible: boolean;
}

class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getMultipartHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
  }

  /**
   * Obter perfil do usuário atual
   */
  async getProfile(): Promise<UserProfile> {
    try {
      console.log('👤 [USER] Obtendo perfil do usuário...');

      const response = await axios.get(
        `${API_URL}/users/profile`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Perfil obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao obter perfil:', error);
      throw new Error('Não foi possível obter o perfil do usuário');
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('👤 [USER] Atualizando perfil do usuário...');

      let profileImageUrl = data.profile_image;

      // Se há uma nova imagem, fazer upload primeiro
      if (data.profile_image && data.profile_image.startsWith('file://')) {
        profileImageUrl = await this.uploadProfileImage(data.profile_image);
      }

      const updateData = {
        ...data,
        profile_image: profileImageUrl,
      };

      const response = await axios.patch(
        `${API_URL}/users/profile`,
        updateData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Perfil atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao atualizar perfil:', error);
      throw new Error('Não foi possível atualizar o perfil');
    }
  }

  /**
   * Upload de imagem de perfil
   */
  private async uploadProfileImage(imageUri: string): Promise<string> {
    try {
      console.log('📸 [USER] Fazendo upload da imagem de perfil...');

      // Criar FormData para upload
      const formData = new FormData();
      
      // Obter informações do arquivo
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo de imagem não encontrado');
      }

      // Adicionar arquivo ao FormData
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await axios.post(
        `${API_URL}/users/upload-profile-image`,
        formData,
        { headers: this.getMultipartHeaders() }
      );

      console.log('✅ [USER] Upload da imagem concluído');
      return response.data.image_url;
    } catch (error) {
      console.error('❌ [USER] Erro no upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  /**
   * Alterar senha
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      console.log('🔒 [USER] Alterando senha...');

      if (data.new_password !== data.confirm_password) {
        throw new Error('As senhas não coincidem');
      }

      if (data.new_password.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      await axios.post(
        `${API_URL}/users/change-password`,
        {
          current_password: data.current_password,
          new_password: data.new_password,
        },
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Senha alterada com sucesso');
    } catch (error: any) {
      console.error('❌ [USER] Erro ao alterar senha:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Senha atual incorreta');
      }
      
      throw new Error('Não foi possível alterar a senha');
    }
  }

  /**
   * Obter configurações de notificação
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      console.log('🔔 [USER] Obtendo configurações de notificação...');

      const response = await axios.get(
        `${API_URL}/users/notification-settings`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Configurações de notificação obtidas');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao obter configurações:', error);
      throw new Error('Não foi possível obter as configurações de notificação');
    }
  }

  /**
   * Atualizar configurações de notificação
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      console.log('🔔 [USER] Atualizando configurações de notificação...');

      const response = await axios.patch(
        `${API_URL}/users/notification-settings`,
        settings,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Configurações de notificação atualizadas');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao atualizar configurações:', error);
      throw new Error('Não foi possível atualizar as configurações de notificação');
    }
  }

  /**
   * Obter configurações de privacidade
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      console.log('🔒 [USER] Obtendo configurações de privacidade...');

      const response = await axios.get(
        `${API_URL}/users/privacy-settings`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Configurações de privacidade obtidas');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao obter configurações:', error);
      throw new Error('Não foi possível obter as configurações de privacidade');
    }
  }

  /**
   * Atualizar configurações de privacidade
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      console.log('🔒 [USER] Atualizando configurações de privacidade...');

      const response = await axios.patch(
        `${API_URL}/users/privacy-settings`,
        settings,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Configurações de privacidade atualizadas');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao atualizar configurações:', error);
      throw new Error('Não foi possível atualizar as configurações de privacidade');
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(): Promise<{
    total_services: number;
    completed_services: number;
    cancelled_services: number;
    average_rating: number;
    total_earnings?: number;
    this_month_earnings?: number;
  }> {
    try {
      console.log('📊 [USER] Obtendo estatísticas do usuário...');

      const response = await axios.get(
        `${API_URL}/users/stats`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Estatísticas obtidas');
      return response.data;
    } catch (error) {
      console.error('❌ [USER] Erro ao obter estatísticas:', error);
      throw new Error('Não foi possível obter as estatísticas');
    }
  }

  /**
   * Excluir conta do usuário
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      console.log('🗑️ [USER] Excluindo conta do usuário...');

      await axios.delete(
        `${API_URL}/users/account`,
        {
          headers: this.getAuthHeaders(),
          data: { password },
        }
      );

      console.log('✅ [USER] Conta excluída com sucesso');
    } catch (error: any) {
      console.error('❌ [USER] Erro ao excluir conta:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Senha incorreta');
      }
      
      throw new Error('Não foi possível excluir a conta');
    }
  }

  /**
   * Solicitar suporte
   */
  async submitSupportRequest(data: {
    subject: string;
    message: string;
    category: 'technical' | 'billing' | 'general' | 'bug_report';
  }): Promise<void> {
    try {
      console.log('🆘 [USER] Enviando solicitação de suporte...');

      await axios.post(
        `${API_URL}/users/support`,
        data,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [USER] Solicitação de suporte enviada');
    } catch (error) {
      console.error('❌ [USER] Erro ao enviar suporte:', error);
      throw new Error('Não foi possível enviar a solicitação de suporte');
    }
  }
}

export const userService = new UserService();

export default UserService;
