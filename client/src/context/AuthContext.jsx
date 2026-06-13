import { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('bugtrack_user');
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (token, userData) => {
    localStorage.setItem('bugtrack_token', token);
    localStorage.setItem('bugtrack_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persist(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('bugtrack_token');
    localStorage.removeItem('bugtrack_user');
    setUser(null);
  };

  // role helpers used to show/hide UI actions (server enforces them too)
  const can = useMemo(
    () => ({
      manageProjects: user?.role === 'manager',
      editTests: ['qa', 'manager'].includes(user?.role),
      executeTests: ['qa', 'manager'].includes(user?.role),
      closeBugs: ['qa', 'manager'].includes(user?.role),
      resolveBugs: ['developer', 'manager'].includes(user?.role),
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, can, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
