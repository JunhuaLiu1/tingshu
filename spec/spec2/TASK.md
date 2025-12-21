# SearchScreen 修复执行清单

## 📋 任务说明

本清单包含 11 个具体修复任务，按优先级和依赖关系排序。每个任务都有详细的验收标准。

---

## 阶段一：核心功能修复 (P0)

### 任务 1.1：集成 SearchSuggestions 组件
**优先级**: P0
**预计耗时**: 0.5 人/天
**依赖**: 无

**具体任务**:
1. 在 `SearchScreen.tsx` 中移除硬编码的 `recentSearches` 状态
2. 从 `useSearchState` 获取 `suggestions`、`onSuggestionPress`、`onClearHistory`
3. 在空输入状态下渲染 `SearchSuggestions` 组件
4. 传递正确的 props

**代码位置**:
```typescript
// 移除
const [recentSearches] = useState(['三体', '百年孤独', '月亮与六便士']);

// 添加
const {
  suggestions,
  clearSearchHistory,
  generateSuggestions
} = useSearchState();

// 在 renderEmptyState 中使用
<SearchSuggestions
  suggestions={suggestions}
  onSuggestionPress={(text) => {
    setSearchQuery(text);
    handleSearch();
  }}
  onClearHistory={clearSearchHistory}
/>
```

**验收标准**:
- [ ] 空输入时显示搜索建议组件
- [ ] 显示热门搜索（带火焰图标）
- [ ] 显示搜索历史（带历史图标）
- [ ] 点击建议能自动填充并搜索
- [ ] 清空历史按钮正常工作
- [ ] 无硬编码数据

---

### 任务 1.2：完整集成 useSearchState
**优先级**: P0
**预计耗时**: 0.5 人/天
**依赖**: 任务 1.1

**具体任务**:
1. 获取 useSearchState 的所有必要方法
2. 在搜索成功后调用 `saveSearchHistory`
3. 实时生成搜索建议（useEffect）
4. 确保搜索历史持久化

**代码位置**:
```typescript
// 获取所有方法
const {
  searchHistory,
  hotSearches,
  suggestions,
  isLoadingHistory,
  saveSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  generateSuggestions,
  loadSearchHistory
} = useSearchState();

// 搜索时保存
const handleSearch = async () => {
  if (!searchQuery.trim()) {
    showToast({ type: 'warning', message: '请输入搜索关键词' });
    return;
  }

  saveSearchHistory(searchQuery); // ← 添加这行

  setLoading(true);
  try {
    const response = await searchApi.searchBooks(searchQuery);
    if (response.code === 200) {
      setSearchResults(response.data || []);
    }
  } catch (error) {
    showToast({ type: 'error', message: '搜索失败，请重试' });
    console.error('Search failed:', error);
  } finally {
    setLoading(false);
  }
};

// 实时生成建议
useEffect(() => {
  const newSuggestions = generateSuggestions(searchQuery);
  setSuggestions(newSuggestions);
}, [searchQuery, generateSuggestions]);
```

**验收标准**:
- [ ] 搜索历史能保存到 AsyncStorage
- [ ] 重新打开应用后历史仍在
- [ ] 搜索建议实时更新
- [ ] 搜索历史去重（重复搜索排到最前）
- [ ] 历史记录最多保存 20 条

---

### 任务 1.3：添加搜索结果点击事件
**优先级**: P0
**预计耗时**: 0.5 人/天
**依赖**: 无

**具体任务**:
1. 导入 navigation hook 和类型
2. 为 `renderSearchResult` 添加 `onPress` 处理
3. 导航到 PlayerScreen 并传递 bookId

**代码位置**:
```typescript
// 顶部导入
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 在 SearchScreen 组件内
const navigation = useNavigation<NavigationProp>();

// 修改 renderSearchResult
const renderSearchResult = ({item}: {item: Book}) => (
  <TouchableOpacity
    style={styles.resultCard}
    activeOpacity={tokens.opacity.active}
    onPress={() => navigation.navigate('Player', { bookId: item.id })}
  >
    <CachedImage source={{uri: item.cover_url}} style={styles.resultCover} />
    {/* ... */}
  </TouchableOpacity>
);
```

**验收标准**:
- [ ] 点击搜索结果能跳转
- [ ] 正确传递 bookId 参数
- [ ] 导航类型安全（无 TypeScript 错误）
- [ ] 触摸反馈正常

---

## 阶段二：性能优化 (P1)

### 任务 2.1：添加 FlatList 的 getItemLayout
**优先级**: P1
**预计耗时**: 0.2 人/天
**依赖**: 无

**具体任务**:
1. 定义固定高度常量
2. 实现 getItemLayout 函数
3. 应用到 FlatList

**代码位置**:
```typescript
// 在组件顶部定义
const ITEM_HEIGHT = 140; // 包含 marginBottom

// 实现函数
const getItemLayout = (data: Book[] | null, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

// 应用到 FlatList
<FlatList
  data={searchResults}
  renderItem={renderSearchResult}
  keyExtractor={item => item.id.toString()}
  getItemLayout={getItemLayout} // ← 添加
  // ... 其他属性
/>
```

