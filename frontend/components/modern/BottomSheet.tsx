import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  onSnapChange?: (snapIndex: number) => void;
  backgroundColor?: string;
  handleColor?: string;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnap = 0,
  onSnapChange,
  backgroundColor = '#FFFFFF',
  handleColor = '#C7C7CC',
  showHandle = true,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight * (1 - snapPoints[initialSnap]))).current;
  const lastGestureY = useRef(0);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);

  const snapToPoint = (snapIndex: number) => {
    const snapPoint = screenHeight * (1 - snapPoints[snapIndex]);
    
    Animated.spring(translateY, {
      toValue: snapPoint,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setCurrentSnap(snapIndex);
    onSnapChange?.(snapIndex);
  };

  // Controles melhorados
  const handleToggle = () => {
    // Se está no snap inicial (menor), expande para o próximo
    // Se está expandido, volta para o inicial
    if (currentSnap === 0) {
      const nextSnap = Math.min(1, snapPoints.length - 1);
      snapToPoint(nextSnap);
    } else {
      snapToPoint(0); // Sempre volta para o inicial
    }
  };

  const handleExpand = () => {
    const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
    snapToPoint(nextSnap);
  };

  const handleCollapse = () => {
    snapToPoint(0); // Sempre volta para o inicial
  };

  useEffect(() => {
    snapToPoint(initialSnap);
  }, []);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            transform: [{ translateY }],
          },
        ]}
      >
      <TouchableOpacity style={styles.header} onPress={handleToggle}>
        {showHandle && (
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
        )}
        {currentSnap > 0 && (
          <TouchableOpacity style={styles.collapseButton} onPress={handleCollapse}>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
    </View>
  );
};

// Componente de conteúdo para diferentes estados
interface BottomSheetContentProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: Array<{
    title: string;
    onPress: () => void;
    style?: 'primary' | 'secondary' | 'danger';
    icon?: string;
  }>;
}

export const BottomSheetContent: React.FC<BottomSheetContentProps> = ({
  title,
  subtitle,
  children,
  actions = [],
}) => {

  return (
    <View style={styles.sheetContent}>
      <View style={styles.contentWrapper}>
        {(title || subtitle) && (
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </View>

      {actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' && styles.primaryButton,
                action.style === 'danger' && styles.dangerButton,

              ]}
              onPress={action.onPress}
            >
              {action.icon && (
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={
                    action.style === 'primary' ? '#FFFFFF' :
                    action.style === 'danger' ? '#FFFFFF' : '#007AFF'
                  }
                  style={styles.actionIcon}
                />
              )}
              <Text
                style={[
                  styles.actionText,
                  action.style === 'primary' && styles.primaryButtonText,
                  action.style === 'danger' && styles.dangerButtonText,
                ]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  collapseButton: {
    position: 'absolute',
    right: 20,
    top: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetContent: {
    flexShrink: 1, // Permite encolher
    justifyContent: 'flex-start', // Alinha no topo
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0, // Permite que o conteúdo seja comprimido
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  childrenContainer: {
    flexShrink: 1,
    // Removido maxHeight para permitir mais flexibilidade
  },
  actionsContainer: {
    paddingTop: 16,
    paddingBottom: 34, // Safe area
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
});
