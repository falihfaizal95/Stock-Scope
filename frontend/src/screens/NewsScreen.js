import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { newsAPI } from '../utils/api';
import { useTheme } from 'react-native-paper';
import { subscribeNewsRefresh } from '../utils/newsRefresh';

const screenWidth = Dimensions.get('window').width;
const DEFAULT_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1642052502203-a2e4f4f1a4b7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
];

const hashString = (value = '') =>
  String(value).split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 0);

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNewsRefresh(() => {
      setRefreshing(true);
      fetchNews();
    });
    return unsubscribe;
  }, []);

  const fetchNews = async () => {
    try {
      const data = await newsAPI.getNewsFeed();
      setNews(Array.isArray(data) ? data : []);
      setImageErrorMap({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching news:', error);
      setErrorMessage('Unable to load live news right now. Pull to retry.');
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const resolveImageForIndex = (article, index, usedUriCount) => {
    const key = `${article.url || article.title || index}_${index}`;
    const fallbackIndexOffset = imageErrorMap[key] || 0;
    const hashSeed = hashString(`${article.source || ''}-${article.title || ''}`);
    const fallbackImage = DEFAULT_NEWS_IMAGES[(hashSeed + fallbackIndexOffset) % DEFAULT_NEWS_IMAGES.length];
    let primaryImage = fallbackIndexOffset > 0
      ? fallbackImage
      : (article.imageUrl || fallbackImage);
    const duplicateCount = usedUriCount.get(primaryImage) || 0;
    if (duplicateCount > 0) {
      primaryImage = DEFAULT_NEWS_IMAGES[(hashSeed + duplicateCount + fallbackIndexOffset + index) % DEFAULT_NEWS_IMAGES.length];
    }
    usedUriCount.set(primaryImage, (usedUriCount.get(primaryImage) || 0) + 1);
    return { imageUri: primaryImage, imageKey: key };
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>
          Loading news...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Business News
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
              Latest financial headlines
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.refreshButton, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.newsGrid}>
        {(() => {
          const usedUriCount = new Map();
          return news.map((article, index) => (
          (() => {
            const { imageUri, imageKey } = resolveImageForIndex(article, index, usedUriCount);
            return (
          <TouchableOpacity
            key={article.url || article.title || String(index)}
            style={[styles.newsCard, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('NewsDetail', { article })}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.newsImage}
                resizeMode="cover"
                onError={() => {
                  setImageErrorMap((prev) => ({
                    ...prev,
                    [imageKey]: (prev[imageKey] || 0) + 1,
                  }));
                }}
              />
            ) : (
              <View style={[styles.newsImagePlaceholder, { backgroundColor: theme.colors.border }]}>
                <Text style={[styles.placeholderText, { color: theme.colors.placeholder }]}>
                  {article.source?.charAt(0) || 'N'}
                </Text>
              </View>
            )}
            <View style={styles.newsContent}>
              <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={3}>
                {article.title}
              </Text>
              <View style={styles.newsMeta}>
                <Text style={[styles.newsSource, { color: theme.colors.primary }]} numberOfLines={1}>
                  {article.source}
                </Text>
                <Text style={[styles.newsDate, { color: theme.colors.placeholder }]}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
            );
          })()
          ));
        })()}
      </View>

      {news.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No news available</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.placeholder }]}>
            {errorMessage || 'Try refreshing in a moment.'}
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  refreshButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  newsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  newsCard: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newsImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#2c2c2e',
    alignSelf: 'center',
  },
  newsImagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
  },
  newsContent: {
    padding: 12,
    minHeight: 100,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  newsSource: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  newsDate: {
    fontSize: 11,
  },
  bottomPadding: {
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
