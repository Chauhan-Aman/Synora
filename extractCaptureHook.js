const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// extractBlock function
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

const captureStates = [
  "const [inputType, setInputType]",
  "const [inputValue, setInputValue]",
  "const [selectedFile, setSelectedFile]",
  "const [isSubmitting, setIsSubmitting]",
  "const [status, setStatus]",
  "const [artifactId, setArtifactId]"
];

let extractedStates = [];
for (const state of captureStates) {
  const res = extractState(appCode, state);
  if (res.extracted) extractedStates.push(res.extracted.trim());
  appCode = res.updatedSource;
}

const resSubmit = extractBlock(appCode, "const handleCaptureSubmit = async (e: React.FormEvent) => {");
appCode = resSubmit.updatedSource;

// useEffect for voice
const resVoiceEffect = extractBlock(appCode, "useEffect(() => {\n    if (isListening) {\n      if (!('webkitSpeechRecognition' in window)) {");
appCode = resVoiceEffect.updatedSource;

const resVoiceStopEffect = extractBlock(appCode, "useEffect(() => {\n    return () => {\n      if (recognitionRef.current) {\n        recognitionRef.current.stop();");
appCode = resVoiceStopEffect.updatedSource;


// create useCapture
const useCaptureCode = `import { useState, useEffect, useRef } from 'react';

export function useCapture(token: string | null, fetchWithAuth: any, fetchKnowledge: any, showToast: any, isListening: boolean, toggleListening: any) {
  ${extractedStates.join('\n  ')}

  const recognitionRef = useRef<any>(null);

  ${resVoiceEffect.extracted}

  ${resVoiceStopEffect.extracted}

  ${resSubmit.extracted}

  return {
    inputType, setInputType,
    inputValue, setInputValue,
    selectedFile, setSelectedFile,
    isSubmitting, setIsSubmitting,
    status, setStatus,
    artifactId, setArtifactId,
    handleCaptureSubmit
  };
}
`;

fs.writeFileSync('apps/web/src/hooks/useCapture.ts', useCaptureCode);
fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useCapture extracted successfully');
