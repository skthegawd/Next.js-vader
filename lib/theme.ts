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
  private static instance: ThemeManager | null = null;
  private currentTheme: ThemeConfig | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.currentTheme = this.loadThemeFromStorage() || this.getDefaultTheme();
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
      const { data } = await api.getTheme();
      const theme = this.processThemeData(data);
      this.currentTheme = theme;
      this.applyTheme(theme);
      return { theme: theme.name };
    } catch (error) {
      console.error('[Theme] Failed to initialize theme:', error);
      const defaultTheme = this.getDefaultTheme();
      this.currentTheme = defaultTheme;
      this.applyTheme(defaultTheme);
      return { theme: defaultTheme.name };
    }
  }

  public getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  private processThemeData(data: ThemeData): ThemeConfig {
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

  private applyTheme(theme: ThemeConfig): void {
    if (typeof window === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme.name);

    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--death-star-${key}`, value);
    });

    document.documentElement.style.setProperty(
      '--death-star-font-primary',
      theme.fonts.primary.family
    );
    document.documentElement.style.setProperty(
      '--death-star-font-secondary',
      theme.fonts.secondary.family
    );

    localStorage.setItem('death-star-theme', JSON.stringify(theme));
    this.currentTheme = theme;
  }

  public generateCssVariables(): string {
    const theme = this.currentTheme || this.getDefaultTheme();
    let css = ':root {\n';

    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --death-star-${key}: ${value};\n`;
    });

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