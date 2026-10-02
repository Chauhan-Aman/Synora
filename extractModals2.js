const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

const modalsStart = appCode.indexOf('{/* Modals */}');
const modalsEnd = appCode.indexOf('export default function AppWrapper');

if (modalsStart !== -1 && modalsEnd !== -1) {
  // Find the exact `</div>\n  );\n}` before export default
  const endDiv = appCode.lastIndexOf('</div>', modalsEnd);
  
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
    ` + appCode.substring(endDiv);
}

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Third modal replacement done');
