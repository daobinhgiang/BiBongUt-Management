const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

const headTags = `
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="theme-color" content="#819067">`;

const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
    </script>`;

if (!html.includes('manifest.json')) {
  html = html.replace('</head>', headTags + '\n  </head>');
}

if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', swScript + '\n  </body>');
}

fs.writeFileSync(indexPath, html);
console.log('PWA tags injected into dist/index.html');
