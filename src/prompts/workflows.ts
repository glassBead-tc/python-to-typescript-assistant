import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export async function registerWorkflowPrompts(server: McpServer): Promise<void> {
  server.prompt(
    'workflow:porting-sprint',
    'Orchestrated workflow for systematic Python to TypeScript porting',
    {
      projectPath: z.string().describe('Path to the Python project to analyze'),
      targetModules: z.string().optional().describe('Specific modules to port (comma-separated)'),
      complexity: z.enum(['simple', 'moderate', 'complex']).optional().describe('Project complexity'),
    },
    async ({ projectPath, targetModules, complexity = 'moderate' }: any) => {
    const modules = targetModules ? targetModules.split(',').map((m: string) => m.trim()) : ['all'];
    
    const workflowSteps = generatePortingWorkflow(projectPath, modules, complexity);
    const toolCalls = generateToolCallPayloads(projectPath, modules);
    
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: formatWorkflowPrompt(workflowSteps, toolCalls)
        }
      }]
    };
  });

  server.prompt(
    'workflow:diff-test-bootstrap',
    'Bootstrap differential testing for Python to TypeScript migration',
    {
      pythonFile: z.string().describe('Path to Python file with functions to test'),
      typeScriptFile: z.string().describe('Path to TypeScript file with ported functions'),
      functionNames: z.string().describe('Comma-separated list of functions to test'),
      testCount: z.string().optional().describe('Number of test cases to generate per function'),
    },
    async ({ pythonFile, typeScriptFile, functionNames, testCount = '5' }: any) => {
    const functions = functionNames.split(',').map((f: string) => f.trim());
    const count = parseInt(testCount, 10);
    
    const testSuite = generateDifferentialTestSuite(
      pythonFile,
      typeScriptFile,
      functions,
      count
    );
    
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: formatDiffTestWorkflow(testSuite)
        }
      }]
    };
  });
}

function generatePortingWorkflow(
  projectPath: string,
  modules: string[],
  complexity: string
): WorkflowStep[] {
  const steps: WorkflowStep[] = [
    {
      id: 'analyze-structure',
      name: 'Analyze Project Structure',
      description: 'Understand the Python project architecture and dependencies',
      tool: 'python-ast-analyze',
      payload: {
        projectPath,
        analysisLevel: 'comprehensive',
      },
      estimatedTime: '5-10 minutes',
    },
    {
      id: 'strategy',
      name: 'Generate Porting Strategy',
      description: 'Create a strategic plan for the migration',
      tool: 'porting-strategy',
      payload: {
        projectInfo: {
          path: projectPath,
          modules,
          complexity,
        },
      },
      estimatedTime: '2-5 minutes',
    },
    {
      id: 'type-analysis',
      name: 'Analyze Type Patterns',
      description: 'Identify Python type hints and patterns for TypeScript conversion',
      tool: 'type-analysis',
      payload: {
        projectPath,
        includeDataclasses: true,
        includeTypedDict: true,
      },
      estimatedTime: '5-10 minutes',
    },
    {
      id: 'library-mapping',
      name: 'Map Library Dependencies',
      description: 'Find TypeScript equivalents for Python libraries',
      tool: 'library-mapping',
      payload: {
        requirements: 'auto-detect',
      },
      estimatedTime: '3-5 minutes',
    },
    {
      id: 'pattern-analysis',
      name: 'Identify Code Patterns',
      description: 'Detect Python-specific patterns requiring special handling',
      tool: 'pattern-mapping',
      payload: {
        patterns: [
          'decorators',
          'context-managers',
          'comprehensions',
          'generators',
          'metaclasses',
        ],
      },
      estimatedTime: '5-10 minutes',
    },
    {
      id: 'create-notebook',
      name: 'Create Porting Notebook',
      description: 'Initialize interactive notebook for side-by-side porting',
      tool: 'create-porting-notebook',
      payload: {
        title: `Porting ${modules.join(', ')}`,
        projectPath,
      },
      estimatedTime: '1-2 minutes',
    },
    {
      id: 'implement-core',
      name: 'Implement Core Functions',
      description: 'Port core business logic functions',
      tool: 'add-porting-step',
      payload: {
        category: 'core-logic',
        priority: 'high',
      },
      estimatedTime: '30-60 minutes',
    },
    {
      id: 'differential-testing',
      name: 'Set Up Differential Testing',
      description: 'Create tests comparing Python and TypeScript outputs',
      tool: 'differential-test',
      payload: {
        mode: 'comprehensive',
        tolerance: 0.0001,
      },
      estimatedTime: '15-30 minutes',
    },
    {
      id: 'validation',
      name: 'Validate Migration',
      description: 'Run validation checks and performance benchmarks',
      tool: 'validation-strategy',
      payload: {
        includePerformance: true,
        includeSecurity: true,
      },
      estimatedTime: '10-20 minutes',
    },
    {
      id: 'documentation',
      name: 'Generate Documentation',
      description: 'Create migration documentation and notes',
      tool: 'create-porting-notebook',
      payload: {
        mode: 'documentation',
        includeDecisions: true,
      },
      estimatedTime: '5-10 minutes',
    },
  ];
  
  // Adjust steps based on complexity
  if (complexity === 'simple') {
    return steps.filter(s => !['pattern-analysis', 'differential-testing'].includes(s.id));
  } else if (complexity === 'complex') {
    steps.splice(7, 0, {
      id: 'hybrid-architecture',
      name: 'Design Hybrid Architecture',
      description: 'Plan gradual migration with Python-TypeScript interop',
      tool: 'resource',
      payload: {
        uri: 'guides://hybrid-architectures',
      },
      estimatedTime: '20-30 minutes',
    });
  }
  
  return steps;
}

