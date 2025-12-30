# 音频播放功能需求文档

## 1. 概述（Overview）
为 EtherAudio 听书应用实现完整的音频播放功能，支持从喜马拉雅平台获取音源，提供流畅的播放体验和本地缓存能力。

## 2. 背景与动机（Background）
当前应用缺少核心的音频播放功能，用户无法实际收听书籍内容。需要集成音频获取、播放控制、进度管理等完整功能链路。

## 3. 需求澄清（Clarifications）
- ✅ 支持用户输入喜马拉雅ID和自动搜索匹配
- ✅ 支持所有平台（Android/iOS/Web）
- ✅ 音频文件缓存到本地存储
- ✅ 播放进度同步到后端
- ✅ 显示音频加载进度和网络状态
- ✅ 学习用途，不考虑版权合规问题

## 4. 目标（Goals）
- 实现喜马拉雅音源获取和解析
- 提供完整的音频播放控制（播放/暂停/快进/倍速/断点续播）
- 支持后台播放和锁屏控制
- 实现音频本地缓存机制
- 播放进度云端同步

## 5. 非目标（Non-Goals）
- 版权保护和DRM
- 多平台音源聚合（仅喜马拉雅）
- 音频编辑功能
- 社交分享功能

## 6. 用户流程（User Flow）
### 6.1 通过ID播放
1. 用户在播放器页面输入喜马拉雅书籍/章节ID
2. 系统解析ID获取音频链接和元数据
3. 开始缓存音频文件到本地
4. 显示加载进度，开始播放

### 6.2 通过搜索播放
1. 用户在搜索页面输入书名/作者
2. 系统调用喜马拉雅搜索API
3. 展示搜索结果列表
4. 用户选择书籍，进入播放流程

### 6.3 播放控制
1. 播放/暂停/上一章/下一章
2. 拖拽进度条跳转
3. 调节播放倍速（0.5x-3.0x）
4. 后台播放和锁屏控制

## 7. 功能规格（Functional Specifications）

### 7.1 音源获取模块
**输入**：喜马拉雅ID或搜索关键词
**输出**：音频URL、书籍元数据、章节列表
**逻辑**：
- 解析喜马拉雅页面获取真实音频链接
- 提取书籍信息（标题、作者、封面、简介）
- 获取完整章节列表和时长信息

### 7.2 音频播放模块
**输入**：音频URL、播放位置
**输出**：播放状态、当前进度、总时长
**逻辑**：
- 使用expo-av进行音频播放
- 支持流式播放和本地文件播放
- 实现播放状态管理（loading/playing/paused/error）

### 7.3 缓存管理模块
**输入**：音频URL、书籍ID
**输出**：本地文件路径、缓存状态
**逻辑**：
- 音频文件下载到本地存储
- LRU缓存策略，限制总缓存大小
- 支持预加载下一章节

### 7.4 进度同步模块
**输入**：用户ID、书籍ID、播放进度
**输出**：同步状态
**逻辑**：
- 实时上传播放进度到后端
- 跨设备进度同步
- 离线时本地存储，联网后批量同步

## 8. 数据结构与状态模型（Data / States）

### 8.1 播放状态
```typescript
interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  currentTime: number;
  duration: number;
  playbackRate: number;
  isBuffering: boolean;
  volume: number;
}
```

### 8.2 音频信息
```typescript
interface AudioInfo {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  audio_url: string;
  duration: number;
  episode_num: number;
  book_id: string;
}
```

### 8.3 缓存记录
```typescript
interface CacheRecord {
  audio_id: string;
  local_path: string;
  file_size: number;
  cached_at: Date;
  last_accessed: Date;
}
```

## 9. 接口规范（API / Contract）

### 9.1 前端播放器接口
```typescript
class AudioPlayer {
  // 加载音频
  loadAudio(audioInfo: AudioInfo): Promise<void>;
  
  // 播放控制
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(position: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  
  // 状态监听
  onStatusUpdate(callback: (state: PlaybackState) => void): void;
  onPlaybackEnd(callback: () => void): void;
}
```

### 9.2 后端API接口
```go
// 获取喜马拉雅音频信息
GET /api/v1/audio/ximalaya/{id}
Response: {
  "code": 200,
  "data": {
    "id": "string",
    "title": "string", 
    "audio_url": "string",
    "duration": 0
  }
}

// 搜索喜马拉雅内容
GET /api/v1/search/ximalaya?q={keyword}
Response: {
  "code": 200,
  "data": {
    "results": [AudioInfo],
    "total": 0
  }
}

// 同步播放进度
POST /api/v1/playback/progress
Body: {
  "book_id": "string",
  "episode_id": "string", 
  "progress": 0,
  "duration": 0
}
```

## 10. 性能 / 安全 / 约束

### 10.1 性能要求
- 音频加载时间 < 3秒
- 缓存命中率 > 80%
- 内存使用 < 100MB
- 支持最大缓存 2GB

### 10.2 技术约束
- 使用expo-av作为播放引擎
- 音频格式支持：MP3、M4A
- 网络超时设置：30秒
- 断网重连机制：3次重试

### 10.3 存储约束
- 单个音频文件最大 200MB
- 总缓存空间限制 2GB
- 自动清理7天未访问的缓存

## 11. 验收标准（Acceptance Criteria）

### 11.1 基础播放功能
- [ ] 能够通过喜马拉雅ID获取并播放音频
- [ ] 支持播放/暂停/快进/快退操作
- [ ] 显示准确的播放进度和总时长
- [ ] 支持拖拽进度条跳转

### 11.2 搜索和发现
- [ ] 能够搜索喜马拉雅内容并播放
- [ ] 搜索结果显示完整书籍信息
- [ ] 支持按书籍/作者/分类搜索

### 11.3 缓存和离线
- [ ] 音频文件能够缓存到本地
- [ ] 离线状态下能播放已缓存内容
- [ ] 缓存空间管理正常工作

### 11.4 进度同步
- [ ] 播放进度实时同步到服务器
- [ ] 跨设备进度保持一致
- [ ] 断网重连后能正确同步

### 11.5 用户体验
- [ ] 加载状态和进度显示清晰
- [ ] 网络异常时有友好提示
- [ ] 后台播放和锁屏控制正常
- [ ] 支持1.0x-3.0x倍速播放

## 12. 实现优先级

### P0 (核心功能)
- 喜马拉雅音源解析
- 基础播放控制
- 进度显示和跳转

### P1 (重要功能)  
- 本地缓存机制
- 搜索功能
- 进度同步

### P2 (增强功能)
- 后台播放
- 倍速播放
- 预加载优化