**验收标准**:
- [ ] 滚动时无卡顿
- [ ] 滚动条位置准确
- [ ] 无布局抖动

---

### 任务 2.2：移除硬编码数据
**优先级**: P1
**预计耗时**: 0.2 人/天
**依赖**: 任务 1.1

**具体任务**:
1. 移除 `recentSearches` 状态定义
2. 确保所有数据来自 useSearchState
3. 检查其他硬编码字符串

**代码位置**:
```typescript
// 移除
const [recentSearches] = useState(['三体', '百年孤独', '月亮与六便士']);

// 确保使用
const { hotSearches, searchHistory } = useSearchState();
```

**验收标准**:
- [ ] 无硬编码的搜索关键词
- [ ] 数据源统一
- [ ] 代码审查无硬编码警告

---

### 任务 2.3：添加下拉刷新
**优先级**: P1
**预计耗时**: 0.3 人/天
**依赖**: 任务 1.2

**具体任务**:
1. 添加 `refreshing` 状态
2. 实现 `onRefresh` 回调（使用 useCallback）
3. 应用到 FlatList

**代码位置**:
```typescript
// 状态
const [refreshing, setRefreshing] = useState(false);

// 回调
const onRefresh = useCallback(async () => {
  if (!searchQuery.trim()) return;

  setRefreshing(true);
  try {
    await handleSearch();
  } finally {
    setRefreshing(false);
  }
}, [searchQuery, handleSearch]);

// 应用
<FlatList
  refreshing={refreshing}
  onRefresh={onRefresh}
  // ...
/>
```

**验收标准**:
- [ ] 下拉触发刷新
- [ ] 加载状态显示正确
- [ ] 不重复保存历史
- [ ] 错误时能正常恢复

---

### 任务 2.4：优化搜索逻辑（可选）
**优先级**: P1
**预计耗时**: 0.3 人/天
**依赖**: 无

**具体任务**:
1. 评估是否需要防抖
2. 如果需要，实现防抖搜索
3. 优化请求频率

**代码位置**:
```typescript
// 如果要实现实时搜索（输入即搜索）
const debouncedSearch = useCallback(
  debounce(async (query: string) => {
    if (!query.trim()) return;
    // 执行搜索
  }, 500),
  []
);

useEffect(() => {
  debouncedSearch(searchQuery);
}, [searchQuery, debouncedSearch]);
```

**验收标准**:
- [ ] 避免重复请求
- [ ] 响应及时
- [ ] 用户体验良好

**备注**: 当前使用按钮触发搜索，此任务可选

---

## 阶段三：体验优化 (P2)

### 任务 3.1：改进错误处理
**优先级**: P2
**预计耗时**: 0.3 人/天
**依赖**: 无

**具体任务**:
1. 添加 `error` 状态
2. 在 UI 中显示错误状态
3. 提供重试按钮

**代码位置**:
```typescript
// 状态
const [error, setError] = useState<string | null>(null);

// 搜索函数修改
const handleSearch = async () => {
  setError(null); // 清除旧错误

  if (!searchQuery.trim()) {
    showToast({ type: 'warning', message: '请输入搜索关键词' });
    return;
  }

  saveSearchHistory(searchQuery);
  setLoading(true);

  try {
    const response = await searchApi.searchBooks(searchQuery);
    if (response.code === 200) {
      setSearchResults(response.data || []);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '搜索失败，请重试';
    setError(message);
    showToast({ type: 'error', message });
  } finally {
    setLoading(false);
  }
};

// UI 渲染
{error && !loading && (
  <EmptyState
    icon="error-outline"
    title="搜索出错"
    subtitle={error}
    actionText="重试"
    onActionPress={handleSearch}
  />
)}
```

**验收标准**:
- [ ] 网络错误显示友好提示
- [ ] 提供重试按钮
- [ ] 错误信息清晰
- [ ] 用户能恢复操作

---

### 任务 3.2：优化小屏适配
**优先级**: P2
**预计耗时**: 0.2 人/天
**依赖**: 无

**具体任务**:
1. 使用 gap 替代 marginBottom
2. 确保按钮不被挤压
3. 测试小屏显示

**代码位置**:
```typescript
// 样式优化
searchContainer: {
  flexDirection: 'row',
  padding: tokens.spacing.md,
  gap: tokens.spacing.md, // ← 使用 gap
},

// 按钮样式（如果需要）
searchButton: {
  minWidth: 60, // 确保最小宽度
}
```

**验收标准**:
- [ ] 小屏（375px）显示正常
- [ ] 无内容溢出
- [ ] 按钮可见且可点击

---

### 任务 3.3：优化自动聚焦
**优先级**: P2
**预计耗时**: 0.2 人/天
**依赖**: 无

**具体任务**:
1. 使用 InteractionManager
2. 添加清理逻辑

