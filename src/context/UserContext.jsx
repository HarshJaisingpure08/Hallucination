import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY = 'factless_user_name';

export function UserProvider({ children }) {
  const [userName, setUserNameState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!userName) {
      setShowPrompt(true);
    }
  }, []);

  const setUserName = (name) => {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setUserNameState(trimmed);
      setShowPrompt(false);
    }
  };

  const clearUser = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserNameState('');
    setShowPrompt(true);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, clearUser, showPrompt, setShowPrompt }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
