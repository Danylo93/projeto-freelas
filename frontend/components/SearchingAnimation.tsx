import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../src/providers/ThemeProvider';

interface SearchingAnimationProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export const SearchingAnimation: React.FC<SearchingAnimationProps> = ({
  isVisible,
  message = 'Procurando prestadores...',
  onComplete
}) => {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, scaleAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <LottieView
          source={require('../assets/animations/searching.json')}
          autoPlay
          loop
          style={styles.animation}
          onAnimationFinish={onComplete}
        />
        <Text style={[styles.message, { color: theme.colors.onSurface }]}>
          {message}
        </Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
          <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
          <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  animation: {
    width: 120,
    height: 120,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});