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

const screenWidth = Dimensions.get('window').width;

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await newsAPI.getNewsFeed();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Business News
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
          Latest financial headlines
        </Text>
      </View>

      <View style={styles.newsGrid}>
        {news.map((article, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.newsCard, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('NewsDetail', { article })}
          >
            {article.imageUrl ? (
              <Image
                source={{ uri: article.imageUrl }}
                style={styles.newsImage}
                resizeMode="cover"
                onError={() => {}}
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
        ))}
      </View>

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
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
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
});