function generateToolCallPayloads(projectPath: string, modules: string[]): ToolCallPayload[] {
  return [
    {
      tool: 'python-ast-analyze',
      description: 'Analyze Python AST for migration complexity',
      payload: {
        code: '# Will be populated with actual code',
        analysisLevel: 'comprehensive',
        includeComplexity: true,
      },
    },
    {
      tool: 'porting-strategy',
      description: 'Generate strategic migration plan',
      payload: {
        projectInfo: {
          description: 'Python project',
          mainTechnologies: ['auto-detect'],
          teamSize: 'small',
          timeline: 'flexible',
        },
        constraints: {
          mustKeepPythonServices: false,
          canUseHybridArchitecture: true,
        },
      },
    },
    {
      tool: 'type-analysis',
      description: 'Analyze and convert type annotations',
      payload: {
        pythonCode: '# Code with type hints',
        includeGenerics: true,
        strictMode: true,
      },
    },
    {
      tool: 'execute-notebook-cell',
      description: 'Execute TypeScript code for validation',
      payload: {
        code: '// TypeScript code to execute',
        cellId: 'validation-cell-1',
        timeout: 5000,
        sandboxOptions: {
          allowFileSystem: false,
          allowNetwork: false,
        },
      },
    },
    {
      tool: 'differential-test',
      description: 'Compare Python and TypeScript outputs',
      payload: {
        pythonCode: '# Python function',
        typeScriptCode: '// TypeScript function',
        entryFunction: 'main',
        cases: [
          {
            name: 'basic-test',
            inputs: [1, 2, 3],
            expectedOutput: 6,
          },
        ],
        comparisonMode: 'strict',
      },
    },
  ];
}

function generateDifferentialTestSuite(
  pythonFile: string,
  typeScriptFile: string,
  functions: string[],
  testCount: number
): DifferentialTestSuite {
  const suite: DifferentialTestSuite = {
    name: 'Differential Test Suite',
    pythonFile,
    typeScriptFile,
    functions: functions.map(func => ({
      name: func,
      testCases: generateTestCases(func, testCount),
    })),
    configuration: {
      timeout: 10000,
      comparisonMode: 'tolerance',
      tolerance: 0.0001,
      pythonVersion: 'python3',
    },
    scaffolding: {
      setupCode: generateSetupCode(),
      teardownCode: generateTeardownCode(),
    },
  };
  
  return suite;
}

function generateTestCases(functionName: string, count: number): TestCase[] {
  const cases: TestCase[] = [];
  
  // Generate diverse test cases based on function name patterns
  const isNumeric = functionName.toLowerCase().includes('calc') || 
                   functionName.toLowerCase().includes('math');
  const isString = functionName.toLowerCase().includes('string') || 
                  functionName.toLowerCase().includes('text');
  const isArray = functionName.toLowerCase().includes('array') || 
                 functionName.toLowerCase().includes('list');
  
  for (let i = 0; i < count; i++) {
    if (isNumeric) {
      cases.push({
        name: `numeric-test-${i + 1}`,
        inputs: [
          Math.random() * 100,
          Math.random() * 100,
        ],
        description: 'Test with random numeric inputs',
      });
    } else if (isString) {
      cases.push({
        name: `string-test-${i + 1}`,
        inputs: [
          `test-string-${i}`,
          i,
        ],
        description: 'Test with string inputs',
      });
    } else if (isArray) {
      cases.push({
        name: `array-test-${i + 1}`,
        inputs: [
          Array.from({ length: i + 1 }, (_, j) => j),
        ],
        description: 'Test with array inputs',
      });
    } else {
      // Generic test cases
      cases.push({
        name: `test-${i + 1}`,
        inputs: [i, i * 2, i % 2 === 0],
        description: 'Generic test case',
      });
    }
  }
  
  // Add edge cases
  cases.push({
    name: 'edge-empty',
    inputs: [],
    description: 'Test with no inputs',
  });
  
  cases.push({
    name: 'edge-null',
    inputs: [null],
    description: 'Test with null input',
  });
  
  return cases;
}

