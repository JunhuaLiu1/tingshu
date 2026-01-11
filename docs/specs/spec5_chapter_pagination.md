# spec5: 章节列表分页功能

## 1. 概述（Overview）
为有声书/音频内容的章节列表实现标准化分页功能，每页显示50个章节，使用上一页/下一页的导航方式，提升用户浏览体验。

## 2. 背景与动机（Background）
当前章节列表的分页状态混乱，需要统一规范为每页50集的标准分页，便于用户浏览长篇内容的章节。

## 3. 需求澄清（Clarifications）
- 分页数量：固定每页50个章节
- 导航方式：上一页/下一页按钮
- **待补充：章节条目显示的具体信息（标题、时长、播放状态等）**
- **待补充：是否需要显示当前页码和总页数**
- **待补充：是否需要快速跳转功能**

## 4. 目标（Goals）
- 实现每页50个章节的标准分页
- 提供上一页/下一页导航功能
- 统一章节列表的显示规范
- 提升长篇内容的浏览体验

## 5. 非目标（Non-Goals）
- 不实现20集或100集的分页选项
- 不实现无限滚动加载
- 不实现章节搜索功能（本次范围外）

## 6. 用户流程（User Flow）
1. 用户进入书籍详情页面
2. 查看章节列表，默认显示第1页（前50个章节）
3. 点击"下一页"查看第51-100章节
4. 点击"上一页"返回前一页章节
5. 点击任意章节开始播放

## 7. 功能规格（Functional Specifications）

### 7.1 分页逻辑
- **每页章节数**：固定50个
- **页码计算**：`总页数 = Math.ceil(总章节数 / 50)`
- **当前页范围**：`起始索引 = (当前页 - 1) * 50`

### 7.2 导航控件
- **上一页按钮**：
  - 第1页时禁用/隐藏
  - 点击后跳转到 `当前页 - 1`
- **下一页按钮**：
  - 最后一页时禁用/隐藏
  - 点击后跳转到 `当前页 + 1`

### 7.3 页面状态
- 显示当前页码信息：`第 X 页，共 Y 页`
- 显示当前页章节范围：`第 A-B 章节`

### 7.4 边界情况
- 总章节数 ≤ 50：不显示分页控件
- 最后一页章节数不足50：正常显示实际数量
- 网络错误：显示重试按钮

## 8. 数据结构与状态模型（Data / States）

### 8.1 分页状态
```typescript
interface PaginationState {
  currentPage: number;      // 当前页码（从1开始）
  totalPages: number;       // 总页数
  totalChapters: number;    // 总章节数
  pageSize: number;         // 每页大小（固定50）
  isLoading: boolean;       // 加载状态
}
```

### 8.2 章节数据
```typescript
interface Chapter {
  id: string;
  title: string;
  index: number;           // 章节序号
  duration?: number;       // 时长（秒）
  isPlayed?: boolean;      // 是否已播放
}
```

## 9. 接口规范（API / Contract）

### 9.1 获取章节列表
```typescript
// API 调用
GET /api/v1/books/{bookId}/chapters?page={page}&size=50

// 响应格式
{
  code: 200,
  data: {
    chapters: Chapter[],
    pagination: {
      current_page: number,
      total_pages: number,
      total_count: number,
      page_size: number
    }
  }
}
```

### 9.2 组件接口
```typescript
interface ChapterPaginationProps {
  bookId: string;
  onChapterSelect: (chapter: Chapter) => void;
  currentChapter?: Chapter;
}
```

## 10. 性能 / 安全 / 约束
- **性能要求**：页面切换响应时间 < 500ms
- **缓存策略**：已加载的页面数据缓存5分钟
- **内存限制**：最多缓存3页数据，超出时清理最旧页面
- **待确认：是否需要预加载相邻页面数据**

## 11. 验收标准（Acceptance Criteria）

### 11.1 基础功能
- [ ] 章节列表按每页50个进行分页
- [ ] 上一页/下一页按钮正常工作
- [ ] 第1页时上一页按钮禁用
- [ ] 最后一页时下一页按钮禁用
- [ ] 显示当前页码和总页数信息

### 11.2 边界测试
- [ ] 总章节数 ≤ 50时不显示分页控件
- [ ] 最后一页章节数不足50时正常显示
- [ ] 网络异常时显示错误提示和重试功能

### 11.3 用户体验
- [ ] 页面切换流畅，无明显卡顿
- [ ] 当前播放章节在列表中有明显标识
- [ ] 分页控件位置合理，易于操作

### 11.4 兼容性
- [ ] 在不同屏幕尺寸下分页控件显示正常
- [ ] 与现有播放器功能无冲突
- [ ] 符合项目整体UI设计规范
