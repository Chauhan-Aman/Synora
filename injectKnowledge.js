const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

if (!appCode.includes('import { useKnowledge }')) {
  appCode = appCode.replace(
    "import { useAuth } from './hooks/useAuth';",
    "import { useAuth } from './hooks/useAuth';\nimport { useKnowledge } from './hooks/useKnowledge';"
  );
}

const authInsert = appCode.indexOf('} = useAuth();') + 14;

appCode = appCode.substring(0, authInsert) + `
  const {
    artifacts, setArtifacts, graphData, setGraphData, isLoadingKnowledge, setIsLoadingKnowledge,
    knowledgeView, setKnowledgeView, showWebSearches, setShowWebSearches, selectedNode, setSelectedNode,
    graphSearchQuery, setGraphSearchQuery, graphSearchSelectedIndex, setGraphSearchSelectedIndex,
    artifactDiagram, setArtifactDiagram, isGeneratingDiagram, setIsGeneratingDiagram,
    selectedArtifact, setSelectedArtifact, annotations, setAnnotations, newAnnotation, setNewAnnotation,
    collections, setCollections, insights, setInsights, isGeneratingInsights, setIsGeneratingInsights,
    selectedCollectionId, setSelectedCollectionId, showNewCollectionModal, setShowNewCollectionModal,
    newCollectionName, setNewCollectionName, showAddToCollectionModal, setShowAddToCollectionModal,
    showCollections, setShowCollections, wikiSummary, setWikiSummary, isFetchingWiki, setIsFetchingWiki,
    graphDimensions, setGraphDimensions, fetchKnowledge, fetchWiki, handleGenerateSummary,
    handleFormat, handleTranslate
  } = useKnowledge(token, activeTab, fetchWithAuth, showToast, graphContainerRef);
` + appCode.substring(authInsert);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useKnowledge hooked into App.tsx');
