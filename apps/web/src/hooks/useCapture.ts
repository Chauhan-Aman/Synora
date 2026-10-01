import { useState, useEffect, useRef } from 'react';

export function useCapture(token: string | null, fetchWithAuth: any, fetchKnowledge: any, showToast: any, isListening: boolean, toggleListening: any) {
  const [inputType, setInputType] = useState<InputType>('URL');
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [artifactId, setArtifactId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  

  

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType === 'FILE' && !selectedFile) return;
    if (inputType !== 'FILE' && !inputValue.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setArtifactId(null);

    try {
      let response;
      if (inputType === 'FILE') {
        const formData = new FormData();
        formData.append('file', selectedFile as File);
        
        response = await fetchWithAuth('http://localhost:3001/capture/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetchWithAuth('http://localhost:3001/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: inputType === 'VOICE' ? 'TEXT' : inputType,
            [inputType === 'URL' ? 'sourceUrl' : 'content']: inputValue,
            model: modelConfig
          }),
        });
      }

      if (!response.ok) throw new Error('Failed to submit capture');

      const data = await response.json();
      setArtifactId(data.artifactId);
      setStatus('success');
      setInputValue('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

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
