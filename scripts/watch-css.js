#!/usr/bin/env node

/**
 * Automatic CSS Watch Script
 * Watches for SCSS file changes and automatically rebuilds CSS
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting automatic CSS rebuild...');
console.log('📁 Watching SCSS files for changes...');
console.log('💡 Press Ctrl+C to stop\n');

// Build CSS once initially
const initialBuild = spawn('npm', ['run', 'build:css'], {
  stdio: 'inherit',
  shell: true
});

initialBuild.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Initial CSS build failed with code ${code}`);
    process.exit(1);
  }
  
  console.log('✅ Initial CSS build complete\n');
  console.log('👀 Watching for changes...\n');
  
  // Start watch mode
  const watchProcess = spawn('npm', ['run', 'watch:css'], {
    stdio: 'inherit',
    shell: true
  });
  
  watchProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ CSS watch stopped with code ${code}`);
    }
    process.exit(code);
  });
  
  // Handle termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping CSS watch...');
    watchProcess.kill();
    process.exit(0);
  });
});



