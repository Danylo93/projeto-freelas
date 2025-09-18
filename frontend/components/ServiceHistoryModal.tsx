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
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { historyService, ServiceHistoryItem, HistoryFilters, HistoryStats } from '@/services/historyService';

interface ServiceHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServiceHistoryModal: React.FC<ServiceHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyItems, setHistoryItems] = useState<ServiceHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({
    status: 'all',
    sort_by: 'date',
    sort_order: 'desc',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [filters, searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadCategories(),
        loadHistory(),
      ]);
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await historyService.getHistoryStats();
      setStats(statsData);
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao carregar estatísticas:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await historyService.getAvailableCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao carregar categorias:', error);
    }
  };

  const loadHistory = async (page: number = 1, append: boolean = false) => {
    try {
      const searchFilters = searchQuery ? { ...filters, search_query: searchQuery } : filters;
      const response = await historyService.getServiceHistory(searchFilters, page, 20);
      
      if (append) {
        setHistoryItems(prev => [...prev, ...response.items]);
      } else {
        setHistoryItems(response.items);
      }
      
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
      setHasMore(response.page < response.total_pages);
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao carregar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadHistory(currentPage + 1, true);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<HistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      Alert.alert(
        'Exportar Histórico',
        'Escolha o formato de exportação:',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'CSV', 
            onPress: () => exportHistory('csv') 
          },
          { 
            text: 'PDF', 
            onPress: () => exportHistory('pdf') 
          },
        ]
      );
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao exportar:', error);
    }
  };

  const exportHistory = async (format: 'csv' | 'pdf') => {
    try {
      setLoading(true);
      const fileUri = await historyService.exportHistory({
        format,
        filters,
        include_details: true,
      });
      
      await historyService.shareExportedFile(fileUri);
      Alert.alert('✅ Sucesso', 'Histórico exportado com sucesso!');
    } catch (error) {
      console.error('❌ [HISTORY] Erro ao exportar:', error);
      Alert.alert('Erro', 'Não foi possível exportar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Histórico de Serviços</Text>

      <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
        <Ionicons name="download" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total_services}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completed_services}</Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {historyService.formatPrice(stats.total_earnings)}
          </Text>
          <Text style={styles.statLabel}>Ganhos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.average_rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
      </View>
    );
  };

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar serviços..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#8E8E93"
        />
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'completed', label: 'Concluídos' },
                { value: 'cancelled', label: 'Cancelados' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    filters.status === option.value && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterChange({ status: option.value as any })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.status === option.value && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          {categories.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Categoria:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filters.category && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterChange({ category: undefined })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !filters.category && styles.filterOptionTextActive,
                    ]}
                  >
                    Todas
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      filters.category === category && styles.filterOptionActive,
                    ]}
                    onPress={() => handleFilterChange({ category })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.category === category && styles.filterOptionTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: ServiceHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemInfo}>
          <Text style={styles.historyItemCategory}>{item.category}</Text>
          <Text style={styles.historyItemDate}>
            {historyService.formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.historyItemStatus}>
          <Ionicons
            name={historyService.getStatusIcon(item.status)}
            size={20}
            color={historyService.getStatusColor(item.status)}
          />
          <Text style={styles.historyItemPrice}>
            {historyService.formatPrice(item.price)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.historyItemDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.historyItemFooter}>
        <Text style={styles.historyItemClient}>
          {item.client_name || item.provider_name}
        </Text>
        {(item.client_rating || item.provider_rating) && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {(item.client_rating || item.provider_rating)?.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyStateTitle}>Nenhum serviço encontrado</Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery || Object.keys(filters).some(key => filters[key as keyof HistoryFilters])
          ? 'Tente ajustar os filtros de busca'
          : 'Você ainda não possui histórico de serviços'}
      </Text>
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
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : (
          <>
            {renderStats()}
            {renderSearchAndFilters()}
            {renderFilters()}
            
            <FlatList
              data={historyItems}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              style={styles.historyList}
              contentContainerStyle={styles.historyListContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
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
  exportButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 8,
  },
  filterGroup: {
    marginHorizontal: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingHorizontal: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyItemStatus: {
    alignItems: 'flex-end',
  },
  historyItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 4,
  },
  historyItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemClient: {
    fontSize: 14,
    color: '#8E8E93',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ServiceHistoryModal;
