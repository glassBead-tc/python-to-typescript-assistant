// Local types based on Srcbook schemas
export interface TitleCellType {
  id: string;
  type: 'title';
  text: string;
}

export interface MarkdownCellType {
  id: string;
  type: 'markdown';
  text: string;
}

export interface PackageJsonCellType {
  id: string;
  type: 'package.json';
  source: string;
  filename: 'package.json';
  status: 'idle' | 'running' | 'failed';
}

export interface CodeCellType {
  id: string;
  type: 'code';
  source: string;
  language: 'javascript' | 'typescript';
  filename: string;
  status: 'idle' | 'running';
}

export interface PlaceholderCellType {
  id: string;
  type: 'placeholder';
  text: string;
}

export type CellType = TitleCellType | MarkdownCellType | PackageJsonCellType | CodeCellType;

export type CodeLanguageType = 'javascript' | 'typescript';

export interface SrcbookType {
  language: CodeLanguageType;
  cells: CellType[];
  'tsconfig.json'?: string;
}

// Re-export the better randomid from utils
export { randomid } from './utils.js'; 