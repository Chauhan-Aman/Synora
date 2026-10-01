import React from 'react';
import { Layers, X } from 'lucide-react';

interface NewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCollectionName: string;
  setNewCollectionName: (val: string) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<any>;
  fetchKnowledge: () => void;
}

export const NewCollectionModal: React.FC<NewCollectionModalProps> = ({
  isOpen, onClose, newCollectionName, setNewCollectionName, fetchWithAuth, fetchKnowledge
}) => {
  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newCollectionName.trim()) return;
    const res = await fetchWithAuth('http://localhost:3001/knowledge/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCollectionName.trim() })
    });
    if (res.ok) {
      fetchKnowledge();
      onClose();
      setNewCollectionName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-synora-surface border border-synora-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-synora-accent" /> New Collection
          </h3>
          <button onClick={onClose} className="text-synora-text-secondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-synora-text-secondary mb-1">Collection Name</label>
            <input 
              autoFocus
              type="text" 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="w-full bg-synora-bg border border-synora-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-synora-accent transition-colors"
              placeholder="e.g. Machine Learning"
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  await handleCreate();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-synora-text-secondary hover:text-white hover:bg-synora-bg transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={!newCollectionName.trim()}
              onClick={handleCreate}
              className="px-4 py-2 bg-synora-accent text-white rounded-lg font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              Create Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
