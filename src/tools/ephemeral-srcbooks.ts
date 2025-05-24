import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Import local Srcbook types and utilities
import type { CellType, CodeLanguageType, SrcbookType } from '../srcbook/types.js';
import { randomid } from '../srcbook/types.js';
import { encode, decode } from '../srcbook/srcmd.js';
import { generatePortingFilename } from '../srcbook/utils.js';

// In-memory registry of ephemeral srcbooks
const ephemeralSrcbooks = new Map<string, {
  id: string;
  title: string;
  path: string;
  created: Date;
  lastModified: Date;
  purpose: string;
  srcbook: SrcbookType;
}>();

// Temporary directory for ephemeral srcbooks
let ephemeralDir: string | null = null;

// Initialize temporary directory for ephemeral srcbooks
async function initEphemeralDirectory(): Promise<string> {
  if (!ephemeralDir) {
    ephemeralDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ephemeral-srcbooks-'));
  }
  return ephemeralDir;
}

// Cleanup function to be called on connection termination
export async function cleanupEphemeralSrcbooks(): Promise<void> {
  if (ephemeralDir) {
    try {
      await fs.rm(ephemeralDir, { recursive: true, force: true });
      console.error(`🧹 Cleaned up ephemeral srcbooks directory: ${ephemeralDir}`);
    } catch (error) {
      console.error(`⚠️ Error cleaning up ephemeral srcbooks: ${error}`);
    }
  }
  ephemeralSrcbooks.clear();
}

export async function registerEphemeralSrcbooksTool(server: McpServer): Promise<void> {
  
  // Register create-ephemeral-journal tool
  server.tool(
    "create-ephemeral-journal",
    "Create a new ephemeral Srcbook journal for sketching out porting implementations. These exist only during the connection and auto-cleanup on termination.",
    {
      title: z.string().describe("Title for the ephemeral journal"),
      purpose: z.string().describe("Purpose of this journal (e.g., 'FastAPI endpoints porting', 'NumPy array patterns')"),
      initialNotes: z.string().optional().describe("Initial notes or thoughts to include"),
      includeTemplates: z.boolean().default(true).describe("Whether to include helpful templates for porting work"),
    },
    {},
    async (args) => {
      const { title, purpose, initialNotes, includeTemplates } = args;
      const result = await createEphemeralJournal(title, purpose, initialNotes, includeTemplates);
      
      return {
        content: [
          {
            type: "text",
            text: `✨ Created ephemeral journal: "${title}"\n\n🎯 Purpose: ${purpose}\n📂 ID: ${result.id}\n\n${result.summary}`,
          },
        ],
      };
    }
  );

  // Register list-ephemeral-journals tool
  server.tool(
    "list-ephemeral-journals",
    "List all active ephemeral journals with their details",
    {},
    {},
    async () => {
      const journals = Array.from(ephemeralSrcbooks.values());
      
      if (journals.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📋 No ephemeral journals currently active.\n\nUse 'create-ephemeral-journal' to start a new structured journal for your porting work.",
            },
          ],
        };
      }

      const journalList = journals
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
        .map(j => {
          const cellCount = j.srcbook.cells.length;
          const codeCount = j.srcbook.cells.filter(c => c.type === 'code').length;
          const age = Math.floor((Date.now() - j.created.getTime()) / 1000 / 60);
          return `📓 **${j.title}** (ID: ${j.id})
   🎯 Purpose: ${j.purpose}
   📊 ${cellCount} cells (${codeCount} code)
   ⏰ Created ${age}m ago
   📝 Last modified: ${j.lastModified.toLocaleTimeString()}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `📋 **Active Ephemeral Journals** (${journals.length})\n\n${journalList}\n\n💡 These journals exist only during this connection and will auto-cleanup on termination.`,
          },
        ],
      };
    }
  );

  // Register add-journal-entry tool
  server.tool(
    "add-journal-entry",
    "Add a new entry to an ephemeral journal with code, notes, or experimental implementations",
    {
      journalId: z.string().describe("ID of the ephemeral journal"),
      entryTitle: z.string().describe("Title for this journal entry"),
      entryType: z.enum(['experiment', 'analysis', 'implementation', 'notes', 'comparison']).describe("Type of entry"),
      content: z.string().describe("Main content - can be markdown, code, or analysis"),
      language: z.enum(['typescript', 'javascript', 'markdown']).default('typescript').describe("Language for code content"),
      tags: z.array(z.string()).optional().describe("Optional tags for organizing entries"),
    },
    {},
    async (args) => {
      const { journalId, entryTitle, entryType, content, language, tags } = args;
      const result = await addJournalEntry(journalId, entryTitle, entryType, content, language, tags);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Added ${entryType} entry "${entryTitle}" to journal\n\n${result.summary}`,
          },
        ],
      };
    }
  );

  // Register get-journal-content tool  
  server.tool(
    "get-journal-content",
    "Get the current content of an ephemeral journal in readable format",
    {
      journalId: z.string().describe("ID of the ephemeral journal"),
      format: z.enum(['summary', 'full', 'code-only']).default('summary').describe("Format for the content"),
    },
    {},
    async (args) => {
      const { journalId, format } = args;
      const result = await getJournalContent(journalId, format);
      
      return {
        content: [
          {
            type: "text",
            text: result.content,
          },
        ],
      };
    }
  );

  // Register save-journal-snapshot tool
  server.tool(
    "save-journal-snapshot",
    "Save a permanent snapshot of an ephemeral journal to the persistent notebooks directory",
    {
      journalId: z.string().describe("ID of the ephemeral journal"),
      snapshotName: z.string().optional().describe("Optional name for the snapshot (defaults to journal title)"),
    },
    {},
    async (args) => {
      const { journalId, snapshotName } = args;
      const result = await saveJournalSnapshot(journalId, snapshotName);
      
      return {
        content: [
          {
            type: "text",
            text: `📸 Saved journal snapshot!\n\n💾 Persistent file: ${result.persistentPath}\n📊 Snapshot includes: ${result.summary}`,
          },
        ],
      };
    }
  );
}

