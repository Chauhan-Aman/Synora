import { useState, useCallback, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('synora_token'));
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userPreferences, setUserPreferences] = useState('');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Not authenticated');
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` } as any;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    } else {
      delete headers['Content-Type'];
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      setToken(null);
      localStorage.removeItem('synora_token');
      throw new Error('Session expired');
    }
    return response;
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      setToken(data.access_token);
      localStorage.setItem('synora_token', data.access_token);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setAuthMode('LOGIN');
      setAuthError('Registration successful! Please login.');
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('synora_token');
  };

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await fetchWithAuth('http://localhost:3001/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: userPreferences })
      });
      // Optionally show toast success here if needed
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  useEffect(() => {
    if (token && isSettingsOpen) {
      fetchWithAuth('http://localhost:3001/auth/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.preferences) setUserPreferences(data.preferences);
        })
        .catch(console.error);
    }
  }, [token, isSettingsOpen, fetchWithAuth]);

  return {
    token,
    authMode, setAuthMode,
    email, setEmail,
    password, setPassword,
    authError, setAuthError,
    isAuthenticating,
    userPreferences, setUserPreferences,
    isSavingPreferences, savePreferences,
    isSettingsOpen, setIsSettingsOpen,
    fetchWithAuth,
    handleLogin,
    handleRegister,
    handleLogout
  };
}
