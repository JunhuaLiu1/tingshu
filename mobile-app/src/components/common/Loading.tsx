import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { tokens } from '../../theme/tokens';

interface LoadingProps {
  visible: boolean;
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  visible,
  text = '加载中...',
  fullScreen = true,
}) => {
  const content = (
    <View style={fullScreen ? styles.fullScreenContainer : styles.inlineContainer}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        {content}
      </Modal>
    );
  }

  return visible ? content : null;
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.overlay,
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  loadingBox: {
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    minWidth: 120,
    ...tokens.shadows.lg,
  },
  text: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
});

export default Loading;
