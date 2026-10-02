const { execSync } = require('child_process');
const fs = require('fs');

const appCode = execSync('git show 7bc428ef:apps/web/src/App.tsx').toString('utf8');

const start = appCode.indexOf("{activeTab === 'LEARN' && (");
const end = appCode.indexOf("{activeTab === 'CHAT' && (");
if (start !== -1 && end !== -1) {
  let learnCode = appCode.substring(start, end);
  const innerStart = learnCode.indexOf('(') + 1;
  const innerEnd = learnCode.lastIndexOf(')}');
  learnCode = learnCode.substring(innerStart, innerEnd).trim();

  let componentCode = `import React from 'react';
import { Loader2, CheckCircle, GraduationCap } from 'lucide-react';

export const LearnTab = (props: any) => {
  const { activeTab, isLoadingLearn, flashcards, currentCardIndex, isFlipped, setIsFlipped, handleReview } = props;

  return (
    <>
      ${learnCode}
    </>
  );
};
`;
  fs.writeFileSync('apps/web/src/components/tabs/LearnTab.tsx', componentCode);
  console.log('LearnTab replaced properly');
} else {
  console.log('Not found');
}
