/**
 * SSOT Chapter Data Migration Script
 *
 * Migrates chapter data from TypeScript files to Supabase SSOT table
 * - Reads files from 마더텅_단원_태그 and 자세한통사_단원_태그 directories
 * - Uploads to Supabase ssot table with ANON_KEY
 * - Key format: tagType
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Supabase client with ANON_KEY (unrestricted table)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Directory paths
const SSOT_DIR = path.join(__dirname, '../src/ssot');
const DIRECTORIES = [{ path: '마더텅_단원_태그' }, { path: '자세한통사_단원_태그' }];

/**
 * Extract exported object from TypeScript file using dynamic import
 */
async function extractChapterData(filePath) {
  try {
    // Convert file path to file:// URL
    const fileUrl = pathToFileURL(filePath).href;

    // Dynamic import the module
    const module = await import(fileUrl);

    // Get the first exported value (should be the chapter data)
    const exportedValues = Object.values(module);

    if (exportedValues.length === 0) {
      throw new Error(`No exports found in ${filePath}`);
    }

    // Return the first exported value (the chapter object)
    return exportedValues[0];
  } catch (error) {
    console.error(`Error importing ${filePath}:`, error);
    throw error;
  }
}

/**
 * 객체의 모든 문자열을 NFC로 정규화
 */
function normalizeStrings(obj) {
  if (typeof obj === 'string') {
    return obj.normalize('NFC');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeStrings(item));
  }

  if (obj && typeof obj === 'object') {
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[key.normalize('NFC')] = normalizeStrings(value);
    }
    return normalized;
  }

  return obj;
}

/**
 * Check if key already exists in Supabase
 */
async function checkKeyExists(key) {
  const { data, error } = await supabase.from('ssot').select('key').eq('key', key).single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116: Row not found
    console.error(`Error checking key ${key}:`, error);
    throw error;
  }

  return !!data;
}

/**
 * Upload chapter data to Supabase
 */
async function uploadChapter(key, value) {
  // Check if key already exists
  const exists = await checkKeyExists(key);
  if (exists) {
    console.log(`⏭️  Skipping ${key} (already exists)`);
    return { skipped: true };
  }

  console.log(`Uploading ${key}...`);

  // value 전체를 NFC로 정규화
  const normalizedValue = normalizeStrings(value);

  const { data, error } = await supabase
    .from('ssot')
    .upsert(
      {
        key,
        value: normalizedValue,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
        ignoreDuplicates: false,
      },
    )
    .select();

  if (error) {
    console.error(`Error uploading ${key}:`, error);
    throw error;
  }

  console.log(`✅ Successfully uploaded ${key}`);
  return data;
}

/**
 * Process all TypeScript files in a directory
 */
async function processDirectory(dirName) {
  const dirPath = path.join(SSOT_DIR, dirName);

  console.log(`\nProcessing directory: ${dirName}`);

  try {
    const files = await fs.readdir(dirPath);
    const tsFiles = files.filter((file) => file.endsWith('.ts'));

    console.log(`Found ${tsFiles.length} TypeScript files`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const file of tsFiles) {
      try {
        const filePath = path.join(dirPath, file);

        // Extract chapter data
        const chapterData = await extractChapterData(filePath);

        // tagType을 key로 사용
        const key = chapterData.tagType;

        if (!key) {
          throw new Error(`tagType not found in ${file}`);
        }

        // Upload to Supabase
        const result = await uploadChapter(key, chapterData);

        if (result?.skipped) {
          skipCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to process ${file}:`, error.message);
        failCount++;
      }
    }

    console.log(`\nDirectory ${dirName} complete:`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);
    console.log(`  ❌ Failed: ${failCount}`);

    return { successCount, skipCount, failCount };
  } catch (error) {
    console.error(`Error reading directory ${dirName}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('='.repeat(60));
  console.log('SSOT Chapter Data Migration');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalSkip = 0;
  let totalFail = 0;

  for (const dir of DIRECTORIES) {
    try {
      const result = await processDirectory(dir.path);
      totalSuccess += result.successCount;
      totalSkip += result.skipCount;
      totalFail += result.failCount;
    } catch (error) {
      console.error(`Failed to process directory ${dir.path}:`, error);
      totalFail++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total Success: ${totalSuccess}`);
  console.log(`Total Skipped: ${totalSkip}`);
  console.log(`Total Failed: ${totalFail}`);
  console.log('='.repeat(60));
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
