import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { newsAPI } from '../utils/api';
import { useTheme } from 'react-native-paper';

// News Card Component
const NewsCard = React.memo(({ article, index, theme }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity activeOpacity={0.9}>
        <View style={[
          styles.newsCard,
          {
            backgroundColor: theme.colors.surface,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 3,
              },
            }),
          },
        ]}>
          <Text style={[styles.newsTitle, { color: theme.colors.text }]}>
            {article.title}
          </Text>
          <View style={styles.newsMeta}>
            <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
              {article.source}
            </Text>
            <Text style={[styles.newsDate, { color: theme.colors.placeholder }]}>
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          {article.description && (
            <Text style={[styles.newsDescription, { color: theme.colors.placeholder }]}>
              {article.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (!loading && news.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, news]);

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

  const onRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await fetchNews();
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
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Business News
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
          Latest financial headlines
        </Text>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {news.map((article, index) => (
          <NewsCard
            key={index}
            article={article}
            index={index}
            theme={theme}
          />
        ))}
      </Animated.View>

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
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newsSource: {
    fontSize: 14,
    fontWeight: '600',
  },
  newsDate: {
    fontSize: 14,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
