const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

// 1. Fix the icon imports and usage
content = content.replace('Twitter, Linkedin', 'MessageCircle, Briefcase');
content = content.replace(/<Linkedin/g, '<Briefcase');
content = content.replace(/<Twitter/g, '<MessageCircle');
content = content.replace(/Linkedin,/g, 'Briefcase,');
content = content.replace(/Twitter,/g, 'MessageCircle,');

// 2. Extract PUBLISH TAB exactly
const publishStartMarker = '      {/* PUBLISH TAB */}';
const startIdx = content.indexOf(publishStartMarker);

// Find the last `    </div>` in the file which is right before `  );\n}`
const lastDivIdx = content.lastIndexOf('    </div>');
const actualEnd = content.lastIndexOf(')}', lastDivIdx) + 2; // the ')}' before the last div

const publishBlock = content.substring(startIdx, actualEnd);

// Remove the block
content = content.substring(0, startIdx) + content.substring(actualEnd);

// Insert at correct place
const insertMarker = '      {/* Modals */}';
const insertIdx = content.indexOf(insertMarker);
if (insertIdx === -1) {
    console.error("Could not find insert marker!");
    process.exit(1);
}

// Find the `</div>` that precedes the modals (it is 2 divs up)
const textBeforeModals = content.substring(0, insertIdx);
const lastDivBeforeModals = textBeforeModals.lastIndexOf('</div>');
const secondLastDivBeforeModals = textBeforeModals.lastIndexOf('</div>', lastDivBeforeModals - 1);

const finalContent = content.substring(0, secondLastDivBeforeModals) + '\n\n' + publishBlock + '\n' + content.substring(secondLastDivBeforeModals);

fs.writeFileSync(appTsxPath, finalContent);
console.log("Successfully fixed layout and icons!");
