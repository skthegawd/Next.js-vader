import React from 'react';

interface CodeDiffViewerProps {
  diff: string;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ diff }) => {
  if (!diff) return null;
  return (
    <div className="code-diff-viewer">
      <h3>Code Diff</h3>
      <pre className="diff" aria-label="Code diff">{diff}</pre>
    </div>
  );
};

export default CodeDiffViewer; 