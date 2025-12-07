import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Book} from '../types';
import {searchApi} from '../services/api';

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches] = useState(['三体', '百年孤独', '月亮与六便士']);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await searchApi.searchBooks(searchQuery);
      if (response.code === 200) {
        setSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({item}: {item: Book}) => (
    <TouchableOpacity style={styles.resultCard}>
      <Image source={{uri: item.cover_url}} style={styles.resultCover} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.resultAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.resultMeta}>
          <MaterialIcons name="play-circle-filled" size={16} color="#FF6B35" />
          <Text style={styles.resultPlayCount}>
            {(item.play_count / 10000).toFixed(1)}万播放
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = (item: string) => (
    <TouchableOpacity
      key={item}
      style={styles.recentSearchItem}
      onPress={() => setSearchQuery(item)}>
      <MaterialIcons name="history" size={16} color="#999" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="search" size={64} color="#ddd" />
      <Text style={styles.emptyStateTitle}>搜索书籍</Text>
      <Text style={styles.emptyStateSubtitle}>
        输入书名、作者或关键词开始搜索
      </Text>
      <View style={styles.recentSearchesContainer}>
        <Text style={styles.recentSearchesTitle}>最近搜索</Text>
        <View style={styles.recentSearchesList}>
          {recentSearches.map(renderRecentSearch)}
        </View>
      </View>
    </View>
  );

  const renderNoResults = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={64} color="#ddd" />
      <Text style={styles.emptyStateTitle}>未找到相关书籍</Text>
      <Text style={styles.emptyStateSubtitle}>
        试试其他关键词或浏览推荐内容
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索书籍、作者..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索结果 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>搜索中...</Text>
        </View>
      ) : searchQuery.trim() === '' ? (
        renderEmptyState()
      ) : searchResults.length === 0 ? (
        renderNoResults()
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id.toString()}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  recentSearchesContainer: {
    width: '100%',
    marginTop: 32,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchesList: {
    flexDirection: 'column',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentSearchText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  resultsList: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCover: {
    width: 80,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultPlayCount: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 4,
  },
});

export default SearchScreen;