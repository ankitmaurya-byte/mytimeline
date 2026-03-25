#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Timeline Backend
 *
 * This script runs all backend tests and provides detailed coverage reporting.
 * It includes:
 * - Unit tests for services, utilities, and models
 * - Integration tests for API routes
 * - Security tests
 * - Performance tests
 * - Coverage reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  testTimeout: 30000,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testPatterns: [
    '**/__tests__/**/*.test.{js,ts}',
    '**/?(*.)+(spec|test).{js,ts}',
  ],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubSection(title) {
  log(`\n${title}`, 'yellow');
  log('-'.repeat(title.length), 'yellow');
}

// Test categories
const testCategories = {
  'Security Tests': [
    '__tests__/utils/security.test.ts',
    '__tests__/integration/security.test.ts',
    '__tests__/integration/security-basic.test.ts',
  ],
  'Service Tests': [
    '__tests__/services/auth.service.test.ts',
    '__tests__/services/user.service.test.ts',
    '__tests__/services/workspace.service.test.ts',
  ],
  'API Route Tests': [
    '__tests__/api/auth/login.test.ts',
    '__tests__/api/user/current.test.ts',
  ],
  'Model Tests': ['__tests__/models/user.model.test.ts'],
  'Infrastructure Tests': [
    '__tests__/config.test.ts',
    '__tests__/example.test.ts',
  ],
};

// Check if test files exist
function checkTestFiles() {
  logSection('Checking Test Files');

  const missingFiles = [];
  const existingFiles = [];

  Object.values(testCategories)
    .flat()
    .forEach((testFile) => {
      const fullPath = path.join(__dirname, '..', testFile);
      if (fs.existsSync(fullPath)) {
        existingFiles.push(testFile);
        log(`✓ ${testFile}`, 'green');
      } else {
        missingFiles.push(testFile);
        log(`✗ ${testFile}`, 'red');
      }
    });

  log(`\nFound ${existingFiles.length} test files`);
  if (missingFiles.length > 0) {
    log(`Missing ${missingFiles.length} test files`, 'yellow');
  }

  return { existingFiles, missingFiles };
}

// Run tests by category
function runTestsByCategory() {
  logSection('Running Tests by Category');

  const results = {};

  Object.entries(testCategories).forEach(([category, testFiles]) => {
    logSubSection(category);

    const existingTests = testFiles.filter((testFile) => {
      const fullPath = path.join(__dirname, '..', testFile);
      return fs.existsSync(fullPath);
    });

    if (existingTests.length === 0) {
      log('No tests found for this category', 'yellow');
      return;
    }

    try {
      const testPattern = existingTests.join(' ');
      log(`Running: ${testPattern}`, 'blue');

      const startTime = Date.now();
      const output = execSync(`npm test -- ${testPattern} --verbose`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      const duration = Date.now() - startTime;

      log(`✓ ${category} completed in ${duration}ms`, 'green');
      results[category] = { success: true, duration, output };
    } catch (error) {
      log(`✗ ${category} failed`, 'red');
      log(error.stdout || error.message, 'red');
      results[category] = { success: false, error: error.message };
    }
  });

  return results;
}

// Run all tests
function runAllTests() {
  logSection('Running All Tests');

  try {
    const startTime = Date.now();
    const output = execSync('npm test -- --coverage --verbose', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const duration = Date.now() - startTime;

    log(`✓ All tests completed in ${duration}ms`, 'green');
    return { success: true, duration, output };
  } catch (error) {
    log(`✗ Tests failed`, 'red');
    log(error.stdout || error.message, 'red');
    return { success: false, error: error.message };
  }
}

// Generate test report
function generateReport(results) {
  logSection('Test Report Summary');

  const totalCategories = Object.keys(testCategories).length;
  const successfulCategories = Object.values(results).filter(
    (r) => r.success
  ).length;
  const failedCategories = totalCategories - successfulCategories;

  log(`Total Categories: ${totalCategories}`, 'blue');
  log(`Successful: ${successfulCategories}`, 'green');
  log(`Failed: ${failedCategories}`, failedCategories > 0 ? 'red' : 'green');

  if (failedCategories > 0) {
    log('\nFailed Categories:', 'red');
    Object.entries(results).forEach(([category, result]) => {
      if (!result.success) {
        log(`  - ${category}: ${result.error}`, 'red');
      }
    });
  }

  // Coverage summary
  logSubSection('Coverage Summary');
  log('Check the coverage/ directory for detailed coverage reports', 'blue');
  log('Coverage thresholds:', 'blue');
  log(`  - Branches: ${config.coverageThreshold.global.branches}%`, 'blue');
  log(`  - Functions: ${config.coverageThreshold.global.functions}%`, 'blue');
  log(`  - Lines: ${config.coverageThreshold.global.lines}%`, 'blue');
  log(`  - Statements: ${config.coverageThreshold.global.statements}%`, 'blue');
}

// Main execution
async function main() {
  log('Timeline Backend Test Runner', 'bright');
  log('============================', 'bright');

  try {
    // Check test files
    const { existingFiles, missingFiles } = checkTestFiles();

    if (existingFiles.length === 0) {
      log('\nNo test files found!', 'red');
      process.exit(1);
    }

    // Run tests by category
    const categoryResults = runTestsByCategory();

    // Run all tests for coverage
    logSubSection('Running Full Test Suite with Coverage');
    const allTestsResult = runAllTests();

    // Generate report
    generateReport(categoryResults);

    // Final status
    logSection('Final Status');
    if (allTestsResult.success) {
      log('🎉 All tests passed successfully!', 'green');
      process.exit(0);
    } else {
      log('❌ Some tests failed. Check the output above for details.', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkTestFiles,
  runTestsByCategory,
  runAllTests,
  generateReport,
  testCategories,
};







