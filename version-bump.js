#!/usr/bin/env node

/**
 * Version bump script for lunchplanner-v2
 * 
 * Updates versions in all package.json files across the project
 * Usage: node version-bump.js v1.0.1
 */

const fs = require('fs');
const path = require('path');

// Package.json paths relative to project root
const packagePaths = [
  './package.json',
  './src/client/package.json',
  './src/lambda/meals/package.json',
  './src/lambda/ingredients/package.json',
  './src/lambda/shoppingLists/package.json'
];

// Get version from command line arguments
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Error: No version specified');
  console.error('Usage: node version-bump.js v1.0.1');
  process.exit(1);
}

// Strip 'v' prefix if present for consistency
const versionNumber = newVersion.startsWith('v') 
  ? newVersion.substring(1) 
  : newVersion;

// Validate version format (basic semver validation)
if (!versionNumber.match(/^\d+\.\d+\.\d+$/)) {
  console.error('Error: Invalid version format. Must be in format x.y.z');
  console.error('Usage: node version-bump.js v1.0.1');
  process.exit(1);
}

console.log(`Updating all package.json files to version ${versionNumber}...`);

// Update each package.json file
packagePaths.forEach(packagePath => {
  const fullPath = path.resolve(__dirname, packagePath);
  
  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: ${packagePath} does not exist, skipping.`);
      return;
    }
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const oldVersion = packageJson.version;
    
    // Update version
    packageJson.version = versionNumber;
    
    // Write back to file
    fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✓ Updated ${packagePath} from ${oldVersion} to ${versionNumber}`);
  } catch (error) {
    console.error(`Error updating ${packagePath}: ${error.message}`);
  }
});

console.log('Version update complete!'); 