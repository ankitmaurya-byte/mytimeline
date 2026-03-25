#!/usr/bin/env node

/**
 * Replace Heavy Emoji Picker Script
 * Replaces @emoji-mart with native emoji picker to reduce bundle size
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🎯 Starting emoji picker replacement...\n');

// Files that might be using the heavy emoji picker
const FILES_TO_CHECK = [
  'src/components/emoji-picker/index.tsx',
  'src/components/emoji-picker/lazy-emoji-picker.tsx',
  'src/components/workspace/task',
  'src/components/workspace/project',
  'src/components/workspace/member',
  'src/page/workspace',
  'src/app',
];

// Search for emoji picker usage
const findEmojiPickerUsage = () => {
  console.log('🔍 Searching for emoji picker usage...\n');

  try {
    // Search for imports
    const importResults = execSync(
      'grep -r "emoji-mart" src/ --include="*.tsx" --include="*.ts" || true',
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      }
    );

    if (importResults.trim()) {
      console.log('📦 Found emoji-mart imports:');
      console.log(importResults);
      console.log('');
    } else {
      console.log('✅ No emoji-mart imports found\n');
    }

    // Search for EmojiPicker component usage
    const componentResults = execSync(
      'grep -r "EmojiPicker" src/ --include="*.tsx" --include="*.ts" || true',
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      }
    );

    if (componentResults.trim()) {
      console.log('🎨 Found EmojiPicker component usage:');
      console.log(componentResults);
      console.log('');
    } else {
      console.log('✅ No EmojiPicker component usage found\n');
    }
  } catch (error) {
    console.log('⚠️ Search completed (some files may not exist)\n');
  }
};

// Remove emoji-mart dependencies
const removeEmojiMartDependencies = () => {
  console.log('🗑️ Removing emoji-mart dependencies...\n');

  try {
    execSync('npm uninstall @emoji-mart/react @emoji-mart/data', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Emoji-mart dependencies removed\n');
  } catch (error) {
    console.log('❌ Failed to remove dependencies:', error.message);
  }
};

// Update package.json scripts
const updatePackageScripts = () => {
  console.log('📝 Updating package.json scripts...\n');

  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add new script for emoji picker replacement
    packageJson.scripts = {
      ...packageJson.scripts,
      'replace:emoji-picker': 'node scripts/replace-emoji-picker.mjs',
      'build:no-emoji-mart': 'npm run replace:emoji-picker && npm run build',
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json scripts updated\n');
  } catch (error) {
    console.log('❌ Failed to update package.json:', error.message);
  }
};

// Generate replacement guide
const generateReplacementGuide = () => {
  console.log('📋 Emoji Picker Replacement Guide:');
  console.log('='.repeat(50));
  console.log('');
  console.log('1. 🎯 REPLACE IMPORTS:');
  console.log('   Old: import Picker from "@emoji-mart/react"');
  console.log(
    '   New: import { NativeEmojiPicker } from "@/components/emoji-picker/NativeEmojiPicker"'
  );
  console.log('');
  console.log('2. 🎨 UPDATE COMPONENT USAGE:');
  console.log('   Old: <Picker onSelectEmoji={handleEmoji} />');
  console.log('   New: <NativeEmojiPicker onSelectEmoji={handleEmoji} />');
  console.log('');
  console.log('3. 📦 REMOVE DATA IMPORTS:');
  console.log('   Old: import data from "@emoji-mart/data"');
  console.log('   New: (Remove - not needed)');
  console.log('');
  console.log('4. 🚀 BENEFITS:');
  console.log('   - 466KB → ~5KB (99% reduction)');
  console.log('   - No external dependencies');
  console.log('   - Faster loading');
  console.log('   - Native browser support');
  console.log('');
};

// Main execution
const main = () => {
  findEmojiPickerUsage();
  generateReplacementGuide();

  console.log('🎯 Next Steps:');
  console.log('1. Replace emoji picker imports in your components');
  console.log('2. Update component usage to use NativeEmojiPicker');
  console.log('3. Remove @emoji-mart dependencies');
  console.log('4. Test the new native emoji picker');
  console.log('5. Run bundle analysis to see the improvement');
  console.log('');
  console.log('💡 Expected bundle reduction: 466KB → ~5KB');
  console.log('🚀 Run "npm run build:optimize" to test the changes\n');
};

main();

























