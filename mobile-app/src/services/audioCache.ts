import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_INDEX_KEY = 'audio_cache_index';

interface CacheEntry {
  episodeId: string;
  remoteUrl: string;
  cachedAt: number;
  lastAccessed: number;
}

class AudioCacheService {
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    await this.loadIndex();
    this.initialized = true;
  }

  private async loadIndex() {
    try {
      const data = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (data) {
        const entries: CacheEntry[] = JSON.parse(data);
        entries.forEach(e => this.cacheIndex.set(e.episodeId, e));
      }
    } catch {}
  }

  private async saveIndex() {
    const entries = Array.from(this.cacheIndex.values());
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(entries));
  }

  async getCachedUrl(episodeId: string): Promise<string | null> {
    await this.init();
    const entry = this.cacheIndex.get(episodeId);
    if (!entry) return null;
    entry.lastAccessed = Date.now();
    await this.saveIndex();
    return entry.remoteUrl;
  }

  async cacheAudio(
    episodeId: string,
    remoteUrl: string,
    _onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.init();
    
    // 简化版：直接存储远程URL，expo-av会自动处理缓存
    const entry: CacheEntry = {
      episodeId,
      remoteUrl,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    };
    this.cacheIndex.set(episodeId, entry);
    await this.saveIndex();
    return remoteUrl;
  }

  async clearCache() {
    this.cacheIndex.clear();
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    this.initialized = false;
  }

  async getCacheSize(): Promise<number> {
    await this.init();
    return this.cacheIndex.size;
  }
}

export const audioCache = new AudioCacheService();
