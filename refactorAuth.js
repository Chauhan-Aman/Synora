const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

function extractBlock(source, startStr) {
  const startIdx = source.indexOf(startStr);
  if (startIdx === -1) return { extracted: '', updatedSource: source };
  let endIdx = startIdx;
  let braceCount = 0;
  let started = false;
  for (let i = startIdx; i < source.length; i++) {
    if (source[i] === '{') { braceCount++; started = true; }
    else if (source[i] === '}') braceCount--;
    if (started && braceCount === 0) { endIdx = i + 1; break; }
  }
  const extracted = source.substring(startIdx, endIdx);
  const updatedSource = source.substring(0, startIdx) + source.substring(endIdx);
  return { extracted, updatedSource };
}

// 1. Add hook imports
if (!appCode.includes('import { useAuth }')) {
  appCode = appCode.replace(
    "import React, { useState, useEffect, useRef, useMemo } from 'react';",
    "import React, { useState, useEffect, useRef, useMemo } from 'react';\nimport { useAuth } from './hooks/useAuth';"
  );
}

// 2. Remove old state declarations
const statesToRemove = [
  "const [token, setToken] = useState<string | null>(localStorage.getItem('synora_token'));",
  "const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');",
  "const [email, setEmail] = useState('');",
  "const [password, setPassword] = useState('');",
  "const [authError, setAuthError] = useState('');",
  "const [isAuthenticating, setIsAuthenticating] = useState(false);",
  "const [userPreferences, setUserPreferences] = useState('');",
  "const [isSavingPreferences, setIsSavingPreferences] = useState(false);",
  "const [isSettingsOpen, setIsSettingsOpen] = useState(false);"
];

for (const state of statesToRemove) {
  const lineIdx = appCode.indexOf(state);
  if (lineIdx !== -1) {
    appCode = appCode.substring(0, lineIdx) + appCode.substring(lineIdx + state.length);
  }
}

// 3. Remove functions
appCode = extractBlock(appCode, 'const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {').updatedSource;
appCode = extractBlock(appCode, 'const handleLogin = async (e: React.FormEvent) => {').updatedSource;
appCode = extractBlock(appCode, 'const handleRegister = async (e: React.FormEvent) => {').updatedSource;
appCode = extractBlock(appCode, 'const handleLogout = () => {').updatedSource;

// 4. Remove user preferences fetch effect
// Wait, we don't have a reliable start string for it, I'll leave the effect for now or use the full string.
const effStartStr = "useEffect(() => {\n    if (token && isSettingsOpen) {";
appCode = extractBlock(appCode, effStartStr).updatedSource;

// 5. Inject the hook call
const insertPoint = appCode.indexOf("const [activeTab, setActiveTab] = useState<Tab>('CAPTURE');");
if (insertPoint !== -1) {
  appCode = appCode.substring(0, insertPoint) + `const {
    token, authMode, setAuthMode, email, setEmail, password, setPassword, authError, setAuthError,
    isAuthenticating, userPreferences, setUserPreferences, isSavingPreferences, savePreferences,
    isSettingsOpen, setIsSettingsOpen, fetchWithAuth, handleLogin, handleRegister, handleLogout
  } = useAuth();
  
  ` + appCode.substring(insertPoint);
}

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Refactored useAuth in App.tsx safely');
