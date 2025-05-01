import { api, ApiClient } from './api';
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

export class ThemeManager {
  private currentTheme: ThemeConfig | null = null;

  async initialize(): Promise<void> {
    try {
      const { data } = await api.getTheme();
      this.currentTheme = this.processThemeData(data);
      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.error('[Theme] Failed to initialize theme:', error);
      this.applyDefaultTheme();
    }
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
  }

  private applyDefaultTheme(): void {
    const defaultTheme: ThemeConfig = {
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

    this.applyTheme(defaultTheme);
  }

  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  generateCssVariables(): string {
    if (!this.currentTheme) return '';

    const { colors, fonts } = this.currentTheme;
    let css = ':root {\n';

    // Add color variables
    Object.entries(colors).forEach(([key, value]) => {
      css += `  --death-star-${key}: ${value};\n`;
    });

    // Add font variables
    Object.entries(fonts).forEach(([key, value]) => {
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