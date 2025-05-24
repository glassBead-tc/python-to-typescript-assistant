import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from 'node:fs/promises';
import path from 'node:path';

// Import local Srcbook types and utilities
import type { CellType, CodeLanguageType } from '../srcbook/types.js';
import { randomid } from '../srcbook/types.js';
import { encode, decode } from '../srcbook/srcmd.js';
import { generatePortingFilename } from '../srcbook/utils.js';

const CreatePortingNotebookSchema = z.object({
  title: z.string().describe("Title for the porting notebook"),
  pythonCode: z.string().describe("Python code to be ported"),
  description: z.string().optional().describe("Optional description of the porting task"),
  includeValidation: z.boolean().default(true).describe("Whether to include validation cells"),
});

const ExecuteNotebookCellSchema = z.object({
  notebookPath: z.string().describe("Path to the notebook file"),
  cellId: z.string().describe("ID of the cell to execute"),
});

const AddPortingStepSchema = z.object({
  notebookPath: z.string().describe("Path to the notebook file"),
  stepTitle: z.string().describe("Title for this porting step"),
  explanation: z.string().describe("Markdown explanation of the porting step"),
  pythonCode: z.string().optional().describe("Original Python code for this step"),
  typescriptCode: z.string().describe("Converted TypeScript code"),
  notes: z.string().optional().describe("Additional notes about the conversion"),
});

export async function registerNotebookPortingTool(server: McpServer): Promise<void> {
  // Register create-porting-notebook tool
  server.tool(
    "create-porting-notebook",
    "Create a new Srcbook notebook for documenting Python-to-TypeScript porting process",
    {
      title: z.string().describe("Title for the porting notebook"),
      pythonCode: z.string().describe("Python code to be ported"),
      description: z.string().optional().describe("Optional description of the porting task"),
      includeValidation: z.boolean().default(true).describe("Whether to include validation cells"),
    },
    {},
    async (args) => {
      const { title, pythonCode, description, includeValidation } = args;
      const notebook = await createPortingNotebook(title, pythonCode, description, includeValidation);
      
      return {
        content: [
          {
            type: "text",
            text: `Created porting notebook: ${notebook.path}\n\nNotebook structure:\n${notebook.summary}`,
          },
        ],
      };
    }
  );

  // Register add-porting-step tool
  server.tool(
    "add-porting-step",
    "Add a documented porting step to an existing notebook with Python and TypeScript code examples",
    {
      notebookPath: z.string().describe("Path to the notebook file"),
      stepTitle: z.string().describe("Title for this porting step"),
      explanation: z.string().describe("Markdown explanation of the porting step"),
      typescriptCode: z.string().describe("Converted TypeScript code"),
      pythonCode: z.string().optional().describe("Original Python code for this step"),
      notes: z.string().optional().describe("Additional notes about the conversion"),
    },
    {},
    async (args) => {
      const { notebookPath, stepTitle, explanation, typescriptCode, pythonCode, notes } = args;
      const result = await addPortingStep(notebookPath, stepTitle, explanation, typescriptCode, pythonCode, notes);
      
      return {
        content: [
          {
            type: "text", 
            text: `Added porting step "${stepTitle}" to notebook.\n\nStep summary:\n${result.summary}`,
          },
        ],
      };
    }
  );

  // Register execute-notebook-cell tool
  server.tool(
    "execute-notebook-cell",
    "Execute a specific cell in a porting notebook to validate TypeScript code",
    {
      notebookPath: z.string().describe("Path to the notebook file"),
      cellId: z.string().describe("ID of the cell to execute"),
    },
    {},
    async (args) => {
      const { notebookPath, cellId } = args;
      const result = await executeNotebookCell(notebookPath, cellId);
      
      return {
        content: [
          {
            type: "text",
            text: `Executed cell ${cellId}:\n\nOutput:\n${result.output}\n\nErrors:\n${result.errors || 'None'}`,
          },
        ],
      };
    }
  );
}

