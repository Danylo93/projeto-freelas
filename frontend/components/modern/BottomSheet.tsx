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

  // Simplificado sem PanGestureHandler por enquanto
  const handleExpand = () => {
    const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
    snapToPoint(nextSnap);
  };

  const handleCollapse = () => {
    const nextSnap = Math.max(currentSnap - 1, 0);
    snapToPoint(nextSnap);
  };

  useEffect(() => {
    snapToPoint(initialSnap);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity style={styles.header} onPress={handleExpand}>
        {showHandle && (
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
        )}
      </TouchableOpacity>
      
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
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
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetContent: {
    flex: 1,
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
    flex: 1,
  },
  actionsContainer: {
    paddingBottom: 34, // Safe area
    gap: 12,
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
