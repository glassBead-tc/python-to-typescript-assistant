#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";

// Import tools and resources
import { registerPortingStrategyTool } from "./tools/porting-strategy.js";
import { registerTypeAnalysisTool } from "./tools/type-analysis.js";
import { registerLibraryMappingTool } from "./tools/library-mapping.js";
import { registerPatternMappingTool } from "./tools/pattern-mapping.js";
import { registerValidationTool } from "./tools/validation.js";
import { registerNotebookPortingTool } from "./tools/notebook-porting.js";
import { registerEphemeralSrcbooksTool, cleanupEphemeralSrcbooks } from "./tools/ephemeral-srcbooks.js";
import { registerTypeScriptReferences } from "./resources/typescript-references.js";
import { registerPortingGuides } from "./resources/porting-guides.js";
import { registerLibraryDatabase } from "./resources/library-database.js";
import { registerExampleSrcbooks } from "./resources/example-srcbooks.js";
import { registerPortingPrompts } from "./prompts/porting-prompts.js";

/**
 * Python-to-TypeScript Porting MCP Server (Python 3.9+ Optimized)
 * 
 * This server provides systematic tools and references for porting Python code to TypeScript,
 * with a strong opinion on using Python 3.9+ features for the best porting experience.
 * It combines model enhancement capabilities with practical porting resources to address
 * the challenges identified in Python-to-TypeScript migration projects.
 * 
 * Python 3.9+ Optimization:
 * - Union type operators (str | int) map perfectly to TypeScript
 * - Built-in generics (list[str], dict[str, int]) align with TypeScript syntax
 * - Dict merge operators (|, |=) have clear TypeScript equivalents
 * - Modern Python patterns translate more naturally to TypeScript
 * 
 * Key capabilities:
 * 1. Porting Strategy Framework - systematic approach to breaking down porting tasks
 * 2. Type Analysis and Inference - tools for analyzing Python 3.9+ types and suggesting TypeScript equivalents
 * 3. Library Mapping - database of Python-to-TypeScript library equivalents
 * 4. Pattern Recognition - identifying Python 3.9+ patterns and their TypeScript equivalents
 * 5. Incremental Validation - tools for testing and validating conversions
 * 6. Reference Resources - quality TypeScript references and best practices
 */

async function createServer(): Promise<McpServer> {
  const server = new McpServer(
    {
      name: "python-to-typescript-porting-server-py39plus",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
        logging: {},
      },
      instructions: `This server provides comprehensive tools and references for Python-to-TypeScript porting, optimized for Python 3.9+ codebases.

🎯 PYTHON 3.9+ OPTIMIZATION:
- Prioritizes modern union syntax (str | int) over legacy Union[str, int]
- Emphasizes built-in generics (list[str], dict[str, int]) over typing module imports
- Provides clear guidance on dict merge operators (|, |=) and their TypeScript equivalents
- Optimizes patterns for the best syntax alignment between Python 3.9+ and TypeScript

🧪 EPHEMERAL JOURNALS:
Create temporary Srcbook journals for sketching out porting implementations. These structured journals:
- Exist only during your connection (auto-cleanup on termination)
- Provide templates for analysis, experiments, and decision tracking
- Allow you to iterate on approaches before committing to final implementations
- Can be saved as permanent snapshots when you find valuable patterns

TOOL USAGE:
Use 'create-ephemeral-journal' to start a structured journal for porting work.
Use the porting strategy tool to systematically break down complex porting tasks.
Use type analysis to understand Python 3.9+ type patterns and find TypeScript equivalents.
Use library mapping to find TypeScript alternatives to Python libraries.
Use pattern mapping to convert Python 3.9+ idioms to TypeScript best practices.
Use validation tools to verify porting correctness.

Access the TypeScript references for best practices and the porting guides for systematic approaches.`,
    }
  );

  console.error(chalk.cyan("🐍➡️📘 Python-to-TypeScript Porting MCP Server (Python 3.9+ Optimized)"));
  console.error(chalk.gray("Initializing Python 3.9+ optimized porting tools and references..."));

  // Register all capabilities
  await registerPortingStrategyTool(server);
  await registerTypeAnalysisTool(server);
  await registerLibraryMappingTool(server);
  await registerPatternMappingTool(server);
  await registerValidationTool(server);
  await registerNotebookPortingTool(server);
  await registerEphemeralSrcbooksTool(server);
  
  await registerTypeScriptReferences(server);
  await registerPortingGuides(server);
  await registerLibraryDatabase(server);
  await registerExampleSrcbooks(server);
  
  await registerPortingPrompts(server);

  console.error(chalk.green("✅ Server initialized with Python 3.9+ optimized porting capabilities"));
  
  return server;
}

async function main() {
  try {
    const server = await createServer();
    
    const transport = new StdioServerTransport();
    transport.onclose = async () => {
      console.error(chalk.yellow("🔌 Transport closed. Cleaning up ephemeral srcbooks..."));
      await cleanupEphemeralSrcbooks();
      console.error(chalk.yellow("🔌 Exiting."));
      process.exit(0);
    };

    await server.connect(transport);
    console.error(chalk.blue("🚀 Python-to-TypeScript Porting Server running on stdio"));
    
  } catch (error) {
    console.error(chalk.red("❌ Fatal error running server:"), error);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', async () => {
  console.error(chalk.yellow("\n🛑 Received SIGINT, shutting down gracefully..."));
  await cleanupEphemeralSrcbooks();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error(chalk.yellow("\n🛑 Received SIGTERM, shutting down gracefully..."));
  await cleanupEphemeralSrcbooks();
  process.exit(0);
});

main().catch((error) => {
  console.error(chalk.red("💥 Unhandled error:"), error);
  process.exit(1);
}); 