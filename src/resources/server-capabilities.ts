import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DatasetInfo {
  version: string;
  sha256: string;
  lastModified?: string;
}

interface ServerCapabilities {
  name: string;
  version: string;
  description: string;
  datasets: Record<string, DatasetInfo>;
  tools: string[];
  prompts: string[];
  resources: string[];
  features: {
    realExecution: boolean;
    differentialTesting: boolean;
    astAnalysis: boolean;
    orchestratedWorkflows: boolean;
    hybridArchitectures: boolean;
  };
  experimental: string[];
}

async function getDatasetHash(filename: string): Promise<string> {
  try {
    const dataPath = join(__dirname, '..', 'data', filename);
    const content = await fs.readFile(dataPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return 'unavailable';
  }
}

async function getDatasetInfo(filename: string): Promise<DatasetInfo> {
  try {
    const dataPath = join(__dirname, '..', 'data', filename);
    const content = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    const stats = await fs.stat(dataPath);
    
    return {
      version: data.version || 'unknown',
      sha256: createHash('sha256').update(content).digest('hex'),
      lastModified: stats.mtime.toISOString(),
    };
  } catch {
    return {
      version: 'unknown',
      sha256: 'unavailable',
    };
  }
}

export async function registerServerCapabilities(server: McpServer): Promise<void> {
  server.resource(
    'server-capabilities',
    'server://capabilities',
    async () => {
    // Get dataset information
    const datasets: Record<string, DatasetInfo> = {
      'type-mappings': await getDatasetInfo('type-mappings.json'),
      'library-mappings': await getDatasetInfo('library-mappings.json'),
      'stdlib-mappings': await getDatasetInfo('stdlib-mappings.json'),
      'patterns': await getDatasetInfo('patterns.json'),
      'testing-strategies': await getDatasetInfo('testing-strategies.json'),
      'python-version-compatibility': await getDatasetInfo('python-version-compatibility.json'),
      'migration-templates': await getDatasetInfo('migration-templates.json'),
      'compatibility-matrix': await getDatasetInfo('compatibility-matrix.json'),
      'performance-benchmarks': await getDatasetInfo('performance-benchmarks.json'),
      'error-patterns': await getDatasetInfo('error-patterns.json'),
    };
    
    const capabilities: ServerCapabilities = {
      name: 'python-to-typescript-porting-server-py39plus',
      version: '1.3.0',
      description: 'Comprehensive MCP server for Python to TypeScript migration with real execution and differential testing',
      datasets,
      tools: [
        'porting-strategy',
        'type-analysis',
        'library-mapping',
        'pattern-mapping',
        'validation-strategy',
        'create-porting-notebook',
        'add-porting-step',
        'execute-notebook-cell',
        'python-ast-analyze',
        'differential-test',
      ],
      prompts: [
        'porting-quick-start',
        'django-to-node',
        'flask-to-express',
        'numpy-to-typescript',
        'typing-strategy',
        'workflow:porting-sprint',
        'workflow:diff-test-bootstrap',
      ],
      resources: [
        'typescript://references',
        'guides://methodology',
        'guides://common-patterns',
        'guides://testing-strategies',
        'guides://hybrid-architectures',
        'library://django-examples',
        'library://flask-examples',
        'library://fastapi-examples',
        'library://numpy-examples',
        'library://typing-examples',
        'library://database',
        'srcbooks://examples',
        'server://capabilities',
        'system://status',
      ],
      features: {
        realExecution: true,
        differentialTesting: true,
        astAnalysis: true,
        orchestratedWorkflows: true,
        hybridArchitectures: true,
      },
      experimental: [
        'wasm-bridges',
        'cognitive-complexity-analysis',
        'auto-migration-suggestions',
      ],
    };
    
    return {
      contents: [{
        uri: 'server://capabilities',
        mimeType: 'application/json',
        text: JSON.stringify(capabilities, null, 2)
      }]
    };
  });
}

export async function registerSystemStatus(server: McpServer): Promise<void> {
  server.resource(
    'system-status',
    'system://status',
    async () => {
    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: {
        hasPython: await checkPythonAvailable(),
        hasTsx: await checkTsxAvailable(),
      },
    };
    
    return {
      contents: [{
        uri: 'system://status',
        mimeType: 'application/json',
        text: JSON.stringify(status, null, 2)
      }]
    };
  });
}

async function checkPythonAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('python3', ['--version']);
    return true;
  } catch {
    return false;
  }
}

async function checkTsxAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('tsx', ['--version']);
    return true;
  } catch {
    return false;
  }
}

function formatCapabilities(caps: ServerCapabilities): string {
  const lines: string[] = [];
  
  lines.push(`=== ${caps.name} v${caps.version} ===`);
  lines.push(caps.description);
  lines.push('');
  
  lines.push('Features:');
  lines.push(`  ✓ Real TypeScript Execution: ${caps.features.realExecution ? 'Enabled' : 'Disabled'}`);
  lines.push(`  ✓ Differential Testing: ${caps.features.differentialTesting ? 'Enabled' : 'Disabled'}`);
  lines.push(`  ✓ AST Analysis: ${caps.features.astAnalysis ? 'Enabled' : 'Disabled'}`);
  lines.push(`  ✓ Orchestrated Workflows: ${caps.features.orchestratedWorkflows ? 'Enabled' : 'Disabled'}`);
  lines.push(`  ✓ Hybrid Architectures: ${caps.features.hybridArchitectures ? 'Enabled' : 'Disabled'}`);
  lines.push('');
  
  lines.push(`Tools (${caps.tools.length}):`);
  for (const tool of caps.tools.slice(0, 5)) {
    lines.push(`  • ${tool}`);
  }
  if (caps.tools.length > 5) {
    lines.push(`  ... and ${caps.tools.length - 5} more`);
  }
  lines.push('');
  
  lines.push('Datasets:');
  for (const [name, info] of Object.entries(caps.datasets)) {
    lines.push(`  • ${name}: v${info.version} (${info.sha256.substring(0, 8)}...)`);
  }
  lines.push('');
  
  if (caps.experimental.length > 0) {
    lines.push('Experimental Features:');
    for (const feature of caps.experimental) {
      lines.push(`  ⚗️ ${feature}`);
    }
  }
  
  return lines.join('\n');
}

function formatStatus(status: any): string {
  const lines: string[] = [];
  
  lines.push('=== System Status ===');
  lines.push(`Status: ${status.status}`);
  lines.push(`Timestamp: ${status.timestamp}`);
  lines.push(`Uptime: ${Math.floor(status.uptime)}s`);
  lines.push('');
  
  lines.push('Memory:');
  lines.push(`  Used: ${(status.memory.used / 1024 / 1024).toFixed(2)} MB`);
  lines.push(`  Total: ${(status.memory.total / 1024 / 1024).toFixed(2)} MB`);
  lines.push('');
  
  lines.push('Environment:');
  lines.push(`  Node: ${status.nodeVersion}`);
  lines.push(`  Platform: ${status.platform} (${status.arch})`);
  lines.push(`  Python3: ${status.environment.hasPython ? 'Available' : 'Not found'}`);
  lines.push(`  TSX: ${status.environment.hasTsx ? 'Available' : 'Not found'}`);
  
  return lines.join('\n');
}