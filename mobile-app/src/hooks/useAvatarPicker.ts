import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { useUserProfile } from './useUserProfile';
import { useToast } from '../contexts/ToastContext';

interface UseAvatarPickerReturn {
    isLoading: boolean;
    pickAvatar: () => void;
}

/**
 * 头像选择 Hook
 * 封装图片选择、压缩、更新逻辑
 */
export const useAvatarPicker = (): UseAvatarPickerReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const { updateProfile } = useUserProfile();
    const { showToast } = useToast();

    // 请求相机权限
    const requestCameraPermission = useCallback(async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('权限不足', '需要相机权限才能拍照上传头像');
            return false;
        }
        return true;
    }, []);

    // 请求相册权限
    const requestMediaLibraryPermission = useCallback(async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('权限不足', '需要相册权限才能选择头像');
            return false;
        }
        return true;
    }, []);

    // 处理选择的图片
    const handleImageResult = useCallback(async (result: ImagePicker.ImagePickerResult) => {
        if (result.canceled || !result.assets || result.assets.length === 0) {
            return;
        }

        const asset = result.assets[0];

        try {
            setIsLoading(true);

            // 直接使用图片 URI（本地文件路径）
            // 注意：这里使用的是本地 URI，重启 App 后可能失效
            // 如果需要持久化，可以使用 expo-file-system 复制到应用目录
            // 或者使用 base64 编码存储（但会增加存储大小）

            await updateProfile({ avatar: asset.uri });
            showToast({ type: 'success', message: '头像更新成功' });
        } catch (error) {
            console.error('Failed to update avatar:', error);
            showToast({ type: 'error', message: '头像更新失败' });
        } finally {
            setIsLoading(false);
        }
    }, [updateProfile, showToast]);

    // 从相册选择
    const pickFromLibrary = useCallback(async () => {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        await handleImageResult(result);
    }, [requestMediaLibraryPermission, handleImageResult]);

    // 从相机拍摄
    const pickFromCamera = useCallback(async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        await handleImageResult(result);
    }, [requestCameraPermission, handleImageResult]);

    // 显示选择器
    const pickAvatar = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['取消', '拍照', '从相册选择'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        pickFromCamera();
                    } else if (buttonIndex === 2) {
                        pickFromLibrary();
                    }
                }
            );
        } else {
            // Android 使用 Alert
            Alert.alert(
                '更换头像',
                '请选择图片来源',
                [
                    { text: '取消', style: 'cancel' },
                    { text: '拍照', onPress: pickFromCamera },
                    { text: '从相册选择', onPress: pickFromLibrary },
                ]
            );
        }
    }, [pickFromCamera, pickFromLibrary]);

    return {
        isLoading,
        pickAvatar,
    };
};
