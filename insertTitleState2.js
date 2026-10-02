const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// The file has \r\n line endings, so match accordingly
const insertAfter = "   setTimeout(() => setToast(null), 3000);\r\n  };\r\n  const [graphData,";

const titleEditingCode = `   setTimeout(() => setToast(null), 3000);\r\n  };\r\n\r\n  // Title Editing State\r\n  const [editingTitleId, setEditingTitleId] = useState(null);\r\n  const [editingTitleValue, setEditingTitleValue] = useState('');\r\n\r\n  /** Rename an artifact title in-place without triggering AI re-processing */\r\n  const renameArtifact = async (id, newTitle) => {\r\n    if (!newTitle.trim()) return;\r\n    try {\r\n      const res = await fetchWithAuth(\`http://localhost:3001/capture/\${id}/title\`, {\r\n        method: 'PATCH',\r\n        headers: { 'Content-Type': 'application/json' },\r\n        body: JSON.stringify({ title: newTitle.trim() }),\r\n      });\r\n      if (res.ok) {\r\n        setArtifacts((prev) => prev.map((a) => a.id === id ? { ...a, title: newTitle.trim() } : a));\r\n        if (selectedArtifact?.id === id) setSelectedArtifact((prev) => prev ? { ...prev, title: newTitle.trim() } : prev);\r\n        showToast('Title updated', 'success');\r\n      } else {\r\n        showToast('Failed to rename', 'error');\r\n      }\r\n    } catch {\r\n      showToast('Failed to rename', 'error');\r\n    } finally {\r\n      setEditingTitleId(null);\r\n    }\r\n  };\r\n\r\n  const [graphData,`;

appCode = appCode.replace(insertAfter, titleEditingCode);

fs.writeFileSync('apps/web/src/App.tsx', appCode, 'utf8');
console.log('Title editing state inserted:', appCode.includes('editingTitleId'));
