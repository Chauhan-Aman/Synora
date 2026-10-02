const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

function extractState(source, stateStr) {
  const lines = source.split('\n');
  const lineIdx = lines.findIndex(l => l.includes(stateStr));
  if (lineIdx === -1) return { extracted: '', updatedSource: source };
  const extracted = lines[lineIdx];
  lines.splice(lineIdx, 1);
  return { extracted, updatedSource: lines.join('\n') };
}

const statesToRemove = [
  "const [publishFormat, setPublishFormat]",
  "const [publishStyle, setPublishStyle]",
  "const [publishSelectedTopics, setPublishSelectedTopics]",
  "const [publishOutput, setPublishOutput]",
  "const [isPublishing, setIsPublishing]",
  "const [publishCopied, setPublishCopied]",
  "const [discoverQuery, setDiscoverQuery]",
  "const [isDiscovering, setIsDiscovering]",
  "const [discoveryResults, setDiscoveryResults]",
  "const [flashcards, setFlashcards]",
  "const [currentCardIndex, setCurrentCardIndex]",
  "const [isFlipped, setIsFlipped]",
  "const [isLoadingLearn, setIsLoadingLearn]"
];

for (const state of statesToRemove) {
  const res = extractState(appCode, state);
  appCode = res.updatedSource;
}

if (!appCode.includes('import { usePublish }')) {
  appCode = appCode.replace(
    "import { useCreate } from './hooks/useCreate';",
    "import { useCreate } from './hooks/useCreate';\nimport { usePublish } from './hooks/usePublish';\nimport { useDiscover } from './hooks/useDiscover';\nimport { useLearn } from './hooks/useLearn';"
  );
}

const insertPoint = appCode.indexOf('} = useCreate(');
const realInsertPoint = appCode.indexOf(';', insertPoint) + 1;

appCode = appCode.substring(0, realInsertPoint) + `
  const {
    publishFormat, setPublishFormat, publishStyle, setPublishStyle,
    publishSelectedTopics, setPublishSelectedTopics, publishOutput, setPublishOutput,
    isPublishing, setIsPublishing, publishCopied, setPublishCopied
  } = usePublish();

  const {
    discoverQuery, setDiscoverQuery, isDiscovering, setIsDiscovering,
    discoveryResults, setDiscoveryResults
  } = useDiscover();

  const {
    flashcards, setFlashcards, currentCardIndex, setCurrentCardIndex,
    isFlipped, setIsFlipped, isLoadingLearn, setIsLoadingLearn
  } = useLearn();
` + appCode.substring(realInsertPoint);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Final hooks injected into App.tsx');
