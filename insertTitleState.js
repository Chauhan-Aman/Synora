const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// Insert title editing state and handler after the showToast function
const insertAfter = `  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };`;

const titleEditingCode = `  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Title Editing State
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  /** Rename an artifact title in-place without triggering AI re-processing */
  const renameArtifact = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetchWithAuth(\`http://localhost:3001/capture/\${id}/title\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setArtifacts((prev) => prev.map((a) => a.id === id ? { ...a, title: newTitle.trim() } : a));
        if (selectedArtifact?.id === id) setSelectedArtifact((prev) => prev ? { ...prev, title: newTitle.trim() } : prev);
        showToast('Title updated', 'success');
      } else {
        showToast('Failed to rename', 'error');
      }
    } catch {
      showToast('Failed to rename', 'error');
    } finally {
      setEditingTitleId(null);
    }
  };`;

appCode = appCode.replace(insertAfter, titleEditingCode);

fs.writeFileSync('apps/web/src/App.tsx', appCode, 'utf8');
console.log('Title editing state inserted:', appCode.includes('editingTitleId'));
