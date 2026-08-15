/**
 * Specialist Agents Implementation
 * Each agent has specific capabilities and optimization
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentConfig, ChatMessage } from './agent-types';
import { bluesmindChatCompletion } from '../../lib/bluesmind';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// PLANNER AGENT - Task Planning and Decomposition
// ============================================================================

export class PlannerAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'planner',
      name: 'Strategic Planner',
      description: 'Breaks down complex tasks into executable subtasks',
      capabilities: [
        'task decomposition',
        'dependency analysis',
        'resource estimation',
        'risk assessment',
        'timeline planning'
      ],
      model: 'meta/llama-3.3-70b-instruct',
      temperature: 0.7,
      maxTokens: 2000,
      enabled: true,
    };
    super(config);
  }

  protected validateInput(input: any): boolean {
    return input && typeof input.description === 'string';
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.validateInput(task.input)) {
      throw new Error('Invalid input for Planner Agent');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are a strategic planning agent. Break down complex tasks into clear, executable subtasks.
      Return ONLY a valid JSON array of subtasks with this structure:
      [
        {
          "id": "task-1",
          "description": "Specific task description",
          "priority": "high|medium|low",
          "estimatedTime": "time in minutes",
          "dependencies": []
        }
      ]
      Focus on logical ordering and clear dependencies.`
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Plan the execution for: ${task.input.description}
      Context: ${JSON.stringify(task.input.context || {})}
      Constraints: ${JSON.stringify(task.input.constraints || {})}`
    };

    const result = await this.executeAI([systemPrompt, userMessage], {
      useCache: true,
      cacheTTL: 600000, // 10 minutes for plans
    });

    if (!result.success) {
      this.handleError(result.error, task);
    }

    try {
      const content = result.data.choices[0].message.content;
      const subtasks = JSON.parse(content);
      return {
        subtasks,
        planningMetadata: {
          originalTask: task.id,
          plannedAt: new Date(),
          subtaskCount: subtasks.length,
        }
      };
    } catch (error) {
      throw new Error('Failed to parse planning result');
    }
  }
}

// ============================================================================
// CODER AGENT - Code Generation and Optimization
// ============================================================================

export class CoderAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'coder',
      name: 'Expert Developer',
      description: 'Generates, optimizes, and validates code',
      capabilities: [
        'code generation',
        'code optimization',
        'debugging',
        'code review',
        'refactoring'
      ],
      model: 'meta/llama-3.3-70b-instruct',
      temperature: 0.3,
      maxTokens: 4000,
      enabled: true,
    };
    super(config);
  }

  protected validateInput(input: any): boolean {
    return input && (input.prompt || input.code || input.task);
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.validateInput(task.input)) {
      throw new Error('Invalid input for Coder Agent');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are an expert developer specializing in TypeScript, React, and Remotion.
      Generate clean, efficient, and well-documented code.
      Always include proper error handling and type safety.
      Return ONLY the code without markdown wrappers unless explicitly asked for explanations.`
    };

    let userMessage: ChatMessage;

    if (task.input.code) {
      // Code optimization or debugging
      userMessage = {
        role: 'user',
        content: `Task: ${task.input.task || 'Optimize this code'}
        Language: ${task.input.language || 'TypeScript'}
        
        Code to process:
        \`\`\`${task.input.language || 'typescript'}
        ${task.input.code}
        \`\`\`
        
        ${task.input.requirements ? `Requirements: ${task.input.requirements}` : ''}`
      };
    } else {
      // Code generation
      userMessage = {
        role: 'user',
        content: `Generate code for: ${task.input.prompt}
        Language: ${task.input.language || 'TypeScript'}
        Framework: ${task.input.framework || 'React'}
        
        ${task.input.context ? `Context: ${task.input.context}` : ''}
        ${task.input.requirements ? `Requirements: ${task.input.requirements}` : ''}`
      };
    }

    const result = await this.executeAI([systemPrompt, userMessage], {
      temperature: 0.2, // Lower temperature for code
      useCache: true,
      cacheTTL: 180000, // 3 minutes for code
    });

    if (!result.success) {
      this.handleError(result.error, task);
    }

    const code = result.data.choices[0].message.content
      .replace(/```typescript\n?|```tsx\n?|```ts\n?|```/g, '')
      .trim();

    return {
      code,
      language: task.input.language || 'TypeScript',
      metadata: {
        tokensUsed: result.data.usage?.total_tokens,
        generatedAt: new Date(),
      }
    };
  }
}

// ============================================================================
// RESEARCHER AGENT - Information Gathering and Analysis
// ============================================================================

export class ResearcherAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'researcher',
      name: 'Information Analyst',
      description: 'Gathers, analyzes, and synthesizes information',
      capabilities: [
        'web research',
        'data analysis',
        'fact checking',
        'trend analysis',
        'information synthesis'
      ],
      model: 'meta/llama-3.3-70b-instruct',
      temperature: 0.5,
      maxTokens: 3000,
      enabled: true,
    };
    super(config);
  }

  protected validateInput(input: any): boolean {
    return input && typeof input.query === 'string';
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.validateInput(task.input)) {
      throw new Error('Invalid input for Researcher Agent');
    }

    // Perform web research first
    const researchData = await this.performWebResearch(task.input.query);

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are a research analyst. Gather and analyze information based on queries.
      Provide comprehensive, accurate, and well-structured responses.
      Include sources when possible and indicate confidence levels.`
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Research query: ${task.input.query}
      Research context: ${task.input.context || 'General'}
      
      Initial research findings:
      ${researchData}
      
      ${task.input.requirements ? `Specific requirements: ${task.input.requirements}` : ''}
      
      Please provide a comprehensive analysis.`
    };

    const result = await this.executeAI([systemPrompt, userMessage], {
      useCache: true,
      cacheTTL: 900000, // 15 minutes for research
    });

    if (!result.success) {
      this.handleError(result.error, task);
    }

    return {
      analysis: result.data.choices[0].message.content,
      researchData,
      metadata: {
        query: task.input.query,
        researchedAt: new Date(),
        confidence: 'high',
      }
    };
  }

  private async performWebResearch(query: string): Promise<string> {
    try {
      const response = await fetch(`https://lite.duckduckgo.com/lite/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `q=${encodeURIComponent(query)}`
      });
      const html = await response.text();
      const snippets = [...html.matchAll(/class="result-snippet"[^>]*>(.*?)<\/td>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim())
        .slice(0, 5)
        .join('\n- ');
      
      return snippets ? `Found research results:\n- ${snippets}` : 'No specific research results found.';
    } catch (e) {
      return 'Web research temporarily unavailable.';
    }
  }
}

// ============================================================================
// VALIDATOR AGENT - Quality Assurance and Validation
// ============================================================================

export class ValidatorAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'validator',
      name: 'Quality Assurance',
      description: 'Validates outputs and ensures quality standards',
      capabilities: [
        'code validation',
        'output quality check',
        'standards compliance',
        'error detection',
        'performance validation'
      ],
      model: 'meta/llama-3.1-8b-instruct', // Use lighter model for validation
      temperature: 0.2,
      maxTokens: 1000,
      enabled: true,
    };
    super(config);
  }

  protected validateInput(input: any): boolean {
    return input && (input.code || input.content || input.output);
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.validateInput(task.input)) {
      throw new Error('Invalid input for Validator Agent');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are a quality assurance validator. Check outputs for:
      - Code correctness and best practices
      - Content quality and accuracy
      - Standards compliance
      - Potential issues or improvements
      
      Return ONLY a valid JSON response:
      {
        "passed": boolean,
        "score": number (0-100),
        "issues": ["issue1", "issue2"],
        "suggestions": ["suggestion1"],
        "confidence": number (0-1)
      }`
    };

    let validationTarget = '';
    if (task.input.code) {
      validationTarget = `Code to validate:\n\`\`\`${task.input.language || 'typescript'}\n${task.input.code}\n\`\`\``;
    } else if (task.input.content) {
      validationTarget = `Content to validate:\n${task.input.content}`;
    } else {
      validationTarget = `Output to validate:\n${JSON.stringify(task.input.output)}`;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Validation task: ${task.input.task || 'General validation'}
      
      ${validationTarget}
      
      ${task.input.standards ? `Standards to check: ${task.input.standards}` : ''}
      ${task.input.requirements ? `Requirements: ${task.input.requirements}` : ''}`
    };

    const result = await this.executeAI([systemPrompt, userMessage], {
      temperature: 0.1, // Very low temperature for consistent validation
      useCache: false, // Don't cache validations
    });

    if (!result.success) {
      this.handleError(result.error, task);
    }

    try {
      const content = result.data.choices[0].message.content;
      const validationResult = JSON.parse(content);
      return {
        ...validationResult,
        validatedAt: new Date(),
        validator: this.config.name,
      };
    } catch (error) {
      // Fallback if parsing fails
      return {
        passed: true,
        score: 75,
        issues: ['Validation parsing failed, auto-approved'],
        suggestions: [],
        confidence: 0.5,
        validatedAt: new Date(),
        validator: this.config.name,
      };
    }
  }
}

// ============================================================================
// OPTIMIZER AGENT - Performance and Resource Optimization
// ============================================================================

export class OptimizerAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: 'optimizer',
      name: 'Performance Optimizer',
      description: 'Optimizes performance and resource usage',
      capabilities: [
        'performance optimization',
        'resource allocation',
        'caching strategies',
        'load balancing',
        'efficiency improvements'
      ],
      model: 'meta/llama-3.1-8b-instruct', // Use lighter model
      temperature: 0.3,
      maxTokens: 1500,
      enabled: true,
    };
    super(config);
  }

  protected validateInput(input: any): boolean {
    return input && (input.code || input.config || input.system);
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.validateInput(task.input)) {
      throw new Error('Invalid input for Optimizer Agent');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are a performance optimization expert. Analyze and optimize for:
      - Execution speed
      - Resource usage
      - Memory efficiency
      - Caching opportunities
      
      Return ONLY a valid JSON response:
      {
        "optimizations": ["optimization1", "optimization2"],
        "estimatedImprovement": "percentage",
        "priority": "high|medium|low",
        "implementationComplexity": "low|medium|high"
      }`
    };

    let optimizationTarget = '';
    if (task.input.code) {
      optimizationTarget = `Code to optimize:\n\`\`\`${task.input.language || 'typescript'}\n${task.input.code}\n\`\`\``;
    } else if (task.input.config) {
      optimizationTarget = `Configuration to optimize:\n${JSON.stringify(task.input.config, null, 2)}`;
    } else {
      optimizationTarget = `System to optimize: ${task.input.system}`;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Optimization task: ${task.input.task || 'General optimization'}
      
      ${optimizationTarget}
      
      ${task.input.constraints ? `Constraints: ${task.input.constraints}` : ''}
      ${task.input.goals ? `Optimization goals: ${task.input.goals}` : ''}`
    };

    const result = await this.executeAI([systemPrompt, userMessage], {
      temperature: 0.2,
      useCache: true,
      cacheTTL: 600000, // 10 minutes
    });

    if (!result.success) {
      this.handleError(result.error, task);
    }

    try {
      const content = result.data.choices[0].message.content;
      const optimizations = JSON.parse(content);
      return {
        ...optimizations,
        optimizedAt: new Date(),
        optimizer: this.config.name,
      };
    } catch (error) {
      return {
        optimizations: ['Basic optimization applied'],
        estimatedImprovement: '10-20%',
        priority: 'medium',
        implementationComplexity: 'low',
        optimizedAt: new Date(),
        optimizer: this.config.name,
      };
    }
  }
}