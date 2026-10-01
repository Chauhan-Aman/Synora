import { useState, useEffect, useCallback, RefObject } from 'react';

export function useKnowledge(token: string | null, activeTab: string, fetchWithAuth: any, showToast: any, graphContainerRef: RefObject<HTMLDivElement>) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [knowledgeView, setKnowledgeView] = useState<'LIST' | 'GRAPH' | 'INSIGHTS'>('LIST');
  const [showWebSearches, setShowWebSearches] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphSearchQuery, setGraphSearchQuery] = useState("");
  const [graphSearchSelectedIndex, setGraphSearchSelectedIndex] = useState(0);
  const [artifactDiagram, setArtifactDiagram] = useState<string | null>(null);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState<{artifactId: string} | null>(null);
  const [showCollections, setShowCollections] = useState(true);
  const [wikiSummary, setWikiSummary] = useState<string | null>(null);
  const [isFetchingWiki, setIsFetchingWiki] = useState(false);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  const fetchKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const [topicsRes, entitiesRes, graphRes, artifactsRes, collectionsRes, insightsRes] = await Promise.all([
        fetchWithAuth('http://localhost:3001/knowledge/topics'),
        fetchWithAuth('http://localhost:3001/knowledge/entities'),
        fetchWithAuth('http://localhost:3001/knowledge/graph'),
        fetchWithAuth('http://localhost:3001/knowledge/artifacts'),
        fetchWithAuth('http://localhost:3001/knowledge/collections'),
        fetchWithAuth('http://localhost:3001/knowledge/insights')
      ]);
      const topicsData = await topicsRes.json();
      const entitiesData = await entitiesRes.json();
      const graphDataJson = await graphRes.json();
      const artifactsData = await artifactsRes.json();
      const collectionsData = await collectionsRes.json();
      const insightsData = await insightsRes.json();

      setTopics(topicsRes.ok ? topicsData : []);
      setEntities(entitiesRes.ok ? entitiesData : []);
      setGraphData(graphRes.ok ? graphDataJson : { nodes: [], links: [] });
      setArtifacts(artifactsRes.ok ? artifactsData : []);
      setCollections(collectionsRes.ok ? collectionsData : []);
      setInsights(insightsRes.ok ? insightsData : []);
      
      if (!topicsRes.ok) console.error("Topics Error:", topicsData);
      if (!entitiesRes.ok) console.error("Entities Error:", entitiesData);
      if (!graphRes.ok) console.error("Graph Error:", graphDataJson);
      if (!artifactsRes.ok) console.error("Artifacts Error:", artifactsData);
    } catch (err: any) {
      console.error("Failed to fetch knowledge graph", err);
    } finally {
      setIsLoadingKnowledge(false);
    }
  }

  const fetchWiki = async (topic: string) => {
    setIsFetchingWiki(true);
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (data.extract) {
        setWikiSummary(data.extract);
      } else {
        setWikiSummary("No article found for this concept on Wikipedia.");
      }
    } catch (e) {
      setWikiSummary("Failed to fetch article.");
    }
    setIsFetchingWiki(false);
  }

  

  

  

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