**代码位置**:
```typescript
import { InteractionManager } from 'react-native';

useEffect(() => {
  const timeout = setTimeout(() => {
    InteractionManager.runAfterInteractions(() => {
      searchInputRef.current?.focus();
    });
  }, 100);

  return () => clearTimeout(timeout);
}, []);
```

**验收标准**:
- [ ] 聚焦稳定
- [ ] 无内存泄漏
- [ ] 体验流畅

---

### 任务 3.4：添加列表头部信息
**优先级**: P2
**预计耗时**: 0.3 人/天
**依赖**: 无

**具体任务**:
1. 实现 `ListHeaderComponent`
2. 显示结果数量
3. 样式优化

**代码位置**:
```typescript
const renderListHeader = () => (
  <View style={styles.listHeader}>
    <Text style={styles.resultCount}>
      找到 {searchResults.length} 个结果
    </Text>
  </View>
);

<FlatList
  ListHeaderComponent={renderListHeader}
  // ...
/>

// 样式
listHeader: {
  paddingHorizontal: tokens.spacing.md,
  paddingVertical: tokens.spacing.sm,
},
resultCount: {
  fontSize: tokens.typography.caption,
  color: tokens.colors.text.secondary,
}
```

**验收标准**:
- [ ] 显示结果数量
- [ ] 样式统一
- [ ] 信息清晰

---

## 📊 任务统计表

| 任务编号 | 任务名称 | 优先级 | 耗时(天) | 状态 |
|---------|---------|--------|----------|------|
| 1.1 | 集成 SearchSuggestions | P0 | 0.5 | ⬜ 待执行 |
| 1.2 | 完整集成 useSearchState | P0 | 0.5 | ⬜ 待执行 |
| 1.3 | 添加搜索结果点击事件 | P0 | 0.5 | ⬜ 待执行 |
| 2.1 | 添加 getItemLayout | P1 | 0.2 | ⬜ 待执行 |
| 2.2 | 移除硬编码数据 | P1 | 0.2 | ⬜ 待执行 |
| 2.3 | 添加下拉刷新 | P1 | 0.3 | ⬜ 待执行 |
| 2.4 | 优化搜索逻辑 | P1 | 0.3 | ⬜ 待执行 |
| 3.1 | 改进错误处理 | P2 | 0.3 | ⬜ 待执行 |
| 3.2 | 优化小屏适配 | P2 | 0.2 | ⬜ 待执行 |
| 3.3 | 优化自动聚焦 | P2 | 0.2 | ⬜ 待执行 |
| 3.4 | 添加列表头部 | P2 | 0.3 | ⬜ 待执行 |
| **总计** | | | **3.5** | |

---

## 🔍 依赖关系图

```
任务 1.1 (集成 SearchSuggestions)
    ↓ 依赖
任务 1.2 (集成 useSearchState)
    ↓ 依赖
任务 2.3 (下拉刷新)

任务 1.3 (点击事件) ──┐
任务 2.1 (getItemLayout) ─┼─ 独立
任务 2.2 (移除硬编码) ──┘
任务 2.4 (防抖) ────────┐
任务 3.1 (错误处理) ────┼─ 独立
任务 3.2 (小屏适配) ────┤
任务 3.3 (自动聚焦) ────┤
任务 3.4 (列表头部) ────┘
```

---

## ✅ 完成检查清单

### 开始前准备
- [ ] 备份当前 SearchScreen.tsx
- [ ] 检查 useSearchState 是否完整
- [ ] 检查 SearchSuggestions 是否正常
- [ ] 确认导航类型定义存在

### 阶段一完成后
- [ ] 搜索建议能正常显示
- [ ] 搜索历史能保存
- [ ] 点击结果能跳转
- [ ] 无 TypeScript 错误

### 阶段二完成后
- [ ] 滚动性能良好
- [ ] 无硬编码数据
- [ ] 下拉刷新正常

### 阶段三完成后
- [ ] 错误处理完善
- [ ] 小屏显示正常
- [ ] 用户体验良好

### 最终验证
- [ ] 所有功能正常
- [ ] 代码符合规范
- [ ] 文档已更新
- [ ] 测试通过

---

## 📝 实施建议

### 开发顺序
1. **先实现任务 1.1**（集成 SearchSuggestions）
   - 这是最明显的缺陷
   - 用户体验提升最明显

2. **接着任务 1.2**（完整集成 useSearchState）
   - 依赖任务 1.1
   - 实现持久化功能

3. **然后任务 1.3**（点击事件）
   - 核心功能闭环
   - 用户能完成完整流程

4. **再做任务 2.x**（性能优化）
   - 功能完整后再优化
   - 避免过早优化

5. **最后做任务 3.x**（体验优化）
   - 锦上添花
   - 提升精致度

### 测试策略
- 每完成一个任务立即测试
- 使用 console.log 验证数据流
- 在不同屏幕尺寸上验证

---

**文档生成时间**: 2025-12-21
**版本**: v1.0
**状态**: 待执行
