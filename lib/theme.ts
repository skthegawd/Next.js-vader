import api from './api';
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
  private currentTheme: ThemeConfig | null = null;

  constructor() {
    this.currentTheme = this.loadThemeFromStorage() || this.getDefaultTheme();
  }

  private loadThemeFromStorage(): ThemeConfig | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('death-star-theme');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('[Theme] Failed to parse stored theme:', error);
      return null;
    }
  }

  private getDefaultTheme(): ThemeConfig {
    return {
      name: 'default',
      colors: {
        primary: '#FF0000',
        secondary: '#000000',
        background: '#1A1A1A',
        text: '#FFFFFF',
        accent: '#FFE81F',
      },
      fonts: {
        primary: {
          family: 'system-ui',
          weight: 400,
          size: '16px',
        },
        secondary: {
          family: 'system-ui',
          weight: 400,
          size: '14px',
        },
      },
    };
  }

  public async initialize(): Promise<{ theme: string }> {
    try {
      // Try to get theme from API
      const { data } = await api.getTheme();
      const theme = this.processThemeData(data);
      this.currentTheme = theme;
      this.applyTheme(theme);
      return { theme: theme.name };
    } catch (error) {
      console.error('[Theme] Failed to initialize theme:', error);
      // Fall back to default theme
      const defaultTheme = this.getDefaultTheme();
      this.currentTheme = defaultTheme;
      this.applyTheme(defaultTheme);
      return { theme: defaultTheme.name };
    }
  }

  public getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  public processThemeData(data: ThemeData): ThemeConfig {
    return {
      name: data.name,
      colors: {
        primary: data.colors.primary || '#FF0000',
        secondary: data.colors.secondary || '#000000',
        background: data.colors.background || '#1A1A1A',
        text: data.colors.text || '#FFFFFF',
        accent: data.colors.accent || '#FFE81F',
        ...data.colors,
      },
      fonts: {
        primary: {
          family: data.fonts.primary || 'system-ui',
          weight: 400,
          size: '16px',
        },
        secondary: {
          family: data.fonts.secondary || 'system-ui',
          weight: 400,
          size: '14px',
        },
      },
    };
  }

  public applyTheme(theme: ThemeConfig): void {
    if (typeof window === 'undefined') return;

    // Set theme name as data attribute
    document.documentElement.setAttribute('data-theme', theme.name);

    // Apply colors as CSS variables
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

    // Store theme in localStorage for persistence
    localStorage.setItem('death-star-theme', JSON.stringify(theme));
    this.currentTheme = theme;
  }

  public generateCssVariables(): string {
    const theme = this.currentTheme || this.getDefaultTheme();
    let css = ':root {\n';

    // Add color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --death-star-${key}: ${value};\n`;
    });

    // Add font variables
    Object.entries(theme.fonts).forEach(([key, value]) => {
      css += `  --death-star-font-${key}: ${value.family};\n`;
      css += `  --death-star-font-${key}-weight: ${value.weight};\n`;
      css += `  --death-star-font-${key}-size: ${value.size};\n`;
    });

    css += '}\n';
    return css;
  }
}

const themeManager = new ThemeManager();
export default themeManager; 