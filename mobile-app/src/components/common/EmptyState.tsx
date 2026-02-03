import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { createTextStyle } from '../../theme/styles';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  onActionPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  onActionPress,
}) => {
  const actionHandler = onActionPress ?? onAction;

  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={64} color={tokens.colors.border.default} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionText && actionHandler && (
        <TouchableOpacity
          style={styles.button}
          onPress={actionHandler}
          activeOpacity={tokens.opacity.active}
        >
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  title: {
    ...createTextStyle('h3', 'primary', 'semibold'),
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    ...createTextStyle('caption', 'secondary', 'regular'),
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  button: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
  },
  buttonText: {
    ...createTextStyle('body', 'inverse', 'semibold'),
  },
});

export default EmptyState;
