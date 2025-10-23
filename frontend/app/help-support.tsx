import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const supportTopics: SupportTopic[] = [
    {
      id: '1',
      title: 'Como solicitar um serviço?',
      description: 'Aprenda a solicitar serviços na plataforma',
      icon: '🚀',
      color: '#2196F3'
    },
    {
      id: '2',
      title: 'Problemas com pagamento',
      description: 'Resolva questões relacionadas a pagamentos',
      icon: '💳',
      color: '#4CAF50'
    },
    {
      id: '3',
      title: 'Cancelar serviço',
      description: 'Como cancelar um serviço em andamento',
      icon: '❌',
      color: '#F44336'
    },
    {
      id: '4',
      title: 'Avaliar prestador',
      description: 'Como avaliar o serviço recebido',
      icon: '⭐',
      color: '#FF9800'
    },
    {
      id: '5',
      title: 'Problemas técnicos',
      description: 'Resolva problemas com o aplicativo',
      icon: '🔧',
      color: '#9C27B0'
    },
    {
      id: '6',
      title: 'Conta e perfil',
      description: 'Gerencie suas informações pessoais',
      icon: '👤',
      color: '#607D8B'
    }
  ];

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Como funciona o sistema de preços?',
      answer: 'Os preços são calculados com base na distância e categoria do serviço. Há uma taxa base por categoria e um valor adicional por quilômetro percorrido.',
      category: 'precos'
    },
    {
      id: '2',
      question: 'Posso cancelar um serviço após solicitar?',
      answer: 'Sim, você pode cancelar um serviço antes do prestador chegar ao local. Após o início do serviço, o cancelamento pode ter taxas.',
      category: 'cancelamento'
    },
    {
      id: '3',
      question: 'Como funciona o pagamento?',
      answer: 'O pagamento é processado automaticamente após a conclusão do serviço. Você pode usar cartão de crédito, débito, PIX ou dinheiro.',
      category: 'pagamento'
    },
    {
      id: '4',
      question: 'Como avaliar um prestador?',
      answer: 'Após a conclusão do serviço, você receberá uma solicitação para avaliar o prestador. A avaliação vai de 1 a 5 estrelas.',
      category: 'avaliacao'
    },
    {
      id: '5',
      question: 'O que fazer se o prestador não aparecer?',
      answer: 'Entre em contato com o prestador pelo telefone. Se não conseguir contato, você pode cancelar o serviço e solicitar um reembolso.',
      category: 'problemas'
    },
    {
      id: '6',
      question: 'Como alterar meus dados pessoais?',
      answer: 'Acesse o menu Perfil e clique em "Editar". Você pode alterar nome, telefone e outros dados pessoais.',
      category: 'conta'
    }
  ];

  const handleTopicPress = (topic: SupportTopic) => {
    Alert.alert(
      topic.title,
      `Esta funcionalidade está em desenvolvimento.\n\n${topic.description}`,
      [{ text: 'OK' }]
    );
  };

  const handleFAQPress = (faq: FAQItem) => {
    Alert.alert(
      faq.question,
      faq.answer,
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    if (!contactMessage.trim()) {
      Alert.alert('Erro', 'Digite sua mensagem antes de enviar');
      return;
    }

    Alert.alert(
      'Mensagem Enviada',
      'Sua mensagem foi enviada para nossa equipe de suporte. Responderemos em até 24 horas.',
      [{ text: 'OK', onPress: () => setContactMessage('') }]
    );
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Ligar para Suporte',
      'Deseja ligar para o atendimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve') }
      ]
    );
  };

  const filteredFAQ = faqItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
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
          <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Conteúdo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Busca */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ajuda..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tópicos de Suporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tópicos Populares</Text>
          <View style={styles.topicsGrid}>
            {supportTopics.map(topic => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, { borderLeftColor: topic.color }]}
                onPress={() => handleTopicPress(topic)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'precos' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('precos')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'precos' && styles.categoryTextActive]}>
                Preços
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'pagamento' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('pagamento')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'pagamento' && styles.categoryTextActive]}>
                Pagamento
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'problemas' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('problemas')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'problemas' && styles.categoryTextActive]}>
                Problemas
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.faqList}>
            {filteredFAQ.map(faq => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => handleFAQPress(faq)}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fale Conosco</Text>
          
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Envie sua mensagem</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Descreva seu problema ou dúvida..."
              placeholderTextColor="#999"
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
            />
            
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleContactSupport}
            >
              <Text style={styles.sendButtonText}>Enviar Mensagem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactOptions}>
            <TouchableOpacity 
              style={styles.contactOption}
              onPress={handleCallSupport}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>Ligar para Suporte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactOption}
              onPress={() => Alert.alert('Em desenvolvimento', 'Funcionalidade será implementada em breve')}
            >
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactText}>Chat Online</Text>
            </TouchableOpacity>
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
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    backgroundColor: 'white',
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topicIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  faqList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqQuestion: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  faqArrow: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactOption: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
