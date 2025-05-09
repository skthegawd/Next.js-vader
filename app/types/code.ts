export interface CodeSpecification {
  language: string;
  description: string;
  requirements?: string[];
  dependencies?: string[];
  framework?: string;
  designPatterns?: string[];
}

export interface CodeAnalysis {
  quality: {
    score: number;
    issues: string[];
  };
  security: {
    score: number;
    vulnerabilities: string[];
  };
  performance: {
    score: number;
    bottlenecks: string[];
  };
  maintainability: {
    score: number;
    suggestions: string[];
  };
  bestPractices: {
    score: number;
    recommendations: string[];
  };
}

export interface ExportOptions {
  format: string;
  filename?: string;
  includeTests?: boolean;
  includeDocs?: boolean;
  includeAnalysis?: boolean;
  language?: string;
  dependencies?: string[];
  dockerConfig?: {
    imageName?: string;
    tag?: string;
  };
  githubConfig?: {
    repoName?: string;
    description?: string;
    isPrivate?: boolean;
  };
  packageConfig?: {
    packageName?: string;
    version?: string;
  };
} 