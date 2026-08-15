/**
 * Enhanced Universal Agent with Multi-Agent System
 * Integrates the new multi-agent architecture with the existing universal agent
 */

import 'dotenv/config';
import { bluesmindChatCompletion, ChatMessage } from '../../lib/bluesmind';
import { AgentCoordinator } from './agent-coordinator';
import { AgentRole, TaskPriority } from './agent-types';

export type EnhancedAgentMode = 'general' | 'video' | 'script' | 'research' | 'code' | 'multi_agent';

const ENHANCED_MODE_PROMPTS: Record<EnhancedAgentMode, string> = {
  general: `Kamu adalah asisten AI serba bisa milik pribadi pengguna bernama AI Agent. 
Jawab dalam bahasa yang sama dengan pengguna (Indonesia atau Inggris). 
Berikan jawaban yang informatif, ramah, dan membantu. 
Gunakan format markdown untuk jawaban yang panjang.`,

  video: `Kamu adalah pakar pembuatan video animasi menggunakan Remotion.js.
Bantu pengguna merencanakan, mendeskripsikan, atau membuat prompt untuk video animasi profesional.
Jawab dalam bahasa Indonesia. Format jawaban dengan baik.`,

  script: `Kamu adalah penulis skrip profesional untuk konten digital.
Bantu pengguna menulis skrip YouTube, TikTok, konten sosmed, narasi video, atau artikel.
Jawab dalam bahasa Indonesia. Buat konten yang menarik, engaging, dan sesuai platform.`,

  research: `Kamu adalah peneliti dan analis konten profesional.
Bantu pengguna mencari fakta, merangkum topik, membuat outline konten, atau menganalisis tren.
Jawab dalam bahasa Indonesia. Berikan informasi yang akurat dan terstruktur.`,

  code: `Kamu adalah developer senior yang ahli di TypeScript, React, Node.js, dan Remotion.
Bantu pengguna menulis kode, debug masalah, atau menjelaskan konsep teknis.
Gunakan format markdown dengan code block untuk jawaban kode.`,

  multi_agent: `Kamu adalah koordinator sistem multi-agent yang canggih.
Koordinasikan agent spesialis untuk menyelesaikan tugas kompleks secara efisien.
Jawab dalam bahasa Indonesia. Jelaskan proses koordinasi dengan jelas.`
};

export interface EnhancedChatSession {
  messages: ChatMessage[];
  mode: EnhancedAgentMode;
  useMultiAgent: boolean;
}

export interface EnhancedAgentResponse {
  text: string;
  mode: EnhancedAgentMode;
  isVideoTask: boolean;
  videoTaskStarted?: boolean;
  agentsUsed?: AgentRole[];
  performanceMetrics?: any;
}

export class EnhancedUniversalAgent {
  private sessions: Map<string, EnhancedChatSession>;
  private coordinator: AgentCoordinator;
  private multiAgentEnabled: boolean;

  constructor() {
    this.sessions = new Map();
    this.coordinator = new AgentCoordinator();
    this.multiAgentEnabled = true;
  }

  /**
   * Enable or disable multi-agent system
   */
  setMultiAgentEnabled(enabled: boolean): void {
    this.multiAgentEnabled = enabled;
  }

  /**
   * Get coordinator instance for direct access
   */
  getCoordinator(): AgentCoordinator {
    return this.coordinator;
  }

  /**
   * Detect if task should use multi-agent system
   */
  private shouldUseMultiAgent(message: string, mode: EnhancedAgentMode): boolean {
    if (!this.multiAgentEnabled) return false;

    const complexTaskIndicators = [
      'complex', 'comprehensive', 'detailed', 'analyze', 'research',
      'optimize', 'plan', 'strategy', 'workflow', 'multiple', 'several'
    ];

    const lowerMessage = message.toLowerCase();
    const hasComplexIndicator = complexTaskIndicators.some(indicator => 
      lowerMessage.includes(indicator)
    );

    // Use multi-agent for complex tasks or specific modes
    return hasComplexIndicator || 
           mode === 'multi_agent' || 
           mode === 'code' || 
           mode === 'research';
  }

