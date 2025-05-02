declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

interface ThemeData {
  name: string;
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
  fonts: {
    primary?: string;
    secondary?: string;
    [key: string]: string | undefined;
  };
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
} 