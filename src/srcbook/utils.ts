import * as crypto from 'crypto';

/**
 * Generate a secure random ID using crypto
 */
export function randomid(byteSize = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteSize));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate if a filename is acceptable for TypeScript/JavaScript
 */
export function validFilename(filename: string): boolean {
  return /^[a-zA-Z0-9_-]+\.(js|cjs|mjs|ts|cts|mts)$/.test(filename);
}

/**
 * Check if filename is a JavaScript file
 */
export function isJavaScriptFile(filename: string): boolean {
  return /\.(js|cjs|mjs)$/.test(filename);
}

/**
 * Check if filename is a TypeScript file
 */
export function isTypeScriptFile(filename: string): boolean {
  return /\.(ts|cts|mts)$/.test(filename);
}

/**
 * Determine language from filename extension
 */
export function languageFromFilename(filename: string): 'javascript' | 'typescript' {
  if (isJavaScriptFile(filename)) {
    return 'javascript';
  } else if (isTypeScriptFile(filename)) {
    return 'typescript';
  } else {
    throw new Error(
      `Language is not one of 'javascript' or 'typescript' based on filename '${filename}'`
    );
  }
}

/**
 * Get file extensions for a language
 */
export function extensionsForLanguage(language: 'javascript' | 'typescript'): string[] {
  switch (language) {
    case 'javascript':
      return ['js', 'cjs', 'mjs'];
    case 'typescript':
      return ['ts', 'cts', 'mts'];
    default:
      throw new Error(`Unrecognized language ${language}`);
  }
}

/**
 * Get default file extension for a language
 */
export function getDefaultExtensionForLanguage(language: 'javascript' | 'typescript'): string {
  switch (language) {
    case 'javascript':
      return '.js';
    case 'typescript':
      return '.ts';
    default:
      throw new Error(`Unrecognized language ${language}`);
  }
}

/**
 * Generate a suitable filename for porting steps
 */
export function generatePortingFilename(stepTitle: string, language: 'javascript' | 'typescript' = 'typescript'): string {
  const sanitized = stepTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  const extension = getDefaultExtensionForLanguage(language);
  return `${sanitized}-${randomid(4)}${extension}`;
} 