# ProfileScreen 修复实施计划

## 总体目标
将 ProfileScreen 从 **60分** 提升到 **90分**，移除所有硬编码，添加真实数据和功能。

---

## 阶段一：核心 Hook 开发 (Day 1 上午)

### 任务 1: 创建 useUserProfile Hook
**目标**: 管理用户数据和统计数据

**功能**:
```typescript
interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  booksPlayed: number;      // 已听书籍
  totalHours: number;       // 总时长(小时)
  favorites: number;        // 收藏数量
  downloads: number;        // 下载数量
  messages: number;         // 新消息数
  cacheSize: string;        // 缓存大小
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}
```

**实现要点**:
- 从 AsyncStorage 加载用户数据
- 模拟 API 调用获取统计数据
- 使用 `useCallback` 优化性能
- 错误处理机制

**文件**: `mobile-app/src/hooks/useUserProfile.ts`

---

### 任务 2: 创建 useAppSettings Hook
**目标**: 管理应用设置并持久化

**功能**:
```typescript
interface AppSettings {
  notifications: boolean;
  autoPlay: boolean;
  downloadOnlyWifi: boolean;
}

interface UseAppSettingsReturn {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}
```

**实现要点**:
- 使用 AsyncStorage 持久化设置
- 提供更新和重置方法
- 自动保存到存储
- 使用 `useCallback` 优化

**文件**: `mobile-app/src/hooks/useAppSettings.ts`

---

### 任务 3: 创建版本号工具函数
**目标**: 动态获取应用版本

**实现**:
```typescript
import Constants from 'expo-constants';

export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};
```

**文件**: `mobile-app/src/utils/appVersion.ts`

---

## 阶段二：ProfileScreen 重构 (Day 1 下午)

### 任务 4: 移除无用导入和代码
**目标**: 清理代码

**操作**:
- 删除 `import {useRouter} from 'expo-router';`
- 删除未使用的 `useState` 导入（如果重构后不需要）
- 清理注释掉的代码

---

### 任务 5: 集成 useUserProfile Hook
**目标**: 使用真实用户数据

**实现**:
```typescript
const {
  profile,
  stats,
  isLoading,
  error,
  loadProfile
} = useUserProfile();

// 组件挂载时加载
useEffect(() => {
  loadProfile();
}, [loadProfile]);
```

**更新渲染**:
- 将硬编码的统计数据替换为 `stats` 对象
- 将用户信息替换为 `profile` 对象
- 处理加载状态
- 处理错误状态

---

### 任务 6: 集成 useAppSettings Hook
**目标**: 持久化设置

**实现**:
```typescript
const {
  settings,
  updateSettings
} = useAppSettings();

// Switch 组件更新
<Switch
  value={settings.autoPlay}
  onValueChange={(value) => updateSettings({ autoPlay: value })}
/>
```

**更新所有 Switch**:
- 自动播放下一集
- 仅WiFi下下载
- 推送通知

---

### 任务 7: 添加导航跳转功能
**目标**: 让菜单项可点击

**实现导航**:
```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const navigation = useNavigation<NavigationProp>();

// 菜单项示例
{renderMenuItem('person', '编辑资料', user.username, () => {
  navigation.navigate('ProfileEdit');
})}

{renderMenuItem('favorite', '我的收藏', `${stats?.favorites}本书籍`, () => {
  navigation.navigate('Favorites');
})}

{renderMenuItem('download', '下载管理', `${stats?.downloads}个文件`, () => {
  navigation.navigate('Downloads');
})}

{renderMenuItem('feedback', '意见反馈', undefined, () => {
  navigation.navigate('Feedback');
})}

{renderMenuItem('help', '帮助与支持', undefined, () => {
  navigation.navigate('Help');
})}
```

**需要添加的导航页面** (可选，如果不存在):
- ProfileEdit
- Favorites
- Downloads
- Feedback
- Help

---

### 任务 8: 添加下拉刷新功能
**目标**: 手动刷新数据

**实现**:
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await loadProfile();
    showToast({ type: 'success', message: '已刷新' });
  } catch (err) {
    showToast({ type: 'error', message: '刷新失败' });
  } finally {
    setRefreshing(false);
  }
}, [loadProfile, showToast]);

// 在 ScrollView 中添加
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[tokens.colors.primary]}
      tintColor={tokens.colors.primary}
    />
  }
>
```

---

### 任务 9: 添加加载和错误状态
**目标**: 处理边界情况

**实现**:
```typescript
if (isLoading) {
  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    </SafeAreaView>
  );
}

if (error) {
  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <EmptyState
        icon="error-outline"
        title="加载失败"
        subtitle={error}
        actionText="重试"
        onActionPress={loadProfile}
      />
    </SafeAreaView>
  );
}

