/**
 * Base Agent Class
 * Foundation for all specialist agents in the multi-agent system
 */

import { bluesmindChatCompletion, ChatMessage } from '../../lib/bluesmind';
import { AgentRole, AgentConfig, AgentPerformance, AgentTask, CacheEntry } from './agent-types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected performance: AgentPerformance;
  protected cache: Map<string, CacheEntry>;
  protected isActive: boolean;

  constructor(config: AgentConfig) {
    this.config = config;
    this.performance = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      cacheHitRate: 0,
      lastActiveTime: new Date(),
    };
    this.cache = new Map();
    this.isActive = config.enabled;
  }

  /**
   * Get agent role
   */
  getRole(): AgentRole {
    return this.config.role;
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Get performance metrics
   */
  getPerformance(): AgentPerformance {
    return { ...this.performance };
  }

  /**
   * Check if agent is active
   */
  isAgentActive(): boolean {
    return this.isActive;
  }

  /**
   * Set agent active state
   */
  setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Generate cache key from input
   */
  protected generateCacheKey(input: any): string {
    return `${this.config.role}-${JSON.stringify(input)}`;
  }

  /**
   * Get cached result if available and not expired
   */
  protected getCached(input: any): any | null {
    const key = this.generateCacheKey(input);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.hits++;
    this.performance.cacheHitRate = this.calculateCacheHitRate();
    return entry.value;
  }

  /**
   * Cache a result
   */
  protected setCached(input: any, value: any, ttl: number = 300000): void {
    const key = this.generateCacheKey(input);
    this.cache.set(key, {
      key,
      value,
      timestamp: new Date(),
      ttl,
      hits: 0,
    });
  }

  /**
   * Calculate cache hit rate
   */
  protected calculateCacheHitRate(): number {
    if (this.performance.totalTasks === 0) return 0;
    
    let totalHits = 0;
    this.cache.forEach(entry => {
      totalHits += entry.hits;
    });
    
    return totalHits / this.performance.totalTasks;
  }

  /**
   * Execute AI call with caching and performance tracking
   */
  protected async executeAI(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      useCache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<any> {
    const startTime = Date.now();
    
    // Check cache if enabled
    if (options?.useCache !== false) {
      const cacheKey = this.generateCacheKey({ messages, options });
      const cached = this.getCached(cacheKey);
      if (cached) {
        this.performance.lastActiveTime = new Date();
        return cached;
      }
    }

    try {
      const result = await bluesmindChatCompletion({
        messages,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        maxRetries: 3,
      });

      const responseTime = Date.now() - startTime;
      this.updatePerformance(responseTime, result.data?.usage?.total_tokens || 0);

      // Cache result if successful
      if (result.success && options?.useCache !== false) {
        this.setCached(
          { messages, options },
          result,
          options?.cacheTTL || 300000 // 5 minutes default
        );
      }

      this.performance.lastActiveTime = new Date();
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.performance.failedTasks++;
      this.performance.totalTasks++;
      throw error;
    }
  }

  /**
   * Update performance metrics
   */
  protected updatePerformance(responseTime: number, tokensUsed: number): void {
    this.performance.totalTasks++;
    this.performance.completedTasks++;
    this.performance.totalTokensUsed += tokensUsed;
    
    // Calculate rolling average response time
    const totalResponseTime = this.performance.averageResponseTime * (this.performance.completedTasks - 1);
    this.performance.averageResponseTime = (totalResponseTime + responseTime) / this.performance.completedTasks;
  }

  /**
   * Abstract method to be implemented by specialist agents
   */
  abstract executeTask(task: AgentTask): Promise<any>;

  /**
   * Validate input for the agent
   */
  protected abstract validateInput(input: any): boolean;

  /**
   * Process agent-specific error handling
   */
  protected handleError(error: any, task: AgentTask): never {
    throw new Error(`${this.config.name} error: ${error.message}`);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.performance.cacheHitRate = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; entries: number } {
    return {
      size: this.cache.size,
      hitRate: this.performance.cacheHitRate,
      entries: this.cache.size,
    };
  }
}