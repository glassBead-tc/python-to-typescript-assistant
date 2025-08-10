import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'src', 'data');
const schemaDir = join(dataDir, 'schemas');

describe('Data File Validation', () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  it('should validate library-mappings.json against schema', async () => {
    const schemaContent = await fs.readFile(join(schemaDir, 'library-mappings.schema.json'), 'utf-8');
    const dataContent = await fs.readFile(join(dataDir, 'library-mappings.json'), 'utf-8');
    
    const schema = JSON.parse(schemaContent);
    const data = JSON.parse(dataContent);
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
    expect(data.version).toBeDefined();
    expect(data.generatedAt).toBeDefined();
  });

  it('should validate migration-templates.json against schema', async () => {
    const schemaContent = await fs.readFile(join(schemaDir, 'migration-templates.schema.json'), 'utf-8');
    const dataContent = await fs.readFile(join(dataDir, 'migration-templates.json'), 'utf-8');
    
    const schema = JSON.parse(schemaContent);
    const data = JSON.parse(dataContent);
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
    expect(data.templates).toBeInstanceOf(Array);
    expect(data.templates.length).toBeGreaterThan(0);
  });

  it('should validate compatibility-matrix.json against schema', async () => {
    const schemaContent = await fs.readFile(join(schemaDir, 'compatibility-matrix.schema.json'), 'utf-8');
    const dataContent = await fs.readFile(join(dataDir, 'compatibility-matrix.json'), 'utf-8');
    
    const schema = JSON.parse(schemaContent);
    const data = JSON.parse(dataContent);
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
  });

  it('should validate performance-benchmarks.json against schema', async () => {
    const schemaContent = await fs.readFile(join(schemaDir, 'performance-benchmarks.schema.json'), 'utf-8');
    const dataContent = await fs.readFile(join(dataDir, 'performance-benchmarks.json'), 'utf-8');
    
    const schema = JSON.parse(schemaContent);
    const data = JSON.parse(dataContent);
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
    expect(data.benchmarks).toBeInstanceOf(Array);
    expect(data.budgets).toBeDefined();
  });

  it('should validate error-patterns.json against schema', async () => {
    const schemaContent = await fs.readFile(join(schemaDir, 'error-patterns.schema.json'), 'utf-8');
    const dataContent = await fs.readFile(join(dataDir, 'error-patterns.json'), 'utf-8');
    
    const schema = JSON.parse(schemaContent);
    const data = JSON.parse(dataContent);
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
    expect(data.patterns).toBeInstanceOf(Array);
    expect(data.patterns.length).toBeGreaterThan(0);
  });

  it('should have consistent versions across data files', async () => {
    const files = [
      'library-mappings.json',
      'migration-templates.json',
      'compatibility-matrix.json',
      'performance-benchmarks.json',
      'error-patterns.json',
    ];
    
    const versions: string[] = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(join(dataDir, file), 'utf-8');
        const data = JSON.parse(content);
        if (data.version) {
          versions.push(data.version);
        }
      } catch {
        // File might not exist yet
      }
    }
    
    // All versions should be the same
    if (versions.length > 0) {
      const uniqueVersions = [...new Set(versions)];
      expect(uniqueVersions.length).toBe(1);
      expect(uniqueVersions[0]).toMatch(/^\d{4}\.\d{2}$/);
    }
  });
});