if (!profile) {
  return (
    <SafeAreaView style={layoutStyles.safeArea}>
      <EmptyState
        icon="person-outline"
        title="未登录"
        subtitle="请先登录以查看个人中心"
        actionText="去登录"
        onActionPress={() => navigation.navigate('Login')}
      />
    </SafeAreaView>
  );
}
```

---

### 任务 10: 性能优化
**目标**: 优化渲染性能

**使用 useCallback**:
```typescript
const handleLogout = useCallback(() => {
  // ...
}, [showToast]);

const handleClearCache = useCallback(() => {
  // ...
}, [showToast]);

const handleMenuPress = useCallback((screen: string) => {
  navigation.navigate(screen as any);
}, [navigation]);
```

**使用 useMemo**:
```typescript
const profileHeader = useMemo(() => renderProfileHeader(), [profile]);
const statsSection = useMemo(() => renderStatsSection(), [stats]);
```

---

### 任务 11: 更新版本号显示
**目标**: 动态显示版本

**实现**:
```typescript
import { getAppVersion } from '../utils/appVersion';

{renderMenuItem('info', '关于我们', `版本 ${getAppVersion()}`)}
```

---

### 任务 12: 优化 UI 细节
**目标**: 提升用户体验

**改进**:
- 添加加载时的骨架屏效果
- 优化空状态的视觉设计
- 添加头像点击事件（查看大图或编辑）
- 优化统计数字的动画效果
- 添加菜单项的长按提示

---

### 任务 13: 添加类型安全
**目标**: 完善 TypeScript 类型

**定义导航参数**:
```typescript
// 在 types/index.ts 中添加
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  Favorites: undefined;
  Downloads: undefined;
  Feedback: undefined;
  Help: undefined;
};
```

---

## 阶段三：测试和验证 (Day 2 上午)

### 任务 14: 单元测试
**目标**: 验证 Hook 功能

**测试内容**:
- useUserProfile Hook
  - 加载用户数据
  - 错误处理
  - 更新用户数据
- useAppSettings Hook
  - 持久化设置
  - 更新设置
  - 重置设置

---

### 任务 15: 集成测试
**目标**: 验证完整流程

**测试场景**:
1. 首次进入个人中心（加载状态）
2. 数据加载成功（正常显示）
3. 数据加载失败（错误状态）
4. 下拉刷新
5. 修改设置（重启应用验证持久化）
6. 点击菜单项（导航跳转）
7. 退出登录（确认弹窗）
8. 清除缓存（确认弹窗）

---

### 任务 16: 边界测试
**目标**: 验证异常情况

**测试**:
- 未登录状态
- 网络错误
- AsyncStorage 访问失败
- 快速连续点击

---

## 阶段四：文档和提交 (Day 2 下午)

### 任务 17: 更新文档
**目标**: 完善项目文档

**内容**:
- 更新 README
- 添加 Hook 使用说明
- 添加 API 文档

---

### 任务 18: Git 提交
**目标**: 版本控制

**提交信息**:
```
feat: 重构 ProfileScreen - 移除硬编码，添加真实数据和功能

主要改进:
- 创建 useUserProfile Hook 管理用户数据和统计
- 创建 useAppSettings Hook 持久化应用设置
- 添加导航跳转功能（收藏、下载、反馈等）
- 添加下拉刷新和错误处理
- 优化性能（useCallback, useMemo）
- 动态显示版本号

修复问题:
- ✅ 移除未使用的 useRouter 导入
- ✅ 解决所有硬编码数据问题
- ✅ 菜单项添加实际功能
- ✅ 设置持久化存储
- ✅ 添加加载和错误状态
- ✅ 性能优化

质量提升: 60 → 90 分
```

---

## 预期成果

### 代码质量
- ✅ 无硬编码数据
- ✅ 完整的 TypeScript 类型
- ✅ 性能优化
- ✅ 错误处理完善

### 功能完整性
- ✅ 真实用户数据展示
- ✅ 持久化设置
- ✅ 导航跳转
- ✅ 下拉刷新
- ✅ 加载/错误状态

### 用户体验
- ✅ 数据实时更新
- ✅ 操作有反馈
- ✅ 边界情况处理
- ✅ 流畅的交互

---

## 时间估算

| 阶段 | 任务 | 时间 |
|------|------|------|
| 阶段一 | Hook 开发 | 3 小时 |
| 阶段二 | Screen 重构 | 4 小时 |
| 阶段三 | 测试验证 | 2 小时 |
| 阶段四 | 文档提交 | 1 小时 |
| **总计** | | **10 小时** |

**建议**: 分 2 天完成，第一天完成开发，第二天测试和优化。
