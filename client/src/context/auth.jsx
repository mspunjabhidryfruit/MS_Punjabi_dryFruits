import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, post, put, CUSTOMER_KEY, ADMIN_KEY } from '../services/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const isAdminRole = (u) => Boolean(u) && ['admin', 'superadmin'].includes(u.role);
// Admin accounts share their session with the admin panel, so /admin opens without a second sign-in.
const shareWithAdmin = (u, token) => {
  if (isAdminRole(u) && token) { localStorage.setItem(ADMIN_KEY, token); localStorage.setItem('msp_admin_name', u.name); }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem(CUSTOMER_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(CUSTOMER_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem('msp_admin_name');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(CUSTOMER_KEY)) return;
    get('/auth/me')
      .then((r) => { shareWithAdmin(r.data.user, localStorage.getItem(CUSTOMER_KEY)); setUser(r.data.user); })
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [logout]);

  useEffect(() => {
    const h = (e) => { if (!e.detail?.admin) logout(); };
    window.addEventListener('msp:unauthorized', h);
    return () => window.removeEventListener('msp:unauthorized', h);
  }, [logout]);

  const start = (r) => {
    localStorage.setItem(CUSTOMER_KEY, r.data.token);
    shareWithAdmin(r.data.user, r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const value = {
    user, ready, logout, isAdmin: isAdminRole(user),
    login: (b) => post('/auth/login', b).then(start),
    register: (b) => post('/auth/register', b).then(start),
    updateProfile: (b) => put('/auth/profile', b).then((r) => { setUser(r.data.user); return r.data.user; }),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