async function createEphemeralJournal(
  title: string,
  purpose: string,
  initialNotes?: string,
  includeTemplates: boolean = true
): Promise<{ id: string; summary: string }> {
  const id = randomid();
  const tempDir = await initEphemeralDirectory();
  const journalPath = path.join(tempDir, `${id}.src.md`);

  const cells: CellType[] = [
    {
      id: randomid(),
      type: 'title',
      text: `🧪 ${title}`,
    },
    {
      id: randomid(),
      type: 'markdown',
      text: `## Journal Purpose\n\n${purpose}\n\n⏰ **Created:** ${new Date().toLocaleString()}\n🔄 **Status:** Active (ephemeral)\n\n---`,
    },
  ];

  if (initialNotes) {
    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `## Initial Notes\n\n${initialNotes}`,
    });
  }

  if (includeTemplates) {
    // Add helpful templates for porting work
    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `## Porting Templates\n\nUse these sections to structure your porting work:`,
    });

    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `### 🔍 Analysis Template\n\n**Python Patterns Identified:**\n- [ ] \n\n**TypeScript Equivalents:**\n- [ ] \n\n**Challenges:**\n- [ ] \n\n**Dependencies Needed:**\n- [ ] `,
    });

    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `### 🧪 Experiment Space\n\nUse the cells below to experiment with different approaches:`,
    });

    cells.push({
      id: randomid(),
      type: 'code',
      source: `// Experiment 1: Basic conversion approach\n// TODO: Add experimental TypeScript code here\n\nconsole.log('Experiment space ready');`,
      language: 'typescript' as const,
      filename: 'experiment-1.ts',
      status: 'idle' as const,
    });

    cells.push({
      id: randomid(),
      type: 'markdown',
      text: `### 📝 Decision Log\n\n**Decisions Made:**\n- Date: ${new Date().toLocaleDateString()}\n  - Decision: \n  - Rationale: \n\n**Next Steps:**\n- [ ] `,
    });
  }

  const srcbook: SrcbookType = {
    language: 'typescript' as CodeLanguageType,
    cells,
  };

  // Save to file
  const srcmdContent = encode(srcbook, { inline: false });
  await fs.writeFile(journalPath, srcmdContent, 'utf8');

  // Register in memory
  const now = new Date();
  ephemeralSrcbooks.set(id, {
    id,
    title,
    path: journalPath,
    created: now,
    lastModified: now,
    purpose,
    srcbook,
  });

  const summary = `📓 **Structure:**
- 1 title cell
- ${cells.filter(c => c.type === 'markdown').length} markdown cells
- ${cells.filter(c => c.type === 'code').length} code cells

🎯 **Ready for:** Sketching implementations, experiments, and structured porting analysis
⚠️ **Ephemeral:** Will be cleaned up when connection terminates
💡 **Tip:** Use 'save-journal-snapshot' to make permanent copies of valuable work`;

  return { id, summary };
}

