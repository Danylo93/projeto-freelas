import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useRatingStore } from '../src/stores/ratingStore';
import { useServiceStore } from '../src/stores/serviceStore';
import { RatingCategory } from '../src/types';

const { width, height } = Dimensions.get('window');

export default function RatingScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const { 
    categories, 
    loadCategories, 
    submitRating, 
    isSubmitting, 
    error, 
    clearError 
  } = useRatingStore();
  const { currentService } = useServiceStore();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animações
  const starScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(50);
  const successScale = useSharedValue(0);

  useEffect(() => {
    loadCategories();
    
    // Animar entrada dos cards
    cardTranslateY.value = withSpring(0, { damping: 15 });
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleStarPress = (starRating: number) => {
    setRating(starRating);
    
    // Animação da estrela
    starScale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Selecione uma avaliação');
      return;
    }

    if (!currentService) {
      Alert.alert('Erro', 'Serviço não encontrado');
      return;
    }

    try {
      const response = await submitRating({
        serviceId: currentService.id,
        rating,
        comment: comment.trim() || undefined,
        categoryIds: selectedCategories
      });

      if (response.success) {
        setShowSuccess(true);
        successScale.value = withSpring(1, { damping: 15 });
        
        // Navegar de volta após delay
        setTimeout(() => {
          router.replace('/client');
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar avaliação');
    }
  };

  const handleSkipRating = () => {
    router.replace('/client');
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Toque nas estrelas para avaliar';
    }
  };

  const getFilteredCategories = (): RatingCategory[] => {
    if (rating >= 3) {
      return categories.filter(cat => cat.isPositive);
    } else if (rating > 0) {
      return categories.filter(cat => !cat.isPositive);
    }
    return [];
  };

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  if (!currentService) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleSkipRating} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Pular</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Avalie sua corrida</Text>
          <Text style={styles.headerSubtitle}>Como foi sua experiência?</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do motorista */}
        <Animated.View style={[styles.driverCard, animatedCardStyle]}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>J</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>João Silva</Text>
              <Text style={styles.driverVehicle}>Honda Civic • ABC-1234</Text>
              <Text style={styles.driverStatus}>Corrida finalizada</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>
                R$ {(currentService.price * 1.1).toFixed(2)}
              </Text>
              <Text style={styles.priceLabel}>Total pago</Text>
            </View>
          </View>
        </Animated.View>

        {/* Avaliação por estrelas */}
        <Animated.View style={[styles.ratingSection, animatedCardStyle]}>
          <Text style={styles.ratingTitle}>Como foi sua experiência?</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Animated.View key={star} style={animatedStarStyle}>
                <TouchableOpacity
                  style={styles.starButton}
                  onPress={() => handleStarPress(star)}
                >
                  <Text style={[
                    styles.starIcon,
                    star <= rating && styles.starIconSelected
                  ]}>
                    {star <= rating ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
        </Animated.View>

        {/* Categorias de avaliação */}
        {rating > 0 && (
          <Animated.View style={[styles.categoriesSection, animatedCardStyle]}>
            <Text style={styles.categoriesTitle}>
              {rating >= 3 ? 'O que mais gostou?' : 'O que pode melhorar?'}
            </Text>
            
            <View style={styles.categoriesContainer}>
              {getFilteredCategories().map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category.id) && styles.categoryChipSelected,
                    category.isPositive ? styles.categoryChipPositive : styles.categoryChipNegative
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category.id) && styles.categoryChipTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Comentário */}
        {rating > 0 && (
          <Animated.View style={[styles.commentSection, animatedCardStyle]}>
            <Text style={styles.commentTitle}>Comentário (opcional)</Text>
            <View style={styles.commentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Conte-nos mais sobre sua experiência..."
                placeholderTextColor="#999999"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>
        )}

        {/* Botão de envio */}
        {rating > 0 && (
          <Animated.View style={[styles.submitContainer, animatedCardStyle]}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitRating}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.submitButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal de sucesso */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.successModal}>
          <Animated.View style={[styles.successContent, animatedSuccessStyle]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Avaliação Enviada!</Text>
            <Text style={styles.successText}>
              Obrigado pela sua avaliação!
            </Text>
            <Text style={styles.successSubtext}>
              Voltando à tela inicial...
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  driverStatus: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666666',
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
  },
  starIcon: {
    fontSize: 32,
    color: '#CCCCCC',
  },
  starIconSelected: {
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  categoryChipSelected: {
    borderWidth: 2,
  },
  categoryChipPositive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
  },
  categoryChipNegative: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666666',
  },
  categoryChipTextSelected: {
    color: '#333333',
    fontWeight: '600',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  commentContainer: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    padding: 16,
  },
  commentInput: {
    fontSize: 16,
    color: '#333333',
    minHeight: 80,
  },
  submitContainer: {
    marginBottom: 40,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
