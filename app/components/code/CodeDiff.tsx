import React from 'react';
import { Card, Typography } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const { Text } = Typography;

interface CodeDiffProps {
  diff: string;
}

export const CodeDiff: React.FC<CodeDiffProps> = ({ diff }) => {
  return (
    <Card title="Code Changes">
      <SyntaxHighlighter
        language="diff"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem'
        }}
      >
        {diff}
      </SyntaxHighlighter>
    </Card>
  );
}; 