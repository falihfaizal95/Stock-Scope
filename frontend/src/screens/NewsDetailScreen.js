import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

export default function NewsDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { article } = route.params;
  const theme = useTheme();

  const handleOpenLink = () => {
    if (article.url) {
      Linking.openURL(article.url);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {article.imageUrl && (
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.headerImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <View style={styles.metaContainer}>
          <Text style={[styles.source, { color: theme.colors.primary }]}>
            {article.source}
          </Text>
          <Text style={[styles.date, { color: theme.colors.placeholder }]}>
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {article.author && (
            <Text style={[styles.author, { color: theme.colors.placeholder }]}>
              By {article.author}
            </Text>
          )}
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {article.title}
        </Text>

        {article.description && (
          <Text style={[styles.description, { color: theme.colors.placeholder }]}>
            {article.description}
          </Text>
        )}

        {article.content && (
          <View style={[styles.contentCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.contentText, { color: theme.colors.text }]}>
              {article.content.replace(/\[\+[0-9]+ chars\]/g, '')}
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleOpenLink}
          style={styles.readMoreButton}
          buttonColor={theme.colors.primary}
          textColor="#000"
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
          contentStyle={{ paddingVertical: 8 }}
        >
          Read Full Article
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: screenWidth,
    height: 250,
    backgroundColor: '#2c2c2e',
  },
  content: {
    padding: 20,
  },
  metaContainer: {
    marginBottom: 20,
  },
  source: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  contentCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  readMoreButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});
