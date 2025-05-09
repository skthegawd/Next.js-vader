import React, { useContext, useRef } from 'react';
import { CodeGenProvider, CodeGenContext } from '../context/CodeGenContext';
import useCodeGenService from '../hooks/useCodeGenService';
import AnalysisRadarChart from './AnalysisRadarChart';
import ImprovementSuggestions from './ImprovementSuggestions';
import CodeDiffViewer from './CodeDiffViewer';
import FileUpload from './FileUpload';
import DownloadExport from './DownloadExport';
import { ThemeProvider } from '../theme';

const CodeGenerator: React.FC = () => {
  const {
    state: {
      input, output, analysis, suggestions, diff, sessionId, streaming, error, rateLimited, files, theme
    },
    dispatch
  } = useContext(CodeGenContext);
  const { generateCode, uploadFile, downloadResult } = useCodeGenService(dispatch);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    await generateCode(input, files);
  };

  const handleFileUpload = async (file: File) => {
    await uploadFile(file);
  };

  const handleDownload = () => {
    downloadResult(output);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="codegen-container">
        <header>
          <h1>AI Code Generator & Analyzer</h1>
          <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} aria-label="Toggle theme">🌓</button>
        </header>
        <section className="input-section">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
            placeholder="Describe what you want to generate or analyze..."
            aria-label="Prompt input"
            rows={6}
          />
          <FileUpload onUpload={handleFileUpload} />
          <button onClick={handleGenerate} disabled={streaming || rateLimited}>Generate</button>
        </section>
        {error && <div className="error">{error}</div>}
        {rateLimited && <div className="rate-limit">You are being rate limited. Please wait and try again.</div>}
        <section className="output-section">
          <h2>Generated Code</h2>
          <pre className="output" aria-live="polite">{output}</pre>
          <DownloadExport onDownload={handleDownload} />
        </section>
        {diff && <CodeDiffViewer diff={diff} />}
        {analysis && <AnalysisRadarChart analysis={analysis} />}
        {suggestions && <ImprovementSuggestions suggestions={suggestions} />}
      </div>
    </ThemeProvider>
  );
};

const CodeGeneratorWithProvider: React.FC = () => (
  <CodeGenProvider>
    <CodeGenerator />
  </CodeGenProvider>
);

export default CodeGeneratorWithProvider; 