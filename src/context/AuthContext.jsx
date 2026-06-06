import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for an existing session
    const user = localStorage.getItem('mockUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Hardcoded credentials
    if (username === 'odourmdu' && password === 'odour123') {
      const user = { uid: 'mock-user-id', username };
      setCurrentUser(user);
      localStorage.setItem('mockUser', JSON.stringify(user));
      return user;
    } else {
      throw new Error('Invalid username or password');
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('mockUser');
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
