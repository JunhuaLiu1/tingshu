import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

interface CachedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  showPlaceholder?: boolean;
}

const CachedImage: React.FC<CachedImageProps> = ({
  style,
  showPlaceholder = true,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {!error && (
        <Image
          {...props}
          style={[styles.image, style]}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {loading && showPlaceholder && (
        <View style={[styles.placeholder, style]}>
          <ActivityIndicator size="small" color={tokens.colors.primary} />
        </View>
      )}
      
      {error && (
        <View style={[styles.errorPlaceholder, style]}>
          <MaterialIcons
            name="broken-image"
            size={32}
            color={tokens.colors.text.tertiary}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
});

export default CachedImage;
