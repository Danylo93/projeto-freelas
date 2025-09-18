import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LoadingAnimationProps {
  size?: number;
  color?: string;
  type?: 'pulse' | 'spin' | 'wave' | 'dots';
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 40,
  color = '#007AFF',
  type = 'pulse',
}) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation;

    switch (type) {
      case 'pulse':
        animationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'spin':
        animationLoop = Animated.loop(
          Animated.timing(animation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        );
        break;

      case 'wave':
        animationLoop = Animated.loop(
          Animated.timing(animation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        );
        break;

      case 'dots':
        animationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        break;
    }

    animationLoop.start();

    return () => animationLoop.stop();
  }, [type]);

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulseContainer,
        {
          width: size,
          height: size,
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
          opacity: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.3],
          }),
        },
      ]}
    >
      <View
        style={[
          styles.pulseCircle,
          {
            backgroundColor: color,
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
          },
        ]}
      />
    </Animated.View>
  );

  const renderSpin = () => (
    <Animated.View
      style={[
        styles.spinContainer,
        {
          width: size,
          height: size,
          transform: [
            {
              rotate: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="refresh" size={size} color={color} />
    </Animated.View>
  );

  const renderWave = () => (
    <View style={styles.waveContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveDot,
            {
              backgroundColor: color,
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size * 0.1,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -size * 0.3, 0],
                  }),
                },
              ],
              opacity: animation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            },
          ]}
        />
      ))}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              width: size * 0.15,
              height: size * 0.15,
              borderRadius: size * 0.075,
              opacity: animation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: index === 0 ? [1, 0.3, 1] : index === 1 ? [0.3, 1, 0.3] : [1, 0.3, 1],
              }),
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: index === 1 ? [1, 1.3, 1] : [1, 1, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderAnimation = () => {
    switch (type) {
      case 'pulse':
        return renderPulse();
      case 'spin':
        return renderSpin();
      case 'wave':
        return renderWave();
      case 'dots':
        return renderDots();
      default:
        return renderPulse();
    }
  };

  return <View style={styles.container}>{renderAnimation()}</View>;
};

// Componente de loading para tela cheia
interface FullScreenLoadingProps {
  message?: string;
  type?: 'pulse' | 'spin' | 'wave' | 'dots';
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Carregando...',
  type = 'pulse',
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.fullScreenContainer, { opacity: fadeAnimation }]}>
      <LoadingAnimation size={60} type={type} />
      <Text style={styles.loadingMessage}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    // Styles applied dynamically
  },
  spinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveDot: {
    // Styles applied dynamically
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    // Styles applied dynamically
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMessage: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 20,
    textAlign: 'center',
  },
});
