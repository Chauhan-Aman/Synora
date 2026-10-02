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

const createStates = [
  "const [draftText, setDraftText]",
  "const [coverData, setCoverData]",
  "const [isGeneratingCover, setIsGeneratingCover]",
  "const [draftContext, setDraftContext]",
  "const [isGeneratingParagraph, setIsGeneratingParagraph]",
  "const [isProofreading, setIsProofreading]",
  "const [suggestedParagraph, setSuggestedParagraph]",
  "const [revisionPrompt, setRevisionPrompt]",
  "const [isRevising, setIsRevising]",
  "const [modelConfig, setModelConfig]"
];

let extractedStates = [];
for (const state of createStates) {
  const res = extractState(appCode, state);
  if (res.extracted) extractedStates.push(res.extracted.trim());
  appCode = res.updatedSource;
}

const createFunctions = [
  "const handleProofread = async () => {",
  "const handleRevise = async () => {",
  "const generateCover = async () => {",
  "const generateNextParagraph = async () => {"
];

let extractedFunctions = [];
for (const func of createFunctions) {
  const res = extractBlock(appCode, func);
  if (res.extracted) extractedFunctions.push(res.extracted);
  appCode = res.updatedSource;
}

const useCreateCode = `import { useState } from 'react';

export function useCreate(token: string | null, fetchWithAuth: any, showToast: any) {
  ${extractedStates.join('\n  ')}

  ${extractedFunctions.join('\n\n  ')}

  return {
    draftText, setDraftText,
    coverData, setCoverData,
    isGeneratingCover, setIsGeneratingCover,
    draftContext, setDraftContext,
    isGeneratingParagraph, setIsGeneratingParagraph,
    isProofreading, setIsProofreading,
    suggestedParagraph, setSuggestedParagraph,
    revisionPrompt, setRevisionPrompt,
    isRevising, setIsRevising,
    modelConfig, setModelConfig,
    handleProofread,
    handleRevise,
    generateCover,
    generateNextParagraph
  };
}
`;

fs.writeFileSync('apps/web/src/hooks/useCreate.ts', useCreateCode);
fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useCreate extracted successfully');
