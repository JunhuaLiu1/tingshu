import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';
import FallbackImage from './common/FallbackImage';
import { openBookInPlayer } from '../utils/openPlayer';

interface EditorsPickProps {
  books: Book[];
  title?: string;
}

// 获取封面 URL（兼容多种格式）
const getBookCoverUrl = (book: Book): string => {
  return book.cover_url || book.coverUrl || '';
};

const EditorsPick: React.FC<EditorsPickProps> = ({ books, title = '名著推荐' }) => {
  const router = useRouter();

  const openPlayer = useCallback((book: Book) => {
    openBookInPlayer(router as any, book as any);
  }, [router]);

  const renderBookItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.bookCard}
      activeOpacity={0.8}
      onPress={() => openPlayer(item)}
    >
      <View style={styles.bookCoverContainer}>
        <FallbackImage
          uri={getBookCoverUrl(item)}
          sourceId={item.source_id || item.sourceId}
          style={styles.bookCover}
        />
        <View style={styles.playButtonOverlay}>
          <TouchableOpacity style={styles.playButton} onPress={() => openPlayer(item)}>
            <MaterialIcons name="play-arrow" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.bookTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {item.author}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <MaterialIcons name="arrow-forward" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  bookCard: {
    width: 150,
  },
  bookCoverContainer: {
    position: 'relative',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  bookCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    opacity: 0,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default EditorsPick;
