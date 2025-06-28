import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, radii, shadows } from '../../utils/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: string[];
  blur?: boolean;
  blurIntensity?: number;
  animateOnPress?: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onPress,
  style,
  gradient = false,
  gradientColors,
  blur = false,
  blurIntensity = 10,
  animateOnPress = true,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (animateOnPress && onPress && !disabled) {
      scale.value = withSpring(0.98);
      opacity.value = withTiming(0.9, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (animateOnPress && onPress && !disabled) {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getVariantStyles = () => {
    const variants = {
      default: {
        backgroundColor: colors.neutral[0],
        borderWidth: 0,
        ...shadows.base,
      },
      elevated: {
        backgroundColor: colors.neutral[0],
        borderWidth: 0,
        ...shadows.lg,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.neutral[200],
        ...shadows.sm,
      },
      filled: {
        backgroundColor: colors.neutral[50],
        borderWidth: 0,
        ...shadows.base,
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        ...shadows.md,
      },
    };

    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        padding: spacing[3],
        borderRadius: radii.md,
      },
      md: {
        padding: spacing[4],
        borderRadius: radii.lg,
      },
      lg: {
        padding: spacing[6],
        borderRadius: radii.xl,
      },
    };

    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const cardStyle = [
    styles.card,
    variantStyles,
    sizeStyles,
    {
      opacity: disabled ? 0.5 : 1,
    },
    style,
  ] as any;

  const CardContent = () => (
    <View style={styles.content}>
      {React.isValidElement(children) || typeof children === 'string' || typeof children === 'number' 
        ? children 
        : React.Children.toArray(children)}
    </View>
  );

  if (blur && variant === 'glass') {
    const content = (
      <BlurView
        intensity={blurIntensity}
        style={cardStyle}
        tint="light"
      >
        <CardContent />
      </BlurView>
    );

    if (onPress) {
      return (
        <AnimatedTouchableOpacity
          style={animatedStyle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.9}
        >
          {content}
        </AnimatedTouchableOpacity>
      );
    }

    return <Animated.View style={animatedStyle}>{content}</Animated.View>;
  }

  if (gradient && gradientColors) {
    const content = (
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyle, { backgroundColor: 'transparent' }]}
      >
        <CardContent />
      </LinearGradient>
    );

    if (onPress) {
      return (
        <AnimatedTouchableOpacity
          style={animatedStyle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.9}
        >
          {content}
        </AnimatedTouchableOpacity>
      );
    }

    return <Animated.View style={animatedStyle}>{content}</Animated.View>;
  }

  if (onPress) {
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, cardStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <CardContent />
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <Animated.View style={[animatedStyle, cardStyle]}>
      <CardContent />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});

export default Card; 