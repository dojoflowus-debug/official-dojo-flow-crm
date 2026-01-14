#!/usr/bin/env node
/**
 * Upload real product images to S3 and update merchandise items
 */
import { storagePut } from '../server/storage.ts';
import { getDb } from '../server/db.ts';
import { merchandiseItems } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const imageMapping = [
  { file: 'product_01.jpg', itemName: 'Kids Karate Gi', type: 'uniform' },
  { file: 'product_02.jpg', itemName: 'Adult Karate Gi', type: 'uniform' },
  { file: 'product_03.jpg', itemName: 'Student Uniform', type: 'uniform' },
  { file: 'product_04.jpg', itemName: 'Black Ninja Uniform', type: 'uniform' },
  { file: 'product_05.jpg', itemName: 'White Training Gi', type: 'uniform' },
];

async function uploadImages() {
  console.log('Starting image upload process...\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  const imageDir = '/home/ubuntu/product_images';
  
  for (const mapping of imageMapping) {
    try {
      const imagePath = path.join(imageDir, mapping.file);
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ File not found: ${mapping.file}`);
        continue;
      }
      
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`📤 Uploading ${mapping.file} (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);
      
      // Upload to S3
      const fileKey = `merchandise/${Date.now()}-${mapping.file}`;
      const { url } = await storagePut(fileKey, imageBuffer, 'image/jpeg');
      console.log(`✅ Uploaded to S3: ${url}`);
      
      // Find matching merchandise item by name or type
      const items = await db.select().from(merchandiseItems).where(
        eq(merchandiseItems.type, mapping.type)
      );
      
      if (items.length > 0) {
        // Update first matching item
        const item = items[0];
        await db.update(merchandiseItems)
          .set({ imageUrl: url })
          .where(eq(merchandiseItems.id, item.id));
        
        console.log(`✅ Updated item: ${item.name} (ID: ${item.id})`);
      } else {
        console.log(`⚠️  No matching item found for type: ${mapping.type}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error processing ${mapping.file}:`, error.message);
      console.log('');
    }
  }
  
  console.log('✨ Image upload complete!');
  process.exit(0);
}

uploadImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
