package source

import (
	"errors"
	"sort"
	"sync"
	"time"
)

type Manager struct {
	mu       sync.RWMutex
	sources  map[string]Source
	disabled map[string]time.Time
	monitor  *Monitor
	cache    *Cache
}

func NewManager() *Manager {
	return &Manager{
		sources:  make(map[string]Source),
		disabled: make(map[string]time.Time),
		monitor:  NewMonitor(),
		cache:    NewCache(),
	}
}

func (m *Manager) Register(src Source) error {
	if src == nil {
		return errors.New("source is nil")
	}
	id := src.ID()
	if id == "" {
		return errors.New("source id is empty")
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if _, exists := m.sources[id]; exists {
		return errors.New("source already registered")
	}
	m.sources[id] = src
	return nil
}

func (m *Manager) Get(id string) (Source, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if disabledAt, ok := m.disabled[id]; ok {
		if time.Since(disabledAt) > time.Hour {
			m.mu.RUnlock()
			m.mu.Lock()
			delete(m.disabled, id)
			m.mu.Unlock()
			m.mu.RLock()
		} else {
			return nil, false
		}
	}

	src, ok := m.sources[id]
	return src, ok
}

func (m *Manager) List() []SourceInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()

	infos := make([]SourceInfo, 0, len(m.sources))
	for _, src := range m.sources {
		info := SourceInfo{
			ID:            src.ID(),
			Name:          src.Name(),
			Description:   src.Description(),
			BaseURL:       src.BaseURL(),
			Version:       src.Version(),
			Searchable:    src.IsSearchable(),
			HasCategories: src.HasCategories(),
		}

		health := src.HealthCheck()
		info.HealthStatus = health.Status
		info.SuccessRate = health.SuccessRate

		if _, disabled := m.disabled[src.ID()]; disabled {
			info.Enabled = false
		} else {
			info.Enabled = true
		}

		infos = append(infos, info)
	}

	sort.Slice(infos, func(i, j int) bool {
		return infos[i].ID < infos[j].ID
	})
	return infos
}

func (m *Manager) Enable(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.disabled, id)
}

func (m *Manager) Disable(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.disabled[id] = time.Now()
}

func (m *Manager) GlobalSearch(keyword string) []Book {
	m.mu.RLock()
	sources := make([]Source, 0, len(m.sources))
	for _, src := range m.sources {
		if _, disabled := m.disabled[src.ID()]; disabled {
			continue
		}
		if !src.IsSearchable() {
			continue
		}
		sources = append(sources, src)
	}
	m.mu.RUnlock()

	var results []Book
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, src := range sources {
		wg.Add(1)
		go func(s Source) {
			defer wg.Done()

			result, err := s.Search(keyword, 1)
			if err != nil {
				m.monitor.RecordFail(s.ID())
				return
			}

			m.monitor.RecordSuccess(s.ID())

			mu.Lock()
			results = append(results, result.Books...)
			mu.Unlock()
		}(src)
	}

	wg.Wait()

	failedSources := m.monitor.CheckAndDisable(0.7)
	for _, id := range failedSources {
		m.Disable(id)
	}

	return results
}

func (m *Manager) GetEnabledSources() []Source {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var enabled []Source
	for id, src := range m.sources {
		if _, disabled := m.disabled[id]; !disabled {
			enabled = append(enabled, src)
		}
	}
	return enabled
}
