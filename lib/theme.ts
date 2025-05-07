import api from './api';
import { Config } from './config';
import type { ThemeData } from './types';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  [key: string]: string;
}

interface ThemeFont {
  family: string;
  weight: number | string;
  size: string;
}

interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  fonts: {
    primary: ThemeFont;
    secondary: ThemeFont;
  };
}

class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: ThemeConfig | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.currentTheme = this.loadThemeFromStorage() || Config.DEFAULT_THEME;
      this.applyTheme(this.currentTheme);
    }
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private loadThemeFromStorage(): ThemeConfig | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(Config.THEME_STORAGE_KEY);
      if (!stored) return null;
      
      const theme = JSON.parse(stored);
      // Validate theme structure
      if (!theme.colors || !theme.fonts || !theme.name) {
        return null;
      }
      return theme;
    } catch (error) {
      console.warn('[Theme] Failed to parse stored theme:', error);
      return null;
    }
  }

  public async initialize(): Promise<{ theme: string }> {
    try {
      // First try to load from storage
      const storedTheme = this.loadThemeFromStorage();
      if (storedTheme) {
        this.currentTheme = storedTheme;
        this.applyTheme(storedTheme);
        return { theme: storedTheme.name };
      }

      // Then try to get from API
      const { data } = await api.getTheme();
      const theme = this.processThemeData(data);
      this.currentTheme = theme;
      this.applyTheme(theme);
      return { theme: theme.name };
    } catch (error) {
      let errorMsg = '';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object') {
        try {
          errorMsg = JSON.stringify(error);
        } catch {
          errorMsg = String(error);
        }
      } else {
        errorMsg = String(error);
      }
      console.warn('[Theme] Failed to initialize theme from API, using default:', errorMsg);
      // Use default theme from config
      const defaultTheme = Config.DEFAULT_THEME;
      this.currentTheme = defaultTheme;
      this.applyTheme(defaultTheme);
      return { theme: defaultTheme.name };
    }
  }

  public getCurrentTheme(): ThemeConfig {
    return this.currentTheme || Config.DEFAULT_THEME;
  }

  private processThemeData(data: ThemeData): ThemeConfig {
    const defaultTheme = Config.DEFAULT_THEME;
    return {
      name: data.name || defaultTheme.name,
      colors: {
        ...defaultTheme.colors,
        ...data.colors,
      },
      fonts: {
        primary: {
          ...defaultTheme.fonts.primary,
          family: data.fonts.primary || defaultTheme.fonts.primary.family,
        },
        secondary: {
          ...defaultTheme.fonts.secondary,
          family: data.fonts.secondary || defaultTheme.fonts.secondary.family,
        },
      },
    };
  }

  private applyTheme(theme: ThemeConfig): void {
    if (typeof window === 'undefined') return;

    try {
      document.documentElement.setAttribute('data-theme', theme.name);

      // Apply colors
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--death-star-${key}`, value);
      });

      // Apply fonts
      document.documentElement.style.setProperty(
        '--death-star-font-primary',
        theme.fonts.primary.family
      );
      document.documentElement.style.setProperty(
        '--death-star-font-secondary',
        theme.fonts.secondary.family
      );

      // Store theme
      localStorage.setItem(Config.THEME_STORAGE_KEY, JSON.stringify(theme));
      this.currentTheme = theme;
    } catch (error) {
      console.error('[Theme] Failed to apply theme:', error);
    }
  }

  public generateCssVariables(): string {
    const theme = this.getCurrentTheme();
    let css = ':root {\n';

    // Add colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --death-star-${key}: ${value};\n`;
    });

    // Add fonts
    Object.entries(theme.fonts).forEach(([key, value]) => {
      css += `  --death-star-font-${key}: ${value.family};\n`;
      css += `  --death-star-font-${key}-weight: ${value.weight};\n`;
      css += `  --death-star-font-${key}-size: ${value.size};\n`;
    });

    css += '}\n';
    return css;
  }
}

export default ThemeManager; 