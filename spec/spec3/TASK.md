# HistoryScreen 修复任务清单

## 📋 执行清单

**项目**: HistoryScreen 播放历史页面
**总任务数**: 13 个
**预计耗时**: 2.5 人/天
**执行顺序**: 按优先级顺序执行

---

## ✅ 阶段一：核心功能修复 (P0) - 0.8 天

### 任务 1.1：创建 usePlayHistory Hook ⭐
**优先级**: 🔴 P0
**预计时间**: 0.3 天
**依赖**: 无

#### 步骤清单
- [ ] 1.1.1 创建文件 `mobile-app/src/hooks/usePlayHistory.ts`
- [ ] 1.1.2 定义数据类型 `PlayHistoryItem`
- [ ] 1.1.3 定义 AsyncStorage 键名
- [ ] 1.1.4 实现 `loadHistory()` - 加载历史
- [ ] 1.1.5 实现 `saveHistory(item)` - 保存记录
- [ ] 1.1.6 实现 `removeHistory(id)` - 删除单条
- [ ] 1.1.7 实现 `clearHistory()` - 清空全部
- [ ] 1.1.8 添加错误处理
- [ ] 1.1.9 导出 Hook 和类型

#### 代码模板
```typescript
// mobile-app/src/hooks/usePlayHistory.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_HISTORY_KEY = 'play_history';

export interface PlayHistoryItem {
  id: string;
  bookId: number;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;      // 0-100
  duration: number;      // 秒
  lastPlayed: Date;
  episodeId?: number;
}

export const usePlayHistory = () => {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: 实现各函数
};

export default usePlayHistory;
```

#### 验收标准
- ✅ 类型定义完整且准确
- ✅ 所有 CRUD 操作正常
- ✅ AsyncStorage 集成正确
- ✅ 错误处理完善
- ✅ 使用 useCallback 优化性能

---

### 任务 1.2：集成导航和点击跳转
**优先级**: 🔴 P0
**预计时间**: 0.2 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 1.2.1 导入 `useNavigation`
- [ ] 1.2.2 导入导航类型
- [ ] 1.2.3 定义 `NavigationProp` 类型
- [ ] 1.2.4 获取 navigation 实例
- [ ] 1.2.5 修改 `renderHistoryItem` 添加 onPress
- [ ] 1.2.6 传递正确参数（bookId, episodeId, progress）
- [ ] 1.2.7 使用 useCallback 优化

#### 代码模板
```typescript
// 在 HistoryScreen.tsx 中
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const navigation = useNavigation<NavigationProp>();

const renderHistoryItem = useCallback(({item}: {item: PlayHistoryItem}) => (
  <TouchableOpacity
    style={styles.historyItem}
    onPress={() => navigation.navigate('Player', {
      bookId: item.bookId,
      episodeId: item.episodeId,
      progress: item.progress
    })}
  >
    {/* ... */}
  </TouchableOpacity>
), [navigation]);
```

#### 验收标准
- ✅ 点击后跳转到 PlayerScreen
- ✅ 参数传递正确
- ✅ 导航类型安全
- ✅ 无重复渲染

---

### 任务 1.3：实现更多按钮功能
**优先级**: 🔴 P0
**预计时间**: 0.2 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 1.3.1 为更多按钮添加 onPress
- [ ] 1.3.2 实现 `handleMorePress` 函数
- [ ] 1.3.3 使用 Alert 弹出操作菜单
- [ ] 1.3.4 实现删除功能（调用 removeHistory）
- [ ] 1.3.5 添加删除确认对话框
- [ ] 1.3.6 集成 Toast 反馈
- [ ] 1.3.7 实现收藏功能（预留接口）

#### 代码模板
```typescript
const handleMorePress = (item: PlayHistoryItem) => {
  Alert.alert('操作', item.book.title, [
    {
      text: '删除记录',
      style: 'destructive',
      onPress: async () => {
        await removeHistory(item.id);
        showToast({ type: 'success', message: '已删除' });
      }
    },
    { text: '取消', style: 'cancel' }
  ]);
};

<TouchableOpacity
  style={styles.moreButton}
  onPress={() => handleMorePress(item)}
>
```

#### 验收标准
- ✅ 菜单正确弹出
- ✅ 删除功能正常
- ✅ Toast 反馈及时
- ✅ 确认对话框存在

---

### 任务 1.4：替换硬编码数据
**优先级**: 🔴 P0
**预计时间**: 0.1 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 1.4.1 导入 usePlayHistory Hook
- [ ] 1.4.2 移除硬编码的 useState 数据
- [ ] 1.4.3 使用 Hook 返回的 history
- [ ] 1.4.4 在 useEffect 中调用 loadHistory
- [ ] 1.4.5 处理加载状态
- [ ] 1.4.6 移除 mockData 导入

