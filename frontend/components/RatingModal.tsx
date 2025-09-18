import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  userType: 'client' | 'provider';
  otherUserName: string;
  requestId: string;
  onSubmitRating: (rating: number, comment: string) => void;
}

const { width } = Dimensions.get('window');

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  userType,
  otherUserName,
  requestId,
  onSubmitRating,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação Necessária', 'Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitRating(rating, comment);
      
      Alert.alert(
        '✅ Avaliação Enviada!',
        'Obrigado pelo seu feedback. Isso nos ajuda a melhorar nossos serviços.',
        [
          {
            text: 'OK',
            onPress: () => {
              setRating(0);
              setComment('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível enviar a avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? '#FFD700' : '#E5E5E7'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muito Ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Selecione uma avaliação';
    }
  };

  const getQuickComments = () => {
    if (userType === 'client') {
      return [
        'Serviço excelente!',
        'Muito profissional',
        'Pontual e eficiente',
        'Recomendo!',
        'Preço justo',
      ];
    } else {
      return [
        'Cliente educado',
        'Local bem organizado',
        'Pagamento em dia',
        'Recomendo!',
        'Muito atencioso',
      ];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Avaliar {userType === 'client' ? 'Prestador' : 'Cliente'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#007AFF" />
            </View>
            <Text style={styles.userName}>{otherUserName}</Text>
            <Text style={styles.userType}>
              {userType === 'client' ? 'Prestador de Serviços' : 'Cliente'}
            </Text>
          </View>

          {/* Rating Stars */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Como foi sua experiência?</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>{getRatingText()}</Text>
          </View>

          {/* Quick Comments */}
          <View style={styles.quickCommentsSection}>
            <Text style={styles.quickCommentsLabel}>Comentários rápidos:</Text>
            <View style={styles.quickCommentsContainer}>
              {getQuickComments().map((quickComment, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickCommentButton,
                    comment === quickComment && styles.quickCommentButtonSelected
                  ]}
                  onPress={() => setComment(comment === quickComment ? '' : quickComment)}
                >
                  <Text style={[
                    styles.quickCommentText,
                    comment === quickComment && styles.quickCommentTextSelected
                  ]}>
                    {quickComment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment Input */}
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Comentário (opcional):</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Conte-nos mais sobre sua experiência..."
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            <Text style={[styles.submitButtonText, rating === 0 && styles.submitButtonTextDisabled]}>
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#666',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  quickCommentsSection: {
    marginBottom: 24,
  },
  quickCommentsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  quickCommentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCommentButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  quickCommentButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickCommentText: {
    fontSize: 12,
    color: '#666',
  },
  quickCommentTextSelected: {
    color: '#fff',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
});
