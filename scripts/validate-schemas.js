#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'src', 'data');
const schemaDir = join(dataDir, 'schemas');

async function validateSchemas() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  
  const validations = [
    { schema: 'library-mappings.schema.json', data: 'library-mappings.json' },
    { schema: 'migration-templates.schema.json', data: 'migration-templates.json' },
    { schema: 'compatibility-matrix.schema.json', data: 'compatibility-matrix.json' },
    { schema: 'performance-benchmarks.schema.json', data: 'performance-benchmarks.json' },
    { schema: 'error-patterns.schema.json', data: 'error-patterns.json' },
  ];
  
  let allValid = true;
  
  for (const { schema, data } of validations) {
    try {
      const schemaContent = await fs.readFile(join(schemaDir, schema), 'utf-8');
      const dataContent = await fs.readFile(join(dataDir, data), 'utf-8');
      
      const schemaObj = JSON.parse(schemaContent);
      const dataObj = JSON.parse(dataContent);
      
      const validate = ajv.compile(schemaObj);
      const valid = validate(dataObj);
      
      if (valid) {
        console.log(chalk.green(`✓ ${data} is valid`));
      } else {
        console.log(chalk.red(`✗ ${data} validation failed:`));
        console.error(validate.errors);
        allValid = false;
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠ Could not validate ${data}:`), error.message);
      // Don't fail if file doesn't exist yet
      if (error.code !== 'ENOENT') {
        allValid = false;
      }
    }
  }
  
  if (allValid) {
    console.log(chalk.green('\n✅ All data files are valid!'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n❌ Some validations failed'));
    process.exit(1);
  }
}

validateSchemas().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});