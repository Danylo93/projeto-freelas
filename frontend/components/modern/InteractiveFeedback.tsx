import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from './Toast';
import { feedbackService } from '../../services/feedbackService';
import analyticsService from '../../services/analyticsService';

interface InteractiveFeedbackProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  providerName?: string;
  onSubmit: (rating: number, comment?: string) => void;
  type: 'service_completed' | 'provider_rating' | 'general_feedback';
}

export const InteractiveFeedback: React.FC<InteractiveFeedbackProps> = ({
  visible,
  onClose,
  requestId,
  providerName,
  onSubmit,
  type,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'rating' | 'comment' | 'thanks'>('rating');
  const { showSuccess, showError } = useToast();

  const scaleAnimation = new Animated.Value(0);
  const starAnimations = Array.from({ length: 5 }, () => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Animar entrada do modal
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Animar estrelas sequencialmente
      const animations = starAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: index * 100,
          useNativeDriver: true,
        })
      );

      Animated.stagger(100, animations).start();
    } else {
      // Reset animations
      scaleAnimation.setValue(0);
      starAnimations.forEach(anim => anim.setValue(0));
      setCurrentStep('rating');
      setRating(0);
      setComment('');
    }
  }, [visible]);

  const handleStarPress = async (selectedRating: number) => {
    setRating(selectedRating);
    
    // Feedback háptico
    await feedbackService.success();
    
    // Animar estrela selecionada
    Animated.sequence([
      Animated.timing(starAnimations[selectedRating - 1], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starAnimations[selectedRating - 1], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-avançar para comentário após 1 segundo
    setTimeout(() => {
      if (selectedRating >= 4) {
        setCurrentStep('comment');
      } else {
        setCurrentStep('comment');
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Por favor, selecione uma avaliação');
      return;
    }

    setIsSubmitting(true);

    try {
      // Feedback háptico
      await feedbackService.success();

      // Analytics
      try {
        await analyticsService.trackEvent('feedback_submitted', {
          rating,
          hasComment: comment.length > 0,
          type,
          requestId,
        });
      } catch (error) {
        console.log('⚠️ [ANALYTICS] Erro ao rastrear evento:', error);
      }

      // Submeter feedback
      await onSubmit(rating, comment);

      setCurrentStep('thanks');

      // Fechar modal após mostrar agradecimento
      setTimeout(() => {
        onClose();
      }, 2000);

      showSuccess('Obrigado pelo seu feedback!');

    } catch (error) {
      console.error('❌ [FEEDBACK] Erro ao enviar:', error);
      showError('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>
        Como foi o atendimento{providerName ? ` do ${providerName}` : ''}?
      </Text>
      <Text style={styles.subtitle}>
        Sua avaliação nos ajuda a melhorar o serviço
      </Text>

      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Animated.View
              style={[
                styles.starWrapper,
                {
                  transform: [{ scale: starAnimations[star - 1] }],
                },
              ]}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFD700' : '#E5E5EA'}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {rating > 0 && (
        <Text style={styles.ratingText}>
          {rating === 1 && '😞 Muito ruim'}
          {rating === 2 && '😐 Ruim'}
          {rating === 3 && '🙂 Regular'}
          {rating === 4 && '😊 Bom'}
          {rating === 5 && '🤩 Excelente'}
        </Text>
      )}
    </View>
  );

  const renderCommentStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>
        Quer deixar um comentário?
      </Text>
      <Text style={styles.subtitle}>
        Conte-nos mais sobre sua experiência (opcional)
      </Text>

      <TextInput
        style={styles.commentInput}
        placeholder="Digite seu comentário aqui..."
        placeholderTextColor="#8E8E93"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.skipButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.skipButtonText}>Pular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderThanksStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.thanksIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#34C759" />
      </View>
      <Text style={styles.thanksTitle}>Obrigado!</Text>
      <Text style={styles.thanksSubtitle}>
        Seu feedback é muito importante para nós
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>

          {currentStep === 'rating' && renderRatingStep()}
          {currentStep === 'comment' && renderCommentStep()}
          {currentStep === 'thanks' && renderThanksStep()}
        </Animated.View>
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
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 8,
  },
  starWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    textAlignVertical: 'top',
    width: '100%',
    minHeight: 100,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#F2F2F7',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  thanksIcon: {
    marginBottom: 24,
  },
  thanksTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  thanksSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
