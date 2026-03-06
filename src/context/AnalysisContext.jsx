import { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext(null);

/**
 * Provider that holds the latest analysis result and the original input text
 * so any page can read them after navigation.
 */
export function AnalysisProvider({ children }) {
  const [result, setResult] = useState(null);       // API response
  const [inputText, setInputText] = useState('');    // text that was analyzed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const value = {
    result,
    setResult,
    inputText,
    setInputText,
    loading,
    setLoading,
    error,
    setError,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

/**
 * Hook to consume analysis context.
 */
export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within <AnalysisProvider>');
  return ctx;
}
