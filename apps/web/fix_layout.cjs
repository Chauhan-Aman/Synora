const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

const publishStartMarker = '{/* PUBLISH TAB */}';
const publishEndMarker = 'export default function AppWrapper';

const publishStartIndex = content.indexOf(publishStartMarker);
const publishEndIndex = content.indexOf(publishEndMarker, publishStartIndex);

if (publishStartIndex === -1 || publishEndIndex === -1) {
  console.error("Could not find PUBLISH TAB markers");
  process.exit(1);
}

// Extract the PUBLISH TAB block (up to the closing div of the app)
// Wait, before `export default function AppWrapper`, there is:
//     </div>
//   );
// }
// We want to capture the PUBLISH tab which ends with `      )}` and then there's the final `    </div>\n  );\n}` for the App component.
// Let's just find the last `      )}` before `export default function AppWrapper`

const blockStr = content.substring(publishStartIndex, publishEndIndex);
const actualEndIndex = publishStartIndex + blockStr.lastIndexOf(')}') + 2;

const publishBlock = content.substring(publishStartIndex, actualEndIndex);

// Remove it from original location
content = content.substring(0, publishStartIndex) + content.substring(actualEndIndex);

const insertionMarker = '      {/* Modals */}';
const insertionIndex = content.indexOf(insertionMarker);

if (insertionIndex === -1) {
  console.error("Could not find insertion marker");
  process.exit(1);
}

// To put it inside the Dynamic Content Area flex column, it needs to be placed right BEFORE the `</div>` that closes that column.
// The `Dynamic Content Area` ends right before `      {/* Modals */}`.
// Specifically, there are two `</div>`s before the Modals.
// Let's find the closing `</div>` of `Dynamic Content Area`.
// Actually, it's safer to just look for the `CREATE TAB` block and insert `PUBLISH TAB` right after it!
const createTabEndMarker = '          )}'; // End of CREATE tab
let searchPos = content.indexOf("{/* CREATE TAB */}");
if(searchPos !== -1) {
    let nextTabClose = content.indexOf('          )}', searchPos) + 12; // Length of '          )}'
    
    let newContent = content.substring(0, nextTabClose) + '\n\n          ' + publishBlock + content.substring(nextTabClose);
    fs.writeFileSync(appTsxPath, newContent);
    console.log("Successfully moved PUBLISH TAB inside Dynamic Content Area");
} else {
    console.error("Could not find CREATE TAB");
}