async function createPortingNotebook(
  title: string, 
  pythonCode: string, 
  description?: string,
  includeValidation: boolean = true
): Promise<{ path: string; summary: string }> {
  const notebookId = randomid();
  const notebookPath = path.join(process.cwd(), 'porting-notebooks', `${notebookId}.src.md`);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(notebookPath), { recursive: true });

  const cells: CellType[] = [
    {
      id: randomid(),
      type: 'title',
      text: title,
    },
    {
      id: randomid(),
      type: 'package.json',
      source: JSON.stringify({
        "type": "module",
        "dependencies": {
          "@types/node": "^20.0.0"
        },
        "devDependencies": {
          "typescript": "^5.0.0",
          "tsx": "^4.0.0"
        }
      }, null, 2),
      filename: 'package.json',
      status: 'idle' as const,
    },
  ];

  if (description) {
    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `## Porting Overview\n\n${description}`,
    });
  }

  // Add original Python code section
  cells.push({
    id: randomid(),
    type: 'markdown',
    text: `## Original Python Code\n\nThe following Python code needs to be ported to TypeScript:\n\n\`\`\`python\n${pythonCode}\n\`\`\``,
  });

  // Add porting analysis section
  cells.push({
    id: randomid(),
    type: 'markdown',
    text: `## Porting Analysis\n\nThis section will document the step-by-step conversion process, including:\n\n- Type analysis and mapping\n- Library dependencies\n- Pattern conversions\n- Runtime considerations`,
  });

  if (includeValidation) {
    // Add validation template
    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `## Validation\n\nThe following cells validate that the TypeScript conversion produces equivalent behavior:`,
    });

    cells.push({
      id: randomid(),
      type: 'code',
      source: `// Validation tests will be added here as conversion steps are documented\nconsole.log('Validation framework ready');`,
      language: 'typescript' as const,
      filename: 'validation.ts',
      status: 'idle' as const,
    });
  }

  const srcmdContent = encode({ 
    cells, 
    language: 'typescript' as CodeLanguageType 
  }, { inline: false });

  await fs.writeFile(notebookPath, srcmdContent, 'utf8');

  const summary = `📓 ${title}
📂 Path: ${notebookPath}
📊 Cells: ${cells.length} total
   - 1 title cell
   - 1 package.json cell
   - ${cells.filter(c => c.type === 'markdown').length} markdown cells
   - ${cells.filter(c => c.type === 'code').length} code cells
🎯 Purpose: Document Python→TypeScript porting process
${includeValidation ? '✅ Includes validation framework' : ''}`;

  return { path: notebookPath, summary };
}

async function addPortingStep(
  notebookPath: string,
  stepTitle: string,
  explanation: string,
  typescriptCode: string,
  pythonCode?: string,
  notes?: string
): Promise<{ summary: string }> {
  // Read existing notebook
  const srcmdContent = await fs.readFile(notebookPath, 'utf8');
  const decoded = decode(srcmdContent);
  
  if (decoded.error || !decoded.srcbook) {
    throw new Error(`Failed to decode notebook: ${decoded.errors?.join(', ')}`);
  }

  const { cells, language } = decoded.srcbook;

  // Find insertion point (before validation section if it exists)
  const validationIndex = cells.findIndex((cell: CellType) => 
    cell.type === 'markdown' && cell.text.includes('## Validation')
  );
  const insertIndex = validationIndex > -1 ? validationIndex : cells.length;

  // Create new cells for this porting step
  const newCells: CellType[] = [];

  // Step header
  newCells.push({
    id: randomid(),
    type: 'markdown',
    text: `## ${stepTitle}\n\n${explanation}`,
  });

  // Python code (if provided)
  if (pythonCode) {
    newCells.push({
      id: randomid(),
      type: 'markdown',
      text: `### Python Code\n\n\`\`\`python\n${pythonCode}\n\`\`\``,
    });
  }

  // TypeScript conversion
  newCells.push({
    id: randomid(),
    type: 'markdown',
    text: `### TypeScript Conversion`,
  });

  const filename = generatePortingFilename(stepTitle);
  newCells.push({
    id: randomid(),
    type: 'code',
    source: typescriptCode,
    language: 'typescript' as const,
    filename,
    status: 'idle' as const,
  });

  // Notes (if provided)
  if (notes) {
    newCells.push({
      id: randomid(),
      type: 'markdown',
      text: `### Notes\n\n${notes}`,
    });
  }

  // Insert new cells
  cells.splice(insertIndex, 0, ...newCells);

  // Re-encode and save
  const updatedSrcmd = encode({ cells, language }, { inline: false });
  await fs.writeFile(notebookPath, updatedSrcmd, 'utf8');

  const summary = `✅ Added porting step: "${stepTitle}"
📝 Explanation: ${explanation.substring(0, 100)}${explanation.length > 100 ? '...' : ''}
💾 Code file: ${filename}
📊 Added ${newCells.length} cells to notebook
${notes ? '📋 Includes implementation notes' : ''}`;

  return { summary };
}

async function executeNotebookCell(
  notebookPath: string,
  cellId: string
): Promise<{ output: string; errors?: string }> {
  // Read notebook
  const srcmdContent = await fs.readFile(notebookPath, 'utf8');
  const decoded = decode(srcmdContent);
  
  if (decoded.error || !decoded.srcbook) {
    throw new Error(`Failed to decode notebook: ${decoded.errors?.join(', ')}`);
  }

  const { cells } = decoded.srcbook;
  const targetCell = cells.find((cell: CellType) => cell.id === cellId);

  if (!targetCell) {
    throw new Error(`Cell with ID ${cellId} not found`);
  }

  if (targetCell.type !== 'code') {
    throw new Error(`Cell ${cellId} is not a code cell`);
  }

  // For now, return a simulated execution result
  // In a full implementation, this would use Srcbook's exec.mts functionality
  return {
    output: `Simulated execution of ${targetCell.filename}:\n${targetCell.source}`
  };
} 