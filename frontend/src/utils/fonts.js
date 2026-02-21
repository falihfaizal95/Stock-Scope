import { Platform } from 'react-native';

// Apple San Francisco font configuration
export const fontFamily = {
  // iOS uses San Francisco by default
  // For web, use system fonts that match
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  }),
};
