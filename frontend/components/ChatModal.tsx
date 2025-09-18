import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_name: string;
  timestamp: number;
  type: 'text' | 'system';
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  otherUser: {
    id: string;
    name: string;
    type: 'client' | 'provider';
  };
}

const { height } = Dimensions.get('window');

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  requestId,
  otherUser,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      // Carregar mensagens existentes
      loadMessages();
      
      // Adicionar mensagem de sistema inicial
      addSystemMessage('Chat iniciado. Você pode se comunicar com segurança.');
    }
  }, [visible, requestId]);

  const loadMessages = async () => {
    if (!requestId) return;

    try {
      // TODO: Implementar carregamento real de mensagens do backend
      // const response = await chatService.getMessages(requestId);
      // setMessages(response.data);

      // Por enquanto, inicializar com array vazio
      setMessages([]);
    } catch (error) {
      console.error('❌ [CHAT] Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  };

  const addSystemMessage = (text: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      text,
      sender_id: 'system',
      sender_name: 'Sistema',
      timestamp: Date.now(),
      type: 'system',
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputText.trim(),
      sender_id: user.id,
      sender_name: user.name,
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simular resposta automática (remover em produção)
    setTimeout(() => {
      const autoReply: Message = {
        id: `reply-${Date.now()}`,
        text: getAutoReply(inputText),
        sender_id: otherUser.id,
        sender_name: otherUser.name,
        timestamp: Date.now(),
        type: 'text',
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);

    // Scroll para o final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getAutoReply = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('quanto tempo') || lowerMessage.includes('demora')) {
      return 'Estou chegando em aproximadamente 10 minutos!';
    }
    if (lowerMessage.includes('onde') || lowerMessage.includes('local')) {
      return 'Estou seguindo o GPS. Já estou bem próximo!';
    }
    if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
      return 'De nada! Estou aqui para ajudar! 😊';
    }
    if (lowerMessage.includes('oi') || lowerMessage.includes('olá')) {
      return 'Olá! Como posso ajudar?';
    }
    
    return 'Entendi! Qualquer coisa me avise.';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    const isSystemMessage = item.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const sendQuickMessage = (text: string) => {
    setInputText(text);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUser.name}</Text>
            <Text style={styles.headerSubtitle}>
              {otherUser.type === 'provider' ? 'Prestador' : 'Cliente'}
            </Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color="#34C759" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Replies */}
        <View style={styles.quickReplies}>
          <TouchableOpacity 
            style={styles.quickReplyButton}
            onPress={() => sendQuickMessage('Estou chegando!')}
          >
            <Text style={styles.quickReplyText}>Estou chegando!</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickReplyButton}
            onPress={() => sendQuickMessage('Quanto tempo?')}
          >
            <Text style={styles.quickReplyText}>Quanto tempo?</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickReplyButton}
            onPress={() => sendQuickMessage('Obrigado!')}
          >
            <Text style={styles.quickReplyText}>Obrigado!</Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite sua mensagem..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? "#fff" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: '#F8F9FA',
  },
  closeButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E5E5E7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#666',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  quickReplies: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickReplyText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: '#F8F9FA',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
});
