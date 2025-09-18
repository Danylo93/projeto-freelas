import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SmartLoadingAnimationProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  style?: any;
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  progress?: number;
  showProgress?: boolean;
  estimatedTime?: number;
  tips?: string[];
  context?: 'location' | 'api' | 'upload' | 'general';
}

export const SmartLoadingAnimation: React.FC<SmartLoadingAnimationProps> = ({
  size = 'medium',
  color = '#007AFF',
  text,
  style,
  type = 'spinner',
  progress = 0,
  showProgress = false,
  estimatedTime,
  tips = [],
  context = 'general',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  
  const [currentTip, setCurrentTip] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Dicas contextuais baseadas no tipo de operação
  const getContextualTips = (): string[] => {
    if (tips.length > 0) return tips;
    
    switch (context) {
      case 'location':
        return [
          'Obtendo sua localização...',
          'Verificando GPS...',
          'Calculando posição precisa...',
        ];
      case 'api':
        return [
          'Conectando ao servidor...',
          'Processando dados...',
          'Quase pronto...',
        ];
      case 'upload':
        return [
          'Enviando arquivo...',
          'Processando upload...',
          'Finalizando envio...',
        ];
      default:
        return [
          'Carregando...',
          'Processando...',
          'Aguarde um momento...',
        ];
    }
  };

  useEffect(() => {
    let animations: Animated.CompositeAnimation[] = [];

    switch (type) {
      case 'spinner':
        animations.push(
          Animated.loop(
            Animated.timing(spinValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          )
        );
        break;

      case 'pulse':
        animations.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          )
        );
        break;

      case 'dots':
        animations.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(fadeValue, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(fadeValue, {
                toValue: 0.3,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          )
        );
        break;

      case 'skeleton':
        animations.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(fadeValue, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(fadeValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          )
        );
        break;
    }

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [type, spinValue, scaleValue, fadeValue]);

  // Atualizar progresso
  useEffect(() => {
    if (type === 'progress') {
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, type, progressValue]);

  // Timer para dicas e tempo estimado
  useEffect(() => {
    const contextualTips = getContextualTips();
    if (contextualTips.length === 0 && !estimatedTime) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      if (contextualTips.length > 0) {
        setCurrentTip(prev => (prev + 1) % contextualTips.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [context, tips, estimatedTime]);

  const getSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const renderSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.spinner,
          {
            width: getSize(),
            height: getSize(),
            borderColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                opacity: fadeValue,
                transform: [
                  {
                    scale: fadeValue.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPulse = () => {
    return (
      <Animated.View
        style={[
          styles.pulse,
          {
            width: getSize(),
            height: getSize(),
            backgroundColor: color,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />
    );
  };

  const renderProgress = () => {
    const screenWidth = Dimensions.get('window').width;
    const progressWidth = screenWidth * 0.8;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: progressWidth }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
                width: progressValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, progressWidth],
                }),
              },
            ]}
          />
        </View>
        {showProgress && (
          <Text style={[styles.progressText, { color }]}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    );
  };

  const renderSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        <Animated.View
          style={[
            styles.skeletonLine,
            { opacity: fadeValue, backgroundColor: color + '20' },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonLineShort,
            { opacity: fadeValue, backgroundColor: color + '20' },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonLineMedium,
            { opacity: fadeValue, backgroundColor: color + '20' },
          ]}
        />
      </View>
    );
  };

  const renderLoadingContent = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const getEstimatedTimeText = () => {
    if (!estimatedTime) return null;
    
    const remaining = Math.max(0, estimatedTime - elapsedTime);
    if (remaining === 0) return 'Quase pronto...';
    
    return `Tempo estimado: ${remaining}s`;
  };

  const contextualTips = getContextualTips();

  return (
    <View style={[styles.container, style]}>
      {renderLoadingContent()}
      
      {text && (
        <Text style={[styles.text, { color }]}>{text}</Text>
      )}
      
      {contextualTips.length > 0 && (
        <Text style={[styles.tip, { color: color + '80' }]}>
          {contextualTips[currentTip]}
        </Text>
      )}
      
      {estimatedTime && (
        <Text style={[styles.timeText, { color: color + '60' }]}>
          {getEstimatedTimeText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 50,
    borderTopColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pulse: {
    borderRadius: 50,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginVertical: 4,
    width: '100%',
  },
  skeletonLineShort: {
    width: '60%',
  },
  skeletonLineMedium: {
    width: '80%',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tip: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
});
