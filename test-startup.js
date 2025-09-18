#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

console.log('Testing SupplyChainLens Backend startup...');

// Start the backend
const backend = spawn('node', ['backend/dist/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3000',
    JWT_SECRET: 'test-secret',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379'
  }
});

let startupComplete = false;
let healthcheckPassed = false;

// Listen for backend output
backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Backend output:', output);
  
  if (output.includes('SupplyChainLens Backend running on port')) {
    startupComplete = true;
    console.log('✅ Backend started successfully');
    testHealthcheck();
  }
});

backend.stderr.on('data', (data) => {
  console.error('Backend error:', data.toString());
});

// Test healthcheck
function testHealthcheck() {
  console.log('Testing healthcheck endpoint...');
  
  const req = http.get('http://localhost:3000/health', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Healthcheck response:', data);
      if (res.statusCode === 200) {
        healthcheckPassed = true;
        console.log('✅ Healthcheck passed');
        backend.kill();
        process.exit(0);
      } else {
        console.log('❌ Healthcheck failed with status:', res.statusCode);
        backend.kill();
        process.exit(1);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Healthcheck request failed:', err.message);
    backend.kill();
    process.exit(1);
  });
  
  req.setTimeout(5000, () => {
    console.log('❌ Healthcheck timeout');
    backend.kill();
    process.exit(1);
  });
}

// Timeout after 30 seconds
setTimeout(() => {
  if (!startupComplete) {
    console.log('❌ Backend failed to start within 30 seconds');
    backend.kill();
    process.exit(1);
  }
}, 30000);

// Handle process exit
process.on('exit', () => {
  if (backend && !backend.killed) {
    backend.kill();
  }
});
