import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface BackgroundPatternProps {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'cream';
  intensity?: 'light' | 'medium' | 'subtle';
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
  children,
  variant = 'default',
  intensity = 'subtle'
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'warm':
        return [theme.colors.flour, theme.colors.primary[50]];
      case 'cream':
        return [theme.colors.cream, theme.colors.tertiary[50]];
      default:
        return [theme.colors.background, theme.colors.primary[50]];
    }
  };

  const getPatternOpacity = () => {
    switch (intensity) {
      case 'light':
        return 0.05;
      case 'medium':
        return 0.08;
      default:
        return 0.03;
    }
  };

  // Criar padrão de pãezinhos
  const createBreadPattern = () => {
    const breadEmojis = ['🥖', '🥐', '🍞', '🥯', '🥨'];
    const pattern = [];
    const rows = Math.ceil(height / 120);
    const cols = Math.ceil(width / 120);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const emoji = breadEmojis[Math.floor(Math.random() * breadEmojis.length)];
        const rotation = Math.random() * 360;
        const scale = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
        
        pattern.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.breadIcon,
              {
                left: col * 120 + (Math.random() - 0.5) * 40,
                top: row * 120 + (Math.random() - 0.5) * 40,
                transform: [
                  { rotate: `${rotation}deg` },
                  { scale: scale }
                ],
                opacity: getPatternOpacity(),
              }
            ]}
          >
            <View style={styles.breadEmoji}>
              {/* Usando uma view com background color em vez de emoji para melhor performance */}
              <View style={[
                styles.breadShape,
                { 
                  backgroundColor: theme.colors.primary[300],
                  transform: [{ rotate: `${rotation * 0.5}deg` }]
                }
              ]} />
            </View>
          </View>
        );
      }
    }
    return pattern;
  };

  return (
    <View style={styles.container}>
      {/* Gradiente de fundo */}
      <LinearGradient
        colors={getGradientColors() as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Padrão de pãezinhos */}
      <View style={styles.patternContainer}>
        {createBreadPattern()}
      </View>
      
      {/* Overlay sutil para suavizar o padrão */}
      <View style={[styles.overlay, { backgroundColor: getGradientColors()[0] }]} />
      
      {/* Conteúdo */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  breadIcon: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadEmoji: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadShape: {
    width: 16,
    height: 8,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});

export default BackgroundPattern; 