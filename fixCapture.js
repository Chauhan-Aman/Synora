const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

const capturePropsStr = `
              inputType={inputType}
              setInputType={setInputType}
              inputValue={inputValue}
              setInputValue={setInputValue}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isSubmitting={isSubmitting}
              isListening={isListening}
              toggleListening={toggleListening}
              handleCaptureSubmit={handleCaptureSubmit}
              status={status}
              artifactId={artifactId}
`;

const startIdx = appCode.indexOf('<CaptureTab');
const endIdx = appCode.indexOf('/>', startIdx) + 2;

appCode = appCode.substring(0, startIdx) + `<CaptureTab` + capturePropsStr + `            />` + appCode.substring(endIdx);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Fixed CaptureTab props in App.tsx');
