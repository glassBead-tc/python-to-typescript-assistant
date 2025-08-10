import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const PythonAstAnalyzeArgsSchema = z.object({
  code: z.string().describe('Python code to analyze'),
  analysisLevel: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
  includeComplexity: z.boolean().default(true).describe('Include cyclomatic complexity analysis'),
});

type PythonAstAnalyzeArgs = z.infer<typeof PythonAstAnalyzeArgsSchema>;

interface AstConstruct {
  type: string;
  line: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  guidance: string;
  name?: string;
  details?: any;
}

interface AstAnalysisResult {
  constructs: AstConstruct[];
  summary: {
    totalConstructs: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  complexity?: {
    cyclomatic: number;
    cognitive: number;
    halstead?: {
      vocabulary: number;
      length: number;
      difficulty: number;
    };
  };
  migrationNotes: string[];
  links: string[];
}

// Python AST analyzer script
const PYTHON_AST_ANALYZER = `
import ast
import json
import sys

class PythonAstAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.constructs = []
        self.complexity = 0
        self.decorators = []
        self.metaclasses = []
        self.context_managers = []
        self.comprehensions = []
        self.dynamic_features = []
        
    def visit_ClassDef(self, node):
        # Check for metaclass
        if node.keywords:
            for keyword in node.keywords:
                if keyword.arg == 'metaclass':
                    self.constructs.append({
                        'type': 'metaclass',
                        'line': node.lineno,
                        'column': node.col_offset,
                        'severity': 'critical',
                        'guidance': 'Refactor to factory/decorator pattern',
                        'name': node.name,
                        'details': {
                            'metaclass': ast.unparse(keyword.value) if hasattr(ast, 'unparse') else str(keyword.value)
                        }
                    })
        
        # Check for multiple inheritance
        if len(node.bases) > 1:
            self.constructs.append({
                'type': 'multiple_inheritance',
                'line': node.lineno,
                'column': node.col_offset,
                'severity': 'high',
                'guidance': 'Use mixins or composition in TypeScript',
                'name': node.name,
                'details': {
                    'bases': [ast.unparse(base) if hasattr(ast, 'unparse') else str(base) for base in node.bases]
                }
            })
        
        # Check decorators
        for decorator in node.decorator_list:
            self.constructs.append({
                'type': 'class_decorator',
                'line': decorator.lineno,
                'column': decorator.col_offset,
                'severity': 'medium',
                'guidance': 'Convert to TypeScript decorator syntax',
                'name': node.name,
                'details': {
                    'decorator': ast.unparse(decorator) if hasattr(ast, 'unparse') else str(decorator)
                }
            })
        
        self.generic_visit(node)
    
    def visit_FunctionDef(self, node):
        # Check decorators
        for decorator in node.decorator_list:
            decorator_name = self.get_decorator_name(decorator)
            severity = 'low' if decorator_name in ['property', 'staticmethod', 'classmethod'] else 'medium'
            self.constructs.append({
                'type': 'function_decorator',
                'line': decorator.lineno,
                'column': decorator.col_offset,
                'severity': severity,
                'guidance': 'Convert to TypeScript decorator or pattern',
                'name': node.name,
                'details': {
                    'decorator': decorator_name
                }
            })
        
        # Calculate complexity
        self.complexity += self.calculate_complexity(node)
        
        self.generic_visit(node)
    
    def visit_AsyncFunctionDef(self, node):
        self.constructs.append({
            'type': 'async_function',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'low',
            'guidance': 'Use async/await in TypeScript',
            'name': node.name
        })
        self.visit_FunctionDef(node)
    
    def visit_With(self, node):
        self.constructs.append({
            'type': 'context_manager',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'high',
            'guidance': 'Use try/finally or callback pattern',
            'details': {
                'items': len(node.items)
            }
        })
        self.generic_visit(node)
    
    def visit_AsyncWith(self, node):
        self.constructs.append({
            'type': 'async_context_manager',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'high',
            'guidance': 'Use async try/finally pattern',
            'details': {
                'items': len(node.items)
            }
        })
        self.generic_visit(node)
    
    def visit_ListComp(self, node):
        self.constructs.append({
            'type': 'list_comprehension',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'low',
            'guidance': 'Use Array methods (map/filter/reduce)'
        })
        self.generic_visit(node)
    
    def visit_DictComp(self, node):
        self.constructs.append({
            'type': 'dict_comprehension',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'low',
            'guidance': 'Use Object.fromEntries with map'
        })
        self.generic_visit(node)
    
    def visit_GeneratorExp(self, node):
        self.constructs.append({
            'type': 'generator_expression',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'medium',
            'guidance': 'Use generator functions or iterators'
        })
        self.generic_visit(node)
    
    def visit_Yield(self, node):
        self.constructs.append({
            'type': 'generator',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'low',
            'guidance': 'Use function* syntax in TypeScript'
        })
        self.generic_visit(node)
    
    def visit_Import(self, node):
        # Check for dynamic imports
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        # Check for star imports
        for alias in node.names:
            if alias.name == '*':
                self.constructs.append({
                    'type': 'star_import',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'severity': 'medium',
                    'guidance': 'Use explicit imports in TypeScript',
                    'details': {
                        'module': node.module
                    }
                })
        self.generic_visit(node)
    
    def visit_Call(self, node):
        # Check for dynamic features
        if isinstance(node.func, ast.Name):
            if node.func.id in ['eval', 'exec', 'compile']:
                self.constructs.append({
                    'type': 'dynamic_execution',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'severity': 'critical',
                    'guidance': 'Refactor to avoid dynamic code execution',
                    'details': {
                        'function': node.func.id
                    }
                })
            elif node.func.id in ['getattr', 'setattr', 'hasattr']:
                self.constructs.append({
                    'type': 'dynamic_attribute',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'severity': 'medium',
                    'guidance': 'Use bracket notation or type guards',
                    'details': {
                        'function': node.func.id
                    }
                })
            elif node.func.id == 'type' and len(node.args) == 3:
                self.constructs.append({
                    'type': 'dynamic_class_creation',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'severity': 'critical',
                    'guidance': 'Use class factory pattern',
                })
        self.generic_visit(node)
    
    def visit_Global(self, node):
        self.constructs.append({
            'type': 'global_statement',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'medium',
            'guidance': 'Use module-level exports or class properties',
            'details': {
                'names': node.names
            }
        })
        self.generic_visit(node)
    
    def visit_Nonlocal(self, node):
        self.constructs.append({
            'type': 'nonlocal_statement',
            'line': node.lineno,
            'column': node.col_offset,
            'severity': 'medium',
            'guidance': 'Use closure or class properties',
            'details': {
                'names': node.names
            }
        })
        self.generic_visit(node)
    
    def get_decorator_name(self, decorator):
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Name):
            return decorator.func.id
        elif isinstance(decorator, ast.Attribute):
            return decorator.attr
        return 'unknown'
    
    def calculate_complexity(self, node):
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
        return complexity

def analyze_code(code):
    try:
        tree = ast.parse(code)
        analyzer = PythonAstAnalyzer()
        analyzer.visit(tree)
        
        # Calculate summary
        summary = {
            'totalConstructs': len(analyzer.constructs),
            'bySeverity': {},
            'byType': {}
        }
        
        for construct in analyzer.constructs:
            severity = construct['severity']
            construct_type = construct['type']
            
            summary['bySeverity'][severity] = summary['bySeverity'].get(severity, 0) + 1
            summary['byType'][construct_type] = summary['byType'].get(construct_type, 0) + 1
        
        result = {
            'constructs': analyzer.constructs,
            'summary': summary,
            'complexity': {
                'cyclomatic': analyzer.complexity,
                'cognitive': analyzer.complexity * 1.5  # Simplified cognitive complexity
            }
        }
        
        print(json.dumps(result))
        
    except SyntaxError as e:
        print(json.dumps({
            'error': f'Syntax error: {e}',
            'line': e.lineno,
            'offset': e.offset
        }))
    except Exception as e:
        print(json.dumps({
            'error': str(e)
        }))

if __name__ == "__main__":
    code = sys.stdin.read()
    analyze_code(code)
`;

export async function registerPythonAstAnalyzeTool(server: any): Promise<void> {
  server.tool(
    'python-ast-analyze',
    'Analyze Python code AST to identify constructs requiring special migration attention',
    PythonAstAnalyzeArgsSchema,
    async ({ code, analysisLevel = 'detailed', includeComplexity = true }: PythonAstAnalyzeArgs) => {
    const tempDir = join(tmpdir(), '.ast-analysis');
    const sessionId = randomBytes(8).toString('hex');
    const analyzerFile = join(tempDir, `analyzer_${sessionId}.py`);
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write analyzer script
      await fs.writeFile(analyzerFile, PYTHON_AST_ANALYZER, 'utf-8');
      
      // Run analysis
      const { stdout, stderr } = await execa('python3', [analyzerFile], {
        input: code,
        timeout: 5000,
        reject: false,
      });
      
      if (stderr) {
        return {
          content: [
            {
              type: 'text',
              text: `Analysis error: ${stderr}`,
            },
          ],
        };
      }
      
      const rawResult = JSON.parse(stdout);
      
      if (rawResult.error) {
        return {
          content: [
            {
              type: 'text',
              text: `Python syntax error at line ${rawResult.line || 'unknown'}: ${rawResult.error}`,
            },
          ],
        };
      }
      
      // Enhance result with migration notes and links
      const result = enhanceAnalysisResult(rawResult, analysisLevel, includeComplexity);
      
      return {
        content: [
          {
            type: 'text',
            text: formatAstAnalysisOutput(result),
          },
          {
            type: 'json',
            json: result,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Analysis failed: ${error.message}`,
          },
        ],
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(analyzerFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
}

function enhanceAnalysisResult(
  rawResult: any,
  analysisLevel: string,
  includeComplexity: boolean
): AstAnalysisResult {
  const result: AstAnalysisResult = {
    constructs: rawResult.constructs || [],
    summary: rawResult.summary || {
      totalConstructs: 0,
      bySeverity: {},
      byType: {},
    },
    migrationNotes: [],
    links: [],
  };
  
  if (includeComplexity && rawResult.complexity) {
    result.complexity = rawResult.complexity;
  }
  
  // Add migration notes based on findings
  const notes = generateMigrationNotes(result.constructs);
  result.migrationNotes = notes;
  
  // Add relevant documentation links
  const links = generateDocumentationLinks(result.constructs);
  result.links = links;
  
  // Filter by analysis level
  if (analysisLevel === 'basic') {
    result.constructs = result.constructs.filter(c => 
      c.severity === 'high' || c.severity === 'critical'
    );
  }
  
  return result;
}

function generateMigrationNotes(constructs: AstConstruct[]): string[] {
  const notes: string[] = [];
  const types = new Set(constructs.map(c => c.type));
  
  if (types.has('metaclass')) {
    notes.push('Metaclasses detected: Consider refactoring to factory patterns or decorators');
  }
  
  if (types.has('multiple_inheritance')) {
    notes.push('Multiple inheritance used: TypeScript supports only single inheritance, use mixins or composition');
  }
  
  if (types.has('context_manager')) {
    notes.push('Context managers found: Implement try/finally blocks or resource management patterns');
  }
  
  if (types.has('dynamic_execution')) {
    notes.push('Dynamic code execution detected: Major refactoring required for type safety');
  }
  
  if (types.has('generator')) {
    notes.push('Generators used: TypeScript supports generators with function* syntax');
  }
  
  const severityCounts = constructs.reduce((acc, c) => {
    acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (severityCounts.critical > 0) {
    notes.push(`${severityCounts.critical} critical issues require architectural changes`);
  }
  
  if (severityCounts.high > 0) {
    notes.push(`${severityCounts.high} high-severity patterns need careful migration`);
  }
  
  return notes;
}

function generateDocumentationLinks(constructs: AstConstruct[]): string[] {
  const links: string[] = [];
  const types = new Set(constructs.map(c => c.type));
  
  // Add links based on detected patterns
  links.push('guides://methodology#migration-strategy');
  
  if (types.has('metaclass') || types.has('dynamic_class_creation')) {
    links.push('guides://methodology#metaclasses');
    links.push('typescript://patterns#factory-pattern');
  }
  
  if (types.has('context_manager')) {
    links.push('guides://methodology#context-managers');
    links.push('typescript://patterns#resource-management');
  }
  
  if (types.has('generator') || types.has('generator_expression')) {
    links.push('typescript://generators');
    links.push('guides://methodology#iterators');
  }
  
  if (types.has('async_function') || types.has('async_context_manager')) {
    links.push('typescript://async-await');
    links.push('guides://methodology#async-patterns');
  }
  
  if (types.has('list_comprehension') || types.has('dict_comprehension')) {
    links.push('typescript://array-methods');
    links.push('guides://methodology#comprehensions');
  }
  
  return [...new Set(links)]; // Remove duplicates
}

function formatAstAnalysisOutput(result: AstAnalysisResult): string {
  const lines: string[] = [];
  
  lines.push('=== Python AST Analysis Results ===');
  lines.push(`Total constructs found: ${result.summary.totalConstructs}`);
  lines.push('');
  
  // Severity breakdown
  if (Object.keys(result.summary.bySeverity).length > 0) {
    lines.push('By Severity:');
    for (const [severity, count] of Object.entries(result.summary.bySeverity)) {
      const icon = severity === 'critical' ? '🔴' : 
                   severity === 'high' ? '🟠' : 
                   severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${icon} ${severity}: ${count}`);
    }
    lines.push('');
  }
  
  // Type breakdown
  if (Object.keys(result.summary.byType).length > 0) {
    lines.push('By Type:');
    for (const [type, count] of Object.entries(result.summary.byType)) {
      lines.push(`  • ${type.replace(/_/g, ' ')}: ${count}`);
    }
    lines.push('');
  }
  
  // Complexity metrics
  if (result.complexity) {
    lines.push('Complexity Metrics:');
    lines.push(`  Cyclomatic: ${result.complexity.cyclomatic}`);
    lines.push(`  Cognitive: ${result.complexity.cognitive.toFixed(1)}`);
    lines.push('');
  }
  
  // Critical and high severity items
  const critical = result.constructs.filter(c => c.severity === 'critical');
  const high = result.constructs.filter(c => c.severity === 'high');
  
  if (critical.length > 0) {
    lines.push('🔴 Critical Issues:');
    for (const construct of critical) {
      lines.push(`  Line ${construct.line}: ${construct.type}`);
      lines.push(`    → ${construct.guidance}`);
    }
    lines.push('');
  }
  
  if (high.length > 0) {
    lines.push('🟠 High Priority:');
    for (const construct of high) {
      lines.push(`  Line ${construct.line}: ${construct.type}`);
      lines.push(`    → ${construct.guidance}`);
    }
    lines.push('');
  }
  
  // Migration notes
  if (result.migrationNotes.length > 0) {
    lines.push('Migration Notes:');
    for (const note of result.migrationNotes) {
      lines.push(`  • ${note}`);
    }
    lines.push('');
  }
  
  // Links
  if (result.links.length > 0) {
    lines.push('Relevant Resources:');
    for (const link of result.links) {
      lines.push(`  → ${link}`);
    }
  }
  
  return lines.join('\n');
}