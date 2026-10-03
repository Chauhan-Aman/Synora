import React from 'react';
import { Plus, X } from 'lucide-react';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: any[];
  artifactId: string;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<any>;
  fetchKnowledge: () => void;
  onOpenNewCollection: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen, onClose, collections, artifactId, fetchWithAuth, fetchKnowledge, onOpenNewCollection
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-synora-surface border border-synora-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-synora-accent" /> Add to Collection
          </h3>
          <button onClick={onClose} className="text-synora-text-secondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {collections.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-synora-text-secondary mb-4">You don't have any collections yet.</p>
            <button 
              onClick={() => {
                onClose();
                onOpenNewCollection();
              }}
              className="px-4 py-2 bg-synora-bg border border-synora-border text-white rounded-lg hover:border-synora-accent transition-colors"
            >
              Create your first collection
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {collections.map(col => (
              <button
                key={col.id}
                onClick={async () => {
                  await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/knowledge/artifacts/${artifactId}/collections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collectionId: col.id })
                  });
                  fetchKnowledge();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 bg-synora-bg border border-synora-border rounded-lg hover:border-synora-accent hover:bg-synora-accent/5 transition-all text-left group"
              >
                <span className="font-medium text-white group-hover:text-synora-accent transition-colors">{col.name}</span>
                <span className="text-xs text-synora-text-secondary bg-synora-surface px-2 py-1 rounded-full">{col.artifacts?.length || 0} items</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
