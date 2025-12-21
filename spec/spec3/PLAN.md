# HistoryScreen 修复实施计划

## 📋 计划概览

- **项目**: HistoryScreen (播放历史页面)
- **目标**: 从静态演示页面升级为完整功能页面
- **缺陷数量**: 10 个
- **预计耗时**: 2.5 人/天
- **计划版本**: v1.0

---

## 🎯 修复目标

### 核心目标
1. ✅ 数据真实化 - 使用真实播放历史数据
2. ✅ 功能完整化 - 实现所有交互功能
3. ✅ 体验优化 - 提升用户体验
4. ✅ 代码质量 - 与 SearchScreen 保持一致

### 修复后预期
- **质量评分**: 40% → 95%
- **功能完整性**: 30% → 100%
- **代码行数**: 286 → 350 行
- **依赖文件**: 新增 `usePlayHistory.ts` Hook

---

## 📅 实施阶段

### 阶段一：核心功能修复 (P0) - 1.0 天

#### 任务 1.1：创建播放历史 Hook
**预计时间**: 0.3 天
**优先级**: 🔴 P0
**目标**: 创建类似 useSearchState 的状态管理 Hook

**任务内容**:
- 创建 `mobile-app/src/hooks/usePlayHistory.ts`
- 实现数据结构定义（PlayHistoryItem）
- 实现加载/保存/删除/清空功能
- 集成 AsyncStorage 持久化
- 提供类型安全的 API

**关键代码**:
```typescript
export interface PlayHistoryItem {
  id: string;
  bookId: number;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;      // 播放进度百分比
  duration: number;      // 总时长（秒）
  lastPlayed: Date;      // 最后播放时间
  episodeId?: number;    // 可选：集数ID
}

export const usePlayHistory = () => {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => { /* ... */ };
  const saveHistory = async (item: PlayHistoryItem) => { /* ... */ };
  const removeHistory = async (id: string) => { /* ... */ };
  const clearHistory = async () => { /* ... */ };

  return { history, isLoading, loadHistory, saveHistory, removeHistory, clearHistory };
};
```

**验证标准**:
- ✅ 类型定义完整
- ✅ AsyncStorage 集成正确
- ✅ 提供完整的 CRUD 操作
- ✅ 错误处理完善

---

#### 任务 1.2：集成导航和点击跳转
**预计时间**: 0.2 天
**优先级**: 🔴 P0
**目标**: 实现历史项点击跳转到播放器

**任务内容**:
- 导入导航相关依赖
- 定义 NavigationProp 类型
- 为历史项添加 `onPress` 事件
- 传递正确的参数（bookId, episodeId, progress）

**关键代码**:
```typescript
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

**验证标准**:
- ✅ 点击后正确跳转
- ✅ 参数传递准确
- ✅ 导航类型安全
- ✅ 使用 useCallback 优化

---

#### 任务 1.3：实现更多按钮功能
**预计时间**: 0.2 天
**优先级**: 🔴 P0
**目标**: 为更多按钮添加实际功能

**任务内容**:
- 为更多按钮添加 `onPress` 事件
- 实现操作菜单（删除/收藏）
- 集成 Toast 反馈
- 处理单条删除逻辑

**关键代码**:
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
    {
      text: '收藏',
      onPress: () => {
        // TODO: 集成收藏功能
        showToast({ type: 'info', message: '已收藏' });
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

**验证标准**:
- ✅ 菜单正确弹出
- ✅ 删除功能正常
- ✅ Toast 反馈及时
- ✅ 错误处理完善

---

#### 任务 1.4：替换硬编码数据
**预计时间**: 0.1 天
**优先级**: 🔴 P0
**目标**: 使用真实数据源

**任务内容**:
- 移除硬编码的 `useState` 数据
- 集成 `usePlayHistory` Hook
- 在 useEffect 中加载数据
- 处理加载状态

**关键代码**:
```typescript
const { history, isLoading, loadHistory } = usePlayHistory();

useEffect(() => {
  loadHistory();
}, [loadHistory]);

// 移除硬编码
// const [history, setHistory] = useState<PlayHistoryItem[]>([...]);
```

**验证标准**:
- ✅ 移除所有硬编码数据
- ✅ 正确使用 Hook
- ✅ 加载状态处理

---

### 阶段二：功能完善 (P1) - 0.8 天

#### 任务 2.1：添加下拉刷新
**预计时间**: 0.2 天
**优先级**: 🟡 P1
**目标**: 支持手动刷新数据

**任务内容**:
- 添加 `refreshing` 状态
- 实现 `onRefresh` 回调
- 集成到 FlatList
- 处理刷新逻辑

**关键代码**:
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

**验证标准**:
- ✅ 下拉触发刷新
- ✅ 加载状态正确
- ✅ 刷新后数据更新
- ✅ 错误处理完善

---

#### 任务 2.2：优化空状态引导
**预计时间**: 0.2 天
**优先级**: 🟡 P1
**目标**: 提供明确的操作引导

**任务内容**:
- 为 EmptyState 添加操作按钮
- 点击后跳转到搜索页面
- 保持与 SearchScreen 一致的风格

**关键代码**:
```typescript
<EmptyState
  icon="history"
  title="暂无播放历史"
  subtitle="开始听书后，播放记录将显示在这里"
  actionText="去搜索"
  onActionPress={() => navigation.navigate('Search')}
