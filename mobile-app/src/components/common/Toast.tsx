import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { ToastType, ToastPosition } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');

interface ToastProps {
  type: ToastType;
  message: string;
  position: ToastPosition;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, position, onHide }) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(position === 'top' ? -50 : 50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: tokens.animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: tokens.animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return tokens.colors.semantic.success;
      case 'error': return tokens.colors.semantic.error;
      case 'warning': return tokens.colors.semantic.warning;
      case 'info': return tokens.colors.semantic.info;
    }
  };

  const positionStyle = {
    top: { top: 60 },
    center: { top: '50%', marginTop: -25 },
    bottom: { bottom: 100 },
  }[position];

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.toast, { borderLeftColor: getColor() }]}>
        <MaterialIcons name={getIcon()} size={20} color={getColor()} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
    borderLeftWidth: 4,
    maxWidth: width - tokens.spacing.md * 2,
    ...tokens.shadows.lg,
  },
  message: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.primary,
    flex: 1,
  },
});

export default Toast;
