import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Provider {
  id: string;
  name: string;
  rating: number;
  distance: number;
  price: number;
  category: string;
  profileImage?: string;
  estimatedTime: number;
}

interface PriceOfferModalProps {
  visible: boolean;
  provider: Provider | null;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export const PriceOfferModal: React.FC<PriceOfferModalProps> = ({
  visible,
  provider,
  onAccept,
  onDecline,
  onClose,
}) => {
  const [pulseAnimation] = useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible) {
      // Animação de pulso para chamar atenção
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [visible]);

  if (!provider) return null;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#E5E5E7" />
      );
    }

    return stars;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
          
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIndicator} />
              <Text style={styles.headerTitle}>Prestador encontrado!</Text>
              <Text style={styles.headerSubtitle}>
                Aceite ou recuse a proposta
              </Text>
            </View>

            {/* Provider Info */}
            <View style={styles.providerSection}>
              <View style={styles.providerHeader}>
                <View style={styles.providerImageContainer}>
                  {provider.profileImage ? (
                    <Image 
                      source={{ uri: provider.profileImage }} 
                      style={styles.providerImage}
                    />
                  ) : (
                    <View style={styles.providerImagePlaceholder}>
                      <Ionicons name="person" size={32} color="#8E8E93" />
                    </View>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
                
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {renderStars(provider.rating)}
                    </View>
                    <Text style={styles.ratingText}>
                      {provider.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.categoryText}>{provider.category}</Text>
                </View>
              </View>

              {/* Service Details */}
              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <Text style={styles.detailText}>
                    {provider.distance.toFixed(1)} km de distância
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#007AFF" />
                  <Text style={styles.detailText}>
                    Chegada em ~{provider.estimatedTime} min
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Section */}
            <Animated.View 
              style={[
                styles.priceSection,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <Text style={styles.priceLabel}>Valor do serviço</Text>
              <Text style={styles.priceValue}>
                R$ {provider.price.toFixed(2)}
              </Text>
              <Text style={styles.priceNote}>
                Preço definido pelo prestador
              </Text>
            </Animated.View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.declineButton}
                onPress={onDecline}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
                <Text style={styles.declineButtonText}>Recusar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={onAccept}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </TouchableOpacity>
            </View>

            {/* Timer */}
            <View style={styles.timerSection}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" />
              <Text style={styles.timerText}>
                Esta oferta expira em 2 minutos
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  providerSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  providerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  serviceDetails: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
  },
  priceSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 6,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
});
