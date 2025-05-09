import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';

export interface CodeGenState {
  input: string;
  output: string;
  analysis: any;
  suggestions: string[];
  diff: string | null;
  sessionId: string | null;
  streaming: boolean;
  error: string | null;
  rateLimited: boolean;
  files: File[];
  theme: 'light' | 'dark';
}

const initialState: CodeGenState = {
  input: '',
  output: '',
  analysis: null,
  suggestions: [],
  diff: null,
  sessionId: null,
  streaming: false,
  error: null,
  rateLimited: false,
  files: [],
  theme: 'light',
};

type Action =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_OUTPUT'; payload: string }
  | { type: 'SET_ANALYSIS'; payload: any }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_DIFF'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RATE_LIMITED'; payload: boolean }
  | { type: 'ADD_FILE'; payload: File }
  | { type: 'REMOVE_FILE'; payload: File }
  | { type: 'CLEAR_FILES' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'RESET' };

function reducer(state: CodeGenState, action: Action): CodeGenState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SET_DIFF':
      return { ...state, diff: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_STREAMING':
      return { ...state, streaming: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RATE_LIMITED':
      return { ...state, rateLimited: action.payload };
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter(f => f !== action.payload) };
    case 'CLEAR_FILES':
      return { ...state, files: [] };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'RESET':
      return { ...initialState, theme: state.theme };
    default:
      return state;
  }
}

export const CodeGenContext = createContext<{
  state: CodeGenState;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => undefined });

export const CodeGenProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CodeGenContext.Provider value={{ state, dispatch }}>
      {children}
    </CodeGenContext.Provider>
  );
}; 