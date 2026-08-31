const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

const publishStartMarker = '          {/* PUBLISH TAB */}';
const publishStartIdx = content.indexOf(publishStartMarker);
if (publishStartIdx === -1) {
  console.error("Could not find PUBLISH TAB start marker");
  process.exit(1);
}

// Find the end of the PUBLISH TAB block
// The PUBLISH TAB block ends with:
//         </div>
//       )}
// Let's find the first `      )}` after `</div>` after `PUBLISH TAB`
// Actually, it's easier to find a specific string near the end of PUBLISH TAB like "Select topics and click Generate to create your content"
// and find the `)}` after that.

const signature = 'Select topics and click Generate to create your content.';
const sigIdx = content.indexOf(signature, publishStartIdx);
const nextDivClose = content.indexOf('</div>', sigIdx);
const nextDivClose2 = content.indexOf('</div>', nextDivClose + 6);
const nextDivClose3 = content.indexOf('</div>', nextDivClose2 + 6);
const nextDivClose4 = content.indexOf('</div>', nextDivClose3 + 6);
const nextDivClose5 = content.indexOf('</div>', nextDivClose4 + 6);
const endOfPublish = content.indexOf('      )}', nextDivClose5) + 8; // length of '      )}'

const publishBlock = content.substring(publishStartIdx, endOfPublish);

// Remove from old location
content = content.substring(0, publishStartIdx) + content.substring(endOfPublish);

// Now, find the SETTINGS TAB closing.
const settingsMarker = '<Settings className="w-6 h-6 text-synora-accent" />';
const settingsIdx = content.indexOf(settingsMarker);
const settingsEndDiv1 = content.indexOf('</div>', settingsIdx);
const settingsEndDiv2 = content.indexOf('</div>', settingsEndDiv1 + 6);
const settingsEndDiv3 = content.indexOf('</div>', settingsEndDiv2 + 6);
const settingsEndDiv4 = content.indexOf('</div>', settingsEndDiv3 + 6);
const settingsEndTab = content.indexOf('          )}', settingsEndDiv4) + 12;

// Wait, the SETTINGS tab doesn't have an explicit `          )}` because it's the last one?
// Let's search for `{/* Modals */}`.
const modalsMarker = '      {/* Modals */}';
const modalsIdx = content.indexOf(modalsMarker);

// The modals marker is preceded by:
//         </div>
//       </div>
//
//       {/* Modals */}
// We want to insert the PUBLISH TAB block right before the `        </div>` that closes the `Dynamic Content Area`.
// The easiest way is to find `{/* Modals */}` and go backwards to find the 2nd `</div>`.
const textBeforeModals = content.substring(0, modalsIdx);
const lastDiv = textBeforeModals.lastIndexOf('</div>');
const secondLastDiv = textBeforeModals.lastIndexOf('</div>', lastDiv - 1);

const insertionIdx = secondLastDiv; // Insert right before the second last </div> which closes Dynamic Content Area.

let newContent = content.substring(0, insertionIdx) + '\n\n' + publishBlock + '\n' + content.substring(insertionIdx);

fs.writeFileSync(appTsxPath, newContent);
console.log("Successfully moved PUBLISH TAB to the correct position.");
