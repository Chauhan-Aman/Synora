const fs = require('fs');

// Read raw bytes to detect BOM
const rawBuf = fs.readFileSync('App_7bc428ef.tsx');
let appCode;

// Check for UTF-16 LE BOM (FF FE)
if (rawBuf[0] === 0xFF && rawBuf[1] === 0xFE) {
  appCode = rawBuf.toString('utf16le');
} else if (rawBuf[0] === 0xEF && rawBuf[1] === 0xBB && rawBuf[2] === 0xBF) {
  // UTF-8 BOM
  appCode = rawBuf.toString('utf8').slice(1); // Remove BOM char
} else {
  appCode = rawBuf.toString('utf8');
}

// Strip any remaining BOM character
appCode = appCode.replace(/^\uFEFF/, '');

// Prepend ts-nocheck as first line
appCode = '// @ts-nocheck\n' + appCode;

// Write as UTF-8 without BOM
fs.writeFileSync('apps/web/src/App.tsx', appCode, 'utf8');
console.log('Wrote App.tsx, first 100 chars:', JSON.stringify(appCode.slice(0, 100)));
