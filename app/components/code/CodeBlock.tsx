import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  showLineNumbers = true
}) => {
  return (
    <div className="rounded-lg overflow-hidden">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}; 