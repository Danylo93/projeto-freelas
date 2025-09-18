import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ServiceCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  onPress: () => void;
  delay?: number;
  size?: 'small' | 'medium' | 'large';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  icon,
  color,
  onPress,
  delay = 0,
  size = 'medium',
}) => {
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const pressAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animação de entrada com delay
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        delay,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(pressAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { width: (width - 60) / 3, height: 80 };
      case 'large':
        return { width: width - 40, height: 120 };
      default:
        return { width: (width - 60) / 2, height: 100 };
    }
  };

  const cardSize = getCardSize();

  return (
    <Animated.View
      style={[
        styles.container,
        cardSize,
        {
          opacity: opacityAnimation,
          transform: [
            { scale: scaleAnimation },
            { scale: pressAnimation },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        
        {/* Efeito de brilho */}
        <View style={styles.shimmer} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente para grid de serviços
interface ServiceGridProps {
  services: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  onServicePress: (service: any) => void;
  columns?: number;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({
  services,
  onServicePress,
  columns = 2,
}) => {
  return (
    <View style={[styles.grid, { gap: columns === 3 ? 8 : 12 }]}>
      {services.map((service, index) => (
        <ServiceCard
          key={service.id}
          {...service}
          onPress={() => onServicePress(service)}
          delay={index * 100}
          size={columns === 3 ? 'small' : 'medium'}
        />
      ))}
    </View>
  );
};

// Componente para serviços em destaque
interface FeaturedServiceProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export const FeaturedService: React.FC<FeaturedServiceProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
}) => {
  const slideAnimation = useRef(new Animated.Value(50)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featuredContainer,
        {
          opacity: opacityAnimation,
          transform: [{ translateX: slideAnimation }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.featuredCard, { backgroundColor: color }]}
        onPress={onPress}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredText}>
            <Text style={styles.featuredTitle}>{title}</Text>
            <Text style={styles.featuredSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.featuredIcon}>
            <Text style={styles.featuredEmoji}>{icon}</Text>
          </View>
        </View>
        
        {/* Gradiente overlay */}
        <View style={styles.gradientOverlay} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  featuredContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  featuredText: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredEmoji: {
    fontSize: 28,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
