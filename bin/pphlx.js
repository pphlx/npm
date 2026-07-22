#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);

function runCompiler() {
  // On Windows, run the native Go compiler binary directly to bypass Node.js WASI filesystem bugs
  if (process.platform === 'win32') {
    const binaryPath = path.join(__dirname, 'pphlx-win.exe');
    if (fs.existsSync(binaryPath)) {
      const proc = spawn(binaryPath, args, { stdio: 'inherit' });
      proc.on('close', (code) => {
        process.exit(code);
      });
      return;
    }
  }

  // Load the Go WebAssembly execution helper
  require('./wasm_exec.js');

  const go = new Go();
  go.argv = process.argv;
  go.env = process.env;

  const wasmPath = path.join(__dirname, '../lib/pphlx.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);

  WebAssembly.instantiate(wasmBuffer, go.importObject).then((result) => {
    go.run(result.instance);
  }).catch((err) => {
    console.error('Failed to run PPHLX compiler:', err);
    process.exit(1);
  });
}

runCompiler();
