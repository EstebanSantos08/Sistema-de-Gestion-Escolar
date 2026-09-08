const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace #087F79 with #41C4BD
      content = content.replace(/#087F79/gi, '#41C4BD');
      
      // Replace hover/active darker shades with related colors if necessary, 
      // but let's just do #066863 (primary-hover) to a slightly darker #3AA8A2
      content = content.replace(/#066863/gi, '#3AA8A2');

      // Replace #183B3A with #9731AC (Violeta as heading? No, maybe keep text colors)

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

replaceInDir('./front-end/src');
console.log('Replaced colors successfully.');
