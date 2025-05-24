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
import { registerTypeScriptReferences } from "./resources/typescript-references.js";
import { registerPortingGuides } from "./resources/porting-guides.js";
import { registerLibraryDatabase } from "./resources/library-database.js";
import { registerPortingPrompts } from "./prompts/porting-prompts.js";
/**
 * Python-to-TypeScript Porting MCP Server
 *
 * This server provides systematic tools and references for porting Python code to TypeScript.
 * It combines model enhancement capabilities with practical porting resources to address
 * the challenges identified in Python-to-TypeScript migration projects.
 *
 * Key capabilities:
 * 1. Porting Strategy Framework - systematic approach to breaking down porting tasks
 * 2. Type Analysis and Inference - tools for analyzing Python types and suggesting TypeScript equivalents
 * 3. Library Mapping - database of Python-to-TypeScript library equivalents
 * 4. Pattern Recognition - identifying Python patterns and their TypeScript equivalents
 * 5. Incremental Validation - tools for testing and validating conversions
 * 6. Reference Resources - quality TypeScript references and best practices
 */
async function createServer() {
    const server = new McpServer({
        name: "python-to-typescript-porting-server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: { listChanged: true },
            resources: { listChanged: true },
            prompts: { listChanged: true },
            logging: {},
        },
        instructions: `This server provides comprehensive tools and references for Python-to-TypeScript porting.

Use the porting strategy tool to systematically break down complex porting tasks.
Use type analysis to understand Python type patterns and find TypeScript equivalents.
Use library mapping to find TypeScript alternatives to Python libraries.
Use pattern mapping to convert Python idioms to TypeScript best practices.
Use validation tools to verify porting correctness.

Access the TypeScript references for best practices and the porting guides for systematic approaches.`,
    });
    console.error(chalk.cyan("🐍➡️📘 Python-to-TypeScript Porting MCP Server"));
    console.error(chalk.gray("Initializing porting tools and references..."));
    // Register all capabilities
    await registerPortingStrategyTool(server);
    await registerTypeAnalysisTool(server);
    await registerLibraryMappingTool(server);
    await registerPatternMappingTool(server);
    await registerValidationTool(server);
    await registerTypeScriptReferences(server);
    await registerPortingGuides(server);
    await registerLibraryDatabase(server);
    await registerPortingPrompts(server);
    console.error(chalk.green("✅ Server initialized with all porting capabilities"));
    return server;
}
async function main() {
    try {
        const server = await createServer();
        const transport = new StdioServerTransport();
        transport.onclose = () => {
            console.error(chalk.yellow("🔌 Transport closed. Exiting."));
            process.exit(0);
        };
        await server.connect(transport);
        console.error(chalk.blue("🚀 Python-to-TypeScript Porting Server running on stdio"));
    }
    catch (error) {
        console.error(chalk.red("❌ Fatal error running server:"), error);
        process.exit(1);
    }
}
// Handle process signals gracefully
process.on('SIGINT', () => {
    console.error(chalk.yellow("\n🛑 Received SIGINT, shutting down gracefully..."));
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.error(chalk.yellow("\n🛑 Received SIGTERM, shutting down gracefully..."));
    process.exit(0);
});
main().catch((error) => {
    console.error(chalk.red("💥 Unhandled error:"), error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map