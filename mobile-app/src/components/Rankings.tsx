import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {RANKING_BOOKS, getBookCoverUrl, getBookPlayCount} from '../data/mockData';

const Rankings: React.FC = () => {
  const renderRankingItem = ({item}: any) => (
    <TouchableOpacity style={styles.rankingItem} activeOpacity={0.8}>
      <View style={styles.bookCoverContainer}>
        <Image
          source={{uri: getBookCoverUrl(item)}}
          style={styles.bookCover}
        />
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
      </View>

      <View style={styles.rankContainer}>
        <Text style={styles.rankNumber}>#{item.rank}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>热门排行</Text>
        <TouchableOpacity style={styles.seeAllBadge}>
          <Text style={styles.seeAllText}>查看全部</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {RANKING_BOOKS.slice(0, 4).map((item, index) => (
          <View key={item.id.toString()}>
            {renderRankingItem({item, index})}
            {index < 3 && <View style={{height: 12}} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllBadge: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  listContainer: {
    paddingBottom: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8f8f8',
  },
  bookCoverContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  bookCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#999',
  },
  rankContainer: {
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 4,
  },
  moreButton: {
    padding: 6,
  },
});

export default Rankings;