import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../utils/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  animationType?: 'scale' | 'opacity' | 'both';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  gradient = false,
  style,
  textStyle,
  hapticFeedback = true,
  animationType = 'both',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (animationType === 'scale' || animationType === 'both') {
      scale.value = withSpring(0.95);
    }
    if (animationType === 'opacity' || animationType === 'both') {
      opacity.value = withTiming(0.8, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (animationType === 'scale' || animationType === 'both') {
      scale.value = withSpring(1);
    }
    if (animationType === 'opacity' || animationType === 'both') {
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (hapticFeedback && !isDisabled) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[500],
      },
      secondary: {
        backgroundColor: colors.secondary[500],
        borderColor: colors.secondary[500],
      },
      tertiary: {
        backgroundColor: 'transparent',
        borderColor: colors.primary[500],
        borderWidth: 2,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.error[500],
        borderColor: colors.error[500],
      },
      success: {
        backgroundColor: colors.success[500],
        borderColor: colors.success[500],
      },
    };

    return variants[variant];
  };

  const getTextColor = () => {
    if (variant === 'tertiary' || variant === 'ghost') {
      return colors.primary[500];
    }
    return colors.neutral[0];
  };

  const getSizeStyles = () => {
    const sizes = {
      xs: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        fontSize: typography.fontSizes.xs,
        iconSize: 14,
      },
      sm: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        fontSize: typography.fontSizes.sm,
        iconSize: 16,
      },
      md: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: typography.fontSizes.base,
        iconSize: 18,
      },
      lg: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        fontSize: typography.fontSizes.lg,
        iconSize: 20,
      },
      xl: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[5],
        fontSize: typography.fontSizes.xl,
        iconSize: 24,
      },
    };

    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();

  const buttonContent = (
    <View style={styles.content}>
      {leftIcon && !isLoading && (
        <Ionicons
          name={leftIcon}
          size={sizeStyles.iconSize}
          color={textColor}
          style={[styles.leftIcon, { marginRight: spacing[2] }]}
        />
      )}
      
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={{ marginRight: leftIcon || rightIcon ? spacing[2] : 0 }}
        />
      ) : null}
      
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: sizeStyles.fontSize,
            fontWeight: typography.fontWeights.semibold as any,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
      
      {rightIcon && !isLoading && (
        <Ionicons
          name={rightIcon}
          size={sizeStyles.iconSize}
          color={textColor}
          style={[styles.rightIcon, { marginLeft: spacing[2] }]}
        />
      )}
    </View>
  );

  const buttonStyle = [
    styles.button,
    variantStyles,
    {
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      width: fullWidth ? '100%' as any : 'auto',
      opacity: isDisabled ? 0.5 : 1,
    },
    shadows.base,
    style,
  ] as any;

  if (gradient && (variant === 'primary' || variant === 'secondary')) {
    const gradientColors = variant === 'primary' 
      ? colors.gradients.primary 
      : colors.gradients.secondary;

    return (
      <AnimatedTouchableOpacity
        style={animatedStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled || isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[buttonStyle, { backgroundColor: 'transparent' }]}
        >
          {buttonContent}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      style={[animatedStyle, buttonStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.8}
    >
      {buttonContent}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
  },
  leftIcon: {},
  rightIcon: {},
});

export default Button; 