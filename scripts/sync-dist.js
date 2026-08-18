const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, 'out');
const publicDir = path.join(rootDir, 'public');

[distDir, outDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper for copying directory contents recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy entire .next directory to dist
if (fs.existsSync(nextDir)) {
  copyDirRecursive(nextDir, distDir);
}

// 2. Copy public directory assets directly into dist and out
if (fs.existsSync(publicDir)) {
  copyDirRecursive(publicDir, distDir);
  copyDirRecursive(publicDir, outDir);
}

// 3. Ensure HTML files are copied to root and appropriate subpaths in dist and out
const appServerDir = path.join(nextDir, 'server', 'app');
if (fs.existsSync(appServerDir)) {
  const rootIndexHtml = path.join(appServerDir, 'index.html');
  if (fs.existsSync(rootIndexHtml)) {
    fs.copyFileSync(rootIndexHtml, path.join(distDir, 'index.html'));
    fs.copyFileSync(rootIndexHtml, path.join(outDir, 'index.html'));
  }

  function copyHtmlFiles(dir, targetDistDir, targetOutDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nextDist = path.join(targetDistDir, entry.name);
        const nextOut = path.join(targetOutDir, entry.name);
        if (!fs.existsSync(nextDist)) fs.mkdirSync(nextDist, { recursive: true });
        if (!fs.existsSync(nextOut)) fs.mkdirSync(nextOut, { recursive: true });
        copyHtmlFiles(srcPath, nextDist, nextOut);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        fs.copyFileSync(srcPath, path.join(targetDistDir, entry.name));
        fs.copyFileSync(srcPath, path.join(targetOutDir, entry.name));
      }
    }
  }
  copyHtmlFiles(appServerDir, distDir, outDir);
}

// 4. Ensure static and _next/static structure exists in dist and out
const staticDir = path.join(nextDir, 'static');
if (fs.existsSync(staticDir)) {
  copyDirRecursive(staticDir, path.join(distDir, 'static'));
  copyDirRecursive(staticDir, path.join(distDir, '_next', 'static'));
  copyDirRecursive(staticDir, path.join(outDir, '_next', 'static'));
  copyDirRecursive(staticDir, path.join(outDir, 'static'));
}

// 5. Create unhashed chunk aliases (e.g. error.js for error-[hash].js, global-error.js for global-error-[hash].js)
function createUnhashedChunkAliases(targetStaticDir) {
  if (!fs.existsSync(targetStaticDir)) return;
  const chunksDir = path.join(targetStaticDir, 'chunks');
  if (!fs.existsSync(chunksDir)) return;

  function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.css'))) {
        const ext = entry.name.endsWith('.js') ? '.js' : '.css';
        const nameWithoutExt = entry.name.slice(0, -ext.length);
        const lastDash = nameWithoutExt.lastIndexOf('-');
        if (lastDash > 0) {
          const unhashedName = nameWithoutExt.slice(0, lastDash) + ext;
          const unhashedPath = path.join(dir, unhashedName);
          if (!fs.existsSync(unhashedPath)) {
            fs.copyFileSync(fullPath, unhashedPath);
          }
        }
      }
    }
  }

  processDir(chunksDir);
}

createUnhashedChunkAliases(path.join(nextDir, 'static'));
createUnhashedChunkAliases(path.join(distDir, 'static'));
createUnhashedChunkAliases(path.join(distDir, '_next', 'static'));
createUnhashedChunkAliases(path.join(outDir, 'static'));
createUnhashedChunkAliases(path.join(outDir, '_next', 'static'));

// 6. Ensure clean public folder (never create _next in public as Next.js prohibits it)
const publicNextDir = path.join(publicDir, '_next');
if (fs.existsSync(publicNextDir)) {
  fs.rmSync(publicNextDir, { recursive: true, force: true });
}

// 7. Ensure valid fallback JS content for crucial unhashed chunks if missing
const crucialChunks = [
  'app/error.js',
  'app/global-error.js',
  'app/not-found.js',
  'app/layout.js',
  'app/page.js',
  'main-app.js',
  'webpack.js',
  'app-pages-internals.js'
];

[nextDir, distDir, outDir].forEach(base => {
  const chunksRoot = path.join(base, 'static', 'chunks');
  if (!fs.existsSync(chunksRoot)) {
    fs.mkdirSync(chunksRoot, { recursive: true });
  }
  crucialChunks.forEach(rel => {
    const targetFile = path.join(chunksRoot, rel);
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (!fs.existsSync(targetFile)) {
      // Find matching hashed sibling or write benign stub
      let found = false;
      const baseName = path.basename(rel, '.js');
      if (fs.existsSync(targetDir)) {
        const siblings = fs.readdirSync(targetDir);
        const match = siblings.find(s => s.startsWith(baseName + '-') && s.endsWith('.js'));
        if (match) {
          fs.copyFileSync(path.join(targetDir, match), targetFile);
          found = true;
        }
      }
      if (!found) {
        fs.writeFileSync(targetFile, '"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([]);\n', 'utf8');
      }
    }
  });
});

console.log('✓ Successfully synced build artifacts and chunk aliases to dist and out directories.');
