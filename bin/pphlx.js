#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);

function getNativeBinary() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    const winPath = path.join(__dirname, 'pphlx-win.exe');
    if (fs.existsSync(winPath)) return winPath;
  }

  if (platform === 'darwin') {
    const armPath = path.join(__dirname, 'pphlx-macos-arm64');
    const amdPath = path.join(__dirname, 'pphlx-macos-amd64');
    const defaultPath = path.join(__dirname, 'pphlx-macos');

    if (arch === 'arm64' && fs.existsSync(armPath)) return armPath;
    if (arch === 'x64' && fs.existsSync(amdPath)) return amdPath;
    if (fs.existsSync(defaultPath)) return defaultPath;
  }

  if (platform === 'linux') {
    const armPath = path.join(__dirname, 'pphlx-linux-arm64');
    const amdPath = path.join(__dirname, 'pphlx-linux-amd64');
    const defaultPath = path.join(__dirname, 'pphlx-linux');

    if (arch === 'arm64' && fs.existsSync(armPath)) return armPath;
    if (arch === 'x64' && fs.existsSync(amdPath)) return amdPath;
    if (fs.existsSync(defaultPath)) return defaultPath;
  }

  return null;
}

function runCompiler() {
  const nativeBinary = getNativeBinary();

  if (nativeBinary && fs.existsSync(nativeBinary)) {
    try {
      // Ensure binary has executable permissions (+x) on Unix systems (macOS/Linux/WSL)
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(nativeBinary, 0o755);
        } catch (e) {
          // ignore permission errors if already executable
        }
      }

      const proc = spawn(nativeBinary, args, { stdio: 'inherit' });
      proc.on('close', (code) => {
        process.exit(code || 0);
      });
      proc.on('error', (err) => {
        console.warn(`[pphlx] Native execution error (${err.message}), attempting WASM fallback...`);
        runWasm();
      });
      return;
    } catch (err) {
      console.warn(`[pphlx] Failed to spawn native binary: ${err.message}, attempting WASM fallback...`);
    }
  }

  runWasm();
}

function runWasm() {
  // Load the Go WebAssembly execution helper
  require('./wasm_exec.js');

  const go = new Go();
  go.argv = process.argv;
  go.env = process.env;

  let importObject = go.importObject;

  // Polyfill WASI snapshot preview1 if required by Node environment
  try {
    const { WASI } = require('wasi');
    const wasi = new WASI({ version: 'preview1' });
    importObject = {
      ...go.importObject,
      wasi_snapshot_preview1: wasi.wasiImport || (wasi.getImportObject && wasi.getImportObject().wasi_snapshot_preview1)
    };
  } catch (e) {
    // Node WASI module optional or unavailable
  }

  const wasmPath = path.join(__dirname, '../lib/pphlx.wasm');
  if (!fs.existsSync(wasmPath)) {
    console.error(`[pphlx] Error: Compiler binary or WASM file not found at ${wasmPath}`);
    process.exit(1);
  }

  const wasmBuffer = fs.readFileSync(wasmPath);

  WebAssembly.instantiate(wasmBuffer, importObject).then((result) => {
    go.run(result.instance);
  }).catch((err) => {
    console.error('Failed to run PPHLX compiler:', err);
    process.exit(1);
  });
}

runCompiler();
