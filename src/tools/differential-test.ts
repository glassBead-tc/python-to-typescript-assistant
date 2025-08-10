import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const TestCaseSchema = z.object({
  name: z.string(),
  inputs: z.array(z.any()),
  expectedOutput: z.any().optional(),
  tolerance: z.number().optional().describe('Tolerance for floating point comparisons'),
});

const DifferentialTestArgsSchema = z.object({
  pythonCode: z.string().describe('Python code to test'),
  typeScriptCode: z.string().describe('TypeScript code to test'),
  entryFunction: z.string().describe('Name of the function to test'),
  cases: z.array(TestCaseSchema).describe('Test cases with inputs and optional expected outputs'),
  comparisonMode: z.enum(['strict', 'tolerance', 'shape']).default('strict'),
  pythonVersion: z.string().default('python3').describe('Python executable to use'),
  timeout: z.number().default(10000).describe('Timeout per test case in milliseconds'),
});

type DifferentialTestArgs = z.infer<typeof DifferentialTestArgsSchema>;
type TestCase = z.infer<typeof TestCaseSchema>;

interface TestResult {
  name: string;
  passed: boolean;
  pythonOutput: any;
  typeScriptOutput: any;
  pythonError?: string | undefined;
  typeScriptError?: string | undefined;
  difference?: string | undefined;
  executionTime: {
    python: number;
    typeScript: number;
  };
}

interface DifferentialTestResult {
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
  results: TestResult[];
  recommendations: string[];
}

