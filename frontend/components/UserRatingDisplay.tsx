import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ratingService, Rating } from '@/services/ratingService';

interface UserRatingDisplayProps {
  userId: string;
  userType: 'client' | 'provider';
  userName: string;
  showRecentRatings?: boolean;
  maxRecentRatings?: number;
}

export const UserRatingDisplay: React.FC<UserRatingDisplayProps> = ({
  userId,
  userType,
  userName,
  showRecentRatings = true,
  maxRecentRatings = 5,
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: {} as { [key: number]: number },
  });
  const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
  const [showAllRatings, setShowAllRatings] = useState(false);

  useEffect(() => {
    loadRatingData();
  }, [userId, userType]);

  const loadRatingData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas
      const statsData = await ratingService.getUserRatingStats(userId, userType);
      setStats(statsData);

      // Carregar avaliações recentes se solicitado
      if (showRecentRatings && userType === 'provider') {
        const recent = await ratingService.getProviderRecentRatings(userId, maxRecentRatings);
        setRecentRatings(recent);
      }
    } catch (error) {
      console.error('❌ [RATING] Erro ao carregar dados de avaliação:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#FFD700" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#E0E0E0" />
        );
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderRatingDistribution = () => {
    if (stats.total === 0) return null;

    return (
      <View style={styles.distributionContainer}>
        <Text style={styles.distributionTitle}>Distribuição das Avaliações</Text>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star] || 0;
          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

          return (
            <View key={star} style={styles.distributionRow}>
              <Text style={styles.distributionStar}>{star}</Text>
              <Ionicons name="star" size={12} color="#FFD700" />
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    { width: `${percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecentRating = (rating: Rating, index: number) => {
    const date = new Date(rating.created_at);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View key={rating.id} style={styles.ratingItem}>
        <View style={styles.ratingHeader}>
          {renderStars(rating.rating, 14)}
          <Text style={styles.ratingDate}>{formattedDate}</Text>
        </View>
        {rating.comment && (
          <Text style={styles.ratingComment} numberOfLines={3}>
            "{rating.comment}"
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando avaliações...</Text>
      </View>
    );
  }

  if (stats.total === 0) {
    return (
      <View style={styles.noRatingsContainer}>
        <Ionicons name="star-outline" size={32} color="#E0E0E0" />
        <Text style={styles.noRatingsText}>
          {userType === 'provider' ? 'Nenhuma avaliação ainda' : 'Ainda não avaliou ninguém'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumo das Avaliações */}
      <View style={styles.summaryContainer}>
        <View style={styles.averageContainer}>
          <Text style={styles.averageNumber}>{stats.average.toFixed(1)}</Text>
          {renderStars(stats.average, 20)}
        </View>
        <Text style={styles.totalRatings}>
          {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
        </Text>
      </View>

      {/* Distribuição das Avaliações */}
      {renderRatingDistribution()}

      {/* Avaliações Recentes */}
      {showRecentRatings && recentRatings.length > 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Avaliações Recentes</Text>
            {recentRatings.length >= maxRecentRatings && (
              <TouchableOpacity
                onPress={() => setShowAllRatings(!showAllRatings)}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>
                  {showAllRatings ? 'Ver menos' : 'Ver todas'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.ratingsScroll} nestedScrollEnabled>
            {(showAllRatings ? recentRatings : recentRatings.slice(0, 3)).map(renderRecentRating)}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noRatingsContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noRatingsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averageContainer: {
    alignItems: 'center',
    gap: 8,
  },
  averageNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  totalRatings: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  distributionContainer: {
    marginBottom: 16,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  distributionStar: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  distributionCount: {
    fontSize: 12,
    color: '#8E8E93',
    width: 20,
    textAlign: 'right',
  },
  recentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  ratingsScroll: {
    maxHeight: 200,
  },
  ratingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ratingComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
