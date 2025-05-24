import type { SrcbookType, CellType, CodeLanguageType } from './types.js';

export interface EncodeOptions {
  inline?: boolean;
}

export interface DecodeResult {
  error: boolean;
  srcbook?: SrcbookType;
  errors?: string[];
}

export function encode(srcbook: SrcbookType, options: EncodeOptions = {}): string {
  const { language, cells } = srcbook;
  const { inline = false } = options;
  
  let result = `<!-- srcbook:{"language":"${language}"} -->\n\n`;
  
  for (const cell of cells) {
    switch (cell.type) {
      case 'title':
        result += `# ${cell.text}\n\n`;
        break;
        
      case 'markdown':
        result += `${cell.text}\n\n`;
        break;
        
      case 'package.json':
        result += `###### package.json\n\n\`\`\`json\n${cell.source}\n\`\`\`\n\n`;
        break;
        
      case 'code':
        result += `###### ${cell.filename}\n\n\`\`\`${cell.language}\n${cell.source}\n\`\`\`\n\n`;
        break;
    }
  }
  
  return result;
}

export function decode(srcmdContent: string): DecodeResult {
  try {
    // Extract metadata
    const metadataMatch = srcmdContent.match(/<!-- srcbook:(\{[^}]+\}) -->/);
    if (!metadataMatch) {
      return { error: true, errors: ['Missing srcbook metadata'] };
    }
    
    const metadata = JSON.parse(metadataMatch[1]);
    const language: CodeLanguageType = metadata.language || 'javascript';
    
    const cells: CellType[] = [];
    
    // Simple parser - this is a simplified version of the actual Srcbook parser
    const lines = srcmdContent.split('\n');
    let currentCell: Partial<CellType> | null = null;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Title detection
      if (line.startsWith('# ') && !inCodeBlock) {
        cells.push({
          id: generateId(),
          type: 'title',
          text: line.substring(2).trim(),
        });
        continue;
      }
      
      // File header detection (package.json or code files)
      if (line.startsWith('###### ') && !inCodeBlock) {
        const filename = line.substring(7).trim();
        
        if (filename === 'package.json') {
          currentCell = {
            id: generateId(),
            type: 'package.json',
            filename: 'package.json',
            status: 'idle' as const,
            source: '', // Will be filled when code block is parsed
          };
        } else {
          currentCell = {
            id: generateId(),
            type: 'code',
            filename,
            language,
            status: 'idle' as const,
            source: '', // Will be filled when code block is parsed
          };
        }
        continue;
      }
      
      // Code block start
      if (line.startsWith('```') && !inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = line.substring(3).trim();
        codeBlockContent = '';
        continue;
      }
      
      // Code block end
      if (line.startsWith('```') && inCodeBlock) {
        inCodeBlock = false;
        if (currentCell && (currentCell.type === 'code' || currentCell.type === 'package.json')) {
          currentCell.source = codeBlockContent;
          cells.push(currentCell as CellType);
          currentCell = null;
        }
        codeBlockContent = '';
        continue;
      }
      
      // Code block content
      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        continue;
      }
      
      // Markdown content (collect consecutive non-special lines)
      if (line.trim() && !line.startsWith('###### ') && !line.startsWith('# ')) {
        // Look ahead to collect markdown content
        let markdownContent = line;
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].startsWith('###### ') && 
               !lines[j].startsWith('# ') &&
               !lines[j].startsWith('```')) {
          if (lines[j].trim()) {
            markdownContent += '\n' + lines[j];
          }
          j++;
        }
        
        if (markdownContent.trim()) {
          cells.push({
            id: generateId(),
            type: 'markdown',
            text: markdownContent.trim(),
          });
        }
        
        i = j - 1; // Skip the lines we've processed
      }
    }
    
    return {
      error: false,
      srcbook: { language, cells },
    };
    
  } catch (error) {
    return {
      error: true,
      errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
    };
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
} 