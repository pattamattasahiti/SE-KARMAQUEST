import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case 'large':
        return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZES.sm;
      case 'large':
        return FONT_SIZES.lg;
      default:
        return FONT_SIZES.md;
    }
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[fullWidth && { width: '100%' }]}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            getSizeStyles(),
            disabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <>
              {icon}
              <Text style={[styles.primaryText, { fontSize: getTextSize() }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getSizeStyles(),
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'text' && styles.textButton,
        disabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'text' ? COLORS.primary : COLORS.surface} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              variant === 'secondary' && styles.secondaryText,
              variant === 'outline' && styles.outlineText,
              variant === 'text' && styles.textButtonText,
              { fontSize: getTextSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryText: {
    color: COLORS.surface,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  secondaryText: {
    color: COLORS.surface,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  textButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
