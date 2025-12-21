import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchSuggestion } from '../hooks/useSearchState';
import { tokens } from '../theme/tokens';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSuggestionPress: (suggestion: string) => void;
  onClearHistory: () => void;
  showClearButton?: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
  onClearHistory,
  showClearButton = true
}) => {
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return 'history';
      case 'hot':
        return 'trending-up';
      default:
        return 'search';
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return tokens.colors.text.secondary;
      case 'hot':
        return tokens.colors.primary;
      default:
        return tokens.colors.text.tertiary;
    }
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSuggestionPress(item.text)}
      activeOpacity={tokens.opacity.active}
    >
      <MaterialIcons
        name={getSuggestionIcon(item.type)}
        size={20}
        color={getSuggestionColor(item.type)}
      />
      <Text style={[styles.suggestionText, { color: getSuggestionColor(item.type) }]}>
        {item.text}
      </Text>
      {item.type === 'hot' && (
        <MaterialIcons
          name="local-fire-department"
          size={16}
          color={tokens.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, showClear?: boolean) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showClear && (
        <TouchableOpacity onPress={onClearHistory} activeOpacity={tokens.opacity.active}>
          <Text style={styles.clearButton}>清空</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (suggestions.length === 0) {
    return null;
  }

  // 按类型分组建议
  const historySuggestions = suggestions.filter(s => s.type === 'history');
  const hotSuggestions = suggestions.filter(s => s.type === 'hot');
  const otherSuggestions = suggestions.filter(s => !['history', 'hot'].includes(s.type));

  return (
    <View style={styles.container}>
      {/* 搜索历史 */}
      {historySuggestions.length > 0 && (
        <View style={styles.section}>
          {renderSectionHeader('搜索历史', showClearButton)}
          <FlatList
            data={historySuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `history-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* 热门搜索 */}
      {hotSuggestions.length > 0 && (
        <View style={styles.section}>
          {renderSectionHeader('热门搜索')}
          <FlatList
            data={hotSuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `hot-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* 其他建议 */}
      {otherSuggestions.length > 0 && (
        <View style={styles.section}>
          {renderSectionHeader('搜索建议')}
          <FlatList
            data={otherSuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    ...tokens.shadows.md,
  },
  section: {
    paddingVertical: tokens.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: tokens.typography.caption,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.primary,
    fontWeight: tokens.fontWeight.medium,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.body,
    color: tokens.colors.text.primary,
  },
});

export default SearchSuggestions;