function generateSetupCode(): string {
  return `
// Setup code for differential testing
import * as fs from 'fs';
import * as path from 'path';

// Ensure test directories exist
const testDir = path.join(__dirname, '.differential-tests');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Initialize test environment
process.env.NODE_ENV = 'test';
`;
}

function generateTeardownCode(): string {
  return `
// Cleanup code for differential testing
import * as fs from 'fs';
import * as path from 'path';

// Clean up test artifacts
const testDir = path.join(__dirname, '.differential-tests');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
`;
}

function formatWorkflowPrompt(steps: WorkflowStep[], toolCalls: ToolCallPayload[]): string {
  const lines: string[] = [];
  
  lines.push('# Python to TypeScript Porting Workflow');
  lines.push('');
  lines.push('This orchestrated workflow will guide you through systematic migration.');
  lines.push('');
  
  lines.push('## Workflow Steps');
  lines.push('');
  
  steps.forEach((step, index) => {
    lines.push(`### Step ${index + 1}: ${step.name}`);
    lines.push(`**Description:** ${step.description}`);
    lines.push(`**Tool:** \`${step.tool}\``);
    lines.push(`**Estimated Time:** ${step.estimatedTime}`);
    lines.push('');
    lines.push('**Payload:**');
    lines.push('```json');
    lines.push(JSON.stringify(step.payload, null, 2));
    lines.push('```');
    lines.push('');
  });
  
  lines.push('## Ready-to-Use Tool Calls');
  lines.push('');
  lines.push('Copy and execute these tool calls in sequence:');
  lines.push('');
  
  toolCalls.forEach((call, index) => {
    lines.push(`### ${index + 1}. ${call.description}`);
    lines.push('```json');
    lines.push(JSON.stringify({
      tool: call.tool,
      ...call.payload,
    }, null, 2));
    lines.push('```');
    lines.push('');
  });
  
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Execute each step in order');
  lines.push('2. Review outputs before proceeding');
  lines.push('3. Adjust parameters based on findings');
  lines.push('4. Run differential tests to validate');
  lines.push('5. Document decisions and rationale');
  
  return lines.join('\n');
}

function formatDiffTestWorkflow(suite: DifferentialTestSuite): string {
  const lines: string[] = [];
  
  lines.push('# Differential Testing Bootstrap');
  lines.push('');
  lines.push(`Testing ${suite.functions.length} functions with ${suite.functions[0].testCases.length} test cases each.`);
  lines.push('');
  
  lines.push('## Configuration');
  lines.push('```json');
  lines.push(JSON.stringify(suite.configuration, null, 2));
  lines.push('```');
  lines.push('');
  
  lines.push('## Test Functions');
  suite.functions.forEach(func => {
    lines.push(`### ${func.name}`);
    lines.push('');
    lines.push('Test Cases:');
    func.testCases.slice(0, 3).forEach(tc => {
      lines.push(`- **${tc.name}**: ${tc.description}`);
      lines.push(`  Inputs: ${JSON.stringify(tc.inputs)}`);
    });
    if (func.testCases.length > 3) {
      lines.push(`- ... and ${func.testCases.length - 3} more`);
    }
    lines.push('');
  });
  
  lines.push('## Setup Code');
  lines.push('```typescript');
  lines.push(suite.scaffolding.setupCode);
  lines.push('```');
  lines.push('');
  
  lines.push('## Execute Tests');
  lines.push('');
  lines.push('Run the following command to execute all differential tests:');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify({
    tool: 'differential-test',
    pythonFile: suite.pythonFile,
    typeScriptFile: suite.typeScriptFile,
    functions: suite.functions.map(f => f.name),
    configuration: suite.configuration,
  }, null, 2));
  lines.push('```');
  
  return lines.join('\n');
}

function estimateDuration(complexity: string): string {
  const durations: Record<string, string> = {
    simple: '1-2 hours',
    moderate: '2-4 hours',
    complex: '4-8 hours',
  };
  return durations[complexity] || '2-4 hours';
}

// Type definitions
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  tool: string;
  payload: any;
  estimatedTime: string;
}

interface ToolCallPayload {
  tool: string;
  description: string;
  payload: any;
}

interface TestCase {
  name: string;
  inputs: any[];
  expectedOutput?: any;
  description: string;
}

interface FunctionTests {
  name: string;
  testCases: TestCase[];
}

interface DifferentialTestSuite {
  name: string;
  pythonFile: string;
  typeScriptFile: string;
  functions: FunctionTests[];
  configuration: {
    timeout: number;
    comparisonMode: string;
    tolerance: number;
    pythonVersion: string;
  };
  scaffolding: {
    setupCode: string;
    teardownCode: string;
  };
}