#### 代码模板
```typescript
// 移除
const [history, setHistory] = useState<PlayHistoryItem[]>([...]);

// 改为
const { history, isLoading, loadHistory } = usePlayHistory();

useEffect(() => {
  loadHistory();
}, [loadHistory]);
```

#### 验收标准
- ✅ 所有硬编码数据已移除
- ✅ 正确使用 usePlayHistory
- ✅ 数据加载逻辑正确

---

## ✅ 阶段二：功能完善 (P1) - 0.8 天

### 任务 2.1：添加下拉刷新
**优先级**: 🟡 P1
**预计时间**: 0.2 天
**依赖**: 任务 1.4

#### 步骤清单
- [ ] 2.1.1 添加 `refreshing` 状态
- [ ] 2.1.2 实现 `onRefresh` 回调
- [ ] 2.1.3 使用 useCallback 包装
- [ ] 2.1.4 集成到 FlatList
- [ ] 2.1.5 添加刷新成功提示
- [ ] 2.1.6 添加错误处理

#### 代码模板
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await loadHistory();
    showToast({ type: 'success', message: '已刷新' });
  } catch (error) {
    showToast({ type: 'error', message: '刷新失败' });
  } finally {
    setRefreshing(false);
  }
}, [loadHistory]);

<FlatList
  refreshing={refreshing}
  onRefresh={onRefresh}
/>
```

#### 验收标准
- ✅ 下拉触发刷新
- ✅ 加载状态显示
- ✅ 刷新后数据更新
- ✅ 错误处理完善

---

### 任务 2.2：优化空状态引导
**优先级**: 🟡 P1
**预计时间**: 0.2 天
**依赖**: 任务 1.2

#### 步骤清单
- [ ] 2.2.1 为 EmptyState 添加 actionText
- [ ] 2.2.2 为 EmptyState 添加 onActionPress
- [ ] 2.2.3 点击后导航到 Search 页面
- [ ] 2.2.4 样式与 SearchScreen 保持一致

#### 代码模板
```typescript
<EmptyState
  icon="history"
  title="暂无播放历史"
  subtitle="开始听书后，播放记录将显示在这里"
  actionText="去搜索"
  onActionPress={() => navigation.navigate('Search')}
/>
```

#### 验收标准
- ✅ 按钮显示正常
- ✅ 点击后正确跳转
- ✅ 样式一致

---

### 任务 2.3：添加错误处理
**优先级**: 🟡 P1
**预计时间**: 0.2 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 2.3.1 添加 `error` 状态
- [ ] 2.3.2 在 loadHistory 中捕获错误
- [ ] 2.3.3 实现 `renderErrorState` 函数
- [ ] 2.3.4 错误时显示 EmptyState
- [ ] 2.3.5 提供重试按钮
- [ ] 2.3.6 集成 Toast 反馈

#### 代码模板
```typescript
const [error, setError] = useState<string | null>(null);

const loadHistory = async () => {
  try {
    setError(null);
    // ... 加载逻辑
  } catch (err) {
    const message = err instanceof Error ? err.message : '加载失败';
    setError(message);
    showToast({ type: 'error', message });
  }
};

const renderErrorState = () => (
  <EmptyState
    icon="error-outline"
    title="加载失败"
    subtitle={error || '请重试'}
    actionText="重试"
    onActionPress={loadHistory}
  />
);
```

#### 验收标准
- ✅ 错误状态显示正确
- ✅ 重试功能正常
- ✅ 错误信息清晰

---

### 任务 2.4：集成 Toast 反馈
**优先级**: 🟡 P1
**预计时间**: 0.1 天
**依赖**: 任务 1.1, 1.3, 2.1

#### 步骤清单
- [ ] 2.4.1 确认 useToast 已导入
- [ ] 2.4.2 删除操作后显示成功 Toast
- [ ] 2.4.3 清空操作后显示成功 Toast
- [ ] 2.4.4 刷新操作后显示成功 Toast
- [ ] 2.4.5 所有错误操作显示错误 Toast
- [ ] 2.4.6 消息内容清晰准确

#### 验收标准
- ✅ 删除成功提示
- ✅ 清空成功提示
- ✅ 刷新成功提示
- ✅ 错误提示

---

### 任务 2.5：添加性能优化
**优先级**: 🟡 P1
**预计时间**: 0.1 天
**依赖**: 任务 1.2, 1.3

#### 步骤清单
- [ ] 2.5.1 定义 `ITEM_HEIGHT` 常量
- [ ] 2.5.2 实现 `getItemLayout` 函数
- [ ] 2.5.3 使用 useCallback 包装 renderHistoryItem
- [ ] 2.5.4 使用 useCallback 包装 handleMorePress
- [ ] 2.5.5 配置 FlatList 性能参数
- [ ] 2.5.6 添加 removeClippedSubviews

#### 代码模板
```typescript
const ITEM_HEIGHT = 120;

