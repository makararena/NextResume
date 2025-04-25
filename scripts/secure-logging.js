/**
 * Secure Logging Script
 * 
 * This script scans the codebase for direct console.log/console.debug calls 
 * that might be logging sensitive information and provides guidance on replacing them
 * with the safer safeConsole utility.
 * 
 * Usage: 
 * 1. Run `node scripts/secure-logging.js` to scan the codebase
 * 2. It will output files that need attention with line numbers
 * 3. For automated replacement, run `node scripts/secure-logging.js --fix` (use with caution)
 * 
 * This script performs the following:
 * 1. Scans all TS/TSX/JS files in src directory
 * 2. Identifies console.log/debug/info calls that might contain sensitive data
 * 3. Reports potential issues with file paths and line numbers
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Sensitive keywords that should trigger warnings
const SENSITIVE_KEYWORDS = [
  'user',
  'email',
  'name',
  'phone',
  'address',
  'location',
  'personal',
  'profile',
  'token',
  'session',
  'auth',
  'jwt',
  'password',
  'credential',
  'secret',
  'key',
  'resume',
];

// Files or directories to ignore
const IGNORED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '.git',
  'tests',
  '__tests__',
  'test',
  'mocks',
  '__mocks__',
];

// Find all TypeScript and JavaScript files in src directory
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip ignored paths
    if (IGNORED_PATHS.some(ignoredPath => filePath.includes(ignoredPath))) {
      return;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findSourceFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check if a console log statement might contain sensitive information
function mightContainSensitiveInfo(line) {
  // Skip logs that are clearly for debugging/performance
  if (line.includes('⏱️') || 
      line.includes('render') ||
      line.includes('performance') ||
      line.includes('timing')) {
    return false;
  }
  
  return SENSITIVE_KEYWORDS.some(keyword => 
    line.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Analyze a file for potentially unsafe console logs
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  const consoleLogRegex = /console\.(log|debug|info|dir)\(/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (consoleLogRegex.test(line) && mightContainSensitiveInfo(line)) {
      issues.push({
        line: i + 1,
        content: line.trim(),
        severity: line.includes('token') || line.includes('auth') ? 'HIGH' : 'MEDIUM'
      });
    }
  }
  
  return issues;
}

// Run a scan of the codebase
function scanCodebase() {
  console.log('🔍 Scanning codebase for unsafe console logging...\n');
  const sourceFiles = findSourceFiles('src');
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  sourceFiles.forEach(filePath => {
    const issues = analyzeFile(filePath);
    
    if (issues.length > 0) {
      filesWithIssues++;
      const relativePath = filePath.replace(process.cwd(), '');
      console.log(`\n📁 ${relativePath}`);
      
      issues.forEach(issue => {
        totalIssues++;
        console.log(`   Line ${issue.line} [${issue.severity}]: ${issue.content}`);
      });
    }
  });
  
  console.log(`\n✅ Scan complete!`);
  console.log(`Found ${totalIssues} potentially unsafe console logs in ${filesWithIssues} files.`);
  console.log(`\nRecommendation: Replace console.log with safeConsole from '@/lib/utils'`);
  console.log(`Example:`);
  console.log(`  // Before`);
  console.log(`  console.log("User data:", userData);`);
  console.log(`  `);
  console.log(`  // After`);
  console.log(`  import { safeConsole } from '@/lib/utils';`);
  console.log(`  safeConsole.debug("User data", userData);`);
}

// Fix mode is still a work in progress
function fixCodebase() {
  console.log('⚠️ Fix mode is experimental. Please backup your code before proceeding.');
  console.log('Running in dry-run mode only...');
  
  const sourceFiles = findSourceFiles('src');
  let totalReplacements = 0;
  
  sourceFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already imports safeConsole
    const hasImport = content.includes("import { safeConsole }") || 
                      content.includes("import {safeConsole}");
    
    // This is where we'd implement the automatic replacements
    // For now, just show what would be replaced
    const lines = content.split('\n');
    let modifications = false;
    
    lines.forEach((line, i) => {
      if (/console\.(log|debug|info)\(/.test(line) && mightContainSensitiveInfo(line)) {
        totalReplacements++;
        modifications = true;
        console.log(`Would replace in ${filePath}:${i+1}:`);
        console.log(`  - ${line.trim()}`);
        // Here we'd do the actual replacement logic
      }
    });
    
    if (modifications && !hasImport) {
      console.log(`Would add import { safeConsole } from '@/lib/utils' to ${filePath}`);
    }
  });
  
  console.log(`\nWould make ${totalReplacements} replacements.`);
  console.log('Run with --confirm to apply changes (not implemented yet)');
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    fixCodebase();
  } else {
    scanCodebase();
  }
}

main(); 