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

      {news.map((article, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.newsCard, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NewsDetail', { article })}
        >
          {article.imageUrl && (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.newsImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.newsContent}>
            <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={3}>
              {article.title}
            </Text>
            {article.description && (
              <Text style={[styles.newsDescription, { color: theme.colors.placeholder }]} numberOfLines={2}>
                {article.description}
              </Text>
            )}
            <View style={styles.newsMeta}>
              <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
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
  newsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
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
    height: 200,
    backgroundColor: '#2c2c2e',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 13,
    fontWeight: '600',
  },
  newsDate: {
    fontSize: 13,
  },
  bottomPadding: {
    height: 20,
  },
});
