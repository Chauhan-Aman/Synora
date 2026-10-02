const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// 1. In the artifact card: Replace the static title with editable inline field
// Original: <h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors break-words">{artifact.title}</h4>
const cardTitleOld = `<h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors break-words">{artifact.title}</h4>`;
const cardTitleNew = `{editingTitleId === artifact.id ? (
                                  <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                    <input
                                      id={\`title-input-\${artifact.id}\`}
                                      autoFocus
                                      className="flex-1 bg-synora-bg border border-synora-accent/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-synora-accent/40"
                                      value={editingTitleValue}
                                      onChange={e => setEditingTitleValue(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') renameArtifact(artifact.id, editingTitleValue);
                                        if (e.key === 'Escape') setEditingTitleId(null);
                                      }}
                                    />
                                    <button onClick={() => renameArtifact(artifact.id, editingTitleValue)} className="p-1.5 rounded-lg bg-synora-accent/20 text-synora-accent hover:bg-synora-accent hover:text-white transition-colors text-xs font-bold shrink-0">Save</button>
                                    <button onClick={() => setEditingTitleId(null)} className="p-1.5 rounded-lg bg-synora-surface border border-synora-border text-synora-text-secondary hover:text-white transition-colors shrink-0">✕</button>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 group/title">
                                    <h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors break-words flex-1">{artifact.title}</h4>
                                    <button
                                      id={\`rename-btn-\${artifact.id}\`}
                                      onClick={e => { e.stopPropagation(); setEditingTitleId(artifact.id); setEditingTitleValue(artifact.title || ''); }}
                                      className="opacity-0 group-hover/title:opacity-100 p-1 rounded-md text-synora-text-secondary hover:text-synora-accent hover:bg-synora-surface transition-all shrink-0 mt-0.5"
                                      title="Rename"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                  </div>
                                )}`;

appCode = appCode.replace(cardTitleOld, cardTitleNew);

// 2. In the artifact reader modal: Replace the static h2 title with editable inline field
const modalTitleOld = `                          <h2 className="text-2xl font-bold text-white max-w-2xl break-words">
                             {selectedArtifact.title || (selectedArtifact.sourceUrl ? selectedArtifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : 'Unknown Document')}
                           </h2>`;
const modalTitleNew = `                          {editingTitleId === selectedArtifact.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                id="modal-title-input"
                                autoFocus
                                className="flex-1 bg-synora-bg border border-synora-accent/50 rounded-xl px-4 py-2 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-synora-accent/40"
                                value={editingTitleValue}
                                onChange={e => setEditingTitleValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') renameArtifact(selectedArtifact.id, editingTitleValue);
                                  if (e.key === 'Escape') setEditingTitleId(null);
                                }}
                              />
                              <button onClick={() => renameArtifact(selectedArtifact.id, editingTitleValue)} className="px-3 py-2 rounded-xl bg-synora-accent/20 text-synora-accent hover:bg-synora-accent hover:text-white transition-colors text-sm font-bold shrink-0">Save</button>
                              <button onClick={() => setEditingTitleId(null)} className="px-3 py-2 rounded-xl bg-synora-surface border border-synora-border text-synora-text-secondary hover:text-white transition-colors shrink-0">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/modal-title">
                              <h2 className="text-2xl font-bold text-white max-w-2xl break-words">
                                {selectedArtifact.title || (selectedArtifact.sourceUrl ? selectedArtifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : 'Unknown Document')}
                              </h2>
                              <button
                                id="modal-rename-btn"
                                onClick={() => { setEditingTitleId(selectedArtifact.id); setEditingTitleValue(selectedArtifact.title || ''); }}
                                className="opacity-0 group-hover/modal-title:opacity-100 p-1.5 rounded-lg text-synora-text-secondary hover:text-synora-accent hover:bg-synora-surface transition-all shrink-0"
                                title="Rename document"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            </div>
                          )}`;

appCode = appCode.replace(modalTitleOld, modalTitleNew);

fs.writeFileSync('apps/web/src/App.tsx', appCode, 'utf8');
console.log('Card title replaced:', appCode.includes('rename-btn-'));
console.log('Modal title replaced:', appCode.includes('modal-rename-btn'));
