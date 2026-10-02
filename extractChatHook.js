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

function extractState(source, stateStr) {
  const lines = source.split('\n');
  const lineIdx = lines.findIndex(l => l.includes(stateStr));
  if (lineIdx === -1) return { extracted: '', updatedSource: source };
  const extracted = lines[lineIdx];
  lines.splice(lineIdx, 1);
  return { extracted, updatedSource: lines.join('\n') };
}

const chatStates = [
  "const [chatQuery, setChatQuery]",
  "const [isChatting, setIsChatting]",
  "const [forceWebSearch, setForceWebSearch]",
  "const [chatHistory, setChatHistory]",
  "const [currentSessionId, setCurrentSessionId]",
  "const [chatSessions, setChatSessions]",
  "const [editingSessionId, setEditingSessionId]",
  "const [editingTitle, setEditingTitle]",
  "const [isListening, setIsListening]",
  "const [isSpeaking, setIsSpeaking]",
  "const [isVoiceEnabled, setIsVoiceEnabled]"
];

let extractedStates = [];
for (const state of chatStates) {
  const res = extractState(appCode, state);
  if (res.extracted) extractedStates.push(res.extracted.trim());
  appCode = res.updatedSource;
}

const chatFunctions = [
  "const loadSession = async (id: string) => {",
  "const renameSession = async (id: string, newTitle: string) => {",
  "const deleteSession = async (id: string) => {",
  "const handleChatSubmit = async (e: React.FormEvent) => {",
  "const stopSpeaking = () => {",
  "const speak = (text: string) => {",
  "const toggleListening = () => {"
];

let extractedFunctions = [];
for (const func of chatFunctions) {
  // if there are multiple toggleListening, we extract the first one
  const res = extractBlock(appCode, func);
  if (res.extracted) extractedFunctions.push(res.extracted);
  appCode = res.updatedSource;
  // If we still have another toggleListening, remove it too
  if (func === "const toggleListening = () => {") {
    const res2 = extractBlock(appCode, func);
    if (res2.extracted) appCode = res2.updatedSource;
  }
}

const useEffectSessions = extractBlock(appCode, "useEffect(() => {\n    if (token) {");
appCode = useEffectSessions.updatedSource;
const useEffectChatScroll = extractBlock(appCode, "useEffect(() => {\n    if (chatEndRef.current) {");
appCode = useEffectChatScroll.updatedSource;
const useEffectVoice = extractBlock(appCode, "useEffect(() => {\n    return () => {\n      stopSpeaking();");
appCode = useEffectVoice.updatedSource;

const useChatCode = `import { useState, useEffect, useRef, RefObject } from 'react';

export function useChat(token: string | null, fetchWithAuth: any) {
  ${extractedStates.join('\n  ')}

  const chatEndRef = useRef<HTMLDivElement>(null);

  ${extractedFunctions.join('\n\n  ')}

  ${useEffectSessions.extracted}

  ${useEffectChatScroll.extracted}

  ${useEffectVoice.extracted}

  return {
    chatQuery, setChatQuery,
    isChatting, setIsChatting,
    forceWebSearch, setForceWebSearch,
    chatHistory, setChatHistory,
    currentSessionId, setCurrentSessionId,
    chatSessions, setChatSessions,
    editingSessionId, setEditingSessionId,
    editingTitle, setEditingTitle,
    isListening, setIsListening,
    isSpeaking, setIsSpeaking,
    isVoiceEnabled, setIsVoiceEnabled,
    chatEndRef,
    loadSession,
    renameSession,
    deleteSession,
    handleChatSubmit,
    stopSpeaking,
    speak,
    toggleListening
  };
}
`;

fs.writeFileSync('apps/web/src/hooks/useChat.ts', useChatCode);
fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useChat extracted successfully');
