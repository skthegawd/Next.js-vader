import { Dispatch } from 'react';
import { CodeGenState } from '../context/CodeGenContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function useCodeGenService(dispatch: Dispatch<any>) {
  // Generate code or analyze
  const generateCode = async (input: string, files: File[]) => {
    dispatch({ type: 'SET_STREAMING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_RATE_LIMITED', payload: false });
    try {
      const formData = new FormData();
      formData.append('prompt', input);
      files.forEach(f => formData.append('files', f));
      // Optionally add sessionId if needed
      // formData.append('sessionId', sessionId);
      const res = await fetch(`${API_URL}/api/codegen`, {
        method: 'POST',
        body: formData,
      });
      if (res.status === 429) {
        dispatch({ type: 'SET_RATE_LIMITED', payload: true });
        dispatch({ type: 'SET_STREAMING', payload: false });
        return;
      }
      if (!res.ok) {
        const err = await res.text();
        dispatch({ type: 'SET_ERROR', payload: err });
        dispatch({ type: 'SET_STREAMING', payload: false });
        return;
      }
      const data = await res.json();
      dispatch({ type: 'SET_OUTPUT', payload: data.output || '' });
      dispatch({ type: 'SET_ANALYSIS', payload: data.analysis || null });
      dispatch({ type: 'SET_SUGGESTIONS', payload: data.suggestions || [] });
      dispatch({ type: 'SET_DIFF', payload: data.diff || null });
      dispatch({ type: 'SET_SESSION_ID', payload: data.sessionId || null });
      dispatch({ type: 'SET_STREAMING', payload: false });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      dispatch({ type: 'SET_STREAMING', payload: false });
    }
  };

  // File upload (standalone, if needed)
  const uploadFile = async (file: File) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.text();
        dispatch({ type: 'SET_ERROR', payload: err });
        return;
      }
      dispatch({ type: 'ADD_FILE', payload: file });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  };

  // Download/export result
  const downloadResult = (output: string) => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return { generateCode, uploadFile, downloadResult };
}

export default useCodeGenService; 