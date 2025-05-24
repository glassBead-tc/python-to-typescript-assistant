import { z } from "zod";
import chalk from "chalk";
class PortingStrategyAnalyzer {
    strategies = {};
    nextComponentId = 1;
    validatePortingStrategyInput(input) {
        const data = input;
        if (!data.projectId || typeof data.projectId !== 'string') {
            throw new Error('Invalid projectId: must be a string');
        }
        if (!data.projectName || typeof data.projectName !== 'string') {
            throw new Error('Invalid projectName: must be a string');
        }
        if (!data.stage || typeof data.stage !== 'string') {
            throw new Error('Invalid stage: must be a string');
        }
        return data;
    }
    analyzeComplexity(components) {
        const criticalCount = components.filter(c => c.complexity === 'critical').length;
        const highCount = components.filter(c => c.complexity === 'high').length;
        const totalComplexity = criticalCount * 4 + highCount * 2 +
            components.filter(c => c.complexity === 'medium').length;
        const complexityRatio = totalComplexity / components.length;
        if (complexityRatio >= 3 || criticalCount > 0)
            return 'extremely-complex';
        if (complexityRatio >= 2 || highCount >= components.length * 0.3)
            return 'complex';
        if (complexityRatio >= 1.2)
            return 'moderate';
        return 'straightforward';
    }
    recommendApproach(complexity, componentCount) {
        if (complexity === 'extremely-complex' || componentCount > 50)
            return 'rewrite';
        if (complexity === 'complex' || componentCount > 20)
            return 'hybrid';
        if (complexity === 'moderate' || componentCount > 10)
            return 'incremental';
        return 'big-bang';
    }
    buildDependencyGraph(components) {
        // Simple topological sort to find critical path
        const graph = {};
        const inDegree = {};
        // Initialize
        components.forEach(comp => {
            graph[comp.id] = comp.dependencies;
            inDegree[comp.id] = 0;
        });
        // Calculate in-degrees
        components.forEach(comp => {
            comp.dependencies.forEach(dep => {
                if (inDegree[dep] !== undefined) {
                    inDegree[dep]++;
                }
            });
        });
        // Find components with no dependencies (start of critical path)
        const queue = components
            .filter(comp => inDegree[comp.id] === 0)
            .sort((a, b) => (b.estimatedEffort * this.getComplexityWeight(b.complexity)) -
            (a.estimatedEffort * this.getComplexityWeight(a.complexity)));
        return queue.slice(0, 3).map(comp => comp.id);
    }
    getComplexityWeight(complexity) {
        switch (complexity) {
            case 'critical': return 4;
            case 'high': return 2;
            case 'medium': return 1;
            case 'low': return 0.5;
        }
    }
    generatePhases(components, approach) {
        const phases = [];
        switch (approach) {
            case 'big-bang':
                phases.push({
                    phase: 1,
                    name: "Complete Migration",
                    description: "Migrate entire codebase in single phase",
                    components: components.map(c => c.id),
                    prerequisites: [],
                    estimatedDuration: components.reduce((sum, c) => sum + c.estimatedEffort, 0),
                    riskLevel: components.some(c => c.complexity === 'critical') ? 'high' : 'medium',
                    milestones: ["Setup TypeScript environment", "Port all components", "Validate functionality", "Deploy"]
                });
                break;
            case 'incremental':
                // Group by complexity and dependencies
                const lowRisk = components.filter(c => c.complexity === 'low' && c.dependencies.length === 0);
                const mediumRisk = components.filter(c => c.complexity === 'medium' || c.dependencies.length > 0);
                const highRisk = components.filter(c => ['high', 'critical'].includes(c.complexity));
                if (lowRisk.length > 0) {
                    phases.push({
                        phase: 1,
                        name: "Foundation Components",
                        description: "Port low-risk, independent components first",
                        components: lowRisk.map(c => c.id),
                        prerequisites: [],
                        estimatedDuration: lowRisk.reduce((sum, c) => sum + c.estimatedEffort, 0),
                        riskLevel: 'low',
                        milestones: ["Setup environment", "Port utilities", "Basic testing"]
                    });
                }
                if (mediumRisk.length > 0) {
                    phases.push({
                        phase: 2,
                        name: "Core Logic",
                        description: "Port main business logic with moderate complexity",
                        components: mediumRisk.map(c => c.id),
                        prerequisites: [1],
                        estimatedDuration: mediumRisk.reduce((sum, c) => sum + c.estimatedEffort, 0),
                        riskLevel: 'medium',
                        milestones: ["Core functionality", "Integration testing", "Performance validation"]
                    });
                }
                if (highRisk.length > 0) {
                    phases.push({
                        phase: 3,
                        name: "Complex Components",
                        description: "Port high-complexity and critical components",
                        components: highRisk.map(c => c.id),
                        prerequisites: [2],
                        estimatedDuration: highRisk.reduce((sum, c) => sum + c.estimatedEffort, 0),
                        riskLevel: 'high',
                        milestones: ["Complex logic", "Comprehensive testing", "Performance optimization"]
                    });
                }
                break;
            case 'hybrid':
                phases.push({
                    phase: 1,
                    name: "Parallel Development Setup",
                    description: "Establish TypeScript environment alongside Python",
                    components: [],
                    prerequisites: [],
                    estimatedDuration: 8,
                    riskLevel: 'low',
                    milestones: ["TypeScript config", "Build pipeline", "Testing framework"]
                }, {
                    phase: 2,
                    name: "Gradual Migration",
                    description: "Migrate components incrementally while maintaining Python",
                    components: components.map(c => c.id),
                    prerequisites: [1],
                    estimatedDuration: components.reduce((sum, c) => sum + c.estimatedEffort * 1.2, 0),
                    riskLevel: 'medium',
                    milestones: ["50% migrated", "Parallel testing", "Performance parity"]
                });
                break;
            case 'rewrite':
                phases.push({
                    phase: 1,
                    name: "Architecture Design",
                    description: "Design new TypeScript architecture from scratch",
                    components: [],
                    prerequisites: [],
                    estimatedDuration: components.length * 2,
                    riskLevel: 'high',
                    milestones: ["Architecture review", "Technology selection", "Proof of concept"]
                }, {
                    phase: 2,
                    name: "Core Implementation",
                    description: "Implement core functionality with new architecture",
                    components: components.filter(c => c.type !== 'import').map(c => c.id),
                    prerequisites: [1],
                    estimatedDuration: components.reduce((sum, c) => sum + c.estimatedEffort * 1.5, 0),
                    riskLevel: 'high',
                    milestones: ["Core features", "Integration points", "Data migration"]
                });
                break;
        }
        return phases;
    }
    visualizeStrategy(strategy) {
        let output = `\n${chalk.bold(`🐍➡️📘 PORTING STRATEGY: ${strategy.projectName}`)} (ID: ${strategy.projectId})\n\n`;
        // Overview
        output += `${chalk.cyan('Project Overview:')}\n`;
        output += `  Components: ${strategy.totalComponents}\n`;
        output += `  Complexity: ${this.getComplexityEmoji(strategy.overallComplexity)} ${strategy.overallComplexity}\n`;
        output += `  Approach: ${this.getApproachEmoji(strategy.recommendedApproach)} ${strategy.recommendedApproach}\n`;
        output += `  Estimated Effort: ${strategy.estimatedTotalEffort} hours (${Math.ceil(strategy.estimatedTotalEffort / 8)} days)\n\n`;
        // Critical path
        if (strategy.criticalPath?.length > 0) {
            output += `${chalk.yellow('🎯 Critical Path:')}\n`;
            strategy.criticalPath.forEach(compId => {
                const comp = strategy.components.find(c => c.id === compId);
                if (comp) {
                    output += `  → ${comp.name} (${comp.type}, ${comp.complexity} complexity)\n`;
                }
            });
            output += '\n';
        }
        // Major risks
        if (strategy.majorRisks?.length > 0) {
            output += `${chalk.red('⚠️  Major Risks:')}\n`;
            strategy.majorRisks.forEach(risk => {
                output += `  • ${risk}\n`;
            });
            output += '\n';
        }
        // Phases
        if (strategy.phases?.length > 0) {
            output += `${chalk.bold('📅 Porting Phases:')}\n`;
            strategy.phases.forEach(phase => {
                const riskColor = phase.riskLevel === 'high' ? chalk.red :
                    phase.riskLevel === 'medium' ? chalk.yellow : chalk.green;
                output += `\n  ${chalk.bold(`Phase ${phase.phase}: ${phase.name}`)} ${riskColor(`[${phase.riskLevel} risk]`)}\n`;
                output += `  ${phase.description}\n`;
                output += `  Duration: ${phase.estimatedDuration} hours\n`;
                output += `  Components: ${phase.components.length}\n`;
                if (phase.milestones.length > 0) {
                    output += `  Milestones: ${phase.milestones.join(', ')}\n`;
                }
            });
            output += '\n';
        }
        // Recommendations
        if (strategy.toolingRecommendations?.length > 0) {
            output += `${chalk.blue('🛠️  Tooling Recommendations:')}\n`;
            strategy.toolingRecommendations.forEach(tool => {
                output += `  • ${tool}\n`;
            });
            output += '\n';
        }
        // Next steps
        if (strategy.nextSteps?.length > 0) {
            output += `${chalk.green('📋 Next Steps:')}\n`;
            strategy.nextSteps.forEach((step, index) => {
                output += `  ${index + 1}. ${step}\n`;
            });
        }
        return output;
    }
    getComplexityEmoji(complexity) {
        switch (complexity) {
            case 'straightforward': return '🟢';
            case 'moderate': return '🟡';
            case 'complex': return '🟠';
            case 'extremely-complex': return '🔴';
        }
    }
    getApproachEmoji(approach) {
        switch (approach) {
            case 'big-bang': return '💥';
            case 'incremental': return '📈';
            case 'hybrid': return '🔄';
            case 'rewrite': return '🏗️';
        }
    }
    analyzePortingStrategy(input) {
        try {
            const validated = this.validatePortingStrategyInput(input);
            // Create or update strategy
            const strategy = {
                projectId: validated.projectId,
                projectName: validated.projectName,
                totalComponents: validated.components?.length || 0,
                analysisDate: new Date().toISOString(),
                overallComplexity: 'moderate',
                recommendedApproach: 'incremental',
                estimatedTotalEffort: 0,
                criticalPath: [],
                majorRisks: [],
                dependencyBottlenecks: [],
                recommendedOrder: [],
                components: validated.components || [],
                phases: [],
                toolingRecommendations: [
                    "Use TypeScript strict mode for better type safety",
                    "Set up automated testing with Jest or Vitest",
                    "Use ESLint with TypeScript rules",
                    "Consider using ts-node for development",
                    "Set up source maps for debugging"
                ],
                testingStrategy: [
                    "Maintain parallel test suites during migration",
                    "Use property-based testing for complex logic",
                    "Implement integration tests for API endpoints",
                    "Set up performance benchmarking"
                ],
                fallbackPlans: [
                    "Keep Python version running in parallel",
                    "Implement gradual rollout with feature flags",
                    "Prepare rollback procedures for each phase"
                ],
                iteration: validated.iteration || 1,
                stage: validated.stage || 'analysis',
                nextSteps: []
            };
            // Analyze complexity and approach
            if (strategy.components.length > 0) {
                strategy.overallComplexity = this.analyzeComplexity(strategy.components);
                strategy.recommendedApproach = this.recommendApproach(strategy.overallComplexity, strategy.components.length);
                strategy.criticalPath = this.buildDependencyGraph(strategy.components);
                strategy.estimatedTotalEffort = strategy.components.reduce((sum, c) => sum + c.estimatedEffort, 0);
                strategy.phases = this.generatePhases(strategy.components, strategy.recommendedApproach);
            }
            // Determine next steps based on stage
            switch (strategy.stage) {
                case 'analysis':
                    strategy.nextSteps = [
                        "Complete component inventory and dependency mapping",
                        "Assess type complexity for each component",
                        "Identify library migration requirements",
                        "Move to planning stage"
                    ];
                    break;
                case 'planning':
                    strategy.nextSteps = [
                        "Set up TypeScript development environment",
                        "Create detailed migration timeline",
                        "Prepare team training on TypeScript",
                        "Begin execution of Phase 1"
                    ];
                    break;
                case 'execution':
                    strategy.nextSteps = [
                        "Execute current phase according to plan",
                        "Monitor progress and adjust timeline",
                        "Validate migrated components",
                        "Prepare for next phase"
                    ];
                    break;
                case 'validation':
                    strategy.nextSteps = [
                        "Run comprehensive test suites",
                        "Performance testing and optimization",
                        "Code review and quality assessment",
                        "Move to completion stage"
                    ];
                    break;
                case 'completion':
                    strategy.nextSteps = [
                        "Final deployment preparation",
                        "Documentation updates",
                        "Team knowledge transfer",
                        "Post-migration monitoring setup"
                    ];
                    break;
            }
            // Store strategy
            if (!this.strategies[strategy.projectId]) {
                this.strategies[strategy.projectId] = [];
            }
            this.strategies[strategy.projectId].push(strategy);
            // Generate visualization
            const visualization = this.visualizeStrategy(strategy);
            console.error(visualization);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            projectId: strategy.projectId,
                            stage: strategy.stage,
                            overallComplexity: strategy.overallComplexity,
                            recommendedApproach: strategy.recommendedApproach,
                            estimatedTotalEffort: strategy.estimatedTotalEffort,
                            phasesCount: strategy.phases.length,
                            nextSteps: strategy.nextSteps.length,
                            summary: `${strategy.projectName}: ${strategy.overallComplexity} complexity, ${strategy.recommendedApproach} approach recommended`
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed'
                        }, null, 2)
                    }],
                isError: true
            };
        }
    }
}
export async function registerPortingStrategyTool(server) {
    const analyzer = new PortingStrategyAnalyzer();
    server.tool("porting-strategy", "Systematic framework for analyzing and planning Python-to-TypeScript porting projects. Provides strategic analysis, risk assessment, and phased migration planning.", {
        projectId: z.string().describe("Unique identifier for the porting project"),
        projectName: z.string().describe("Human-readable name of the project being ported"),
        stage: z.enum(["analysis", "planning", "execution", "validation", "completion"]).describe("Current stage of the porting project"),
        iteration: z.number().min(1).default(1).describe("Current iteration of the analysis"),
        components: z.array(z.object({
            id: z.string().optional().describe("Unique identifier for the component"),
            name: z.string().describe("Name of the component (file, class, function, etc.)"),
            type: z.enum(["module", "class", "function", "variable", "import", "type"]).describe("Type of component"),
            complexity: z.enum(["low", "medium", "high", "critical"]).describe("Complexity level for porting"),
            dependencies: z.array(z.string()).default([]).describe("List of dependencies this component has"),
            challenges: z.array(z.string()).default([]).describe("Specific challenges expected for this component"),
            portingApproach: z.string().describe("Recommended approach for porting this component"),
            estimatedEffort: z.number().min(0).describe("Estimated effort in hours")
        })).optional().describe("Components to be ported with their analysis"),
        currentPhase: z.number().min(1).optional().describe("Current phase number if in execution"),
        riskFactors: z.array(z.string()).default([]).describe("Additional risk factors to consider"),
        constraints: z.array(z.string()).default([]).describe("Project constraints (timeline, resources, etc.)"),
        preferences: z.object({
            riskTolerance: z.enum(["low", "medium", "high"]).default("medium"),
            timelinePreference: z.enum(["fast", "balanced", "safe"]).default("balanced"),
            teamExperience: z.enum(["beginner", "intermediate", "expert"]).default("intermediate")
        }).optional().describe("Project preferences and constraints")
    }, {
        title: "Python-to-TypeScript Porting Strategy",
        readOnlyHint: false,
        idempotentHint: false
    }, async (args) => analyzer.analyzePortingStrategy(args));
    console.error(chalk.green("✅ Registered porting strategy tool"));
}
//# sourceMappingURL=porting-strategy.js.map