import { useState } from 'react';

export function useCreate(token: string | null, fetchWithAuth: any, showToast: any) {
  const [draftText, setDraftText] = useState("");
  const [coverData, setCoverData] = useState<any>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [draftContext, setDraftContext] = useState<any[]>([]);
  const [isGeneratingParagraph, setIsGeneratingParagraph] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);
  const [suggestedParagraph, setSuggestedParagraph] = useState<string>("");
  const [revisionPrompt, setRevisionPrompt] = useState<string>("");
  const [isRevising, setIsRevising] = useState(false);
  const [modelConfig, setModelConfig] = useState(localStorage.getItem('synora_model') || 'auto');

  const handleProofread = async () => {
    if (!draftText.trim() || isProofreading) return;
    setIsProofreading(true);
    try {
      const res = await fetchWithAuth('http://localhost:3001/create/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, model: modelConfig })
      });
      const data = await res.json();
      if (data.proofreadText) {
        setDraftText(data.proofreadText);
      }
    } catch (error) {
      console.error("Error proofreading document:", error);
    } finally {
      setIsProofreading(false);
    }
  }

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
