import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { createButtonStyle, createTextStyle } from '../../theme/styles';

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyle = createButtonStyle(variant, size);
  
  const getTextColor = () => {
    if (variant === 'primary') return tokens.colors.text.inverse;
    if (variant === 'outline') return tokens.colors.primary;
    return tokens.colors.text.primary;
  };
  
  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={tokens.opacity.active}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size="small"
        />
      ) : (
        <Text
          style={[
            createTextStyle('body', 'primary', 'semibold'),
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});

export default Button;
