import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useServiceStore } from '../src/stores/serviceStore';
import { Service, ServiceStatus } from '../src/types';

const { width, height } = Dimensions.get('window');

export default function HistoryScreen() {
  const router = useRouter();
  const { completedServices, loadCompletedServices } = useServiceStore();
  
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadCompletedServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [completedServices, selectedFilter]);

  const filterServices = () => {
    let filtered = [...completedServices];
    
    switch (selectedFilter) {
      case 'completed':
        filtered = completedServices.filter(service => service.status === ServiceStatus.COMPLETED);
        break;
      case 'cancelled':
        filtered = completedServices.filter(service => service.status === ServiceStatus.CANCELLED);
        break;
      case 'thisMonth':
        const thisMonth = new Date();
        filtered = completedServices.filter(service => {
          const serviceDate = new Date(service.createdAt);
          return serviceDate.getMonth() === thisMonth.getMonth() && 
                 serviceDate.getFullYear() === thisMonth.getFullYear();
        });
        break;
      default:
        filtered = completedServices;
    }
    
    setFilteredServices(filtered);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return '#4CAF50';
      case ServiceStatus.CANCELLED:
        return '#F44336';
      case ServiceStatus.IN_PROGRESS:
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.COMPLETED:
        return 'Concluído';
      case ServiceStatus.CANCELLED:
        return 'Cancelado';
      case ServiceStatus.IN_PROGRESS:
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const handleServiceDetails = (service: Service) => {
    Alert.alert(
      'Detalhes do Serviço',
      `Serviço: ${service.category.displayName}\n` +
      `Valor: R$ ${service.price.toFixed(2)}\n` +
      `Status: ${getStatusText(service.status)}\n` +
      `Data: ${formatDate(service.createdAt)}`,
      [{ text: 'OK' }]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => handleServiceDetails(item)}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{item.category.displayName}</Text>
          <Text style={styles.serviceDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.serviceStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={styles.servicePrice}>R$ {item.price.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.serviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Origem:</Text>
          <Text style={styles.detailValue}>{item.location.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🎯 Destino:</Text>
          <Text style={styles.detailValue}>{item.destination?.address || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📏 Distância:</Text>
          <Text style={styles.detailValue}>{item.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏱️ Tempo:</Text>
          <Text style={styles.detailValue}>{item.estimatedTime} min</Text>
        </View>
      </View>
      
      {item.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Sua avaliação:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text 
                key={star} 
                style={[
                  styles.star, 
                  star <= item.rating ? styles.starFilled : styles.starEmpty
                ]}
              >
                ⭐
              </Text>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Nenhum serviço encontrado</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all' 
          ? 'Você ainda não possui serviços no histórico'
          : 'Nenhum serviço corresponde ao filtro selecionado'
        }
      </Text>
    </View>
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
          <Text style={styles.headerTitle}>Histórico de Serviços</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Todos ({completedServices.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text style={[styles.filterText, selectedFilter === 'completed' && styles.filterTextActive]}>
              Concluídos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Text style={[styles.filterText, selectedFilter === 'cancelled' && styles.filterTextActive]}>
              Cancelados
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'thisMonth' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('thisMonth')}
          >
            <Text style={[styles.filterText, selectedFilter === 'thisMonth' && styles.filterTextActive]}>
              Este Mês
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Serviços */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
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
  filtersContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 12,
    color: '#666',
  },
  serviceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  serviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 12,
    marginRight: 2,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