async function addJournalEntry(
  journalId: string,
  entryTitle: string,
  entryType: string,
  content: string,
  language: string,
  tags?: string[]
): Promise<{ summary: string }> {
  const journal = ephemeralSrcbooks.get(journalId);
  if (!journal) {
    throw new Error(`Ephemeral journal ${journalId} not found`);
  }

  const newCells: CellType[] = [];
  const now = new Date();
  const timestamp = now.toLocaleTimeString();

  // Entry header with metadata
  let header = `## ${entryType === 'experiment' ? '🧪' : entryType === 'analysis' ? '🔍' : entryType === 'implementation' ? '⚙️' : entryType === 'comparison' ? '⚖️' : '📝'} ${entryTitle}`;
  
  if (tags && tags.length > 0) {
    header += `\n\n**Tags:** ${tags.map(tag => `\`${tag}\``).join(', ')}`;
  }
  
  header += `\n**Added:** ${timestamp}\n**Type:** ${entryType}\n\n---`;

  newCells.push({
    id: randomid(),
    type: 'markdown',
    text: header,
  });

  // Add content based on language
  if (language === 'markdown') {
    newCells.push({
      id: randomid(),
      type: 'markdown',
      text: content,
    });
  } else {
    // Add as code cell
    const filename = generatePortingFilename(entryTitle, language as 'typescript' | 'javascript');
    newCells.push({
      id: randomid(),
      type: 'code',
      source: content,
      language: language as 'typescript' | 'javascript',
      filename,
      status: 'idle' as const,
    });
  }

  // Add to srcbook
  journal.srcbook.cells.push(...newCells);
  journal.lastModified = now;

  // Save updated srcbook
  const srcmdContent = encode(journal.srcbook, { inline: false });
  await fs.writeFile(journal.path, srcmdContent, 'utf8');

  const summary = `📝 Entry details:
