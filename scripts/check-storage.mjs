#!/usr/bin/env node
/**
 * Script to check storage bucket for orphaned uploads
 * Lists all files in storage for a specific organization
 */

import 'dotenv/config';

const baseUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

if (!baseUrl || !apiKey) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function listStorageFiles(prefix = '') {
  const listUrl = new URL('v1/storage/list', baseUrl + '/');
  if (prefix) {
    listUrl.searchParams.set('prefix', prefix);
  }
  
  console.log(`Checking storage at: ${listUrl.toString()}`);
  
  try {
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Storage list failed (${response.status}): ${text}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing storage:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== Storage Bucket Investigation ===\n');
  
  // Check for student photos
  console.log('1. Checking for student photos...');
  const studentPhotos = await listStorageFiles('student-photos/');
  if (studentPhotos) {
    console.log('Student photos found:', JSON.stringify(studentPhotos, null, 2));
  }
  
  // Check for profile pictures
  console.log('\n2. Checking for profile pictures...');
  const profilePics = await listStorageFiles('profile-pictures/');
  if (profilePics) {
    console.log('Profile pictures found:', JSON.stringify(profilePics, null, 2));
  }
  
  // Check for logos
  console.log('\n3. Checking for logos...');
  const logos = await listStorageFiles('logos/');
  if (logos) {
    console.log('Logos found:', JSON.stringify(logos, null, 2));
  }
  
  // Check root level
  console.log('\n4. Checking root level...');
  const root = await listStorageFiles('');
  if (root) {
    console.log('Root level files:', JSON.stringify(root, null, 2));
  }
}

main().catch(console.error);
