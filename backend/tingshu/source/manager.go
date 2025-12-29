package source

import (
	"errors"
	"sort"
	"sync"
)

type Manager struct {
	mu      sync.RWMutex
	sources map[string]Source
}

func NewManager() *Manager {
	return &Manager{
		sources: make(map[string]Source),
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
	src, ok := m.sources[id]
	return src, ok
}

func (m *Manager) List() []SourceInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()

	infos := make([]SourceInfo, 0, len(m.sources))
	for _, src := range m.sources {
		infos = append(infos, SourceInfo{
			ID:          src.ID(),
			Name:        src.Name(),
			Description: src.Description(),
			BaseURL:     src.BaseURL(),
		})
	}

	sort.Slice(infos, func(i, j int) bool {
		return infos[i].ID < infos[j].ID
	})
	return infos
}