- Type: ${entryType}
- Language: ${language}
- Cells added: ${newCells.length}
- Total cells in journal: ${journal.srcbook.cells.length}
${tags ? `- Tags: ${tags.join(', ')}` : ''}`;

  return { summary };
}

async function getJournalContent(
  journalId: string,
  format: string
): Promise<{ content: string }> {
  const journal = ephemeralSrcbooks.get(journalId);
  if (!journal) {
    throw new Error(`Ephemeral journal ${journalId} not found`);
  }

  const { srcbook, title, purpose, created, lastModified } = journal;

  if (format === 'summary') {
    const cellCounts = {
      total: srcbook.cells.length,
      markdown: srcbook.cells.filter(c => c.type === 'markdown').length,
      code: srcbook.cells.filter(c => c.type === 'code').length,
      title: srcbook.cells.filter(c => c.type === 'title').length,
    };

    const recentEntries = srcbook.cells
      .slice(-3)
      .filter((c): c is Extract<CellType, { type: 'markdown' }> => c.type === 'markdown' && c.text.includes('##'))
      .map(c => {
        const titleMatch = c.text.match(/##\s*(.+)/);
        return titleMatch ? titleMatch[1].split('\n')[0] : 'Untitled';
      });

    return {
      content: `📓 **${title}**\n\n🎯 **Purpose:** ${purpose}\n⏰ **Created:** ${created.toLocaleString()}\n📝 **Last Modified:** ${lastModified.toLocaleString()}\n\n📊 **Content Summary:**\n- Total cells: ${cellCounts.total}\n- Markdown cells: ${cellCounts.markdown}\n- Code cells: ${cellCounts.code}\n\n📋 **Recent Entries:**\n${recentEntries.length > 0 ? recentEntries.map(e => `- ${e}`).join('\n') : '- No recent entries'}\n\n💡 Use format='full' to see complete journal content`
    };
  }

  if (format === 'code-only') {
    const codeCells = srcbook.cells.filter(c => c.type === 'code') as CellType[];
    if (codeCells.length === 0) {
      return { content: `📓 **${title}** - No code cells found` };
    }

    const codeContent = codeCells
      .map((cell, index) => {
        const c = cell as Extract<CellType, { type: 'code' }>;
        return `### Code Cell ${index + 1}: ${c.filename}\n\`\`\`${c.language}\n${c.source}\n\`\`\``;
      })
      .join('\n\n');

    return { content: `📓 **${title}** - Code Cells\n\n${codeContent}` };
  }

  // Full format
  const fullContent = srcbook.cells
    .map(cell => {
      switch (cell.type) {
        case 'title':
          return `# ${cell.text}`;
        case 'markdown':
          return cell.text;
        case 'code':
          const c = cell as Extract<CellType, { type: 'code' }>;
          return `### 📄 ${c.filename}\n\`\`\`${c.language}\n${c.source}\n\`\`\``;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return { content: fullContent };
}

async function saveJournalSnapshot(
  journalId: string,
  snapshotName?: string
): Promise<{ persistentPath: string; summary: string }> {
  const journal = ephemeralSrcbooks.get(journalId);
  if (!journal) {
    throw new Error(`Ephemeral journal ${journalId} not found`);
  }

  // Ensure persistent directory exists
  const persistentDir = path.join(process.cwd(), 'porting-notebooks');
  await fs.mkdir(persistentDir, { recursive: true });

  // Generate snapshot filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = snapshotName || journal.title;
  const safeTitle = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const snapshotPath = path.join(persistentDir, `${safeTitle}-snapshot-${timestamp}.src.md`);

  // Add snapshot metadata to the beginning
  const snapshotCells: CellType[] = [
    {
      id: randomid(),
      type: 'markdown',
      text: `> **📸 Snapshot Information**
> 
> This is a permanent snapshot of an ephemeral journal.
> 
> - **Original Title:** ${journal.title}
> - **Purpose:** ${journal.purpose}
> - **Created:** ${journal.created.toLocaleString()}
> - **Snapshot Date:** ${new Date().toLocaleString()}
> - **Original ID:** ${journalId}

---`,
    },
    ...journal.srcbook.cells,
  ];

  const snapshotSrcbook: SrcbookType = {
    ...journal.srcbook,
    cells: snapshotCells,
  };

  // Save snapshot
  const srcmdContent = encode(snapshotSrcbook, { inline: false });
  await fs.writeFile(snapshotPath, srcmdContent, 'utf8');

  const summary = `- ${snapshotCells.length} total cells
- ${snapshotCells.filter(c => c.type === 'code').length} code cells
- ${snapshotCells.filter(c => c.type === 'markdown').length} markdown cells
- Includes original metadata and timestamp`;

  return { 
    persistentPath: snapshotPath, 
    summary 
  };
} 