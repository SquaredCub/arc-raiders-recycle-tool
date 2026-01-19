// Script to extract all unique item types from the arcraiders-data
// Run with: node scripts/extract-item-types.js

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Read all JSON files from the items directory
  const itemsDir = join(__dirname, '../src/arcraiders-data/items');
  const files = readdirSync(itemsDir).filter(file => file.endsWith('.json'));

  // Extract unique types
  const types = new Set();
  let itemsWithoutType = 0;
  let totalItems = 0;

  for (const file of files) {
    totalItems++;
    const itemPath = join(itemsDir, file);
    const item = JSON.parse(readFileSync(itemPath, 'utf-8'));

    if (item.type) {
      types.add(item.type);
    } else {
      itemsWithoutType++;
      console.log(`⚠️  Item without type: ${item.id || file}`);
    }
  }

  // Sort types alphabetically
  const sortedTypes = Array.from(types).sort();

  console.log('\n📊 Statistics:');
  console.log(`Total items: ${totalItems}`);
  console.log(`Items without type: ${itemsWithoutType}`);
  console.log(`Unique types found: ${sortedTypes.length}\n`);

  console.log('🏷️  All unique item types:');
  sortedTypes.forEach(type => console.log(`  - ${type}`));

  console.log('\n📝 TypeScript union type:');
  console.log('export type ItemType =');
  sortedTypes.forEach((type, index) => {
    const isLast = index === sortedTypes.length - 1;
    console.log(`  | '${type}'${isLast ? ';' : ''}`);
  });

} catch (error) {
  console.error('❌ Error reading items data:', error.message);
  console.error('\nMake sure the directory exists at: src/arcraiders-data/items/');
  process.exit(1);
}
