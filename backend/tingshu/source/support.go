package source

import (
	"math/rand"
	"sync"
	"time"
)

type Monitor struct {
	successCount map[string]int
	failCount    map[string]int
	mu           sync.RWMutex
}

func NewMonitor() *Monitor {
	return &Monitor{
		successCount: make(map[string]int),
		failCount:    make(map[string]int),
	}
}

func (m *Monitor) RecordSuccess(sourceID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.successCount[sourceID]++
}

func (m *Monitor) RecordFail(sourceID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.failCount[sourceID]++
}

func (m *Monitor) GetSuccessRate(sourceID string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()

	success := m.successCount[sourceID]
	fail := m.failCount[sourceID]
	total := success + fail
	if total == 0 {
		return 1.0
	}
	return float64(success) / float64(total)
}

func (m *Monitor) CheckAndDisable(threshold float64) []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var disabled []string
	for sourceID := range m.failCount {
		if m.GetSuccessRate(sourceID) < threshold {
			disabled = append(disabled, sourceID)
		}
	}
	return disabled
}

type Cache struct {
	mu       sync.RWMutex
	search   *simpleCache
	book     *simpleCache
	audio    *simpleCache
	chapters *simpleCache
	health   *simpleCache
}

func NewCache() *Cache {
	return &Cache{
		search:   newSimpleCache(5 * time.Minute),
		book:     newSimpleCache(10 * time.Minute),
		audio:    newSimpleCache(30 * time.Minute),
		chapters: newSimpleCache(10 * time.Minute),
		health:   newSimpleCache(1 * time.Minute),
	}
}

type simpleCache struct {
	mu      sync.RWMutex
	items   map[string]cacheItem
	ttl     time.Duration
	maxSize int
}

type cacheItem struct {
	value      interface{}
	expireAt   time.Time
	accessTime time.Time
}

func newSimpleCache(ttl time.Duration) *simpleCache {
	return &simpleCache{
		items:   make(map[string]cacheItem),
		ttl:     ttl,
		maxSize: 1000,
	}
}

func (c *simpleCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, ok := c.items[key]
	if !ok {
		return nil, false
	}

	if time.Now().After(item.expireAt) {
		return nil, false
	}

	item.accessTime = time.Now()
	return item.value, true
}

func (c *simpleCache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.items) >= c.maxSize {
		c.evictLRU()
	}

	c.items[key] = cacheItem{
		value:      value,
		expireAt:   time.Now().Add(c.ttl),
		accessTime: time.Now(),
	}
}

func (c *simpleCache) evictLRU() {
	var oldestKey string
	var oldestTime time.Time

	for key, item := range c.items {
		if oldestKey == "" || item.accessTime.Before(oldestTime) {
			oldestKey = key
			oldestTime = item.accessTime
		}
	}

	if oldestKey != "" {
		delete(c.items, oldestKey)
	}
}

var userAgents = []string{
	"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
	"Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

func GetRandomUserAgent() string {
	return userAgents[rand.Intn(len(userAgents))]
}
