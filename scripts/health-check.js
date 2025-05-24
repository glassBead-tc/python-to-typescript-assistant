#!/usr/bin/env node

/**
 * Health check script for the Python-to-TypeScript Porting MCP Server
 * 
 * This script can be used by Docker health checks, monitoring systems,
 * or manual health verification.
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

async function checkHealth() {
  try {
    // Basic process check - ensures Node.js can start and run
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', ['-e', 'console.log("Health check passed"); process.exit(0)'], {
        stdio: 'pipe',
        timeout: HEALTH_CHECK_TIMEOUT
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve({ status: 'healthy', message: 'Node.js process responsive' });
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout handler
      setTimeout(HEALTH_CHECK_TIMEOUT).then(() => {
        child.kill('SIGTERM');
        reject(new Error('Health check timeout'));
      });
    });

    console.log(JSON.stringify(result));
    process.exit(0);

  } catch (error) {
    const result = {
      status: 'unhealthy',
      message: error.message || 'Health check failed',
      timestamp: new Date().toISOString()
    };
    
    console.error(JSON.stringify(result));
    process.exit(1);
  }
}

// Additional health checks could be added here:
// - Memory usage check
// - CPU usage check
// - Dependency availability check
// - MCP server specific functionality check

if (import.meta.url === `file://${process.argv[1]}`) {
  checkHealth();
} 