/>
```

**验证标准**:
- ✅ 按钮显示正常
- ✅ 点击后正确跳转
- ✅ 样式与 SearchScreen 一致

---

#### 任务 2.3：添加错误处理
**预计时间**: 0.2 天
**优先级**: 🟡 P1
**目标**: 完善的错误边界处理

**任务内容**:
- 添加 `error` 状态
- 实现错误状态 UI
- 提供重试机制
- 集成 Toast 反馈

**关键代码**:
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

**验证标准**:
- ✅ 错误状态显示正确
- ✅ 重试功能正常
- ✅ 错误信息清晰

---

#### 任务 2.4：集成 Toast 反馈
**预计时间**: 0.1 天
**优先级**: 🟡 P1
**目标**: 所有操作都有反馈

**任务内容**:
- 在删除、清空、刷新等操作后显示 Toast
- 使用正确的类型（success/error/info）
- 消息内容清晰

**验证标准**:
- ✅ 删除成功提示
- ✅ 清空成功提示
- ✅ 刷新成功提示
- ✅ 错误提示

---

#### 任务 2.5：添加性能优化
**预计时间**: 0.1 天
**优先级**: 🟡 P1
**目标**: 与 SearchScreen 保持一致的性能标准

**任务内容**:
- 添加 `getItemLayout`
- 使用 `removeClippedSubviews`
- 优化 FlatList 参数
- 使用 `useCallback` 包装函数

**关键代码**:
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

**验证标准**:
- ✅ 滚动流畅
- ✅ 无重复渲染
- ✅ 内存占用合理

---

### 阶段三：体验优化 (P2) - 0.7 天

#### 任务 3.1：添加列表头部统计
**预计时间**: 0.2 天
**优先级**: 🟢 P2
**目标**: 显示历史记录统计信息

**任务内容**:
- 实现 `renderListHeader`
- 显示记录总数
- 样式优化

**关键代码**:
```typescript
const renderListHeader = useCallback(() => (
  <View style={styles.listHeader}>
    <Text style={styles.resultCount}>
      共 {history.length} 条播放记录
    </Text>
    <Text style={styles.lastUpdate}>
      最后更新: {formatTimeAgo(new Date())}
    </Text>
  </View>
), [history.length]);

<FlatList
  ListHeaderComponent={renderListHeader}
