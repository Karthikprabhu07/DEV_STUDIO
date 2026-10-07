import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = [];

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace text-white or text-bg-page with text-on-accent when bg-accent-teal or bg-[#3B82F6] or bg-status-success is in the same class string
    // This regex looks for className="..." containing the bg color and text color
    content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
      if (classes.includes('bg-[#3B82F6]') || classes.includes('bg-accent-teal') || classes.includes('bg-status-success')) {
        let newClasses = classes
          .replace(/\btext-white\b/g, 'text-on-accent')
          .replace(/\btext-bg-page\b/g, 'text-on-accent');
        
        // Also update icon text colors like text-white -> text-on-accent if they are explicitly colored,
        // but typically icons inherit.
        
        return `className=${quote}${newClasses}${quote}`;
      }
      return match;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      modifiedFiles.push(filePath);
    }
  }
});

console.log("Modified files:", modifiedFiles);
