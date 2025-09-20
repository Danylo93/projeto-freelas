import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Modal,
  TouchableOpacity,
  PanGestureHandler,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  snapPoints?: number[]; // Percentages of screen height
  defaultSnapPoint?: number; // Index of default snap point
  enablePanDownToClose?: boolean;
  enableBackdropClose?: boolean;
  backdropOpacity?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  handleStyle?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  subtitle,
  snapPoints = [0.25, 0.5, 0.9],
  defaultSnapPoint = 1,
  enablePanDownToClose = true,
  enableBackdropClose = true,
  backdropOpacity = 0.5,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  handleStyle,
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (visible) {
      showBottomSheet();
    } else {
      hideBottomSheet();
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const showBottomSheet = () => {
    const targetY = SCREEN_HEIGHT * (1 - snapPoints[currentSnapIndex]);
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 260,
      friction: 24,
    }).start();
  };

  const hideBottomSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      duration: theme.animation.medium,
    }).start();
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event: any) => {
    const { state, translationY, velocityY } = event.nativeEvent;

    if (state === 1) { // BEGAN
      setIsDragging(true);
    } else if (state === 5) { // END
      setIsDragging(false);
      
      const currentY = SCREEN_HEIGHT * (1 - snapPoints[currentSnapIndex]);
      const newY = currentY + translationY;
      
      // Determine which snap point to go to
      let targetIndex = currentSnapIndex;
      const threshold = 50;
      
      if (velocityY > 500 || translationY > SCREEN_HEIGHT * 0.3) {
        // Close the sheet
        onClose();
        return;
      }
      
      // Find closest snap point
      for (let i = 0; i < snapPoints.length; i++) {
        const snapY = SCREEN_HEIGHT * (1 - snapPoints[i]);
        if (Math.abs(newY - snapY) < threshold) {
          targetIndex = i;
          break;
        }
      }
      
      setCurrentSnapIndex(targetIndex);
      const targetY = SCREEN_HEIGHT * (1 - snapPoints[targetIndex]);
      
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 260,
        friction: 24,
      }).start();
    }
  };

  const getSheetStyle = (): ViewStyle => {
    return {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xxl,
      borderTopRightRadius: theme.borderRadius.xxl,
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      minHeight: SCREEN_HEIGHT * snapPoints[0],
      maxHeight: SCREEN_HEIGHT * 0.95,
    };
  };

  const getTitleStyle = (): TextStyle => {
    return {
      ...theme.typography.headlineSmall,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: subtitle ? theme.spacing.xs : theme.spacing.lg,
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    };
  };

  const getHandleStyle = (): ViewStyle => {
    return {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    };
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {enableBackdropClose && (
          <TouchableOpacity
            style={[styles.backdrop, { opacity: backdropOpacity }]}
            activeOpacity={1}
            onPress={onClose}
          />
        )}
        
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleGestureStateChange}
          enabled={enablePanDownToClose}
        >
          <Animated.View
            style={[
              styles.sheet,
              getSheetStyle(),
              {
                transform: [{ translateY }],
              },
              style,
            ]}
          >
            <View style={[styles.handle, getHandleStyle(), handleStyle]} />
            
            {title && (
              <Text style={[getTitleStyle(), titleStyle]}>
                {title}
              </Text>
            )}
            
            {subtitle && (
              <Text style={[getSubtitleStyle(), subtitleStyle]}>
                {subtitle}
              </Text>
            )}
            
            <View style={[styles.content, contentStyle]}>
              {children}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  handle: {
    // Handle styles are defined in getHandleStyle
  },
  content: {
    flex: 1,
  },
});

// BottomSheet específico para seleção de categoria
export interface CategoryBottomSheetProps extends Omit<BottomSheetProps, 'children'> {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
  }>;
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
}

export const CategoryBottomSheet: React.FC<CategoryBottomSheetProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  ...props
}) => {
  const themeContext = useTheme();
  
  if (!themeContext || !themeContext.theme) {
    return null;
  }
  
  const { theme } = themeContext;

  return (
    <BottomSheet
      title="Selecione uma categoria"
      subtitle="Escolha o tipo de serviço que você precisa"
      {...props}
    >
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              {
                backgroundColor: selectedCategory === category.id 
                  ? theme.colors.primaryContainer 
                  : theme.colors.surfaceContainer,
                borderColor: selectedCategory === category.id 
                  ? theme.colors.primary 
                  : theme.colors.outlineVariant,
              },
            ]}
            onPress={() => onCategorySelect(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryName,
              {
                color: selectedCategory === category.id 
                  ? theme.colors.onPrimaryContainer 
                  : theme.colors.onSurface,
              },
            ]}>
              {category.name}
            </Text>
            {category.description && (
              <Text style={[
                styles.categoryDescription,
                {
                  color: selectedCategory === category.id 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onSurfaceVariant,
                },
              ]}>
                {category.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
};

const categoryStyles = StyleSheet.create({
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
});