/>
```

**验证标准**:
- ✅ 头部显示正常
- ✅ 数据准确
- ✅ 样式美观

---

#### 任务 3.2：实现单条删除功能
**预计时间**: 0.3 天
**优先级**: 🟢 P2
**目标**: 支持选择性删除

**任务内容**:
- 方案选择：长按菜单 或 滑动删除
- 实现删除逻辑
- 集成 Toast 反馈
- 添加确认对话框

**关键代码** (方案1: 长按):
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

**验证标准**:
- ✅ 长按/滑动触发
- ✅ 删除功能正常
- ✅ 确认对话框
- ✅ 数据更新及时

---

#### 任务 3.3：添加排序功能
**预计时间**: 0.1 天
**优先级**: 🟢 P2
**目标**: 支持按不同方式排序

**任务内容**:
- 添加排序状态
- 实现排序逻辑
- 提供 UI 切换（可选）

**关键代码**:
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

**验证标准**:
- ✅ 排序逻辑正确
- ✅ 数据显示有序
- ✅ 默认按时间倒序

---

#### 任务 3.4：小屏适配优化
**预计时间**: 0.1 天
**优先级**: 🟢 P2
**目标**: 在小屏幕上正常显示

**任务内容**:
- 使用 `gap` 替代 marginBottom
- 检查 375px 屏幕显示
- 优化布局间距

**验证标准**:
- ✅ 375px 屏幕正常
- ✅ 无内容溢出
- ✅ 间距合理

---

## 📊 任务总览

### 阶段一：核心功能 (1.0 天)
| 任务 | 时间 | 优先级 | 状态 |
|------|------|--------|------|
| 1.1 创建 usePlayHistory Hook | 0.3 天 | 🔴 P0 | 待办 |
| 1.2 集成导航和点击跳转 | 0.2 天 | 🔴 P0 | 待办 |
| 1.3 实现更多按钮功能 | 0.2 天 | 🔴 P0 | 待办 |
| 1.4 替换硬编码数据 | 0.1 天 | 🔴 P0 | 待办 |
| **小计** | **0.8 天** | - | - |

### 阶段二：功能完善 (0.8 天)
| 任务 | 时间 | 优先级 | 状态 |
|------|------|--------|------|
| 2.1 添加下拉刷新 | 0.2 天 | 🟡 P1 | 待办 |
| 2.2 优化空状态引导 | 0.2 天 | 🟡 P1 | 待办 |
| 2.3 添加错误处理 | 0.2 天 | 🟡 P1 | 待办 |
| 2.4 集成 Toast 反馈 | 0.1 天 | 🟡 P1 | 待办 |
| 2.5 添加性能优化 | 0.1 天 | 🟡 P1 | 待办 |
| **小计** | **0.8 天** | - | - |

### 阶段三：体验优化 (0.7 天)
| 任务 | 时间 | 优先级 | 状态 |
|------|------|--------|------|
| 3.1 添加列表头部统计 | 0.2 天 | 🟢 P2 | 待办 |
| 3.2 实现单条删除 | 0.3 天 | 🟢 P2 | 待办 |
| 3.3 添加排序功能 | 0.1 天 | 🟢 P2 | 待办 |
| 3.4 小屏适配优化 | 0.1 天 | 🟢 P2 | 待办 |
| **小计** | **0.7 天** | - | - |

**总计**: **2.5 人/天**

---

## 📁 文件变更清单

### 新增文件
1. `mobile-app/src/hooks/usePlayHistory.ts` - 播放历史 Hook
2. `spec/spec3/HISTORY_SCREEN_ANALYSIS.md` - 缺陷分析（已创建）
3. `spec/spec3/PLAN.md` - 实施计划（本文件）
4. `spec/spec3/TASK.md` - 任务清单（待创建）
5. `spec/spec3/SUMMARY.md` - 总结报告（待创建）

### 修改文件
1. `mobile-app/src/screens/HistoryScreen.tsx` - 主文件（286 → 350 行）

### 依赖文件（已存在）
- ✅ `mobile-app/src/types/index.ts` - 类型定义
- ✅ `mobile-app/src/theme/tokens.ts` - 设计令牌
- ✅ `mobile-app/src/components/common/EmptyState.tsx` - 空状态组件
- ✅ `mobile-app/src/components/common/CachedImage.tsx` - 图片组件
- ✅ `mobile-app/src/contexts/ToastContext.tsx` - Toast 上下文
- ✅ `mobile-app/src/data/mockData.ts` - Mock 数据（将被替换）

---

## 🎯 成功标准

### 功能完整性
- ✅ 能从 AsyncStorage 读取真实数据
- ✅ 点击历史项能跳转到播放器
- ✅ 更多按钮能删除/收藏
- ✅ 下拉刷新正常工作
- ✅ 空状态有引导按钮
- ✅ 错误时能重试

### 代码质量
- ✅ 无硬编码数据
- ✅ 使用设计令牌
- ✅ 类型安全（TypeScript）
- ✅ 使用 useCallback 优化
- ✅ FlatList 性能优化
- ✅ 错误处理完整

### 用户体验
- ✅ 所有操作有反馈（Toast）
- ✅ 小屏显示正常
- ✅ 加载状态清晰
- ✅ 交互响应及时

---

## 📋 前置依赖

### 必须完成
1. ✅ SearchScreen 已修复（参考标准）
2. ⏳ PlayerScreen 需要支持接收 progress 参数
3. ⏳ 播放器需要能保存播放进度到历史

### 可选依赖
1. 收藏功能（可以先预留接口）
2. 分享功能（可以后续添加）

---

## 🚀 实施建议

### 开发顺序
1. **先创建 Hook** - 这是基础，其他都依赖它
2. **再改主组件** - 替换数据源
3. **然后加功能** - 逐步添加交互
4. **最后做优化** - 体验和性能

### 测试策略
- 每完成一个任务立即测试
- 使用真实数据测试（而不是 mock）
- 测试边界情况（空数据、错误、大量数据）
- 在不同屏幕尺寸上测试

### 代码复用
- 参考 SearchScreen 的实现方式
- 复用 useSearchState 的模式
- 保持一致的代码风格

---

## 📊 预期成果

### 修复前后对比

| 指标 | 修复前 | 修复后 | 提升 |
|------|--------|--------|------|
| 功能完整性 | 30% | 100% | +70% |
| 代码质量 | 50% | 95% | +45% |
| 用户体验 | 40% | 90% | +50% |
| 性能 | 60% | 90% | +30% |
| **综合评分** | **45%** | **94%** | **+49%** |

### 代码统计
- **新增文件**: 1 个（Hook）
- **修改文件**: 1 个（HistoryScreen）
- **新增代码**: ~100 行
- **删除代码**: ~20 行（硬编码）
- **净增加**: ~80 行

---

## ⚠️ 风险提示

### 潜在风险
1. **PlayerScreen 未完成**: 如果播放器不支持保存进度，历史功能不完整
2. **数据格式不一致**: 需要与后端/播放器的数据格式对齐
3. **AsyncStorage 限制**: 需要处理存储空间不足的情况

### 缓解措施
1. 先实现基础功能，后续对接播放器
2. 定义清晰的数据接口
3. 添加存储错误处理

---

## 📞 下一步行动

1. ✅ 审阅本计划
2. ✅ 确认前置依赖
3. ⏳ 开始实施任务 1.1
4. ⏳ 创建 TASK.md 详细清单

---

**计划创建时间**: 2025-12-21
**计划版本**: v1.0
**状态**: 待实施
