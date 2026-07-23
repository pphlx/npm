const fs = require('fs');
const path = require('path');

// During npm install, INIT_CWD points to the directory where the install command was run
const projectDir = process.env.INIT_CWD || path.resolve(__dirname, '../../../');
const packageJsonPath = path.join(projectDir, 'package.json');
const pphlxJsonPath = path.join(projectDir, 'pphlx.json');
const pphlxConfigJsonPath = path.join(projectDir, 'pphlx.config.json');
const pphlxViteConfigPath = path.join(projectDir, 'pphlx.vite.config.mjs');
const layoutsDirPath = path.join(projectDir, 'layouts');
const componentsDirPath = path.join(projectDir, 'components');
const indexPath = path.join(projectDir, 'index.pphx');

const projectName = path.basename(projectDir);

// 1. Auto-configure package.json
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    let modified = false;
    
    if (!packageJson.scripts.build || !packageJson.scripts.build.includes("pphlx")) {
      packageJson.scripts.build = "pphlx";
      modified = true;
    }
    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = "pphlx dev";
      modified = true;
    }
    if (!packageJson.scripts.start) {
      packageJson.scripts.start = "pphlx dev";
      modified = true;
    }
    if (!packageJson.scripts.watch) {
      packageJson.scripts.watch = "pphlx watch";
      modified = true;
    }
    if (!packageJson.scripts.preview) {
      packageJson.scripts.preview = "pphlx preview";
      modified = true;
    }
    if (!packageJson.scripts.check) {
      packageJson.scripts.check = "pphlx check";
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log(`[pphlx] Automatically added "dev", "build", and "watch" scripts to your package.json!`);
    }
  } catch (err) {
    console.warn(`[pphlx] Failed to auto-configure package.json scripts: ${err.message}`);
  }
}

// 2. Auto-generate pphlx.json if missing
if (!fs.existsSync(pphlxJsonPath)) {
  try {
    const pphlxJson = {
      name: projectName,
      version: "1.0.0",
      description: "PPHLX Monolithic Application",
      scripts: {
        build: "pphlx build",
        dev: "pphlx dev",
        watch: "pphlx watch"
      },
      dependencies: {
        pphlx: "^1.1.0"
      }
    };
    fs.writeFileSync(pphlxJsonPath, JSON.stringify(pphlxJson, null, 2), 'utf8');
    console.log(`[pphlx] Created pphlx.json (Project Manifest)`);
  } catch (err) {
    console.warn(`[pphlx] Failed to create pphlx.json: ${err.message}`);
  }
}

// 3. Auto-generate pphlx.config.json if missing
if (!fs.existsSync(pphlxConfigJsonPath)) {
  try {
    const pphlxConfig = {
      srcDir: ".",
      outDir: "dist",
      cssOut: "dist/css/styles.css",
      jsOut: "dist/js/bundle.js",
      output: {
        target: "php"
      }
    };
    fs.writeFileSync(pphlxConfigJsonPath, JSON.stringify(pphlxConfig, null, 2), 'utf8');
    console.log(`[pphlx] Created pphlx.config.json (Compiler Config)`);
  } catch (err) {
    console.warn(`[pphlx] Failed to create pphlx.config.json: ${err.message}`);
  }
}

// 4. Auto-generate pphlx.vite.config.mjs if missing
if (!fs.existsSync(pphlxViteConfigPath)) {
  try {
    const viteConfigContent = `import { defineConfig } from 'vite';
import pphlx from 'pphlx/vite';

export default defineConfig({
  plugins: [pphlx()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
`;
    fs.writeFileSync(pphlxViteConfigPath, viteConfigContent, 'utf8');
    console.log(`[pphlx] Created pphlx.vite.config.mjs (Vite Bridge Config)`);
  } catch (err) {
    console.warn(`[pphlx] Failed to create pphlx.vite.config.mjs: ${err.message}`);
  }
}

// 5. Scaffold root layouts/, components/, and index.pphx templates matching multiframe-dashboard
if (!fs.existsSync(layoutsDirPath)) {
  try {
    fs.mkdirSync(layoutsDirPath, { recursive: true });

    const layoutContent = `{|
if (!defined('PPHLX_EXEC')) {
    define('PPHLX_EXEC', true);
}
$_title = !empty($title) ? $title : 'PPHLX Monolith App';
|}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{|= $_title; |}</title>
    {{PPHLX_CSS}}
</head>
<body>
    <main>
        {{slot}}
    </main>
    {{PPHLX_JS}}
</body>
</html>
`;
    fs.writeFileSync(path.join(layoutsDirPath, 'Layout.pphx'), layoutContent, 'utf8');
    console.log(`[pphlx] Created layouts/Layout.pphx`);
  } catch (err) {
    console.warn(`[pphlx] Failed to scaffold layouts: ${err.message}`);
  }
}

if (!fs.existsSync(componentsDirPath)) {
  try {
    fs.mkdirSync(componentsDirPath, { recursive: true });
    console.log(`[pphlx] Created components/ directory`);
  } catch (err) {
    // optional
  }
}

if (!fs.existsSync(indexPath)) {
  try {
    const indexContent = `@import Layout from './layouts/Layout.pphx'

<Layout title="Welcome to PPHLX App">
    <div style="font-family:sans-serif;padding:40px;text-align:center;">
        <h1>🚀 Welcome to PPHLX Monolith</h1>
        <p>Zero Node.js runtime in production. Standalone PHP template execution.</p>
    </div>
</Layout>
`;
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log(`[pphlx] Created root index.pphx template`);
  } catch (err) {
    console.warn(`[pphlx] Failed to scaffold index.pphx: ${err.message}`);
  }
}
