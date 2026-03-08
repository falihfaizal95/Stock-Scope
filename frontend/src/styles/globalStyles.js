import { StyleSheet, Platform } from 'react-native';
import { fontFamily } from '../utils/fonts';

// Global text styles with Apple San Francisco font
export const globalTextStyles = StyleSheet.create({
  // Headers
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
  },
  // Labels
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  // Caption
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

// Apply font to all Text components globally via App.js
export const applyGlobalFonts = () => {
  if (Platform.OS === 'web') {
    if (document.getElementById('stockscope-global-fonts')) return;
    const style = document.createElement('style');
    style.id = 'stockscope-global-fonts';
    style.textContent = `
      html, body, button, input, textarea, select {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* Keep icon font glyphs intact on web (Ionicons/react-native-vector-icons). */
      [style*="Ionicons"],
      [class*="icon"],
      [data-icon] {
        font-family: "Ionicons", "Material Icons", "FontAwesome", sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }
};
