const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

function extractJSX(source, startStr) {
  const startIdx = source.indexOf(startStr);
  if (startIdx === -1) return { extracted: '', updatedSource: source };
  let endIdx = startIdx;
  let braceCount = 0;
  let tagCount = 0;
  let started = false;
  
  // A heuristic way since perfect JSX parsing is hard.
  // We'll just find the exact block ends manually if it's simpler.
  return { extracted: '', updatedSource: source };
}

// Since I have the file locally, I can just use string replacements using start and end substrings.

// 1. Confirm Modal
const confirmStart = appCode.indexOf('{/* Global Confirm Modal */}');
const confirmEnd = appCode.indexOf('      <div className="fixed top-[-10%]');
if (confirmStart !== -1 && confirmEnd !== -1) {
  appCode = appCode.substring(0, confirmStart) + `{/* Global Confirm Modal */}
      <ConfirmModal 
        isOpen={!!(confirmDialog && confirmDialog.isOpen)}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm();
          setConfirmDialog(null);
        }}
        onCancel={() => setConfirmDialog(null)}
      />
` + appCode.substring(confirmEnd);
}

// 2. Settings Modal
const settingsStart = appCode.indexOf('{/* SETTINGS MODAL */}');
const settingsEnd = appCode.indexOf('{/* Modals */}');
if (settingsStart !== -1 && settingsEnd !== -1) {
  appCode = appCode.substring(0, settingsStart) + `{/* SETTINGS MODAL */}
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            modelConfig={modelConfig}
            setModelConfig={setModelConfig}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
            handleLogout={handleLogout}
            isSavingPreferences={isSavingPreferences}
            setIsSavingPreferences={setIsSavingPreferences}
            fetchWithAuth={fetchWithAuth}
          />
` + appCode.substring(settingsEnd);
}

// 3. New Collection & Add To Collection Modals
const modalsStart = appCode.indexOf('{/* Modals */}');
const modalsEnd = appCode.lastIndexOf('</div>\n  );\n}'); // Just before the end of App function
if (modalsStart !== -1 && modalsEnd !== -1) {
  appCode = appCode.substring(0, modalsStart) + `{/* Modals */}
      <NewCollectionModal 
        isOpen={showNewCollectionModal}
        onClose={() => setShowNewCollectionModal(false)}
        newCollectionName={newCollectionName}
        setNewCollectionName={setNewCollectionName}
        fetchWithAuth={fetchWithAuth}
        fetchKnowledge={fetchKnowledge}
      />

      <AddToCollectionModal 
        isOpen={!!showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(null)}
        collections={collections}
        artifactId={showAddToCollectionModal?.artifactId || ''}
        fetchWithAuth={fetchWithAuth}
        fetchKnowledge={fetchKnowledge}
        onOpenNewCollection={() => setShowNewCollectionModal(true)}
      />
    ` + appCode.substring(modalsEnd);
}

// Add Imports
const importsStr = `import { ConfirmModal } from './components/modals/ConfirmModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { NewCollectionModal } from './components/modals/NewCollectionModal';
import { AddToCollectionModal } from './components/modals/AddToCollectionModal';
`;
appCode = appCode.replace("import { CreateTab } from './components/tabs/CreateTab';", importsStr + "import { CreateTab } from './components/tabs/CreateTab';");

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Modals extracted and replaced in App.tsx');
