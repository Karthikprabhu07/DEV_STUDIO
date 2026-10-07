const fs = require('fs');
const path = require('path');

// Base64 encoded simple 32x32 teal square PNG with ">_"
const b64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEBSURBVFhH7ZexDcIwEEX9C6QEhT0DsABrMAVjMAWrMAMVbJEQC4QE5+A4juXEMWLFc6S8013+u/O/s23bVjA2M2iY7dY+Z8w2/7w/wA3ug32T/E94hGf4xQ3wBtfBLsk/0w2cgh2Sf6YbuAZ7JP9MN3ALjkn+mW7gERyS/DPdwDM4JvlnuoFncEzyz3QDz+CY5J/pBp7BMck/8wN+wR/YA33yP2F/cI5xYj46H18H10CflH9C37gO+qT8E/rGddAn5Z/QN66DPin/hL5xHfRJ+Sf0jeugT8o/oW9cB31S/gl94zrok/JP6BvXQZ+Uf0LfuA76pPwT+sZ10Cfln9A3ruNHk8n+3m4uL2l6q8k4xosrAAAAAElFTkSuQmCC";

const buffer = Buffer.from(b64, 'base64');
const publicDir = path.join(__dirname, 'public');

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), buffer);

const manifest = {
  "name": "DevStudio",
  "short_name": "DevStudio",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#0A0F1D",
  "background_color": "#0A0F1D",
  "display": "standalone"
};

fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

// Copy OG image
const ogSource = 'C:\\Users\\devil\\.gemini\\antigravity-ide\\brain\\840f5d0e-d9a5-4f7e-afc0-3a38c7dd5528\\og_image_1790704808603.jpg';
fs.copyFileSync(ogSource, path.join(publicDir, 'og-image.png'));

console.log('Favicons and OG image created.');
