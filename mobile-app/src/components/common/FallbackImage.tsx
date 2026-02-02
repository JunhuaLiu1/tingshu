import React, { useState, useCallback } from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { buildImageProxyUrl } from '../../hooks/useHomeData';
import { tokens } from '../../theme/tokens';

interface FallbackImageProps {
    uri: string;
    proxyUri?: string;
    sourceId?: string;
    style: ImageStyle;
    containerStyle?: ViewStyle;
    placeholder?: 'book' | 'avatar';
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

type LoadState = 'loading' | 'direct' | 'proxy' | 'fallback';

/**
 * 带回退逻辑的图片组件
 * 加载顺序：直连 URL -> 代理 URL -> 本地占位图
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
    uri,
    proxyUri,
    sourceId,
    style,
    containerStyle,
    placeholder = 'book',
    resizeMode = 'cover',
}) => {
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [currentUri, setCurrentUri] = useState<string>(uri);

    // 获取代理 URL
    const getProxyUrl = useCallback((): string | null => {
        if (proxyUri) return proxyUri;
        if (sourceId && uri) return buildImageProxyUrl(sourceId, uri);
        return null;
    }, [proxyUri, sourceId, uri]);

    // 处理图片加载错误
    const handleError = useCallback(() => {
        if (loadState === 'loading' || loadState === 'direct') {
            // 直连失败，尝试代理
            const proxy = getProxyUrl();
            if (proxy) {
                console.log(`[FallbackImage] Direct load failed, trying proxy: ${proxy.substring(0, 80)}...`);
                setCurrentUri(proxy);
                setLoadState('proxy');
                return;
            }
        }

        // 代理也失败，显示占位图
        console.log(`[FallbackImage] All attempts failed, showing placeholder`);
        setLoadState('fallback');
    }, [loadState, getProxyUrl]);

    // 处理图片加载成功
    const handleLoad = useCallback(() => {
        if (loadState === 'loading') {
            setLoadState('direct');
        }
    }, [loadState]);

    // 渲染占位图
    if (loadState === 'fallback' || !uri) {
        return (
            <View style={[styles.placeholder, style, containerStyle]}>
                <MaterialIcons
                    name={placeholder === 'avatar' ? 'person' : 'menu-book'}
                    size={Math.min(Number(style.width) || 48, Number(style.height) || 48) * 0.4}
                    color={tokens.colors.text.tertiary}
                />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: currentUri }}
            style={style}
            resizeMode={resizeMode}
            onError={handleError}
            onLoad={handleLoad}
        />
    );
};

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: tokens.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: tokens.colors.border.light,
    },
});

export default FallbackImage;