  /**
   * Detect video intent
   */
  private detectVideoIntent(message: string): boolean {
    const videoKeywords = [
      'buat video', 'create video', 'generate video', 'render video',
      'bikin video', 'video animasi', 'animation video', 'background video',
      'adobe stock', 'remotion', 'buatkan video'
    ];
    const lower = message.toLowerCase();
    return videoKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Auto-detect mode based on message content
   */
  private autoDetectMode(message: string): EnhancedAgentMode {
    const lower = message.toLowerCase();
    
    if (this.detectVideoIntent(lower)) return 'video';
    if (lower.includes('skrip') || lower.includes('script') || lower.includes('konten') || 
        lower.includes('caption') || lower.includes('naskah')) return 'script';
    if (lower.includes('riset') || lower.includes('research') || lower.includes('cari') || 
        lower.includes('fakta') || lower.includes('informasi tentang')) return 'research';
    if (lower.includes('kode') || lower.includes('code') || lower.includes('debug') || 
        lower.includes('typescript') || lower.includes('javascript') || 
        lower.includes('function') || lower.includes('optimize')) return 'code';
    if (lower.includes('agent') || lower.includes('koordinator') || lower.includes('multi')) return 'multi_agent';
    
    return 'general';
  }

  /**
   * Process message using multi-agent system
   */
  private async processWithMultiAgent(
    message: string,
    mode: EnhancedAgentMode
  ): Promise<{ text: string; agentsUsed: AgentRole[] }> {
    const agentsUsed: AgentRole[] = [];

    try {
      // Step 1: Planning phase for complex tasks
      if (mode === 'code' || mode === 'research') {
        const planTaskId = await this.coordinator.submitTask(
          'planning',
          `Plan execution for: ${message}`,
          {
            description: message,
            context: { mode },
            constraints: { maxSteps: 5 }
          },
          { priority: 'high', assignedTo: 'planner' }
        );
        agentsUsed.push('planner');

        // Wait for planning
        await this.waitForTask(planTaskId);
        const planResult = this.coordinator.getTaskStatus(planTaskId);
        
        if (planResult?.output?.subtasks) {
          console.log('📋 Multi-agent plan created:', planResult.output.subtasks);
        }
      }

      // Step 2: Execute based on mode
      let executionResult: any;
      
      if (mode === 'code') {
        const codeTaskId = await this.coordinator.submitTask(
          'code_generation',
          `Generate code for: ${message}`,
          {
            prompt: message,
            language: 'TypeScript',
            framework: 'React'
          },
          { priority: 'high', assignedTo: 'coder' }
        );
        agentsUsed.push('coder');
        
        await this.waitForTask(codeTaskId);
        executionResult = this.coordinator.getTaskStatus(codeTaskId);

        // Step 3: Validate generated code
        if (executionResult?.output?.code) {
          const validateTaskId = await this.coordinator.submitTask(
            'validation',
            'Validate generated code',
            {
              code: executionResult.output.code,
              language: 'TypeScript',
              task: 'Code quality check'
            },
            { priority: 'medium', assignedTo: 'validator' }
          );
          agentsUsed.push('validator');
          
          await this.waitForTask(validateTaskId);
          const validationResult = this.coordinator.getTaskStatus(validateTaskId);
          
          if (validationResult?.output) {
            executionResult.validation = validationResult.output;
          }
        }
      } 
      else if (mode === 'research') {
        const researchTaskId = await this.coordinator.submitTask(
          'research',
          `Research: ${message}`,
          {
            query: message,
            context: 'General research task'
          },
          { priority: 'high', assignedTo: 'researcher' }
        );
        agentsUsed.push('researcher');
        
        await this.waitForTask(researchTaskId);
        executionResult = this.coordinator.getTaskStatus(researchTaskId);
      }

      // Format response
      let responseText = '';
      
      if (executionResult?.output) {
        if (mode === 'code') {
          responseText = `🤖 **Multi-Agent Code Generation Complete**

**Agents involved:** ${agentsUsed.map(a => `🔹 ${a}`).join(', ')}

**Generated Code:**
\`\`\`typescript
${executionResult.output.code}
\`\`\`

**Validation Result:** ${executionResult.validation?.passed ? '✅ Passed' : '⚠️ Issues found'}
**Quality Score:** ${executionResult.validation?.score || 'N/A'}/100

${executionResult.validation?.issues?.length ? `**Issues:**\n${executionResult.validation.issues.map(i => `• ${i}`).join('\n')}` : ''}
${executionResult.validation?.suggestions?.length ? `**Suggestions:**\n${executionResult.validation.suggestions.map(s => `• ${s}`).join('\n')}` : ''}`;
        } else if (mode === 'research') {
          responseText = `🔍 **Multi-Agent Research Complete**

**Agents involved:** ${agentsUsed.map(a => `🔹 ${a}`).join(', ')}

**Research Analysis:**
${executionResult.output.analysis}

**Research Data:**
${executionResult.output.researchData}`;
        }
      } else {
        responseText = 'Multi-agent processing completed but no output generated.';
      }

      return { text: responseText, agentsUsed };

    } catch (error: any) {
      console.error('Multi-agent processing error:', error);
      return {
        text: `⚠️ Multi-agent processing encountered an error: ${error.message}. Falling back to standard processing.`,
        agentsUsed
      };
    }
  }

  /**
   * Wait for task completion
   */
  private async waitForTask(taskId: string, timeout: number = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const task = this.coordinator.getTaskStatus(taskId);
      if (!task) throw new Error('Task not found');
      
      if (task.status === 'completed' || task.status === 'failed') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Task timeout');
  }

  /**
   * Main chat method with multi-agent support
   */
  async chat(
    sessionId: string,
    userMessage: string,
    forceMode?: EnhancedAgentMode
  ): Promise<EnhancedAgentResponse> {
    // Get or create session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        messages: [],
        mode: 'general',
        useMultiAgent: false
      });
    }
    const session = this.sessions.get(sessionId)!;

    // Determine mode
    const mode = forceMode || this.autoDetectMode(userMessage);
    session.mode = mode;

    // Check if should use multi-agent
    const useMultiAgent = this.shouldUseMultiAgent(userMessage, mode);
    session.useMultiAgent = useMultiAgent;

    // Check for video task
    const isVideoTask = this.detectVideoIntent(userMessage) && (mode === 'video' || mode === 'general');

    // Add user message to history
    session.messages.push({ role: 'user', content: userMessage });

    let responseText = '';
    let agentsUsed: AgentRole[] = [];
    let performanceMetrics: any = null;

    if (useMultiAgent) {
      // Use multi-agent system
      const multiAgentResult = await this.processWithMultiAgent(userMessage, mode);
      responseText = multiAgentResult.text;
      agentsUsed = multiAgentResult.agentsUsed;
      
      // Get performance metrics
      performanceMetrics = {
        systemMetrics: this.coordinator.getSystemMetrics(),
        agentPerformance: Object.fromEntries(this.coordinator.getAgentPerformance())
      };
    } else {
      // Use standard single-agent processing
      const contextMessages: ChatMessage[] = [
        { role: 'system', content: ENHANCED_MODE_PROMPTS[mode] },
        ...session.messages.slice(-10)
      ];

      const result = await bluesmindChatCompletion({
        messages: contextMessages,
        temperature: 0.8,
        max_tokens: 2000,
      });

      if (result.success && result.data?.choices?.[0]) {
        responseText = result.data.choices[0].message.content;
      } else {
        responseText = `❌ Maaf, terjadi kesalahan saat menghubungi AI: ${result.error || 'Unknown error'}`;
      }
    }

    // Add assistant response to history
    session.messages.push({ role: 'assistant', content: responseText });

    return {
      text: responseText,
      mode,
      isVideoTask,
      videoTaskStarted: false,
      agentsUsed: agentsUsed.length > 0 ? agentsUsed : undefined,
      performanceMetrics: performanceMetrics || undefined
    };
  }

  /**
   * Run video task (existing functionality)
   */
  async runVideoTask(prompt: string): Promise<{ success: boolean; message: string }> {
    // Import AIAgentController dynamically to avoid circular dependency
    const { AIAgentController } = await import('./agent-controller');
    const agent = new AIAgentController();
    return agent.createRemotionVideo(prompt);
  }

  /**
   * Reset session
   */
  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get session history
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId)?.messages || [];
  }

  /**
   * Get system status
   */
  getSystemStatus(): any {
    return {
      multiAgentEnabled: this.multiAgentEnabled,
      availableAgents: this.coordinator.getAvailableAgents(),
      systemMetrics: this.coordinator.getSystemMetrics(),
      agentPerformance: Object.fromEntries(this.coordinator.getAgentPerformance()),
      activeSessions: this.sessions.size,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.coordinator.shutdown();
  }
}