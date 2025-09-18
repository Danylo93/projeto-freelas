import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RequestAcceptModalProps {
  visible: boolean;
  request: {
    request_id: string;
    client_name: string;
    category: string;
    description?: string;
    price: number;
    distance: number;
    client_address: string;
    client_latitude?: number;
    client_longitude?: number;
  } | null;
  onAccept: () => void;
  onDecline: () => void;
}

const { width, height } = Dimensions.get('window');

export const RequestAcceptModal: React.FC<RequestAcceptModalProps> = ({
  visible,
  request,
  onAccept,
  onDecline,
}) => {
  if (!request) return null;

  const estimatedTime = Math.ceil(request.distance * 2); // 2 min por km estimado

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
            <View style={styles.clientInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{request.client_name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.rating}>4.8</Text>
                </View>
              </View>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.category}>{request.category}</Text>
              <Text style={styles.price}>R$ {request.price.toFixed(2)}</Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.locationContainer}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Local do serviço</Text>
                <Text style={styles.locationAddress}>{request.client_address}</Text>
              </View>
            </View>
            
            {request.description && (
              <View style={styles.descriptionContainer}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.description}>{request.description}</Text>
              </View>
            )}
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Distância</Text>
              <Text style={styles.infoValue}>{request.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Tempo estimado</Text>
              <Text style={styles.infoValue}>{estimatedTime} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={20} color="#34C759" />
              <Text style={styles.infoLabel}>Você receberá</Text>
              <Text style={styles.infoValue}>R$ {(request.price * 0.8).toFixed(2)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>Aceitar</Text>
            </TouchableOpacity>
          </View>

          {/* Timer */}
          <View style={styles.timer}>
            <Text style={styles.timerText}>Responda em 15 segundos</Text>
          </View>
        </View>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  serviceInfo: {
    alignItems: 'flex-end',
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  tripDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