const getItemLayout = useCallback((data: PlayHistoryItem[] | null, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);

const renderHistoryItem = useCallback(({item}: {item: PlayHistoryItem}) => (
  // ...
), [navigation, handleMorePress]);

<FlatList
  getItemLayout={getItemLayout}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

#### 验收标准
- ✅ 滚动流畅无卡顿
- ✅ 无重复渲染
- ✅ 内存占用合理

---

## ✅ 阶段三：体验优化 (P2) - 0.7 天

### 任务 3.1：添加列表头部统计
**优先级**: 🟢 P2
**预计时间**: 0.2 天
**依赖**: 任务 2.1

#### 步骤清单
- [ ] 3.1.1 实现 `renderListHeader` 函数
- [ ] 3.1.2 显示记录总数
- [ ] 3.1.3 显示最后更新时间
- [ ] 3.1.4 使用 useCallback 优化
- [ ] 3.1.5 集成到 FlatList
- [ ] 3.1.6 样式美化

#### 代码模板
```typescript
const renderListHeader = useCallback(() => (
  <View style={styles.listHeader}>
    <Text style={styles.resultCount}>
      共 {history.length} 条播放记录
    </Text>
  </View>
), [history.length]);

<FlatList
  ListHeaderComponent={renderListHeader}
/>
```

#### 验收标准
- ✅ 头部显示正常
- ✅ 数据准确
- ✅ 样式美观

---

### 任务 3.2：实现单条删除功能
**优先级**: 🟢 P2
**预计时间**: 0.3 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 3.2.1 为历史项添加 onLongPress
- [ ] 3.2.2 实现 `handleLongPress` 函数
- [ ] 3.2.3 弹出删除确认对话框
- [ ] 3.2.4 调用 removeHistory 删除单条
- [ ] 3.2.5 集成 Toast 反馈
- [ ] 3.2.6 更新 UI

#### 代码模板
```typescript
const handleLongPress = (item: PlayHistoryItem) => {
  Alert.alert('删除记录', `确定删除 "${item.title}" 吗？`, [
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        await removeHistory(item.id);
        showToast({ type: 'success', message: '已删除' });
      }
    },
    { text: '取消', style: 'cancel' }
  ]);
};

<TouchableOpacity
  onLongPress={() => handleLongPress(item)}
>
```

#### 验收标准
- ✅ 长按触发菜单
- ✅ 删除功能正常
- ✅ 确认对话框
- ✅ 数据及时更新

---

### 任务 3.3：添加排序功能
**优先级**: 🟢 P2
**预计时间**: 0.1 天
**依赖**: 任务 1.1

#### 步骤清单
- [ ] 3.3.1 添加 `sortBy` 状态
- [ ] 3.3.2 使用 useMemo 实现排序逻辑
- [ ] 3.3.3 支持按时间排序（默认）
- [ ] 3.3.4 支持按进度排序
- [ ] 3.3.5 支持按标题排序
- [ ] 3.3.6 使用 sortedHistory 渲染

#### 代码模板
```typescript
const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');

const sortedHistory = useMemo(() => {
  const sorted = [...history];
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());
    case 'progress':
      return sorted.sort((a, b) => b.progress - a.progress);
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}, [history, sortBy]);
```

#### 验收标准
- ✅ 排序逻辑正确
- ✅ 默认按时间倒序
- ✅ 使用 useMemo 优化

---

### 任务 3.4：小屏适配优化
**优先级**: 🟢 P2
**预计时间**: 0.1 天
**依赖**: 无

#### 步骤清单
- [ ] 3.4.1 检查 375px 屏幕显示
- [ ] 3.4.2 使用 gap 替代 marginBottom
- [ ] 3.4.3 优化间距
- [ ] 3.4.4 确保无内容溢出

#### 验收标准
- ✅ 375px 屏幕正常
- ✅ 无内容溢出
- ✅ 间距合理

---

## 📊 任务统计

### 按优先级
| 优先级 | 任务数 | 预计时间 |
|--------|--------|----------|
| 🔴 P0 | 4 | 0.8 天 |
| 🟡 P1 | 5 | 0.8 天 |
| 🟢 P2 | 4 | 0.7 天 |
| **总计** | **13** | **2.5 天** |

### 按阶段
| 阶段 | 任务数 | 预计时间 | 说明 |
|------|--------|----------|------|
| 核心功能 | 4 | 0.8 天 | 必须完成 |
| 功能完善 | 5 | 0.8 天 | 建议完成 |
| 体验优化 | 4 | 0.7 天 | 可选优化 |
| **总计** | **13** | **2.5 天** | - |

---

## 🎯 执行顺序建议

### 最佳实践
1. **按阶段执行** - 完成一个阶段再进入下一阶段
2. **按优先级** - P0 → P1 → P2
3. **验证后继续** - 每个任务完成后测试

### 推荐顺序
```
1.1 → 1.2 → 1.3 → 1.4 → (测试)
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → (测试)
3.1 → 3.2 → 3.3 → 3.4 → (最终测试)
```

---

## 📝 每日工作计划

### Day 1 上午 (0.5 天)
- [ ] 任务 1.1：创建 usePlayHistory Hook
- [ ] 任务 1.2：集成导航和点击跳转
- [ ] **测试点**: 能否正常跳转

### Day 1 下午 (0.5 天)
- [ ] 任务 1.3：实现更多按钮功能
- [ ] 任务 1.4：替换硬编码数据
- [ ] **测试点**: 数据是否真实

### Day 2 上午 (0.5 天)
- [ ] 任务 2.1：添加下拉刷新
- [ ] 任务 2.2：优化空状态引导
- [ ] 任务 2.3：添加错误处理
- [ ] **测试点**: 交互是否正常

### Day 2 下午 (0.5 天)
- [ ] 任务 2.4：集成 Toast 反馈
- [ ] 任务 2.5：添加性能优化
- [ ] 任务 3.1：添加列表头部统计
- [ ] **测试点**: 性能是否流畅

### Day 3 上午 (0.5 天)
- [ ] 任务 3.2：实现单条删除
- [ ] 任务 3.3：添加排序功能
- [ ] 任务 3.4：小屏适配优化
- [ ] **最终测试**: 全面验证

---

## ✅ 验收检查清单

### 功能完整性
- [ ] 能从 AsyncStorage 读取真实数据
- [ ] 点击历史项能跳转到播放器
- [ ] 更多按钮能删除/收藏
- [ ] 下拉刷新正常工作
- [ ] 空状态有引导按钮
- [ ] 错误时能重试
- [ ] 长按能删除单条
- [ ] 支持排序功能

### 代码质量
- [ ] 无硬编码数据
- [ ] 使用设计令牌
- [ ] 类型安全（TypeScript）
- [ ] 使用 useCallback 优化
- [ ] FlatList 性能优化
- [ ] 错误处理完整
- [ ] 代码风格一致

### 用户体验
- [ ] 所有操作有反馈（Toast）
- [ ] 小屏显示正常（375px）
- [ ] 加载状态清晰
- [ ] 交互响应及时
- [ ] 无卡顿现象

---

## 📋 交付物清单

### 代码文件
1. ✅ `mobile-app/src/hooks/usePlayHistory.ts` (新增)
2. ✅ `mobile-app/src/screens/HistoryScreen.tsx` (修改)

### 文档文件
1. ✅ `spec/spec3/HISTORY_SCREEN_ANALYSIS.md` (已创建)
2. ✅ `spec/spec3/PLAN.md` (已创建)
3. ✅ `spec/spec3/TASK.md` (本文件)
4. ⏳ `spec/spec3/SUMMARY.md` (待创建)

---

## ⚠️ 注意事项

### 开发建议
1. **先实现基础** - 确保 Hook 正常工作
2. **逐步添加** - 不要一次性改太多
3. **及时测试** - 每步都验证
4. **参考 SearchScreen** - 保持一致性

### 常见陷阱
1. ❌ 忘记处理空数组情况
2. ❌ 日期格式不统一
3. ❌ 导航参数传递错误
4. ❌ 忘记使用 useCallback
5. ❌ FlatList 没有 keyExtractor

---

## 🎯 成功标准

完成所有任务后，HistoryScreen 应该：
- ✅ 功能完整（100%）
- ✅ 代码质量高（95%）
- ✅ 用户体验好（90%）
- ✅ 性能流畅（90%）
- ✅ 与 SearchScreen 一致

**综合评分**: 45% → 94% (+49%)

---

**清单创建时间**: 2025-12-21
**清单版本**: v1.0
**状态**: 待执行
