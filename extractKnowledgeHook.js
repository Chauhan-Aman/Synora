const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// A function to extract a block (function, useEffect) and remove it from source
function extractBlock(source, startStr) {
  const startIdx = source.indexOf(startStr);
  if (startIdx === -1) return { extracted: '', updatedSource: source };
  
  let endIdx = startIdx;
  let braceCount = 0;
  let started = false;
  
  for (let i = startIdx; i < source.length; i++) {
    if (source[i] === '{') {
      braceCount++;
      started = true;
    } else if (source[i] === '}') {
      braceCount--;
    }
    
    if (started && braceCount === 0) {
      endIdx = i + 1;
      break;
    }
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

// 1. We will extract all knowledge-related state
const knowledgeStates = [
  "const [artifacts, setArtifacts]",
  "const [graphData, setGraphData]",
  "const [isLoadingKnowledge, setIsLoadingKnowledge]",
  "const [knowledgeView, setKnowledgeView]",
  "const [showWebSearches, setShowWebSearches]",
  "const [selectedNode, setSelectedNode]",
  "const [graphSearchQuery, setGraphSearchQuery]",
  "const [graphSearchSelectedIndex, setGraphSearchSelectedIndex]",
  "const [artifactDiagram, setArtifactDiagram]",
  "const [isGeneratingDiagram, setIsGeneratingDiagram]",
  "const [selectedArtifact, setSelectedArtifact]",
  "const [annotations, setAnnotations]",
  "const [newAnnotation, setNewAnnotation]",
  "const [collections, setCollections]",
  "const [insights, setInsights]",
  "const [isGeneratingInsights, setIsGeneratingInsights]",
  "const [selectedCollectionId, setSelectedCollectionId]",
  "const [showNewCollectionModal, setShowNewCollectionModal]",
  "const [newCollectionName, setNewCollectionName]",
  "const [showAddToCollectionModal, setShowAddToCollectionModal]",
  "const [showCollections, setShowCollections]",
  "const [wikiSummary, setWikiSummary]",
  "const [isFetchingWiki, setIsFetchingWiki]",
  "const [graphDimensions, setGraphDimensions]"
];

let extractedStates = [];
for (const state of knowledgeStates) {
  const res = extractState(appCode, state);
  if (res.extracted) extractedStates.push(res.extracted.trim());
  appCode = res.updatedSource;
}

const knowledgeFunctions = [
  "const fetchKnowledge = async () => {",
  "const fetchWiki = async (topic: string) => {",
  "const handleGenerateSummary = async () => {",
  "const handleFormat = async () => {",
  "const handleTranslate = async () => {"
];

let extractedFunctions = [];
for (const func of knowledgeFunctions) {
  const res = extractBlock(appCode, func);
  if (res.extracted) extractedFunctions.push(res.extracted);
  appCode = res.updatedSource;
}

// Extract the useEffect for loading knowledge
const useEffectKnowledgeRes = extractBlock(appCode, "useEffect(() => {\n    if (token && activeTab === 'KNOWLEDGE') fetchKnowledge();");
appCode = useEffectKnowledgeRes.updatedSource;
const useEffectWikiRes = extractBlock(appCode, "useEffect(() => {\n    if (selectedNode) {");
appCode = useEffectWikiRes.updatedSource;
const useEffectContainerRes = extractBlock(appCode, "useEffect(() => {\n    const updateDimensions = () => {");
appCode = useEffectContainerRes.updatedSource;


// create useKnowledge
const useKnowledgeCode = `import { useState, useEffect, useCallback, RefObject } from 'react';

export function useKnowledge(token: string | null, activeTab: string, fetchWithAuth: any, showToast: any, graphContainerRef: RefObject<HTMLDivElement>) {
  ${extractedStates.join('\n  ')}

  ${extractedFunctions.join('\n\n  ')}

  ${useEffectKnowledgeRes.extracted}

  ${useEffectWikiRes.extracted}

  ${useEffectContainerRes.extracted}

  return {
    artifacts, setArtifacts,
    graphData, setGraphData,
    isLoadingKnowledge, setIsLoadingKnowledge,
    knowledgeView, setKnowledgeView,
    showWebSearches, setShowWebSearches,
    selectedNode, setSelectedNode,
    graphSearchQuery, setGraphSearchQuery,
    graphSearchSelectedIndex, setGraphSearchSelectedIndex,
    artifactDiagram, setArtifactDiagram,
    isGeneratingDiagram, setIsGeneratingDiagram,
    selectedArtifact, setSelectedArtifact,
    annotations, setAnnotations,
    newAnnotation, setNewAnnotation,
    collections, setCollections,
    insights, setInsights,
    isGeneratingInsights, setIsGeneratingInsights,
    selectedCollectionId, setSelectedCollectionId,
    showNewCollectionModal, setShowNewCollectionModal,
    newCollectionName, setNewCollectionName,
    showAddToCollectionModal, setShowAddToCollectionModal,
    showCollections, setShowCollections,
    wikiSummary, setWikiSummary,
    isFetchingWiki, setIsFetchingWiki,
    graphDimensions, setGraphDimensions,
    fetchKnowledge,
    fetchWiki,
    handleGenerateSummary,
    handleFormat,
    handleTranslate
  };
}
`;

fs.writeFileSync('apps/web/src/hooks/useKnowledge.ts', useKnowledgeCode);
fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useKnowledge extracted successfully');