export async function registerDifferentialTestTool(server: any): Promise<void> {
  server.tool(
    'differential-test',
    'Compare Python and TypeScript code behavior with test cases',
    DifferentialTestArgsSchema,
    async ({
    pythonCode,
    typeScriptCode,
    entryFunction,
    cases,
    comparisonMode = 'strict',
    pythonVersion = 'python3',
    timeout = 10000,
  }: DifferentialTestArgs) => {
    const tempDir = join(tmpdir(), '.differential-tests');
    const sessionId = randomBytes(8).toString('hex');
    
    const pythonFile = join(tempDir, `test_${sessionId}.py`);
    const tsFile = join(tempDir, `test_${sessionId}.ts`);
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      
      // Prepare test files
      const pythonTestCode = preparePythonTestCode(pythonCode, entryFunction, cases);
      const tsTestCode = prepareTypeScriptTestCode(typeScriptCode, entryFunction, cases);
      
      await fs.writeFile(pythonFile, pythonTestCode, 'utf-8');
      await fs.writeFile(tsFile, tsTestCode, 'utf-8');
      
      // Run tests
      const results: TestResult[] = [];
      
      for (const testCase of cases) {
        const result = await runSingleTest(
          pythonFile,
          tsFile,
          testCase,
          pythonVersion,
          timeout,
          comparisonMode
        );
        results.push(result);
      }
      
      // Analyze results
      const analysis = analyzeResults(results);
      
      return {
        content: [
          {
            type: 'text',
            text: formatDifferentialTestOutput(analysis),
          },
          {
            type: 'json',
            json: analysis,
          },
        ],
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(pythonFile);
        await fs.unlink(tsFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
}

function preparePythonTestCode(code: string, entryFunction: string, cases: TestCase[]): string {
  return `
import json
import sys

${code}

if __name__ == "__main__":
    test_index = int(sys.argv[1])
    test_cases = ${JSON.stringify(cases)}
    test_case = test_cases[test_index]
    
    try:
        result = ${entryFunction}(*test_case["inputs"])
        print(json.dumps({"success": True, "output": result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
`;
}

function prepareTypeScriptTestCode(code: string, entryFunction: string, cases: TestCase[]): string {
  return `
${code}

const testIndex = parseInt(process.argv[2]);
const testCases = ${JSON.stringify(cases)};
const testCase = testCases[testIndex];

try {
  const result = ${entryFunction}(...testCase.inputs);
  console.log(JSON.stringify({ success: true, output: result }));
} catch (error: any) {
  console.log(JSON.stringify({ success: false, error: error.message }));
}
`;
}

async function runSingleTest(
  pythonFile: string,
  tsFile: string,
  testCase: TestCase,
  pythonVersion: string,
  timeout: number,
  comparisonMode: string
): Promise<TestResult> {
  const testIndex = 0; // We process one at a time
  
  // Run Python
  const pythonStart = Date.now();
  let pythonResult: any;
  let pythonError: string | undefined;
  
  try {
    const { stdout } = await execa(pythonVersion, [pythonFile, testIndex.toString()], {
      timeout,
      reject: false,
    });
    pythonResult = JSON.parse(stdout);
  } catch (error: any) {
    pythonError = error.message;
  }
  const pythonTime = Date.now() - pythonStart;
  
  // Run TypeScript
  const tsStart = Date.now();
  let tsResult: any;
  let tsError: string | undefined;
  
  try {
    const { stdout } = await execa('tsx', [tsFile, testIndex.toString()], {
      timeout,
      reject: false,
    });
    tsResult = JSON.parse(stdout);
  } catch (error: any) {
    tsError = error.message;
  }
  const tsTime = Date.now() - tsStart;
  
  // Compare outputs
  const passed = compareOutputs(
    pythonResult?.output,
    tsResult?.output,
    comparisonMode,
    testCase.tolerance
  );
  
  return {
    name: testCase.name,
    passed,
    pythonOutput: pythonResult?.output,
    typeScriptOutput: tsResult?.output,
    pythonError: pythonError || pythonResult?.error,
    typeScriptError: tsError || tsResult?.error,
    difference: !passed ? describeDifference(pythonResult?.output, tsResult?.output) : undefined,
    executionTime: {
      python: pythonTime,
      typeScript: tsTime,
    },
  };
}

function compareOutputs(
  pythonOutput: any,
  tsOutput: any,
  mode: string,
  tolerance?: number
): boolean {
  if (mode === 'strict') {
    return JSON.stringify(pythonOutput) === JSON.stringify(tsOutput);
  }
  
  if (mode === 'tolerance' && typeof pythonOutput === 'number' && typeof tsOutput === 'number') {
    const tol = tolerance || 0.0001;
    return Math.abs(pythonOutput - tsOutput) < tol;
  }
  
  if (mode === 'shape') {
    return compareShape(pythonOutput, tsOutput);
  }
  
  return false;
}

function compareShape(a: any, b: any): boolean {
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length;
  }
  
  if (typeof a === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    return JSON.stringify(keysA) === JSON.stringify(keysB);
  }
  
  return true;
}

function describeDifference(pythonOutput: any, tsOutput: any): string {
  const pythonStr = JSON.stringify(pythonOutput, null, 2);
  const tsStr = JSON.stringify(tsOutput, null, 2);
  
  return `Python: ${pythonStr}\nTypeScript: ${tsStr}`;
}

function analyzeResults(results: TestResult[]): DifferentialTestResult {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  const recommendations: string[] = [];
  
  // Check for systematic errors
  const allPythonErrors = results.every(r => r.pythonError);
  const allTsErrors = results.every(r => r.typeScriptError);
  
  if (allPythonErrors) {
    recommendations.push('All Python tests failed - check Python environment and syntax');
  }
  if (allTsErrors) {
    recommendations.push('All TypeScript tests failed - check TypeScript syntax and imports');
  }
  
  // Performance comparison
  const avgPythonTime = results.reduce((sum, r) => sum + r.executionTime.python, 0) / results.length;
  const avgTsTime = results.reduce((sum, r) => sum + r.executionTime.typeScript, 0) / results.length;
  
  if (avgTsTime < avgPythonTime * 0.5) {
    recommendations.push(`TypeScript is ${(avgPythonTime / avgTsTime).toFixed(1)}x faster on average`);
  } else if (avgPythonTime < avgTsTime * 0.5) {
    recommendations.push(`Python is ${(avgTsTime / avgPythonTime).toFixed(1)}x faster on average`);
  }
  
  // Type-related issues
  const typeDifferences = results.filter(r => 
    !r.passed && 
    typeof r.pythonOutput !== typeof r.typeScriptOutput
  );
  
  if (typeDifferences.length > 0) {
    recommendations.push('Type differences detected - check type conversions and return types');
  }
  
  return {
    summary: {
      total: results.length,
      passed,
      failed,
      successRate: results.length > 0 ? (passed / results.length) * 100 : 0,
    },
    results,
    recommendations,
  };
}

function formatDifferentialTestOutput(analysis: DifferentialTestResult): string {
  const lines: string[] = [];
  
  lines.push('=== Differential Test Results ===');
  lines.push(`Total: ${analysis.summary.total} | Passed: ${analysis.summary.passed} | Failed: ${analysis.summary.failed}`);
  lines.push(`Success Rate: ${analysis.summary.successRate.toFixed(1)}%`);
  lines.push('');
  
  // Individual results
  for (const result of analysis.results) {
    const status = result.passed ? '✓' : '✗';
    lines.push(`${status} ${result.name}`);
    
    if (!result.passed) {
      if (result.pythonError) {
        lines.push(`  Python Error: ${result.pythonError}`);
      }
      if (result.typeScriptError) {
        lines.push(`  TypeScript Error: ${result.typeScriptError}`);
      }
      if (result.difference) {
        lines.push(`  Difference:`);
        lines.push(result.difference.split('\n').map(l => `    ${l}`).join('\n'));
      }
    }
    
    lines.push(`  Execution Time - Python: ${result.executionTime.python}ms, TypeScript: ${result.executionTime.typeScript}ms`);
  }
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push('');
    lines.push('=== Recommendations ===');
    for (const rec of analysis.recommendations) {
      lines.push(`• ${rec}`);
    }
  }
  
  return lines.join('\n');
}